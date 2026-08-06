import cors from "cors";
import express from "express";
import "./config/db.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();
app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("CampusX Backend is Running 🚀");
});

app.use("/api/auth", authRoutes);

export default app;
