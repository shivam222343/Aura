import express from "express";
import Meeting from "../modules/meeting.module.js";

const atrouter = express.Router();

atrouter.post('/meetings', async (req, res) => {
  const { title, date, description } = req.body;

  try {
    const newMeeting = new Meeting({ title, date: new Date(date), description });
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
  
// Get all meetings
atrouter.get('/meetings', async (req, res) => {
    try {
      const meetings = await Meeting.find().sort({ date: -1 }); // Fetch all meetings sorted by latest date first
      res.json(meetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      res.status(500).json({ message: 'Error fetching meetings', error });
    }
});

// Get all descriptions in structured format with meeting ID
atrouter.get('/meetings/descriptions', async (req, res) => {
    try {
      const meetings = await Meeting.find({}, 'date description _id').sort({ date: -1 });
      const formattedMeetings = meetings.map(meeting => ({
        id: meeting._id,
        date: meeting.date.toISOString().split('T')[0],
        description: meeting.description
      }));
      res.json(formattedMeetings);
    } catch (error) {
      console.error('Error fetching meeting descriptions:', error);
      res.status(500).json({ message: 'Error fetching meeting descriptions', error });
    }
});

atrouter.get('/meetings/:meetingId/attendance', async (req, res) => {
    try {
      const { meetingId } = req.params;
      
      // Fetch meeting and populate attendance user details
      const meeting = await Meeting.findById(meetingId)
        .populate({
          path: 'attendance.userId',
          select: 'username email phone'
        });
  
      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }
  
      // Return only attendance details
      res.json({ attendance: meeting.attendance });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ message: 'Error fetching attendance', error });
    }
});

export default atrouter;
