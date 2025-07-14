import express from "express";
import cors from "cors";
import applicationRoutes from "./api/application/route.js";
import userRoutes from "./api/users/route.js";

const app = express();
const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());
app.use("/api/application", applicationRoutes);
app.use("/api/users", userRoutes);

app.listen(PORT, () => {
    //load data?
  console.log(`Express server is running on port ${PORT}`);
});