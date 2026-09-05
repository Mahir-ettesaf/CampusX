import db from "../config/db.js";
const query = (sql, values = []) => new Promise((resolve, reject) => db.query(sql, values, (error, results) => error ? reject(error) : resolve(results)));
const columns = "id, user_id, title, description, due_date, status, progress_percentage, created_at, updated_at";
export const listMilestones = (userId) => query(`SELECT ${columns} FROM thesis_milestones WHERE user_id = ? ORDER BY status = 'completed', due_date, id`, [userId]);
export const findMilestone = async (userId, id) => (await query(`SELECT ${columns} FROM thesis_milestones WHERE user_id = ? AND id = ?`, [userId, id]))[0] || null;
export const createMilestone = async (userId, data) => { const result = await query("INSERT INTO thesis_milestones (user_id,title,description,due_date,status,progress_percentage) VALUES (?,?,?,?,?,?)", [userId, data.title, data.description, data.due_date, data.status, data.progress_percentage]); return findMilestone(userId, result.insertId); };
export const updateMilestone = async (userId, id, data) => { const fields = Object.keys(data); await query(`UPDATE thesis_milestones SET ${fields.map((field) => `\`${field}\` = ?`).join(", ")} WHERE user_id = ? AND id = ?`, [...fields.map((field) => data[field]), userId, id]); return findMilestone(userId, id); };
export const deleteMilestone = (userId, id) => query("DELETE FROM thesis_milestones WHERE user_id = ? AND id = ?", [userId, id]);
