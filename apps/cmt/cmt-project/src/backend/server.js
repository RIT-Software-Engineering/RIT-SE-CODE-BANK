/* server.js */
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  JWT_SECRET is missing. Using a temporary dev secret. Add JWT_SECRET to your .env.');
    process.env.JWT_SECRET = 'dev-temp-' + Math.random().toString(36).slice(2) + Date.now();
  } else {
    throw new Error('JWT_SECRET is required in production');
  }
}

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

/* ---------- Core middleware ---------- */
app.use(cors({
  origin: /^http:\/\/localhost:\d+$/, // allow any localhost port
  credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/* ---------- Dev login (temp) ---------- */
if (process.env.NODE_ENV !== 'production') {
  // Quick GET for manual testing: /dev/login/:email
  app.get('/dev/login/:email', (req, res) => {
    const email = String(req.params.email || '').toLowerCase();
    let role = 'student';
    if (email.includes('faculty')) role = 'professor';
    else if (email.includes('ta')) role = 'ta';

    const token = jwt.sign(
      { sub: email, email, name: email.split('@')[0], role },
      process.env.JWT_SECRET,
      { issuer: 'cmt-auth', expiresIn: '8h' }
    );

    res.cookie('cmt_id', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // true in prod behind HTTPS
      path: '/',
      maxAge: 8 * 60 * 60 * 1000
    });

    res.json({ ok: true, who: email, role });
  });

  // Form-based POST for your /pages/DevLogin.jsx
  app.post('/dev/login', (req, res) => {
    const { email, role } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });

    const _email = String(email).toLowerCase();
    const _role =
      role ||
      (_email.includes('faculty') ? 'professor' :
       _email.includes('ta') ? 'ta' : 'student');

    const token = jwt.sign(
      { sub: _email, email: _email, name: _email.split('@')[0], role: _role },
      process.env.JWT_SECRET,
      { issuer: 'cmt-auth', expiresIn: '8h' }
    );

    res.cookie('cmt_id', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // true in prod behind HTTPS
      path: '/',
      maxAge: 8 * 60 * 60 * 1000
    });

    res.json({ ok: true, role: _role });
  });

  // Logout clears cookie
  app.post('/dev/logout', (_req, res) => {
    res.clearCookie('cmt_id', { path: '/' });
    res.json({ ok: true });
  });
}

/* ---------- Auth middleware ---------- */
function requireAuth(req, res, next) {
  const token = req.cookies?.cmt_id;
  if (!token) return res.sendStatus(401);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'cmt-auth' });
    req.me = { id: payload.sub, email: payload.email, name: payload.name, role: payload.role };
    next();
  } catch {
    return res.sendStatus(401);
  }
}

/* ---------- PUBLIC routes (must be BEFORE protected mounts) ---------- */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Course Calendar Backend is running'
  });
});

app.get('/', (_req, res) => {
  res.json({
    message: 'Course Calendar Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      events: '/api/events'
    }
  });
});

/* ---------- Protected helpers ---------- */
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ me: req.me }); // { email, name, role }
});

/* ---------- Routers ---------- */
const makeTeamBuilderRouter = require('./routes/teamBuilder');
const teamBuilderRoutes = makeTeamBuilderRouter(prisma);

const makeEventsRouter = require('./routes/events');
const eventRoutes = makeEventsRouter(prisma);

/* ---------- Protected mounts (scoped paths) ---------- */
// NOTE: mount under specific prefixes so /api/health remains public
app.use('/api/team', requireAuth, teamBuilderRoutes);
app.use('/api/events', requireAuth, eventRoutes);

/* ---------- Example: professor-scoped endpoints ---------- */
app.get('/api/courseCreation', requireAuth, async (req, res) => {
  try {
    const prof = await prisma.professor.findUnique({
      where: { email: (req.me.email || '').toLowerCase() }
    });
    if (!prof) return res.status(403).json({ error: 'No professor record for this account' });

    const courses = await prisma.courseCreation.findMany({
      where: { professorId: prof.id },
      include: { professor: true, sections: true }
    });

    res.json(courses);
  } catch (err) {
    console.error('courseCreation fetch failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courseCreation', requireAuth, async (req, res) => {
  try {
    const prof = await prisma.professor.findUnique({
      where: { email: (req.me.email || '').toLowerCase() }
    });
    if (!prof) return res.status(403).json({ error: 'No professor record for this account' });

    const { id, name, semester } = req.body;
    const course = await prisma.courseCreation.create({
      data: { id, name, semester, professorId: prof.id }
    });
    res.json(course);
  } catch (err) {
    console.error('course creation failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sections', requireAuth, async (req, res) => {
  try {
    const prof = await prisma.professor.findUnique({
      where: { email: (req.me.email || '').toLowerCase() }
    });
    if (!prof) return res.status(403).json({ error: 'No professor record for this account' });

    const { sectionNum, courseId } = req.body;

    // ensure the course belongs to this professor
    const cc = await prisma.courseCreation.findUnique({
      where: { id_professorId: { id: courseId, professorId: prof.id } }
    });
    if (!cc) return res.status(403).json({ error: 'Not permitted for this course' });

    const section = await prisma.section.create({
      data: { sectionNum, courseId, professorId: prof.id }
    });
    res.json(section);
  } catch (err) {
    console.error('section creation failed:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- 404 & error ---------- */
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

app.use((err, _req, res, _next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

/* ---------- Start ---------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'dev'})`);
  console.log(`🔗 API base http://localhost:${PORT}/api`);
});
