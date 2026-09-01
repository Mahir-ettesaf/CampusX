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
