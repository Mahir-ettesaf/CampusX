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

export const findSkills = async (searchTerm = "") => {
  const results = await query(
    `SELECT id, name, normalized_name, created_at, updated_at
     FROM skills
     WHERE normalized_name LIKE ?
     ORDER BY name
     LIMIT 50`,
    [`%${searchTerm}%`],
  );

  return results;
};

export const findUserSkills = async (userId) => {
  return query(
    `SELECT s.id AS skill_id, s.name, s.normalized_name,
            us.proficiency_level, us.created_at, us.updated_at
     FROM user_skills us
     INNER JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = ?
     ORDER BY s.name`,
    [userId],
  );
};

export const findOrCreateSkill = async (name, normalizedName) => {
  const existingSkills = await query(
    "SELECT id, name, normalized_name FROM skills WHERE normalized_name = ?",
    [normalizedName],
  );

  if (existingSkills[0]) {
    return existingSkills[0];
  }

  try {
    const result = await query(
      "INSERT INTO skills (name, normalized_name) VALUES (?, ?)",
      [name, normalizedName],
    );

    return { id: result.insertId, name, normalized_name: normalizedName };
  } catch (error) {
    if (error.code !== "ER_DUP_ENTRY") {
      throw error;
    }

    const skills = await query(
      "SELECT id, name, normalized_name FROM skills WHERE normalized_name = ?",
      [normalizedName],
    );
    return skills[0];
  }
};

export const addUserSkill = async (userId, skillId, proficiencyLevel) => {
  const result = await query(
    "INSERT INTO user_skills (user_id, skill_id, proficiency_level) VALUES (?, ?, ?)",
    [userId, skillId, proficiencyLevel],
  );

  return result.insertId;
};

export const updateUserSkillProficiency = async (userId, skillId, proficiencyLevel) => {
  return query(
    `UPDATE user_skills
     SET proficiency_level = ?
     WHERE user_id = ? AND skill_id = ?`,
    [proficiencyLevel, userId, skillId],
  );
};

export const removeUserSkill = async (userId, skillId) => {
  return query("DELETE FROM user_skills WHERE user_id = ? AND skill_id = ?", [userId, skillId]);
};

export const findUserSkill = async (userId, skillId) => {
  const results = await query(
    `SELECT s.id AS skill_id, s.name, s.normalized_name,
            us.proficiency_level, us.created_at, us.updated_at
     FROM user_skills us
     INNER JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = ? AND us.skill_id = ?`,
    [userId, skillId],
  );

  return results[0] || null;
};
