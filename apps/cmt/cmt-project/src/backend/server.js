/* server.js */
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('!  JWT_SECRET is missing. Using a temporary dev secret. Add JWT_SECRET to your .env.');
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
   origin: [/^http:\/\/localhost:\d+$/], // CRA (3000/5001/etc.)
   credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/* ---------- Dev login (Shibboleth-mimicking) ---------- */
const fs = require('fs');
const path = require('path');
// const bcrypt = require('bcrypt'); // optional if you later hash passwords

const DEV_USERS_FILE = process.env.DEV_USERS_FILE ||
  path.join(__dirname, '..', '..', 'dev-users.json');

function loadDevUsers() {
  try {
    const raw = fs.readFileSync(DEV_USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load dev users:', e.message);
    return [];
  }
}

function inferRoleFromAffiliations(affs = []) {
  if (affs.includes('Faculty')) return 'professor';
  if (affs.includes('TA')) return 'ta';
  if (affs.includes('Employee')) return 'staff';
  if (affs.includes('Student')) return 'student';
  return 'guest';
}

if (process.env.NODE_ENV !== 'production') {
  // POST /dev/login  (email/uid + password)
  app.post('/dev/login', (req, res) => {
    const { uid, email, password } = req.body || {};
    if (!password || (!uid && !email))
      return res.status(400).json({ error: 'uid or email and password required' });

    const users = loadDevUsers();
    const needle = String((uid || email)).toLowerCase();
    const user = users.find(u =>
      (u.uid && String(u.uid).toLowerCase() === needle) ||
      (u.email && String(u.email).toLowerCase() === needle)
    );

    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const ok = user.password && password === user.password;
    // const ok = user.passwordHash && bcrypt.compareSync(password, user.passwordHash);

    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const claims = {
      sub: user.id,
      id: user.id,
      uid: user.uid,
      email: user.email,
      givenName: user.givenName,
      sn: user.sn,
      affiliations: user.affiliations,
      role: inferRoleFromAffiliations(user.affiliations),
      name: `${user.givenName} ${user.sn}`.trim()
    };

    const token = jwt.sign(
      claims,
      process.env.JWT_SECRET,
      { issuer: 'cmt-auth', expiresIn: '8h' }
    );

    res.cookie('cmt_id', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000
  });

    res.json({ ok: true, me: claims });
  });

  // POST /dev/logout  (clears cookie)
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
    // keep ALL claims so downstream code can use them
    req.me = {
      id: payload.sub,
      uid: payload.uid,
      email: payload.email,
      givenName: payload.givenName,
      sn: payload.sn,
      name: payload.name,
      role: payload.role,
      affiliations: payload.affiliations || []
    };
    next();
  } catch {
    return res.sendStatus(401);
  }
}

/* ---------- Attach DB actor (derived identity) ---------- */
async function attachActor(req, res, next) {
  try {
    const email = (req.me?.email || '').toLowerCase();

    // Safe helper: only call if the delegate exists
    const findFirstIf = (delegate, where) =>
      delegate && typeof delegate.findFirst === 'function'
        ? delegate.findFirst({ where })
        : Promise.resolve(null);
    const findUniqueIf = (delegate, where) =>
      delegate && typeof delegate.findUnique === 'function'
        ? delegate.findUnique({ where })
        : Promise.resolve(null);

    // Your schema has User and Professor — no Student, no TA
    const [user, prof] = await Promise.all([
      // User.email is @unique, so findUnique is ideal
      findUniqueIf(prisma.user, { email }),
      // Professor.email is NOT unique, so use findFirst
      findFirstIf(prisma.professor, { email }),
    ]);

    req.actor = {
      email,
      user,
      prof,
      student: null,
      ta: null,
      affiliations: req.me?.affiliations || []
    };
    next();
  } catch (e) {
    next(e);
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

/* ---------- Protected mounts (one gateway) ---------- */
// Everything under /api (except the explicit public routes you defined above)
// will now have req.me and req.actor available
app.use('/api', requireAuth, attachActor);

app.use('/api/team', teamBuilderRoutes);
app.use('/api/events', eventRoutes);

/* ---------- Example: professor-scoped endpoints ---------- */
// NOTE: These are already behind the /api gateway (requireAuth, attachActor)
// so we can rely on req.me and req.actor here.

app.get('/api/courseCreation', async (req, res) => {
  try {
    const prof = req.actor?.prof;
    if (!prof) return res.status(403).json({ error: 'No professor record for this account' });

    const courses = await prisma.courseCreation.findMany({
      where: { professorId: prof.id },               // ← scoped by logged-in professor
      include: { professor: true, sections: true }
    });

    res.json(courses);
  } catch (err) {
    console.error('courseCreation fetch failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courseCreation', async (req, res) => {
  try {
    const prof = req.actor?.prof;
    if (!prof) return res.status(403).json({ error: 'No professor record for this account' });

    const { id, name, semester } = req.body;         // no professorId from client
    const course = await prisma.courseCreation.create({
      data: { id, name, semester, professorId: prof.id }  // ← inject owner from actor
    });
    res.json(course);
  } catch (err) {
    console.error('course creation failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sections', async (req, res) => {
  try {
    const prof = req.actor?.prof;
    if (!prof) return res.status(403).json({ error: 'No professor record for this account' });

    const { sectionNum, courseId } = req.body;

    // Ensure the course belongs to this professor
    const owns = await prisma.courseCreation.findUnique({
      where: { id_professorId: { id: courseId, professorId: prof.id } },
      select: { id: true }
    });
    if (!owns) return res.status(403).json({ error: 'Not permitted for this course' });

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
  console.error('Error:', err.stack || err);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

/* ---------- Start ---------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'dev'})`);
  console.log(`🔗 API base http://localhost:${PORT}/api`);
});
