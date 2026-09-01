import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  createAnnouncementForUser,
  deleteAnnouncementForUser,
  getAnnouncementForUser,
  listAnnouncementsForUser,
  updateAnnouncementForUser,
} from "../controllers/announcement.controllers.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", listAnnouncementsForUser);
router.get("/:announcementId", getAnnouncementForUser);
router.post("/", createAnnouncementForUser);
router.put("/:announcementId", updateAnnouncementForUser);
router.delete("/:announcementId", deleteAnnouncementForUser);

export default router;
