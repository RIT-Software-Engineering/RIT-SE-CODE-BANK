import express from "express";
import cors from "cors";
import { userRoutes, communityRoutes, teamRoutes } from "./routes/routes";

const app = express();
app.use(cors()); // Allow all origins by default
app.use(express.json());

// Use routes
app.use('/api', userRoutes);
app.use('/api', communityRoutes);
app.use('/api', teamRoutes);

const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000
⭐️ See sample requests: https://github.com/prisma/prisma-examples/blob/latest/orm/express/README.md#using-the-rest-api`),
);
