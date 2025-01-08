import express from 'express';
import User from '../modules/user.module.js'; 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authentication from '../Auth/user.auth.js';
import {OAuth2Client} from 'google-auth-library'

const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
    const { username, email, password, phone, DOB } = req.body;

    try {
        const userExist = await User.findOne({ email, phone, username });
        if (userExist) return res.status(400).json({ message: 'User already exists, change credentials...' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            phone,
            DOB
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, 'secretKey', { expiresIn: '1h' });
        res.json({ token, user});
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
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

// Update user profile
router.put('/profile', async (req, res) => {
    const { username, email, biography, avatar } = req.body;
    const { id } = req.headers;
    try {
        const updatedUser = await User.findByIdAndUpdate(id, {
            username,
            email,
            biography,
            avatar
        }, { new: true });

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });

        res.json(updatedUser);
    } catch (error) {
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
    const {id} = req.headers;
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
  

export default router;
