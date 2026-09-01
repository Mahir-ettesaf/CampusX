-- CampusX skills catalogue and authenticated user skill associations.

CREATE TABLE `skills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `normalized_name` varchar(150) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `skills_normalized_name_unique` (`normalized_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_skills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `skill_id` int NOT NULL,
  `proficiency_level` enum('beginner','intermediate','advanced','expert') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_skills_user_skill_unique` (`user_id`, `skill_id`),
  KEY `user_skills_skill_id_index` (`skill_id`),
  CONSTRAINT `user_skills_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_skills_skill_id_fk`
    FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- CampusX Resume module foundation.
-- This migration is additive: it does not alter the existing users, profile, or skills tables.

CREATE TABLE resumes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  summary TEXT NULL,
  file_url VARCHAR(2048) NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  -- MySQL has no partial unique indexes. This column is NULL for non-primary
  -- rows, and MySQL permits multiple NULL values in a unique index.
  primary_user_id INT GENERATED ALWAYS AS (
    CASE WHEN is_primary = 1 THEN user_id ELSE NULL END
  ) STORED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY resumes_user_id_index (user_id),
  UNIQUE KEY resumes_one_primary_per_user_unique (primary_user_id),
  CONSTRAINT resumes_is_primary_check CHECK (is_primary IN (0, 1)),
  CONSTRAINT resumes_user_id_foreign
    FOREIGN KEY (user_id) REFERENCES users(id)
    -- RESTRICT is required because MySQL cannot cascade a foreign-key column
    -- that is used by a stored generated column. User IDs are immutable.
    ON DELETE RESTRICT
    ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- CampusX Certificates module foundation.
-- This migration is additive and does not change existing tables or user records.

CREATE TABLE certificates (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  issuing_organization VARCHAR(150) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NULL,
  credential_id VARCHAR(150) NULL,
  credential_url VARCHAR(2048) NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY certificates_user_id_index (user_id),
  CONSTRAINT certificates_date_range_check
    CHECK (expiry_date IS NULL OR expiry_date >= issue_date),
  CONSTRAINT certificates_user_id_foreign
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- CampusX Projects module foundation.
-- This migration is additive and does not change existing tables or user records.

CREATE TABLE portfolio_projects (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  project_type ENUM('academic', 'professional', 'personal') NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  project_url VARCHAR(2048) NULL,
  github_url VARCHAR(2048) NULL,
  technologies TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY portfolio_projects_user_id_index (user_id),
  CONSTRAINT portfolio_projects_date_range_check
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  CONSTRAINT portfolio_projects_user_id_foreign
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- CampusX Publications module foundation. Additive only.
CREATE TABLE publications (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(300) NOT NULL,
  authors VARCHAR(1000) NOT NULL,
  journal_or_conference VARCHAR(300) NOT NULL,
  publication_date DATE NOT NULL,
  doi VARCHAR(255) NULL,
  publication_url VARCHAR(2048) NULL,
  abstract TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY publications_user_id_index (user_id),
  CONSTRAINT publications_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- CampusX Opportunities foundation. This migration is additive only.
CREATE TABLE opportunities (
  id INT NOT NULL AUTO_INCREMENT,
  creator_user_id INT NOT NULL,
  company_id INT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  opportunity_type ENUM('internship','job','ra','ta','research') NOT NULL,
  location VARCHAR(150) NULL,
  is_remote TINYINT(1) NOT NULL DEFAULT 0,
  eligibility TEXT NULL,
  deadline DATE NOT NULL,
  status ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY opportunities_creator_user_id_index (creator_user_id), KEY opportunities_company_id_index (company_id), KEY opportunities_type_index (opportunity_type), KEY opportunities_status_index (status), KEY opportunities_deadline_index (deadline),
  CONSTRAINT opportunities_is_remote_check CHECK (is_remote IN (0,1)),
  CONSTRAINT opportunities_creator_user_id_fk FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT opportunities_company_id_fk FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE applications (id INT NOT NULL AUTO_INCREMENT, opportunity_id INT NOT NULL, applicant_id INT NOT NULL, resume_id INT UNSIGNED NULL, status ENUM('submitted','reviewing','shortlisted','rejected','accepted','withdrawn') NOT NULL DEFAULT 'submitted', cover_letter TEXT NULL, submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY(id), UNIQUE KEY applications_opportunity_applicant_unique(opportunity_id,applicant_id), KEY applications_applicant_index(applicant_id), KEY applications_resume_index(resume_id), KEY applications_status_index(status), CONSTRAINT applications_opportunity_fk FOREIGN KEY(opportunity_id) REFERENCES opportunities(id) ON DELETE RESTRICT ON UPDATE CASCADE, CONSTRAINT applications_applicant_fk FOREIGN KEY(applicant_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT applications_resume_fk FOREIGN KEY(resume_id) REFERENCES resumes(id) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- Company ownership foundation. Apply after migrations 001-009.
-- Nullable so existing companies and administrator-created companies remain valid.
ALTER TABLE `companies`
  ADD COLUMN `created_by` int DEFAULT NULL AFTER `id`,
  ADD KEY `companies_created_by_index` (`created_by`),
  ADD CONSTRAINT `companies_created_by_fk`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
-- CampusX required skills for opportunities. This migration is additive only.
CREATE TABLE opportunity_skills (
  opportunity_id INT NOT NULL,
  skill_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (opportunity_id, skill_id),
  KEY opportunity_skills_skill_id_index (skill_id),
  CONSTRAINT opportunity_skills_opportunity_fk
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT opportunity_skills_skill_fk
    FOREIGN KEY (skill_id) REFERENCES skills(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- CampusX Academic Resources foundation. This migration is additive only.
-- Resources are metadata records; file upload and binary storage are intentionally out of scope.
CREATE TABLE academic_resources (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  resource_type ENUM('lecture_notes','slides','lab_manual','previous_questions','research_material','other') NOT NULL,
  subject VARCHAR(150) NULL,
  resource_url VARCHAR(2048) NULL,
  created_by INT NOT NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY academic_resources_created_by_index (created_by),
  KEY academic_resources_status_index (status),
  KEY academic_resources_resource_type_index (resource_type),
  KEY academic_resources_subject_index (subject),
  CONSTRAINT academic_resources_created_by_fk
    FOREIGN KEY (created_by) REFERENCES users(id)
    -- Keep ownership valid: a creator with resources must be handled explicitly.
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- CampusX Announcements foundation. This migration is additive only.
-- Announcements are managed by faculty or administrators; no delivery/notification records are stored here.
CREATE TABLE announcements (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  announcement_type ENUM('academic','assignment','general') NOT NULL,
  audience ENUM('student','graduate','faculty','recruiter','all') NOT NULL,
  created_by INT NOT NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY announcements_created_by_index (created_by),
  KEY announcements_status_index (status),
  KEY announcements_announcement_type_index (announcement_type),
  KEY announcements_audience_index (audience),
  KEY announcements_published_at_index (published_at),
  KEY announcements_visibility_index (status, audience, published_at),
  CONSTRAINT announcements_created_by_fk
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- CampusX Planner foundation. This migration is additive only.
-- Planner items are personal student/graduate records; reminders and notifications are out of scope.
CREATE TABLE planner_items (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  item_type ENUM('assignment','exam','meeting','personal','thesis_research') NOT NULL,
  due_at DATETIME NOT NULL,
  status ENUM('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY planner_items_user_id_index (user_id),
  KEY planner_items_due_at_index (due_at),
  KEY planner_items_item_type_index (item_type),
  KEY planner_items_status_index (status),
  KEY planner_items_user_status_due_index (user_id, status, due_at),
  CONSTRAINT planner_items_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- CampusX Team Collaboration foundation. This migration is additive only.
-- Teams are independent of portfolio_projects; collaboration invitations/notifications are intentionally out of scope.
CREATE TABLE project_teams (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY project_teams_created_by_index (created_by),
  CONSTRAINT project_teams_created_by_fk
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE team_members (
  team_id INT NOT NULL,
  user_id INT NOT NULL,
  membership_role ENUM('owner','member') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id),
  KEY team_members_user_id_index (user_id),
  CONSTRAINT team_members_team_fk
    FOREIGN KEY (team_id) REFERENCES project_teams(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT team_members_user_fk
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE team_tasks (
  id INT NOT NULL AUTO_INCREMENT,
  team_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  assigned_to INT NULL,
  status ENUM('todo','in_progress','completed','cancelled') NOT NULL DEFAULT 'todo',
  priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  due_at DATETIME NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY team_tasks_team_id_index (team_id),
  KEY team_tasks_assigned_to_index (assigned_to),
  KEY team_tasks_created_by_index (created_by),
  KEY team_tasks_status_index (status),
  KEY team_tasks_due_at_index (due_at),
  KEY team_tasks_team_status_due_index (team_id, status, due_at),
  CONSTRAINT team_tasks_team_fk
    FOREIGN KEY (team_id) REFERENCES project_teams(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT team_tasks_assigned_user_fk
    FOREIGN KEY (assigned_to) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT team_tasks_assignment_membership_fk
    FOREIGN KEY (team_id, assigned_to) REFERENCES team_members(team_id, user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT team_tasks_created_by_fk
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- CampusX in-app notification foundation. This migration is additive only.
-- Notifications are server-created by future event handlers; there is intentionally no public creation API.
CREATE TABLE notifications (
  id INT NOT NULL AUTO_INCREMENT,
  recipient_user_id INT NOT NULL,
  notification_type ENUM('application_update','announcement','team','planner','system') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  related_entity_type VARCHAR(50) NULL,
  related_entity_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY notifications_recipient_user_id_index (recipient_user_id),
  KEY notifications_is_read_index (is_read),
  KEY notifications_created_at_index (created_at),
  KEY notifications_recipient_read_created_index (recipient_user_id, is_read, created_at),
  CONSTRAINT notifications_recipient_user_fk
    FOREIGN KEY (recipient_user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- Deterministic academic-resource skill mappings for Learning Path recommendations.
CREATE TABLE academic_resource_skills (
  resource_id INT NOT NULL,
  skill_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (resource_id, skill_id),
  KEY academic_resource_skills_skill_id_index (skill_id),
  CONSTRAINT academic_resource_skills_resource_fk FOREIGN KEY (resource_id) REFERENCES academic_resources(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT academic_resource_skills_skill_fk FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
