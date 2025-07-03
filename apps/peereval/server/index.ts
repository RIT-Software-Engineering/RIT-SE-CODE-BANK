import express from "express";
import cors from "cors";
import userRoutes from "./routes/users";
import projectRoutes from "./routes/projects";

const app = express();
const PORT = process.env.PORT || 3006;

app.use(express.json());
// Allow requests from frontend
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, // if you send cookies or auth headers
  })
);

// -------------------------------------------------------
// ROUTES
// -------------------------------------------------------
app.use("/users", userRoutes);
app.use("/projects", projectRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
