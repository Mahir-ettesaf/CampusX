import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  createMyResume,
  deleteMyResume,
  getMyResumes,
  reviewMyResume,
  uploadMyResumeDocument,
  updateMyResume,
} from "../controllers/resume.controllers.js";
import { resumeDocumentUpload } from "../services/resume-document.service.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getMyResumes);
router.post("/", createMyResume);
router.post("/:resumeId/review", reviewMyResume);
router.post("/:resumeId/upload", resumeDocumentUpload, uploadMyResumeDocument);
router.put("/:resumeId", updateMyResume);
router.delete("/:resumeId", deleteMyResume);

export default router;
