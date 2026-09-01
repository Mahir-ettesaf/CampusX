import db from "../config/db.js";

const query = (sql, values = []) => new Promise((resolve, reject) =>
  db.query(sql, values, (error, results) => error ? reject(error) : resolve(results)),
);

const columns = `ar.id, ar.title, ar.description, ar.resource_type, ar.subject,
  ar.resource_url, ar.created_by, ar.status, ar.created_at, ar.updated_at,
  u.full_name AS creator_name`;

export const listAcademicResources = ({ createdBy, status, resourceType, subject, search } = {}) => {
  const where = [];
  const values = [];
  if (createdBy !== undefined) { where.push("ar.created_by = ?"); values.push(createdBy); }
  if (status) { where.push("ar.status = ?"); values.push(status); }
  if (resourceType) { where.push("ar.resource_type = ?"); values.push(resourceType); }
  if (subject) { where.push("ar.subject LIKE ?"); values.push(`%${subject}%`); }
  if (search) { where.push("(ar.title LIKE ? OR ar.description LIKE ? OR ar.subject LIKE ?)"); values.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  return query(
    `SELECT ${columns}
     FROM academic_resources ar
     INNER JOIN users u ON u.id = ar.created_by
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY ar.updated_at DESC, ar.id DESC`,
    values,
  );
};

export const findAcademicResource = async (resourceId) => {
  const results = await query(
    `SELECT ${columns} FROM academic_resources ar
     INNER JOIN users u ON u.id = ar.created_by
     WHERE ar.id = ?`,
    [resourceId],
  );
  return results[0] || null;
};

export const createAcademicResource = async (createdBy, data) => {
  const result = await query(
    `INSERT INTO academic_resources
      (title, description, resource_type, subject, resource_url, created_by, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.title, data.description, data.resource_type, data.subject, data.resource_url, createdBy, data.status],
  );
  return findAcademicResource(result.insertId);
};

export const updateAcademicResource = async (resourceId, data) => {
  const fields = Object.keys(data);
  if (fields.length > 0) {
    await query(
      `UPDATE academic_resources SET ${fields.map((field) => `\`${field}\` = ?`).join(", ")} WHERE id = ?`,
      [...fields.map((field) => data[field]), resourceId],
    );
  }
  return findAcademicResource(resourceId);
};

export const deleteAcademicResource = (resourceId) =>
  query("DELETE FROM academic_resources WHERE id = ?", [resourceId]);
