// src/backend/server.js
const path = require("path");
require("dotenv").config({
  // Load .env from the cmt-project root
  path: path.join(__dirname, "..", "..", ".env"),
});

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./authMiddleware");

const eventRoutes = require("./routes/events");
const templateRoutes = require("./routes/template");
const makeTeamBuilderRouter = require("./routes/teamBuilder");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const app = express();

const BACKEND_PORT = Number(process.env.BACKEND_PORT) || 5010; // API server
const FRONTEND_PORT = Number(process.env.PORT) || 3010;        // React dev server

/* ------------------------------------------------------------------
   MIDDLEWARE
   ------------------------------------------------------------------ */

const allowedOrigins = [
  `http://localhost:${FRONTEND_PORT}`, // from .env (e.g., 3010)
  "http://localhost:3000",            // CRA default
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests from tools/extensions with no origin
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Attach req.user from the cmt_id cookie
app.use(authMiddleware);

// Simple logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/* ------------------------------------------------------------------
   DEV USERS (JSON file) + DEV LOGIN ROUTES
   ------------------------------------------------------------------ */

let devUsers = [];
if (process.env.NODE_ENV !== "production") {
  try {
    const devUsersPath = path.join(__dirname, "dev-users.json");
    console.log("Loading dev-users from:", devUsersPath);
    devUsers = require(devUsersPath);
    console.log("Loaded dev users:", devUsers.length);
  } catch (e) {
    console.error("Could not load dev-users.json:", e.message);
    devUsers = [];
  }

  // GET /dev/users – list of test users for DevLoginPage
  app.get("/api/dev/users", (req, res) => {
  const publicUsers = devUsers.map(({ id, email, name, roles }) => ({
    id,
    email,
    name,
    roles,
  }));
  res.json({ users: publicUsers }); // wrapped for consistency
});

  // Helper: map dev user to JWT payload (match future Shibboleth claims)
  function buildClaimsFromDevUser(user) {
    return {
      sub: user.uid || user.email,
      email: user.email,
      name: user.name,
      givenName: user.givenName,
      sn: user.sn,
      affiliations: user.affiliations || [],
      roles: user.roles || [],
      uid: user.uid,
    };
  }

  // POST /dev/login { id } -> set cmt_id cookie
  app.post("/api/dev/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const user = devUsers.find(
    (u) => String(u.email || "").toLowerCase() === String(email).toLowerCase()
  );

  // dev-users.json must include "password"
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const claims = buildClaimsFromDevUser(user);

  const token = jwt.sign(claims, process.env.JWT_SECRET || "dev-secret", {
    issuer: "cmt-auth",
    expiresIn: "8h",
  });

  res.cookie("cmt_id", token, {
    httpOnly: false,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  });

  res.json({ ok: true, user: claims });
});
}



/* ------------------------------------------------------------------
   ROUTES
   ------------------------------------------------------------------ */

const teamBuilderRoutes = makeTeamBuilderRouter(prisma);

app.use("/api/events", eventRoutes);
app.use("/api/template", templateRoutes);
app.use("/api/team-builder", teamBuilderRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "Course Calendar Backend is running",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Course Calendar Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      events: "/api/events",
      courses: "/api/events/courses",
    },
  });
});

// get all courses from a professor
// TODO: CHANGE IT SO IT'S BASED ON THE PROFESSOR ID THAT'S CURRENTLY LOGGED IN
app.get("/api/course", async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: { professor: true },
    });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create a course
app.post("/api/course", async (req, res) => {
  try {
    let { id, name, semester, color, students, professorId } = req.body;
    students = parseInt(students, 10);
    const course = await prisma.course.create({
      data: { id, name, semester, color, students, professorId },
    });
    res.json(course);
  } catch (err) {
    console.error("course creation failed: ", err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------
   ERROR / 404 HANDLERS
   ------------------------------------------------------------------ */

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

/* ------------------------------------------------------------------
   START SERVER
   ------------------------------------------------------------------ */

app.listen(BACKEND_PORT, () => {
  console.log(`🚀 Server running on port ${BACKEND_PORT}`);
  console.log(`📚 Course Calendar Backend is ready!`);
  console.log(`🔗 API endpoints available at http://localhost:${BACKEND_PORT}/api`);
});
