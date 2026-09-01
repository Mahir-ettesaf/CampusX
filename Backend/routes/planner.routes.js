import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { createMyPlannerItem, deleteMyPlannerItem, getMyPlannerItem, listMyPlannerItems, updateMyPlannerItem } from "../controllers/planner.controllers.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", listMyPlannerItems);
router.get("/:itemId", getMyPlannerItem);
router.post("/", createMyPlannerItem);
router.put("/:itemId", updateMyPlannerItem);
router.delete("/:itemId", deleteMyPlannerItem);

export default router;
