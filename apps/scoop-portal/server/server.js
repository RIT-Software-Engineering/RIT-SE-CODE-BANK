import express from "express";
import cors from "cors";
import applicationRoutes from "./api/application/route.js";
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use("/api/application", applicationRoutes);

app.listen(PORT, () => {
    //load data?
  console.log(`Express server is running on port ${PORT}`);
});