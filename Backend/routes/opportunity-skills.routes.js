import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { addRequiredSkill, listOpportunitySkills, removeRequiredSkill } from "../controllers/opportunity-skill.controllers.js";

const router = express.Router();
router.use(authenticateToken);
router.get("/:opportunityId/skills", listOpportunitySkills);
router.post("/:opportunityId/skills", addRequiredSkill);
router.delete("/:opportunityId/skills/:skillId", removeRequiredSkill);
export default router;
