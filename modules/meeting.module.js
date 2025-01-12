import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  attendees: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      status: {
        type: String,
        enum: ['Present', 'Absent', 'Excused'],
        default: 'Present',
      },
    },
  ],
}, 
{
  timestamps: true,
});

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;

