const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const eventRoutes = require("./routes/events");

const templateRoutes = require("./routes/template");

const app = express();
const PORT = process.env.PORT || 5010;
const templateRoutes = require("./routes/template");
const workflowRoutes = require("./routes/workflows");

const app = express();
const PORT = process.env.BACKEND_PORT || 5010;

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const makeTeamBuilderRouter = require("./routes/teamBuilder");
const teamBuilderRoutes = makeTeamBuilderRouter(prisma);

const makeCourseWebsiteRouter = require("./routes/courseWebsite");
const courseWebsiteRoutes = makeCourseWebsiteRouter(prisma);

app.use(
  cors({
    origin: /^http:\/\/localhost:\d+$/, // allows any localhost port
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to attach prisma to request for workflow routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/events", eventRoutes);
app.use("/api/template", templateRoutes);
app.use("/api/team-builder", teamBuilderRoutes);
app.use("/api/course-website", courseWebsiteRoutes)
app.use("/api/workflows", workflowRoutes); // NEW: Workflow routes

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
      workflows: "/api/workflows"
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

// 404 handler
// UPDATE course - add workflowId
// IMPORTANT: This MUST be BEFORE the 404 handler!
app.put("/api/course/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log("PUT /api/course/:id called with:", id, updateData);

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
    });

    console.log("Course updated successfully:", updatedCourse);

    res.json({
      success: true,
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// 404 handler - MUST BE LAST!
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Course Calendar Backend is ready!`);
  console.log(`🔗 API endpoints available at http://localhost:${PORT}/api`);
});