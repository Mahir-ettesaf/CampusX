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
