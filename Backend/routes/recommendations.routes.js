import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { getOpportunityRecommendations } from "../controllers/recommendation.controllers.js";

const router = express.Router();
router.use(authenticateToken);
router.get("/opportunities", getOpportunityRecommendations);
export default router;
