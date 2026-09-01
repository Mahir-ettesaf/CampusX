import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { createResource, deleteResource, getResource, listResources, updateResource } from "../controllers/academic-resource.controllers.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", listResources);
router.get("/:resourceId", getResource);
router.post("/", createResource);
router.put("/:resourceId", updateResource);
router.delete("/:resourceId", deleteResource);

export default router;
