import express from "express";
import { PrismaClient } from "./prisma/generated/client/index.js";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

import authMiddleware from "./authMiddleware.js";

import courseRoutes from "./routes/course.js";
import makeTeamBuilderRouter from "./routes/teamBuilder.js";
import workflowRoutes from "./routes/workflows.js";
import sessionRoutes from './routes/session.js';
import resourceRoutes from './routes/resources.js';

import path from "path";
import { fileURLToPath } from "url";
import makeCourseWebsiteRouter from "./routes/courseWebsite.js";
import { readFileSync } from "fs";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '..', '.env');

dotenv.config({
  path: envPath,
});

const prisma = new PrismaClient();

const app = express();

const BACKEND_PORT = Number(process.env.BACKEND_PORT) || 5010; // API server
const FRONTEND_PORT = Number(process.env.PORT) || 3010;        // React dev server
const BASE_URL = process.env.BASE_URL || `http://localhost:${FRONTEND_PORT}`;

/* ------------------------------------------------------------------
   MIDDLEWARE
   ------------------------------------------------------------------ */

const allowedOrigins = [
  `http://localhost:${FRONTEND_PORT}`, // from .env (e.g., 3010)
  "http://localhost:3000",            // CRA default
  "http://apps-staging.se.rit.edu",   // staging
  "https://apps-staging.se.rit.edu",   // staging
  "https://apps.se.rit.edu",   // prod
];
if (process.env.REMOTE_DEV_SERVER_ORIGIN) allowedOrigins.push(process.env.REMOTE_DEV_SERVER_ORIGIN)

const courseWebsiteRoutes = makeCourseWebsiteRouter(prisma);
const teamBuilderRoutes = makeTeamBuilderRouter(prisma);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests from tools/extensions with no origin
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS: " + origin + ", Allowed origins: " + allowedOrigins.join(", ")));
    },
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware to attach prisma to request for workflow routes
app.use((req, _res, next) => {
  req.prisma = prisma;
  next();
});

// Attach req.user from the cmt_id cookie
app.use(authMiddleware);

// Simple logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/* ------------------------------------------------------------------
   ROUTES
   ------------------------------------------------------------------ */

// Dev login endpoint - creates a JWT token for testing
app.post("/api/cmt/dev/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Read dev-users.json for authentication
    const devUsersPath = path.join(__dirname, "dev-users.json");
    const devUsers = JSON.parse(readFileSync(devUsersPath, "utf-8"));

    // Find user by email
    const user = devUsers.find(u => u.email === email);

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create JWT token with user data from dev-users.json
    const token = jwt.sign(
      { 
        uid: user.uid,
        professorId: user.id,
        email: user.email,
        name: user.name,
        givenName: user.givenName,
        sn: user.sn,
        affiliations: user.affiliations,
        roles: user.roles,
      },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "7d" }
    );

    // Set cookie (httpOnly: false so frontend can read it)
    res.cookie("cmt_id", token, {
      httpOnly: false, // Allow JavaScript access for dev
      // secure: process.env.NODE_ENV === "production",
      secure: false, // For staging rn
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        roles: user.roles,
        affiliations: user.affiliations,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "CMT Backend is running",
  });
});

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    message: "CMT API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      events: "/api/cmt/events",
      courses: "/api/cmt/course",
      templates: "/api/cmt/template",
      workflows: "/api/cmt/workflows",
      teamBuilder: "/api/cmt/team-builder",
      session: "/api/cmt/session",
    },
  });
});

// API Routes
app.use("/api/cmt/course", courseRoutes);
app.use("/api/cmt/team-builder", teamBuilderRoutes);
app.use("/api/cmt/course-website", courseWebsiteRoutes);
app.use("/api/cmt/workflow", workflowRoutes)
app.use("/api/cmt/session", sessionRoutes);
app.use("/api/cmt/resources", resourceRoutes);

/* ------------------------------------------------------------------
   ERROR / 404 HANDLERS
   ------------------------------------------------------------------ */

// Error handling middleware
app.use((err, _req, res, _next) => {
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

/* ------------------------------------------------------------------
   START SERVER
   ------------------------------------------------------------------ */

// Start server
app.listen(BACKEND_PORT, () => {
  console.log(`🚀 Server running on port ${BACKEND_PORT}`);
  console.log(`🔗 API endpoints available at ${BASE_URL}/api`);
});