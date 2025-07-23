import express from "express";
import cors from "cors";
import applicationRoutes from "./api/application/route.js";
<<<<<<< HEAD
import userRoutes from "./api/users/route.js";
=======
import journalRoutes from "./api/journal/route.js";
>>>>>>> scoop-portal-dev

const app = express();
const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());
app.use("/api/application", applicationRoutes);
<<<<<<< HEAD
app.use("/api/users", userRoutes);
=======
app.use("/api/journal", journalRoutes);
>>>>>>> scoop-portal-dev

app.listen(PORT, () => {
    //load data?
    console.log(`Express server is running on port ${PORT}`);
});
