import db from "../config/db.js";

const query = (sql, values = []) => new Promise((resolve, reject) =>
  db.query(sql, values, (error, results) => error ? reject(error) : resolve(results)),
);

const columns = "id, user_id, title, description, item_type, due_at, status, priority, created_at, updated_at";

export const findPlannerItems = ({ userId, itemType, status, dueFrom, dueTo, upcoming } = {}) => {
  const where = ["user_id = ?"];
  const values = [userId];
  if (itemType) { where.push("item_type = ?"); values.push(itemType); }
  if (status) { where.push("status = ?"); values.push(status); }
  if (dueFrom) { where.push("due_at >= ?"); values.push(dueFrom); }
  if (dueTo) { where.push("due_at <= ?"); values.push(dueTo); }
  if (upcoming) where.push("status = 'pending' AND due_at >= UTC_TIMESTAMP()");
  return query(
    `SELECT ${columns} FROM planner_items
     WHERE ${where.join(" AND ")}
     ORDER BY CASE
       WHEN status = 'pending' AND due_at >= UTC_TIMESTAMP() THEN 0
       WHEN status = 'pending' THEN 1
       WHEN status = 'completed' THEN 2
       ELSE 3
     END, due_at ASC, id ASC`,
    values,
  );
};

export const findPlannerItem = async (userId, itemId) => {
  const results = await query(`SELECT ${columns} FROM planner_items WHERE id = ? AND user_id = ?`, [itemId, userId]);
  return results[0] || null;
};

export const createPlannerItem = async (userId, data) => {
  const result = await query(
    `INSERT INTO planner_items (user_id, title, description, item_type, due_at, status, priority)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, data.title, data.description, data.item_type, data.due_at, data.status, data.priority],
  );
  return findPlannerItem(userId, result.insertId);
};

export const updatePlannerItem = async (userId, itemId, data) => {
  const fields = Object.keys(data);
  await query(
    `UPDATE planner_items SET ${fields.map((field) => `\`${field}\` = ?`).join(", ")} WHERE id = ? AND user_id = ?`,
    [...fields.map((field) => data[field]), itemId, userId],
  );
  return findPlannerItem(userId, itemId);
};

export const deletePlannerItem = (userId, itemId) =>
  query("DELETE FROM planner_items WHERE id = ? AND user_id = ?", [itemId, userId]);
