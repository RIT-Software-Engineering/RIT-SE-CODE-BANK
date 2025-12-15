import express from "express";
import cors from "cors";
import semesterGroupRoutes from "./api/semestergroup/route.js";
import applicationRoutes from "./api/application/route.js";
import userRoutes from "./api/users/route.js";
import journalRoutes from "./api/journal/route.js";
import teamRoutes from "./api/teams/route.js";
import authRoutes from "./api/auth/route.js";
import projectRoutes from "./api/project/route.js";
import checkJwt from "./middleware.js";

import * as dotenv from "dotenv";
dotenv.config();

const app = express();


const PORT = process.env.PORT || 5002;

app.use(cors());


// Increase payload size limit to 10MB for JSON and URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use("/scoop-portal/api/semestergroup", semesterGroupRoutes);
app.use("/scoop-portal/api/application", applicationRoutes);
app.use("/scoop-portal/api/users", userRoutes);
app.use("/scoop-portal/api/journal", journalRoutes);
app.use("/scoop-portal/api/teams", teamRoutes);
app.use("/scoop-portal/api/auth", authRoutes);
app.use("/scoop-portal/api/project", checkJwt, projectRoutes);

(async () => {

  app.listen(PORT, () => {
    console.log(`Express server is running on port ${PORT}`);
  });
})();
