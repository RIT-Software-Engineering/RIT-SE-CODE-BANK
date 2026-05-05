import express from "express";
import dotenv from "dotenv";
import preferencesRouter from "./routes/preferences.js";
import dispatchRouter from "./routes/dispatch.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

// New, simplified API surface
// - Preferences: GET/PUT /api/notifications/preferences/:appId/:userId
// - Dispatch:    POST    /api/notifications/dispatch/:appId
app.use("/notifications/preferences", preferencesRouter);
app.use("/notifications/dispatch", dispatchRouter);

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Notification service listening on :${PORT}`);
});
