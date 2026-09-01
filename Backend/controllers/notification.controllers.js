import {
  deleteNotificationForRecipient,
  findNotificationForRecipient,
  listNotificationsForRecipient,
  markAllNotificationsReadForRecipient,
  markNotificationReadForRecipient,
} from "../models/notification.model.js";

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const internal = (res) => fail(res, 500, "Unable to process the notification request");
const getId = (value) => { const id = Number(value); return Number.isInteger(id) && id > 0 ? id : null; };
const safeNotification = ({ id, notification_type, title, message, is_read, related_entity_type, related_entity_id, created_at, read_at }) => ({ id, type: notification_type, title, message, is_read: Boolean(is_read), related_entity_type, related_entity_id, created_at, read_at });

const listOptions = (query) => {
  const { unread, limit, offset } = query;
  if (unread !== undefined && unread !== "true" && unread !== "1") return { error: "Unread filter must be true when provided" };
  const parsedLimit = limit === undefined ? 50 : Number(limit);
  const parsedOffset = offset === undefined ? 0 : Number(offset);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) return { error: "Limit must be an integer between 1 and 100" };
  if (!Number.isInteger(parsedOffset) || parsedOffset < 0) return { error: "Offset must be a non-negative integer" };
  return { options: { unread: unread === "true" || unread === "1", limit: parsedLimit, offset: parsedOffset } };
};

export const listNotifications = async (req, res) => {
  const validated = listOptions(req.query);
  if (validated.error) return fail(res, 400, validated.error);
  try { return res.json({ success: true, notifications: (await listNotificationsForRecipient(req.user.id, validated.options)).map(safeNotification) }); }
  catch { return internal(res); }
};

export const getNotification = async (req, res) => {
  const notificationId = getId(req.params.notificationId);
  if (!notificationId) return fail(res, 400, "Provide a valid notification ID");
  try { const notification = await findNotificationForRecipient(notificationId, req.user.id); return notification ? res.json({ success: true, notification: safeNotification(notification) }) : fail(res, 404, "Notification was not found"); }
  catch { return internal(res); }
};

export const markNotificationRead = async (req, res) => {
  const notificationId = getId(req.params.notificationId);
  if (!notificationId) return fail(res, 400, "Provide a valid notification ID");
  try {
    const notification = await findNotificationForRecipient(notificationId, req.user.id);
    if (!notification) return fail(res, 404, "Notification was not found");
    await markNotificationReadForRecipient(notificationId, req.user.id);
    return res.json({ success: true, message: "Notification marked as read", notification: safeNotification(await findNotificationForRecipient(notificationId, req.user.id)) });
  } catch { return internal(res); }
};

export const markAllNotificationsRead = async (req, res) => {
  try { const result = await markAllNotificationsReadForRecipient(req.user.id); return res.json({ success: true, message: "Notifications marked as read", marked_count: result.affectedRows }); }
  catch { return internal(res); }
};

export const deleteNotification = async (req, res) => {
  const notificationId = getId(req.params.notificationId);
  if (!notificationId) return fail(res, 400, "Provide a valid notification ID");
  try { const result = await deleteNotificationForRecipient(notificationId, req.user.id); return result.affectedRows ? res.json({ success: true, message: "Notification deleted successfully" }) : fail(res, 404, "Notification was not found"); }
  catch { return internal(res); }
};
