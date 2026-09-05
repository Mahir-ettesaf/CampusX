CREATE TABLE thesis_milestones (
  id INT NOT NULL AUTO_INCREMENT, user_id INT NOT NULL, title VARCHAR(200) NOT NULL, description TEXT NULL,
  due_date DATE NOT NULL, status ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
  progress_percentage TINYINT UNSIGNED NOT NULL DEFAULT 0, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY thesis_milestones_user_id_index (user_id), KEY thesis_milestones_user_due_index (user_id, due_date),
  CONSTRAINT thesis_milestones_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT thesis_milestones_progress_check CHECK (progress_percentage <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
