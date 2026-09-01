import db from "../config/db.js";

const query = (sql, values = []) => new Promise((resolve, reject) =>
  db.query(sql, values, (error, results) => error ? reject(error) : resolve(results)),
);

export const findOpportunitySkills = (opportunityId) => query(
  `SELECT s.id AS skill_id, s.name, s.normalized_name, os.created_at
   FROM opportunity_skills os
   INNER JOIN skills s ON s.id = os.skill_id
   WHERE os.opportunity_id = ?
   ORDER BY s.name`,
  [opportunityId],
);

export const findSkill = async (skillId) => (await query(
  "SELECT id, name, normalized_name FROM skills WHERE id = ?",
  [skillId],
))[0] || null;

export const hasOpportunitySkill = async (opportunityId, skillId) => Boolean((await query(
  "SELECT 1 FROM opportunity_skills WHERE opportunity_id = ? AND skill_id = ?",
  [opportunityId, skillId],
))[0]);

export const addOpportunitySkill = (opportunityId, skillId) => query(
  "INSERT INTO opportunity_skills (opportunity_id, skill_id) VALUES (?, ?)",
  [opportunityId, skillId],
);

export const removeOpportunitySkill = (opportunityId, skillId) => query(
  "DELETE FROM opportunity_skills WHERE opportunity_id = ? AND skill_id = ?",
  [opportunityId, skillId],
);
