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


// Update attendance for a specific meeting
atrouter.post('/meetings/:meetingId/attendance', async (req, res) => {
    try {
      const { meetingId } = req.params;
      const { attendees } = req.body;
  
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }
  
      meeting.attendance = attendees.map(attendee => ({
        userId: attendee.userId,
        status: attendee.status
      }));
  
      await meeting.save();
      res.json({ message: 'Attendance updated successfully' });
    } catch (error) {
      console.error('Error updating attendance:', error);
      res.status(500).json({ message: 'Error updating attendance', error });
    }
  });
  
  
  atatrouter.get('/meetings/:meetingId/attendance', async (req, res) => {
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

  // Get all meetings
atrouter.get('/meetings', async (req, res) => {
    try {
      const meetings = await Meeting.find(); // Fetch all meetings
      res.json(meetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      res.status(500).json({ message: 'Error fetching meetings', error });
    }
  });
  
  // Get attendance for a specific meeting
  atrouter.get('/meetings/:meetingId/attendance', async (req, res) => {
    try {
      const { meetingId } = req.params;
      const meeting = await Meeting.findById(meetingId).populate('attendance.userId', 'username');
      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }
      res.json(meeting);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ message: 'Error fetching attendance', error });
    }
  });
  

  export default atrouter;
  