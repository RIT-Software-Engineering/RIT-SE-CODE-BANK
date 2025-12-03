// src/backend/server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./authMiddleware");

const eventRoutes = require("./routes/events");
const templateRoutes = require("./routes/template");
const makeTeamBuilderRouter = require("./routes/teamBuilder");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 5010;

/* ------------------------------------------------------------------
   MIDDLEWARE
   ------------------------------------------------------------------ */

app.use(
  cors({
    origin: /^http:\/\/localhost:\d+$/, // allows any localhost port
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(authMiddleware);

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
  app.get("/dev/users", (req, res) => {
    const publicUsers = devUsers.map(({ id, email, name, roles }) => ({
      id,
      email,
      name,
      roles,
    }));
    res.json(publicUsers);
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
  app.post("/dev/login", (req, res) => {
    const { id } = req.body || {};
    const user = devUsers.find((u) => u.id === id);

    if (!user) {
      return res.status(404).json({ error: "Unknown dev user" });
    }

    const claims = buildClaimsFromDevUser(user);

    const token = jwt.sign(claims, process.env.JWT_SECRET || "dev-secret", {
      issuer: "cmt-auth",
      expiresIn: "8h",
    });

    // In dev we allow JS to read this cookie (RequireAuth on the frontend)
    res.cookie("cmt_id", token, {
      httpOnly: false,
      sameSite: "lax",
      secure: false, // ok for http://localhost
      path: "/",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Course Calendar Backend is ready!`);
  console.log(`🔗 API endpoints available at http://localhost:${PORT}/api`);
});
