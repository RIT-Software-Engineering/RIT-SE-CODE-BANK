const express = require('express');
const router = express.Router();
const dataHandler = require('../utils/dataHandler');

// Validation middleware
const validateEvent = (req, res, next) => {
  const { title, course, type, date } = req.body;
  
  if (!title || !course || !type || !date) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['title', 'course', 'type', 'date']
    });
  }
  
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({
      error: 'Invalid date format. Use YYYY-MM-DD'
    });
  }
  
  next();
};

// GET /api/events - Get all events
router.get('/', async (req, res) => {
  try {
    const events = await dataHandler.getEvents();
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/events/courses - Get all courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await dataHandler.getCourses();
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/events/stats - Get statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await dataHandler.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/events/deadlines - Get upcoming deadlines
router.get('/deadlines', async (req, res) => {
  try {
    const daysAhead = parseInt(req.query.days) || 7;
    const deadlines = await dataHandler.getUpcomingDeadlines(daysAhead);
    res.json({
      success: true,
      data: deadlines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/events/date/:date - Get events for specific date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const events = await dataHandler.getEventsForDate(date);
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/events/course/:courseId - Get course by ID
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await dataHandler.getCourseById(courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/events - Create new event
router.post('/', validateEvent, async (req, res) => {
  try {
    const { date, ...eventData } = req.body;
    
    // Set default values
    const newEventData = {
      title: eventData.title,
      course: eventData.course,
      type: eventData.type,
      time: eventData.time || '12:00 PM',
      location: eventData.location || 'TBD',
      description: eventData.description || '',
      importance: eventData.importance || 'Medium',
      preparation: eventData.preparation || []
    };
    
    const newEvent = await dataHandler.addEvent(date, newEventData);
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/events/:id - Update existing event
router.put('/:id', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const updatedData = req.body;
    
    // Remove id from update data to prevent conflicts
    delete updatedData.id;
    
    await dataHandler.updateEvent(eventId, updatedData);
    
    res.json({
      success: true,
      message: 'Event updated successfully'
    });
  } catch (error) {
    if (error.message === 'Event not found') {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    
    await dataHandler.deleteEvent(eventId);
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Event not found') {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

module.exports = router;