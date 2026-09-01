import express from "express";
import { getCareerReadiness } from "../controllers/career-readiness.controllers.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, getCareerReadiness);

export default router;
