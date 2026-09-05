import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  createMyProject,
  deleteMyProject,
  getMyProjects,
  updateMyProject,
  uploadMyProjectFile,
} from "../controllers/project.controllers.js";
import { portfolioFileUpload } from "../services/portfolio-upload.service.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getMyProjects);
router.post("/", createMyProject);
router.post("/:projectId/upload", portfolioFileUpload, uploadMyProjectFile);
router.put("/:projectId", updateMyProject);
router.delete("/:projectId", deleteMyProject);

export default router;
