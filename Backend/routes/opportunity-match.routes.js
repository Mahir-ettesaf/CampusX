import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { getOpportunityMatch } from "../controllers/opportunity-match.controllers.js";

const router = express.Router();
router.use(authenticateToken);
router.get("/:opportunityId/match", getOpportunityMatch);
export default router;
