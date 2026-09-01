import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { deleteNotification, getNotification, listNotifications, markAllNotificationsRead, markNotificationRead } from "../controllers/notification.controllers.js";

const router = express.Router();
router.use(authenticateToken);
router.get("/", listNotifications);
router.put("/read-all", markAllNotificationsRead);
router.get("/:notificationId", getNotification);
router.put("/:notificationId/read", markNotificationRead);
router.delete("/:notificationId", deleteNotification);
export default router;
