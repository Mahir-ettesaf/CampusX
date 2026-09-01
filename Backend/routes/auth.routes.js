import express from "express";
import { register, login, getCurrentUser } from "../controllers/auth.controllers.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

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
router.get("/me", authenticateToken, getCurrentUser);

export default router;
