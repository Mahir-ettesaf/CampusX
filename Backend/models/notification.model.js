import db from "../config/db.js";

const query = (sql, values = []) => new Promise((resolve, reject) =>
  db.query(sql, values, (error, results) => error ? reject(error) : resolve(results)),
);

const columns = "id, notification_type, title, message, is_read, related_entity_type, related_entity_id, created_at, read_at";

// This helper is intentionally backend-only. Future trusted event handlers supply recipientUserId.
export const createNotification = async (recipientUserId, data) => {
  const result = await query(
    "INSERT INTO notifications (recipient_user_id, notification_type, title, message, related_entity_type, related_entity_id) VALUES (?, ?, ?, ?, ?, ?)",
    [recipientUserId, data.notification_type, data.title, data.message, data.related_entity_type, data.related_entity_id],
  );
  return findNotificationForRecipient(result.insertId, recipientUserId);
};

// Server-side batch helper for announcement publication. Audience is validated by its caller.
export const createNotificationsForAudience = (audience, data) => {
  const roles = audience === "all" ? ["student", "graduate", "faculty", "recruiter", "admin"] : [audience];
  return query(
    `INSERT INTO notifications (recipient_user_id, notification_type, title, message, related_entity_type, related_entity_id)
     SELECT id, ?, ?, ?, ?, ? FROM users WHERE role IN (${roles.map(() => "?").join(", ")})`,
    [data.notification_type, data.title, data.message, data.related_entity_type, data.related_entity_id, ...roles],
  );
};

export const listNotificationsForRecipient = (recipientUserId, { unread, limit, offset }) => {
  const where = ["recipient_user_id = ?"];
  const values = [recipientUserId];
  if (unread) where.push("is_read = 0");
  return query(
    `SELECT ${columns} FROM notifications WHERE ${where.join(" AND ")} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
};

export const findNotificationForRecipient = async (notificationId, recipientUserId) =>
  (await query(`SELECT ${columns} FROM notifications WHERE id = ? AND recipient_user_id = ?`, [notificationId, recipientUserId]))[0] || null;

export const markNotificationReadForRecipient = (notificationId, recipientUserId) =>
  query("UPDATE notifications SET is_read = 1, read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id = ? AND recipient_user_id = ?", [notificationId, recipientUserId]);

export const markAllNotificationsReadForRecipient = (recipientUserId) =>
  query("UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE recipient_user_id = ? AND is_read = 0", [recipientUserId]);

export const deleteNotificationForRecipient = (notificationId, recipientUserId) =>
  query("DELETE FROM notifications WHERE id = ? AND recipient_user_id = ?", [notificationId, recipientUserId]);
