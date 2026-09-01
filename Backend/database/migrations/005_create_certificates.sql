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
