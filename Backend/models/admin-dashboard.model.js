import db from "../config/db.js";

const query = (sql) => new Promise((resolve, reject) =>
  db.query(sql, (error, results) => error ? reject(error) : resolve(results)),
);

// One aggregate query returns only platform counts; it never retrieves entity records.
export const findDashboardStatistics = async () => {
  const results = await query(
    `SELECT
       user_counts.total_users,
       user_counts.students,
       user_counts.graduates,
       user_counts.faculty,
       user_counts.recruiters,
       company_counts.companies,
       company_counts.pending_companies,
       company_counts.approved_companies,
       opportunity_counts.opportunities,
       opportunity_counts.published_opportunities,
       application_counts.applications
     FROM (
       SELECT COUNT(*) AS total_users,
              COALESCE(SUM(role = 'student'), 0) AS students,
              COALESCE(SUM(role = 'graduate'), 0) AS graduates,
              COALESCE(SUM(role = 'faculty'), 0) AS faculty,
              COALESCE(SUM(role = 'recruiter'), 0) AS recruiters
       FROM users
     ) user_counts
     CROSS JOIN (
       SELECT COUNT(*) AS companies,
              COALESCE(SUM(approval_status = 'pending'), 0) AS pending_companies,
              COALESCE(SUM(approval_status = 'approved'), 0) AS approved_companies
       FROM companies
     ) company_counts
     CROSS JOIN (
       SELECT COUNT(*) AS opportunities,
              COALESCE(SUM(status = 'published'), 0) AS published_opportunities
       FROM opportunities
     ) opportunity_counts
     CROSS JOIN (
       SELECT COUNT(*) AS applications
       FROM applications
     ) application_counts`,
  );

  return results[0];
};
