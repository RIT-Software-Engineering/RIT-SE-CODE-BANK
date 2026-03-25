import preferencesRouter from "./routes/preferences.js";
import dispatchRouter from "./routes/dispatch.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

const env = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${env}` });

const app = express();

app.use(
  cors({
    origin: process.env.BASE_URL || "http://localhost:3020",
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
