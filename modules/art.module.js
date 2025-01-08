import mongoose from "mongoose";

const artSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 100 },
    artist: { type: String, required: true, maxlength: 50 },
    image: { 
        type: String,
        required: true
    },
    description: { type: String, required: true, maxlength: 1000 },
    category: { 
        type: String, 
        required: true
    },
    likes: {
        type: [mongoose.Schema.Types.ObjectId], // Array of user IDs who liked the art
        default: []
    },
    ratings: {
        type: [Number], // Array to store ratings from users (e.g., 1-5)
        default: []
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

const Art = mongoose.model('Art', artSchema);

export default Art;
