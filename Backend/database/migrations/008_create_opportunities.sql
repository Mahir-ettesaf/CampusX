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
