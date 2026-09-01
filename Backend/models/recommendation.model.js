import db from "../config/db.js";

const query = (sql, values = []) => new Promise((resolve, reject) =>
  db.query(sql, values, (error, results) => error ? reject(error) : resolve(results)),
);

export const findOpportunityRecommendations = (userId, limit = 10) => query(
  `SELECT o.id, o.title, o.opportunity_type, o.location, o.is_remote, o.deadline,
          COUNT(os.skill_id) AS total_required_skills,
          SUM(CASE WHEN us.skill_id IS NULL THEN 0 ELSE 1 END) AS matched_skill_count,
          ROUND(
            100 * SUM(CASE WHEN us.skill_id IS NULL THEN 0 ELSE 1 END)
            / NULLIF(COUNT(os.skill_id), 0),
            2
          ) AS match_percentage
   FROM opportunities o
   LEFT JOIN opportunity_skills os ON os.opportunity_id = o.id
   LEFT JOIN user_skills us ON us.skill_id = os.skill_id AND us.user_id = ?
   WHERE o.status = 'published' AND o.deadline >= CURDATE()
   GROUP BY o.id, o.title, o.opportunity_type, o.location, o.is_remote, o.deadline
   ORDER BY
     CASE WHEN COUNT(os.skill_id) = 0 THEN 1 ELSE 0 END ASC,
     match_percentage DESC,
     matched_skill_count DESC,
     o.deadline ASC,
     o.id ASC
   LIMIT ?`,
  [userId, limit],
);
