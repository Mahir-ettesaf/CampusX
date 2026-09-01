import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  createMyResume,
  deleteMyResume,
  getMyResumes,
  updateMyResume,
} from "../controllers/resume.controllers.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getMyResumes);
router.post("/", createMyResume);
router.put("/:resumeId", updateMyResume);
router.delete("/:resumeId", deleteMyResume);

export default router;
