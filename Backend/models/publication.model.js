import db from "../config/db.js";

const query = (sql, values = []) => new Promise((resolve, reject) => db.query(sql, values, (error, results) => error ? reject(error) : resolve(results)));
const columns = `id, user_id, title, authors, journal_or_conference, publication_date, doi, publication_url, abstract, created_at, updated_at`;

export const findUserPublications = (userId) => query(`SELECT ${columns} FROM publications WHERE user_id = ? ORDER BY publication_date DESC, updated_at DESC, id DESC`, [userId]);
export const findUserPublication = async (userId, publicationId) => (await query(`SELECT ${columns} FROM publications WHERE id = ? AND user_id = ?`, [publicationId, userId]))[0] || null;
export const createUserPublication = async (userId, data) => {
  const result = await query(`INSERT INTO publications (user_id, title, authors, journal_or_conference, publication_date, doi, publication_url, abstract) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [userId, data.title, data.authors, data.journal_or_conference, data.publication_date, data.doi, data.publication_url, data.abstract]);
  return findUserPublication(userId, result.insertId);
};
export const updateUserPublication = async (userId, publicationId, data) => {
  const fields = Object.keys(data);
  await query(`UPDATE publications SET ${fields.map((field) => `\`${field}\` = ?`).join(", ")} WHERE id = ? AND user_id = ?`, [...fields.map((field) => data[field]), publicationId, userId]);
  return findUserPublication(userId, publicationId);
};
export const deleteUserPublication = (userId, publicationId) => query("DELETE FROM publications WHERE id = ? AND user_id = ?", [publicationId, userId]);
