const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// allows any port
app.use(cors({ origin: /http:\/\/localhost:\d+$/, credentials: true }));
app.use(bodyParser.json());

//console.log(process.env.DATABASE_URL);

// health check
app.get('/api/health', (req, res) => {
  res.json({status: 'OK', message: 'Backend is running'});
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

// start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})