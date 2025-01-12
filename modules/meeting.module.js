const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Excused'], required: true }
});

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  attendance: [attendanceSchema]
});

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;
