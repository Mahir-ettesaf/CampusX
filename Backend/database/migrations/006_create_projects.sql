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
