import express from "express";
import dotenv from "dotenv";
import notifyRouter from "./routes/notify.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use("/send", notifyRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Notification service listening on :${PORT}`);
});
