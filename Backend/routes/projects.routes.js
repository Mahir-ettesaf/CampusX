import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  createMyProject,
  deleteMyProject,
  getMyProjects,
  updateMyProject,
} from "../controllers/project.controllers.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getMyProjects);
router.post("/", createMyProject);
router.put("/:projectId", updateMyProject);
router.delete("/:projectId", deleteMyProject);

export default router;
