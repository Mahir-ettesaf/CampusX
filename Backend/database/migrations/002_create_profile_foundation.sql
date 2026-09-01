-- CampusX profile database foundation.
-- This migration adds new tables only and does not modify the existing users table.

CREATE TABLE `profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `headline` varchar(150) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `linkedin_url` varchar(255) DEFAULT NULL,
  `github_username` varchar(100) DEFAULT NULL,
  `portfolio_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profiles_user_id_unique` (`user_id`),
  CONSTRAINT `profiles_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `student_academic_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `student_id` varchar(50) DEFAULT NULL,
  `department` varchar(150) DEFAULT NULL,
  `program` varchar(150) DEFAULT NULL,
  `degree_level` enum('undergraduate','graduate') NOT NULL,
  `graduation_year` smallint unsigned DEFAULT NULL,
  `cgpa` decimal(3,2) DEFAULT NULL,
  `interests` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_academic_profiles_user_id_unique` (`user_id`),
  UNIQUE KEY `student_academic_profiles_student_id_unique` (`student_id`),
  CONSTRAINT `student_academic_profiles_cgpa_check` CHECK (`cgpa` IS NULL OR `cgpa` BETWEEN 0 AND 4),
  CONSTRAINT `student_academic_profiles_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `faculty_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `department` varchar(150) DEFAULT NULL,
  `designation` varchar(150) DEFAULT NULL,
  `research_areas` text DEFAULT NULL,
  `office_location` varchar(150) DEFAULT NULL,
  `contact_details` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `faculty_profiles_user_id_unique` (`user_id`),
  CONSTRAINT `faculty_profiles_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `approval_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `companies_name_unique` (`name`),
  KEY `companies_approved_by_index` (`approved_by`),
  CONSTRAINT `companies_approved_by_fk`
    FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `recruiter_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `company_id` int NOT NULL,
  `job_title` varchar(150) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `recruiter_profiles_user_id_unique` (`user_id`),
  KEY `recruiter_profiles_company_id_index` (`company_id`),
  CONSTRAINT `recruiter_profiles_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `recruiter_profiles_company_id_fk`
    FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
