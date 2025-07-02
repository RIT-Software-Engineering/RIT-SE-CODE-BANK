const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3003;

app.use(express.json()); // Allows parsing JSON bodies
app.use(express.urlencoded({ extended: true }));

// Allow requests from frontend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true, // if you send cookies or auth headers
}));

const projects = require('./data/dummy/projects.json');
const assessments = require('./data/dummy/assessments.json');
const peerToAssessmentCompletions = require('./data/dummy/peerToAssessmentCompletions.json');
const users = require('./data/dummy/users.json');

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

// Get the peer ID's for a project
app.get('/projects/getPeers/:id', (req, res) => {
  const id = req.params.id;

  const proj = projects.filter(p => p.id == id);
  if (proj.length == 0)
    res.status(404).send('Project not found');

  res.send(proj[0].peers);
})

// Get the peer full info for a project
app.get('/projects/getPeersFull/:id', (req, res) => {
  const id = req.params.id;

  const proj = projects.filter(p => p.id == id);
  if (proj.length == 0)
    res.status(404).send('Project not found');

  const peerIds = proj[0].peers;
  const peerInfos = []
  peerIds.forEach(pid => {
    peerInfos.push(users.find(u => u.id == pid));
  })

  res.send(peerInfos);
})

// ========================================================
// ASSESSMENTS
// ========================================================

// Get assessment by id
app.get('/assessments/:id', (req, res) => {
    const projectId = req.params.id;

    const projectAssessments = assessments.filter(a => a.id == projectId);

    res.send(projectAssessments[0]);
})

// Get project's assessments
app.get('/assessments/byProject/:projectId', (req, res) => {
    const projectId = req.params.projectId;

    const projectAssessments = assessments.filter(a => a.ownerProjectId == projectId);

    res.send(projectAssessments);
})

// Get peer's assessment responses
app.get('/assessments/responses/:userId/:assessmentId', (req, res) => {
    const userId = req.params.userId;
    const assessmentId = req.params.assessmentId;

    const peerResponse = peerToAssessmentCompletions?.[userId]?.[assessmentId].completions ?? {};

    res.send(peerResponse);
})

// Set peer's assessment response for a specific peer
app.post('/assessment/:assessmentId/addFeedback/:reviewerId/:revieweeId', (req, res) => {
  const assessmentId = req.params.assessmentId;
  const reviewerId = req.params.reviewerId;
  const revieweeId = req.params.revieweeId;
  
  let completions = peerToAssessmentCompletions[userId].completions;
  const otherCompletions = completions.filter(c => c.userId != revieweeId);

  peerToAssessmentCompletions[userId].completions = [req.body, ...otherCompletions];
  utils.save(rubrics, './data/peerToAssessmentCompletions.json')
    .then(() => console.log('Response updated successfully'))
    .catch(err => console.error('Error saving rubrics:', err));
  res.status(201);

})
