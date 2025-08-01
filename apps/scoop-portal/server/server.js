import express from "express";
import cors from "cors";
import semesterGroupRoutes from "./api/semestergroup/route.js";
import applicationRoutes from "./api/application/route.js";
import userRoutes from "./api/users/route.js";
import journalRoutes from "./api/journal/route.js";
<<<<<<< HEAD
import projectRoutes from "./api/project/route.js";
import * as dotenv from "dotenv";
=======
import teamRoutes from "./api/teams/route.js";
import projectsRoutes from './api/projects/route.js';
import * as dotenv from 'dotenv';
>>>>>>> origin/scoop-portal-dev
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use("/api/semestergroup", semesterGroupRoutes);
app.use("/api/application", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/journal", journalRoutes);
<<<<<<< HEAD
app.use("/api/project", projectRoutes);
=======
app.use("/api/teams", teamRoutes);
app.use("/api/projects", projectsRoutes)
>>>>>>> origin/scoop-portal-dev

app.listen(PORT, () => {
  //load data?
  console.log(`Express server is running on port ${PORT}`);
});
