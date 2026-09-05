import express from "express";
import {
  getProfile,
  getGitHubPortfolio,
  updateAcademicProfile,
  updateFacultyProfile,
  updateProfile,
  updateRecruiterProfile,
} from "../controllers/profile.controllers.js";
import {
  addMySkill,
  deleteMySkill,
  getMySkills,
  updateMySkill,
} from "../controllers/skill.controllers.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getProfile);
router.get("/github-portfolio", getGitHubPortfolio);
router.put("/", updateProfile);
router.put("/academic", updateAcademicProfile);
router.put("/faculty", updateFacultyProfile);
router.put("/recruiter", updateRecruiterProfile);
router.get("/skills", getMySkills);
router.post("/skills", addMySkill);
router.put("/skills/:skillId", updateMySkill);
router.delete("/skills/:skillId", deleteMySkill);

export default router;
