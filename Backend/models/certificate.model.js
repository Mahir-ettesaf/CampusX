import db from "../config/db.js";

const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(results);
    });
  });

const certificateColumns = `id, user_id, title, issuing_organization, issue_date,
  expiry_date, credential_id, credential_url, description, created_at, updated_at`;

export const findUserCertificates = async (userId) =>
  query(
    `SELECT ${certificateColumns}
     FROM certificates
     WHERE user_id = ?
     ORDER BY issue_date DESC, updated_at DESC, id DESC`,
    [userId],
  );

export const findUserCertificate = async (userId, certificateId) => {
  const results = await query(
    `SELECT ${certificateColumns} FROM certificates WHERE id = ? AND user_id = ?`,
    [certificateId, userId],
  );
  return results[0] || null;
};

export const createUserCertificate = async (userId, certificateData) => {
  const result = await query(
    `INSERT INTO certificates
      (user_id, title, issuing_organization, issue_date, expiry_date, credential_id, credential_url, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      certificateData.title,
      certificateData.issuing_organization,
      certificateData.issue_date,
      certificateData.expiry_date,
      certificateData.credential_id,
      certificateData.credential_url,
      certificateData.description,
    ],
  );

  return findUserCertificate(userId, result.insertId);
};

export const updateUserCertificate = async (userId, certificateId, certificateData) => {
  const fields = Object.keys(certificateData);
  const assignments = fields.map((field) => `\`${field}\` = ?`).join(", ");

  await query(
    `UPDATE certificates SET ${assignments} WHERE id = ? AND user_id = ?`,
    [...fields.map((field) => certificateData[field]), certificateId, userId],
  );

  return findUserCertificate(userId, certificateId);
};

export const deleteUserCertificate = async (userId, certificateId) =>
  query("DELETE FROM certificates WHERE id = ? AND user_id = ?", [certificateId, userId]);
