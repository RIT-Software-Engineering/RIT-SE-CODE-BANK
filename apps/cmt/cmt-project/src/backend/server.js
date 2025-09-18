const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());

// health check
app.get('/api/health', (req, res) => {
  res.json({status: 'OK', message: 'Backend is running'});
});

// get all courses + sections from a professor
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            include: {professor: true, sections: true},
        });
        res.json(courses);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// create a course
app.post('/api/courses', async (req, res) => {
    try {
        const {id, name, semester, professorId} = req.body;
        const course = await prisma.course.create({
            data: {id, name, semester, professorId},
        });
        res.json(course);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});


// create a section for a course
app.post('/api/sections', async (req, res) => {
    try {
        const {sectionCode, courseId, professorId, classTimes} = req.body;
        const section = await prisma.section.create({
            data: {sectionCode, courseId, professorId,
                classTimes : {
                    create: c
                }
            }
        })
    } catch (err) {
        res.status(500).json({error: err.message});
    }
})



// update a course
app.put('/api/courses', async (req, res) => {
    try {

    } catch (err) {
        res.status(500).json({error: err.message});
    }
})



// start server
app.listen(PORT, () => {
    console.log('Server running on port ${PORT}');
})