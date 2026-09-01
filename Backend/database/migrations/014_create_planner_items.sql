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
