import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { createResource, deleteResource, getResource, listResources, updateResource, uploadResourceFile } from "../controllers/academic-resource.controllers.js";
import { portfolioFileUpload } from "../services/portfolio-upload.service.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", listResources);
router.get("/:resourceId", getResource);
router.post("/", createResource);
router.post("/:resourceId/upload", portfolioFileUpload, uploadResourceFile);
router.put("/:resourceId", updateResource);
router.delete("/:resourceId", deleteResource);

export default router;
