-- CampusX Railway schema preflight (read-only).
--
-- Run this in the Railway MySQL query console before applying any CampusX
-- migration. It does not create, alter, delete, or update database data.
--
-- The numbered migrations 002-017 are intentionally not idempotent. Apply a
-- missing migration once, in order, only after this report confirms that its
-- table(s) are absent. Do not run migration 001 when users.role already
-- contains graduate.

SELECT
  required_tables.table_name,
  required_tables.introduced_by,
  CASE WHEN information_schema.tables.table_name IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS status
FROM (
  SELECT 'profiles' AS table_name, '002_create_profile_foundation.sql' AS introduced_by
  UNION ALL SELECT 'student_academic_profiles', '002_create_profile_foundation.sql'
  UNION ALL SELECT 'faculty_profiles', '002_create_profile_foundation.sql'
  UNION ALL SELECT 'companies', '002_create_profile_foundation.sql'
  UNION ALL SELECT 'recruiter_profiles', '002_create_profile_foundation.sql'
  UNION ALL SELECT 'skills', '003_create_skills.sql'
  UNION ALL SELECT 'user_skills', '003_create_skills.sql'
  UNION ALL SELECT 'resumes', '004_create_resumes.sql'
  UNION ALL SELECT 'certificates', '005_create_certificates.sql'
  UNION ALL SELECT 'portfolio_projects', '006_create_projects.sql'
  UNION ALL SELECT 'publications', '007_create_publications.sql'
  UNION ALL SELECT 'opportunities', '008_create_opportunities.sql'
  UNION ALL SELECT 'applications', '009_create_applications.sql'
  UNION ALL SELECT 'opportunity_skills', '011_create_opportunity_skills.sql'
  UNION ALL SELECT 'academic_resources', '012_create_academic_resources.sql'
  UNION ALL SELECT 'announcements', '013_create_announcements.sql'
  UNION ALL SELECT 'planner_items', '014_create_planner_items.sql'
  UNION ALL SELECT 'project_teams', '015_create_project_teams.sql'
  UNION ALL SELECT 'team_members', '015_create_project_teams.sql'
  UNION ALL SELECT 'team_tasks', '015_create_project_teams.sql'
  UNION ALL SELECT 'notifications', '016_create_notifications.sql'
  UNION ALL SELECT 'academic_resource_skills', '017_create_academic_resource_skills.sql'
) AS required_tables
LEFT JOIN information_schema.tables
  ON information_schema.tables.table_schema = DATABASE()
 AND information_schema.tables.table_name = required_tables.table_name
ORDER BY required_tables.introduced_by, required_tables.table_name;

SELECT
  column_name,
  column_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'users'
ORDER BY ordinal_position;

SELECT
  column_type AS users_role_enum
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'users'
  AND column_name = 'role';

SELECT
  CASE WHEN EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'companies'
      AND column_name = 'created_by'
  ) THEN 'PRESENT' ELSE 'MISSING' END AS companies_created_by_status;

-- Repair procedure after reviewing the result:
-- 1. If users.role lacks graduate, apply 001_add_graduate_role.sql once.
-- 2. Apply every wholly missing migration in numeric order, starting at 002.
-- 3. Apply 010_add_company_creator.sql only when companies exists and the
--    companies_created_by_status above is MISSING.
-- 4. If a table is present but has missing columns/constraints, stop and
--    compare it with its numbered migration before issuing targeted ALTER
--    statements. Do not rerun a whole CREATE TABLE migration in that case.
