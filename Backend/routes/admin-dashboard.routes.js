import express from "express";
import { getDashboard } from "../controllers/admin-dashboard.controllers.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, getDashboard);

export default router;
