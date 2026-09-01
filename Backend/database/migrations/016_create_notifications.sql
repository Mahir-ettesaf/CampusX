-- CampusX in-app notification foundation. This migration is additive only.
-- Notifications are server-created by future event handlers; there is intentionally no public creation API.
CREATE TABLE notifications (
  id INT NOT NULL AUTO_INCREMENT,
  recipient_user_id INT NOT NULL,
  notification_type ENUM('application_update','announcement','team','planner','system') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  related_entity_type VARCHAR(50) NULL,
  related_entity_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY notifications_recipient_user_id_index (recipient_user_id),
  KEY notifications_is_read_index (is_read),
  KEY notifications_created_at_index (created_at),
  KEY notifications_recipient_read_created_index (recipient_user_id, is_read, created_at),
  CONSTRAINT notifications_recipient_user_fk
    FOREIGN KEY (recipient_user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
