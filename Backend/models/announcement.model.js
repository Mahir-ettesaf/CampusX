import db from "../config/db.js";

const query = (sql, values = []) => new Promise((resolve, reject) =>
  db.query(sql, values, (error, results) => error ? reject(error) : resolve(results)),
);

const columns = `a.id, a.title, a.content, a.announcement_type, a.audience,
  a.created_by, a.status, a.published_at, a.created_at, a.updated_at,
  u.full_name AS creator_name`;

export const listAnnouncements = ({ createdBy, status, audience, announcementType, search } = {}) => {
  const where = [];
  const values = [];
  if (createdBy !== undefined) { where.push("a.created_by = ?"); values.push(createdBy); }
  if (status) { where.push("a.status = ?"); values.push(status); }
  if (audience) {
    const audiences = Array.isArray(audience) ? audience : [audience];
    where.push(`a.audience IN (${audiences.map(() => "?").join(", ")})`);
    values.push(...audiences);
  }
  if (announcementType) { where.push("a.announcement_type = ?"); values.push(announcementType); }
  if (search) { where.push("(a.title LIKE ? OR a.content LIKE ?)"); values.push(`%${search}%`, `%${search}%`); }

  return query(
    `SELECT ${columns}
     FROM announcements a
     INNER JOIN users u ON u.id = a.created_by
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY a.published_at DESC, a.updated_at DESC, a.id DESC`,
    values,
  );
};

export const findAnnouncement = async (announcementId) => {
  const results = await query(
    `SELECT ${columns}
     FROM announcements a
     INNER JOIN users u ON u.id = a.created_by
     WHERE a.id = ?`,
    [announcementId],
  );
  return results[0] || null;
};

export const createAnnouncement = async (createdBy, data) => {
  const result = await query(
    `INSERT INTO announcements
      (title, content, announcement_type, audience, created_by, status, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.title, data.content, data.announcement_type, data.audience, createdBy, data.status, data.published_at],
  );
  return findAnnouncement(result.insertId);
};

export const updateAnnouncement = async (announcementId, data) => {
  const fields = Object.keys(data);
  if (fields.length > 0) {
    await query(
      `UPDATE announcements SET ${fields.map((field) => `\`${field}\` = ?`).join(", ")} WHERE id = ?`,
      [...fields.map((field) => data[field]), announcementId],
    );
  }
  return findAnnouncement(announcementId);
};

export const deleteAnnouncement = (announcementId) =>
  query("DELETE FROM announcements WHERE id = ?", [announcementId]);
