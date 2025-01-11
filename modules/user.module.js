import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        minlength: 3,
        maxlength: 20,
        match: /^[a-zA-Z0-9_]+$/,
        required: true,
        unique: true
    },
    password: {
        type: String,
        minlength: 8,
        maxlength: 200,
        required: true
    },
    email: {
        type: String,
        required: true,
        match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        unique: true,
        minlength: 8
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        match: /^[0-9]{10}$/
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'artist'],
        default: 'user'
    },
    biography: {
        type: String,
        maxlength: 500
    },
    DOB: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: 'https://th.bing.com/th/id/OIP.BgaEYtwtykKt4-75mRcJ9wHaHa?rs=1&pid=ImgDetMain'
    },
    date: {
        type: Date,
        default: Date.now
    },
    myCollection: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Art'
    }]
}, { 
    timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
