import express from "express";
import { getSkills } from "../controllers/skill.controllers.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getSkills);

export default router;
