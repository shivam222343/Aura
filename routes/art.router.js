import Art from '../modules/art.module.js'; 
import express from 'express';
import User from '../modules/user.module.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const artrouter = express.Router();


cloudinary.config({
    cloud_name:"dwsddmatc",
    api_key:"354363645799793",
    api_secret:"_IAY82sOHU_p84GW0LdovKhAW30",
});

// Multer setup for file handling
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route to upload file to Cloudinary
artrouter.post('/profile/upload-art', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const { title, artist, description, category, createdBy } = req.body;

        if (!file) return res.status(400).json({ message: 'No file uploaded' });

        // Upload file to Cloudinary
        cloudinary.uploader.upload_stream(
            { folder: 'art-gallery' },
            async (error, result) => {
                if (error) return res.status(500).json({ message: 'Cloudinary upload failed', error });

                // Create a new art entry
                const newArt = new Art({
                    title,
                    artist,
                    image: result.secure_url,
                    description,
                    category,
                    createdBy, 
                });

                await newArt.save();
                const user = await User.findById(createdBy);
                user.myCollection.push(newArt._id);
                await user.save();
                
                res.status(201).json({
                    message: 'Art uploaded successfully',
                    art: newArt,
                });
            }
        ).end(file.buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

artrouter.put('/profile/art-collection/:artId', upload.single('file'), async (req, res) => {
    const { artId } = req.params;
    const { title, artist, description, category, createdBy } = req.body;

    try {
        const artPiece = await Art.findById(artId);
        if (!artPiece) return res.status(404).json({ message: 'Art not found' });

        // Upload new image if provided
        if (req.file) {
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'art-gallery' },
                    (error, result) => {
                        if (error) reject(new Error('Cloudinary upload failed'));
                        else resolve(result);
                    }
                );
                uploadStream.end(req.file.buffer);
            });
            artPiece.image = uploadResult.secure_url;
        }

        // Update other fields
        if (title) artPiece.title = title;
        if (artist) artPiece.artist = artist;
        if (description) artPiece.description = description;
        if (category) artPiece.category = category;

        await artPiece.save();


        res.json({ message: 'Art updated successfully', art: artPiece });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

//Get art collection for all users
artrouter.get('/profile/all-art', async (req, res) => {
    try {
        // Fetch all art pieces from the Art collection
        const allArt = await Art.find();

        // Check if there are any art pieces
        if (!allArt || allArt.length === 0) {
            return res.status(404).json({ message: 'No art found' });
        }

        // Respond with all the art pieces
        res.json(allArt);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get top 5 most liked arts
artrouter.get('/profile/top-liked', async (req, res) => {
    try {
        // Fetch art pieces sorted by the number of likes in descending order
        const topLikedArts = await Art.find()
            .sort({ "likes.length": -1 }) // Sort by the length of the likes array in descending order
            .limit(5); // Limit to top 5 results

        // Check if there are any art pieces
        if (!topLikedArts || topLikedArts.length === 0) {
            return res.status(404).json({ message: 'No art found' });
        }

        // Respond with the top liked art pieces
        res.json(topLikedArts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Get art collection for specific user
artrouter.get('/profile/art-collection', async (req, res) => {
    const { id } = req.headers;  // Use user ID from headers
    try {
        const user = await User.findById(id).populate('myCollection');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const artCollection = await Art.find({ _id: { $in: user.myCollection } });
        res.json(artCollection);
    } catch (error) {
        console.log(error); 
        res.status(500).json({ message: 'Server error' });
    }
});


// Update art piece details
artrouter.put('/profile/art-collection/:artId', async (req, res) => {
    const { artId } = req.params;
    const { title, artist, image, description, category } = req.body;
    const { id } = req.headers;  // Use user ID from headers

    try {
        // Find the art piece to update
        const artPiece = await Art.findById(artId);
        if (!artPiece) return res.status(404).json({ message: 'Art not found' });

        // Only allow updating the art that belongs to the user
        if (artPiece.createdBy.toString() !== id) {
            return res.status(403).json({ message: 'You can only update your own art pieces' });
        }

        // Update the art details
        artPiece.title = title || artPiece.title;
        artPiece.artist = artist || artPiece.artist;
        artPiece.image = image || artPiece.image;
        artPiece.description = description || artPiece.description;
        artPiece.category = category || artPiece.category;

        await artPiece.save();
        res.json({ message: 'Art updated', art: artPiece });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove art from collection
artrouter.delete('/profile/art-collection/:artId', async (req, res) => {
    const { artId } = req.params;
    console.log(artId);
    const { id } = req.headers;  // Use user ID from headers

    try {
        // Find the art piece to remove
        const artPiece = await Art.findById(artId);
        if (!artPiece) return res.status(404).json({ message: 'Art not found' });

        // Only allow deleting the art that belongs to the user
        if (artPiece.createdBy.toString() !== id) {
            return res.status(403).json({ message: 'You can only delete your own art pieces' });
        }

        // Remove the art piece from the user's collection
        const user = await User.findById(id);
        user.myCollection.pull(artId);
        await user.save();

        // Delete the art piece from the Art collection
        await Art.deleteOne({ _id: artId });

        res.json({ message: 'Art removed from collection' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Like an art piece
artrouter.post('/profile/art-collection/:artId/like', async (req, res) => {
    const { artId } = req.params;
    const { id } = req.headers;  // Use user ID from headers

    try {
        // Find the art piece
        const artPiece = await Art.findById(artId);
        if (!artPiece) return res.status(404).json({ message: 'Art not found' });

        // Check if the user has already liked the art
        if (artPiece.likes.includes(id)) {
            return res.status(400).json({ message: 'You have already liked this art' });
        }

        // Add the user ID to the likes array
        artPiece.likes.push(id);
        await artPiece.save();

        res.json({ message: 'Art liked', art: artPiece });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Unlike an art piece
artrouter.post('/profile/art-collection/:artId/unlike', async (req, res) => {
    const { artId } = req.params;
    const { id } = req.headers; // User ID from headers

    try {
        // Find the art piece
        const artPiece = await Art.findById(artId);
        if (!artPiece) return res.status(404).json({ message: 'Art not found' });

        // Check if the user has liked the art
        if (!artPiece.likes.includes(id)) {
            return res.status(400).json({ message: 'You have not liked this art' });
        }

        // Remove the user ID from the likes array
        artPiece.likes = artPiece.likes.filter(userId => userId !== id);
        await artPiece.save();

        res.json({ message: 'Art unliked', art: artPiece });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Rate an art piece (1-5)
artrouter.post('/profile/art-collection/:artId/rate', async (req, res) => {
    const { artId } = req.params;
    const { rating } = req.body;  // Rating should be sent in the body (1-5)
    const { id } = req.headers;  // Use user ID from headers

    // Validate the rating
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    try {
        // Find the art piece
        const artPiece = await Art.findById(artId);
        if (!artPiece) return res.status(404).json({ message: 'Art not found' });

        // Add the rating to the ratings array
        artPiece.ratings.push(rating);
        await artPiece.save();

        // Calculate the average rating (optional)
        const averageRating = artPiece.ratings.reduce((sum, rate) => sum + rate, 0) / artPiece.ratings.length;

        res.json({ message: 'Art rated', averageRating });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


// Get the number of likes for an art piece
artrouter.get('/profile/art-collection/:artId/likes', async (req, res) => {
    const { artId } = req.params;

    try {
        // Find the art piece
        const artPiece = await Art.findById(artId);
        if (!artPiece) return res.status(404).json({ message: 'Art not found' });

        // Get the number of likes
        const numberOfLikes = artPiece.likes.length;

        res.json({ message: 'Likes retrieved', numberOfLikes });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get the average rating and number of ratings for an art piece
artrouter.get('/profile/art-collection/:artId/ratings', async (req, res) => {
    const { artId } = req.params;

    try {
        // Find the art piece
        const artPiece = await Art.findById(artId);
        if (!artPiece) return res.status(404).json({ message: 'Art not found' });

        // Calculate the average rating
        const numberOfRatings = artPiece.ratings.length;
        const averageRating = numberOfRatings > 0 ? (artPiece.ratings.reduce((sum, rate) => sum + rate, 0) / numberOfRatings) : 0;

        res.json({ message: 'Ratings retrieved', averageRating, numberOfRatings });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
});

artrouter.get('/profile/art-collection/:artId/liked-users', async (req, res) => {
    try {
        const art = await Art.findById(req.params.artId).populate('likes', 'username');
        if (!art) return res.status(404).send({ message: 'Art not found' });
        res.send({ users: art.likes });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

export default artrouter;
