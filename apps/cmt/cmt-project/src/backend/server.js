const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const eventRoutes = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 5000;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/events', eventRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Course Calendar Backend is running'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Course Calendar Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      events: '/api/events',
      courses: '/api/events/courses'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// get all courses + sections from a professor
// TODO: CHANGE IT SO IT'S BASED ON THE PROFESSOR ID THAT'S CURRENTLY LOGGED IN
app.get('/api/courseCreation', async (req, res) => {
    try {
        const courses = await prisma.courseCreation.findMany({
            include: {professor: true, sections: true},
        });
        res.json(courses);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// create a course
app.post('/api/courseCreation', async (req, res) => {
    try {
        const {id, name, semester, professorId} = req.body;
        const course = await prisma.courseCreation.create({
            data: {id, name, semester, professorId},
        });
        res.json(course);
    } catch (err) {
        console.error('course creation failed: ', err)
        res.status(500).json({error: err.message});
    }
});

// create a section for a course
// creates them without the class times
app.post('/api/sections', async (req, res) => {
    try {
        const {sectionNum, courseId, professorId} = req.body;
        const section = await prisma.section.create({
            data: {sectionNum, courseId, professorId}
        });
        res.json(section);
    } catch (err) {
        console.error('section creation failed: ', err)
        res.status(500).json({error: err.message});
    }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Course Calendar Backend is ready!`);
  console.log(`🔗 API endpoints available at http://localhost:${PORT}/api`);
});
