import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/,
    required: true,
    unique: true,
    default:"I_am_Artist"
  },
  password: {
    type: String,
    minlength: 8,
    maxlength: 200,
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    unique: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: /^[0-9]{10}$/,
  },
  role: {
    type: String,
    enum: ['user', 'artist', 'admin', 'superadmin'],
    default: 'user',
  },
  biography: {
    type: String,
    maxlength: 500,
    trim: true,
  },
  DOB: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  avatar: {
    type: String,
    default: 'https://th.bing.com/th/id/OIP.BgaEYtwtykKt4-75mRcJ9wHaHa?rs=1&pid=ImgDetMain',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  myCollection: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Art',
    },
  ],
  attendance: [
    {
      date: {
        type: Date,
        required: true,
        default: Date.now, // Automatically sets the attendance date to current date
      },
      status: {
        type: String,
        enum: ['Present', 'Absent', 'Not upladed'],
        default: 'Not upladed',
      },
      meetingId: {
        type: mongoose.Schema.Types.ObjectId, // Links to a specific meeting
        ref: 'Meeting', // Reference to the Meeting schema (if needed)
      },
    },
  ],
}, 
{
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

export default User;
