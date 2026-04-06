import express from "express";
import dotenv from "dotenv";
import preferencesRouter from "./routes/preferences.js";
import dispatchRouter from "./routes/dispatch.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.BASE_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

// New, simplified API surface
// - Preferences: GET/PUT /api/notifications/preferences/:appId/:userId
// - Dispatch:    POST    /api/notifications/dispatch/:appId
app.use("/api/notifications/preferences", preferencesRouter);
app.use("/api/notifications/dispatch", dispatchRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Notification service listening on :${PORT}`);
});
