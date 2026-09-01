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
