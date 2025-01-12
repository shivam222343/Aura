// Register route with schema-based validation
router.post('/register', async (req, res) => {
    const { username, email, password, phone, DOB } = req.body;

    if (!username || !email || !password || !phone || !DOB) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ message: 'Invalid username format' });
    }

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({ message: 'Invalid phone number' });
    }

    const age = new Date().getFullYear() - new Date(DOB).getFullYear();
    if (age < 13) {
        return res.status(400).json({ message: 'User must be at least 13 years old' });
    }

    try {
        const userExist = await User.findOne({ $or: [{ email }, { phone }, { username }] });
        if (userExist) return res.status(400).json({ message: 'User already exists with the given credentials' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            phone,
            DOB,
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login route with schema-based validation
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, 'secretKey', { expiresIn: '1h' });
        res.json({ token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Profile update route with schema-based validation
router.put('/profile', upload.single('avatar'), async (req, res) => {
    const { username, email, biography } = req.body;
    const { id } = req.headers;

    if (!id) return res.status(400).json({ message: 'User ID is required in headers' });

    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Validate username and email if provided
        if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ message: 'Invalid username format' });
        }
        if (email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (biography && biography.length > 500) {
            return res.status(400).json({ message: 'Biography exceeds maximum length of 500 characters' });
        }

        // Update avatar if file is uploaded
        if (req.file) {
            try {
                const uploadResult = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: 'user-profiles' },
                        (error, result) => {
                            if (error) reject(new Error('Cloudinary upload failed'));
                            else resolve(result);
                        }
                    );
                    uploadStream.end(req.file.buffer);
                });
                user.avatar = uploadResult.secure_url;
            } catch (uploadError) {
                return res.status(500).json({ message: 'Cloudinary upload failed', error: uploadError.message });
            }
        }

        // Update other fields
        if (username) user.username = username;
        if (email) user.email = email;
        if (biography) user.biography = biography;

        await user.save();
        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
