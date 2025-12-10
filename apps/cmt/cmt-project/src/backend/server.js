const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const eventRoutes = require("./routes/events");
const courseRoutes = require("./routes/course"); // NEW - Course routes
const templateRoutes = require("./routes/template");
const workflowRoutes = require("./routes/workflows");

const app = express();
const PORT = process.env.BACKEND_PORT || 5010;

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const makeTeamBuilderRouter = require("./routes/teamBuilder");
const teamBuilderRoutes = makeTeamBuilderRouter(prisma);

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
app.use("/api/cmt/events", eventRoutes);
app.use("/api/cmt/course", courseRoutes); // NEW - All course routes (CRUD + workflow)
app.use("/api/cmt/template", templateRoutes);
app.use("/api/cmt/team-builder", teamBuilderRoutes);
app.use("/api/cmt/workflows", workflowRoutes);

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
      events: "/api/cmt/events",
      courses: "/api/cmt/course",
      templates: "/api/cmt/template",
      workflows: "/api/cmt/workflows",
      teamBuilder: "/api/cmt/team-builder",
    },
  });
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