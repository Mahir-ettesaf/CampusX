import db from "../config/db.js";

const query = (sql, values = []) => new Promise((resolve, reject) =>
  db.query(sql, values, (error, results) => error ? reject(error) : resolve(results)),
);

// This is one user-scoped aggregate query. The derived tables avoid per-category queries.
export const findCareerReadinessData = async (userId) => {
  const results = await query(
    `SELECT u.id, u.role,
            p.headline, p.bio, p.phone, p.location, p.linkedin_url,
            p.github_username, p.portfolio_url,
            ap.student_id, ap.department, ap.program, ap.degree_level, ap.graduation_year,
            COALESCE(skill_data.skill_points, 0) AS skill_points,
            COALESCE(skill_data.skill_count, 0) AS skill_count,
            COALESCE(resume_data.resume_count, 0) AS resume_count,
            COALESCE(resume_data.has_primary_resume, 0) AS has_primary_resume,
            COALESCE(project_data.project_count, 0) AS project_count,
            COALESCE(certificate_data.certificate_count, 0) AS certificate_count,
            COALESCE(publication_data.publication_count, 0) AS publication_count
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN student_academic_profiles ap ON ap.user_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS skill_count,
              SUM(CASE proficiency_level
                WHEN 'beginner' THEN 2
                WHEN 'intermediate' THEN 3
                ELSE 4
              END) AS skill_points
       FROM user_skills
       WHERE user_id = ?
       GROUP BY user_id
     ) skill_data ON skill_data.user_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS resume_count, MAX(is_primary) AS has_primary_resume
       FROM resumes
       WHERE user_id = ?
       GROUP BY user_id
     ) resume_data ON resume_data.user_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS project_count
       FROM portfolio_projects
       WHERE user_id = ?
       GROUP BY user_id
     ) project_data ON project_data.user_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS certificate_count
       FROM certificates
       WHERE user_id = ?
       GROUP BY user_id
     ) certificate_data ON certificate_data.user_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS publication_count
       FROM publications
       WHERE user_id = ?
       GROUP BY user_id
     ) publication_data ON publication_data.user_id = u.id
     WHERE u.id = ?`,
    [userId, userId, userId, userId, userId, userId],
  );

  return results[0] || null;
};
