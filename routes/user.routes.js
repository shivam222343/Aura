import express from 'express';
import User from '../modules/user.module.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authentication from '../Auth/user.auth.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { verifyToken, verifyAdmin } from '../Auth/authMiddleware.js';


const router = express.Router();

cloudinary.config({
    cloud_name: "dwsddmatc",
    api_key: "354363645799793",
    api_secret: "_IAY82sOHU_p84GW0LdovKhAW30",
});

const upload = multer({ storage: multer.memoryStorage() });
// Assuming `router` is the defined router object
router.post('/register', async (req, res) => {
    const { username, email, password, phone, DOB } = req.body;

    // Trim input values to remove accidental spaces
    if (!username?.trim() || !email?.trim() || !password?.trim() || !phone?.trim() || !DOB?.trim()) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
    }

    // Validate email format
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Validate phone number format
    if (!/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
    }

    // Validate age restriction
    const birthDate = new Date(DOB);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    if (isNaN(birthDate) || age < 13) {
        return res.status(400).json({ message: 'You must be at least 13 years old to register' });
    }

    try {
        // Check if the user already exists with the same username, email, or phone
        const userExist = await User.findOne({ $or: [{ email }, { phone }, { username }] });
        if (userExist) {
            return res.status(400).json({ message: 'An account with this username, email, or phone number already exists' });
        }

        // Hash the password before storing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            phone,
            DOB,
        });

        await newUser.save();
        res.status(201).json({ message: 'Registration successful! You can now log in.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An unexpected error occurred. Please try again.', error: error.message });
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

// Get user profile
router.get('/profile', async (req, res) => {
    const { id } = req.headers;
    try {
        const user = await User.findById(id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

//liked users
router.get("/users/details", async (req, res) => {
    try {
        // Extract IDs from the query parameter
        const ids = req.query.ids.split(",");

        // Fetch user details from the database
        const users = await User.find({ _id: { $in: ids } }).select("username avatar");

        // Return the user details
        res.status(200).json({ users });
    } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get all users
router.get('/all-users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Get friend list
router.get('/profile/friends', async (req, res) => {
    const { id } = req.headers;
    try {
        const user = await User.findById(id).populate('friends');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user.friends);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add friend
router.post('/profile/friends', async (req, res) => {
    const { friendId } = req.body;
    const { id } = req.headers;
    try {
        const user = await User.findById(id);
        const friend = await User.findById(friendId);

        if (!friend) return res.status(404).json({ message: 'Friend not found' });

        user.friends.push(friend._id);
        await user.save();

        res.json({ message: 'Friend added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove friend
router.delete('/profile/friends/:friendId', async (req, res) => {
    const { friendId } = req.params;

    try {
        const user = await User.findById(req.userId);
        user.friends.pull(friendId);
        await user.save();

        res.json({ message: 'Friend removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

//google login route
router.post("/google-login", async (req, res) => {
    const { tokenId } = req.body;

    try {
        // Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: "947200404764-4vrp7nq09hjv85p4c9it0bv1qicaadjh.apps.googleusercontent.com",
        });

        const { email, name, sub } = ticket.getPayload();

        // Check if User Exists
        let user = await User.findOne({ email });
        if (!user) {
            // Create New User
            user = new User({
                username: name,
                email,
                password: sub, // You can hash or save token for Google users
            });
            await user.save();
        }

        // Generate JWT
        const token = jwt.sign({ userId: user._id }, "secretKey", { expiresIn: "1h" });
        res.json({ token, user, message: "Google Login Successful" });
    } catch (error) {
        res.status(400).json({ message: "Invalid Google Token" });
    }
});


//update user role 
router.patch('/user-role/:id', async (req, res) => {
    const { id } = req.params;
    const { newRole } = req.body;

    // Ensure valid role
    const validRoles = ['user', 'artist', 'admin'];
    if (!validRoles.includes(newRole)) {
        return res.status(400).json({ message: 'Invalid role specified' });
    }

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = newRole;
        await user.save();

        res.status(200).json({ message: `User role updated to ${newRole}` });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


//update user role
router.put('/:id/role', verifyAdmin, async (req, res) => {
    try {
        const { userid } = req.body;
        const { role } = req.body;

        // Check if role is valid
        const validRoles = ['user', 'artist', 'admin', 'superadmin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role provided' });
        }

        // Find the user
        const user = await User.findById(userid);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(user);


        // Update the role
        user.role = role;
        await user.save();

        res.status(200).json({ message: 'User role updated successfully', user });

    } catch (error) {
        console.log(error);

        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
