import express from "express";
import dotenv from "dotenv";
import notifyRouter from "./routes/notify.js";
import preferencesRouter from "./routes/preferences.js";
import recentRouter from "./routes/recent.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use("/send", notifyRouter);
app.use("/api/v1/preferences", preferencesRouter);
app.use("/api/v1/recent", recentRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Notification service listening on :${PORT}`);
});
