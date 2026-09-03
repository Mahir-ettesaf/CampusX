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

const beginTransaction = () =>
  new Promise((resolve, reject) => db.beginTransaction((error) => (error ? reject(error) : resolve())));

const commit = () => new Promise((resolve, reject) => db.commit((error) => (error ? reject(error) : resolve())));

const rollback = () => new Promise((resolve) => db.rollback(() => resolve()));

const withTransaction = async (operation) => {
  await beginTransaction();
  try {
    const result = await operation();
    await commit();
    return result;
  } catch (error) {
    await rollback();
    throw error;
  }
};

const resumeColumns = `id, user_id, title, summary, file_url, is_primary, created_at, updated_at`;

const primaryResumeRequiredError = () => {
  const error = new Error("A user must retain a primary resume");
  error.code = "PRIMARY_RESUME_REQUIRED";
  return error;
};

export const findUserResumes = async (userId) =>
  query(
    `SELECT ${resumeColumns} FROM resumes WHERE user_id = ? ORDER BY is_primary DESC, updated_at DESC, id DESC`,
    [userId],
  );

export const findUserResume = async (userId, resumeId) => {
  const results = await query(
    `SELECT ${resumeColumns} FROM resumes WHERE id = ? AND user_id = ?`,
    [resumeId, userId],
  );
  return results[0] || null;
};

export const findUserResumeForReview = async (userId, resumeId) => {
  const results = await query(
    `SELECT ${resumeColumns}, extracted_text FROM resumes WHERE id = ? AND user_id = ?`,
    [resumeId, userId],
  );
  return results[0] || null;
};

export const updateUserResumeDocument = async (userId, resumeId, fileUrl, extractedText) => {
  const result = await query(
    "UPDATE resumes SET file_url = ?, extracted_text = ? WHERE id = ? AND user_id = ?",
    [fileUrl, extractedText, resumeId, userId],
  );
  return result.affectedRows ? findUserResume(userId, resumeId) : null;
};

export const createUserResume = async (userId, resumeData) =>
  withTransaction(async () => {
    const existingResumes = await query("SELECT id FROM resumes WHERE user_id = ? FOR UPDATE", [userId]);
    const isPrimary = resumeData.is_primary === true || existingResumes.length === 0;

    if (isPrimary) {
      await query("UPDATE resumes SET is_primary = 0 WHERE user_id = ? AND is_primary = 1", [userId]);
    }

    const result = await query(
      `INSERT INTO resumes (user_id, title, summary, file_url, is_primary)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, resumeData.title, resumeData.summary, resumeData.file_url, isPrimary ? 1 : 0],
    );

    return findUserResume(userId, result.insertId);
  });

export const updateUserResume = async (userId, resumeId, resumeData) =>
  withTransaction(async () => {
    const lockedResumes = await query(
      `SELECT ${resumeColumns} FROM resumes WHERE id = ? AND user_id = ? FOR UPDATE`,
      [resumeId, userId],
    );
    const existingResume = lockedResumes[0];
    if (!existingResume) {
      return null;
    }

    const updatedData = { ...resumeData };
    if (resumeData.is_primary === true) {
      await query("UPDATE resumes SET is_primary = 0 WHERE user_id = ? AND is_primary = 1", [userId]);
      updatedData.is_primary = 1;
    } else if (resumeData.is_primary === false && existingResume.is_primary) {
      const replacementRows = await query(
        `SELECT id FROM resumes
         WHERE user_id = ? AND id <> ?
         ORDER BY updated_at DESC, id DESC
         LIMIT 1 FOR UPDATE`,
        [userId, resumeId],
      );
      if (!replacementRows[0]) {
        throw primaryResumeRequiredError();
      }

      await query("UPDATE resumes SET is_primary = 0 WHERE id = ? AND user_id = ?", [resumeId, userId]);
      await query("UPDATE resumes SET is_primary = 1 WHERE id = ? AND user_id = ?", [replacementRows[0].id, userId]);
      delete updatedData.is_primary;
    }

    const fields = Object.keys(updatedData);
    if (fields.length > 0) {
      const assignments = fields.map((field) => `\`${field}\` = ?`).join(", ");
      await query(
        `UPDATE resumes SET ${assignments} WHERE id = ? AND user_id = ?`,
        [...fields.map((field) => updatedData[field]), resumeId, userId],
      );
    }

    return findUserResume(userId, resumeId);
  });

export const deleteUserResume = async (userId, resumeId) =>
  withTransaction(async () => {
    const lockedResumes = await query(
      `SELECT id, is_primary FROM resumes WHERE id = ? AND user_id = ? FOR UPDATE`,
      [resumeId, userId],
    );
    const existingResume = lockedResumes[0];
    if (!existingResume) {
      return null;
    }

    await query("DELETE FROM resumes WHERE id = ? AND user_id = ?", [resumeId, userId]);

    let replacementId = null;
    if (existingResume.is_primary) {
      const replacementRows = await query(
        `SELECT id FROM resumes WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 1 FOR UPDATE`,
        [userId],
      );
      if (replacementRows[0]) {
        replacementId = replacementRows[0].id;
        await query("UPDATE resumes SET is_primary = 1 WHERE id = ? AND user_id = ?", [replacementId, userId]);
      }
    }

    return { replacementId };
  });
