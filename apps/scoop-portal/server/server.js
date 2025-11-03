import express from "express";
import cors from "cors";
import semesterGroupRoutes from "./api/semestergroup/route.js";
import applicationRoutes from "./api/application/route.js";
import userRoutes from "./api/users/route.js";
import journalRoutes from "./api/journal/route.js";
import teamRoutes from "./api/teams/route.js";
import authRoutes from "./api/auth/route.js";
import projectRoutes from "./api/project/route.js";

import * as dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Increase payload size limit to 10MB for JSON and URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use("/api/semestergroup", semesterGroupRoutes);
app.use("/api/application", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/project", projectRoutes);

(async () => {
  // // const workflowsRoutesModule = await import('../../workflow/server/api/routes/workflows.js');
  // // const actionsRoutesModule = await import('../../workflow/server/api/routes/actions.js');
  // // const statesRoutesModule = await import('../../workflow/server/api/routes/states.js');
  // const permissionsRoutesModule = await import('../../workflow/server/api/routes/permissions.js');

  // // app.use("/workflows", workflowsRoutesModule.default);
  // app.use("/actions", actionsRoutesModule.default);
  // app.use("/states", statesRoutesModule.default);
  // app.use("/permissions", permissionsRoutesModule.default);

  app.listen(PORT, () => {
    console.log(`Express server is running on port ${PORT}`);
  });
})();
