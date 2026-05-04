import express from "express";
import { PrismaClient } from "./prisma/generated/client/index.js";
import cors from "cors";
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
import { CMTErrorToString, serializeError } from "@se-code-bank/cmt-shared-utilities";
import { getTimeString } from "../shared-utilities/cmtLogging.js";

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
const BASE_URL = process.env.BASE_URL || `http://localhost:${BACKEND_PORT}`;

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

      return callback(new Error("CMT Error: Not allowed by CORS: " + origin + ", Allowed origins: " + allowedOrigins.join(", ")));
    },
    credentials: true,
  })
);

// Logs requests on finish. May give confusing results if requests are long-running, but that really shouldn't happen. Additionally, knowing the resultant code and elapsed time can be helpful.
app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();;

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1000000;
    console.log(
      `${getTimeString()} ${req.method} ${req.originalUrl} - ${res.statusCode} - ${durationMs.toFixed(1)}ms`
    );
  });

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware to attach prisma to request for workflow routes
app.use((req, _res, next) => {
  req.prisma = prisma;
  next();
});

// Attach req.user from the cmt_id cookie
app.use(authMiddleware);

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
app.use("/api/cmt/workflow", workflowRoutes)
app.use("/api/cmt/session", sessionRoutes);
app.use("/api/cmt/resources", resourceRoutes);

/* ------------------------------------------------------------------
   ERROR / 404 HANDLERS
   ------------------------------------------------------------------ */

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`
    Error in: ${req.method} ${req.path}
    Full request URL: ${req.url}
    
    Request body:
    ${JSON.stringify(req.body ?? "")}
    
    Error: ${CMTErrorToString(err)}
  `)

  // If error happens during streaming of response, allow express to handle
  if (res.headersSent) {
    return next(err);
  }

  // Prisma Record Not Found
  if (err.code === 'P2025') {
    return res.sendStatus(404)
  }

  // Otherwise, start streaming the response manually.
  // Default error serialization is garbo, so specify things manually.
  res.status(err.status || err.statusCode || 500).json({
    error: err ? serializeError(err): "Internal Server Error"
  })
});

// 404 handler - MUST BE LAST!
app.use((req, res) => {
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
  console.log(
    `Server running on port ${BACKEND_PORT}
and URL: ${BASE_URL}/api`
  );
});
