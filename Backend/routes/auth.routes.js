import express from "express";
import { register, login, getCurrentUser, requestPasswordReset, resetPassword, verifyAccount } from "../controllers/auth.controllers.js";
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
router.post("/password-reset/request", requestPasswordReset);
router.post("/password-reset/confirm", resetPassword);
router.post("/verify", verifyAccount);
router.get("/me", authenticateToken, getCurrentUser);

export default router;
