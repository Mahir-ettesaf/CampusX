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
