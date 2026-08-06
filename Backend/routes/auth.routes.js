import express from "express";
import { register, login } from "../controllers/auth.controllers.js";

const router = express.Router();

// Test Route
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth Route Working 🚀",
  });
});

// Register Route
router.post("/register", register);
router.post("/login", login);

export default router;
