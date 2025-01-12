import express from "express";
import Meeting from "../modules/meeting.module.js";

const atrouter = express.Router();

atrouter.post('/meetings', async (req, res) => {
  const { title, date, description } = req.body;

  try {
    const newMeeting = new Meeting({ title, date, description });
    const savedMeeting = await newMeeting.save();

    res.status(201).json({ message: 'Meeting created successfully', meeting: savedMeeting });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create meeting', error: error.message });
  }
});


atrouter.post('/meetings/:meetingId/attendance', async (req, res) => {
    const { meetingId } = req.params;
    const { attendees } = req.body; // Array of { userId, status }
  
    try {
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }
  
      meeting.attendees = attendees; // Update the attendees array
      await meeting.save();
  
      res.json({ message: 'Attendance recorded successfully', meeting });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to record attendance', error: error.message });
    }
  });

  
  atrouter.get('/meetings/:meetingId/attendance', async (req, res) => {
    const { meetingId } = req.params;
  
    try {
      const meeting = await Meeting.findById(meetingId).populate('attendees.userId', 'username email');
      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }
  
      res.json(meeting.attendees);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch attendance', error: error.message });
    }
  });

  export default atrouter;
  