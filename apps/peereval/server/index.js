const express = require('express');
const app = express();
const PORT = 3003;

app.use(express.json()); // Allows parsing JSON bodies

const projects = require('./data/dummy/projects.json');
const assessments = require('./data/dummy/assessments.json');
const peerToAssessmentCompletions = require('./data/dummy/peerToAssessmentCompletions.json');

// Sample route
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// Sample API route
app.get('/api/greet', (req, res) => {
  res.json({ message: 'Hello from API!' });
});

// POST route example
app.post('/api/echo', (req, res) => {
  res.json({ youSent: req.body });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


// ========================================================
// PROJECTS
// ========================================================

// Get projects by peer
app.get('/projects/asPeer/:userId', (req, res) => {
    const userId = req.params.userId;

    const peerProjects = projects.filter(p => p.peers.includes(userId))

    res.send(peerProjects.map(p => {
        p.id,
        p.name,
        p.description
    }));
})

// Get projects by overseer
app.get('/projects/asOverseer/:userId', (req, res) => {
    const userId = req.params.userId;

    const peerProjects = projects.filter(p => p.overseer.includes(userId))

    res.send(peerProjects.map(p => {
        p.id,
        p.name,
        p.description
    }));
})

// ========================================================
// ASSESSMENTS
// ========================================================

// Get projects's assessments
app.get('/assessments/byProjects/:projectId', (req, res) => {
    const projectId = req.params.projectId;

    const projectAssessments = assessments.filter(a => a.ownerProjectId == projectId);

    res.send(projectAssessments);
})

// Get peer's assessment responses
app.get('/assessments/responses/:userId/:assessmentId', (req, res) => {
    const userId = req.params.userId;
    const assessmentId = req.params.assessmentId;

    const peerResponse = peerToAssessmentCompletions[userId].filter(c => c.assessmentId == assessmentId);

    res.send(peerResponse.length === 0 ? {} : peerResponse[0]);
})

