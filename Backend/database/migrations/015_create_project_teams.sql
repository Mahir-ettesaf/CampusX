-- CampusX Team Collaboration foundation. This migration is additive only.
-- Teams are independent of portfolio_projects; collaboration invitations/notifications are intentionally out of scope.
CREATE TABLE project_teams (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY project_teams_created_by_index (created_by),
  CONSTRAINT project_teams_created_by_fk
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE team_members (
  team_id INT NOT NULL,
  user_id INT NOT NULL,
  membership_role ENUM('owner','member') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id),
  KEY team_members_user_id_index (user_id),
  CONSTRAINT team_members_team_fk
    FOREIGN KEY (team_id) REFERENCES project_teams(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT team_members_user_fk
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE team_tasks (
  id INT NOT NULL AUTO_INCREMENT,
  team_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  assigned_to INT NULL,
  status ENUM('todo','in_progress','completed','cancelled') NOT NULL DEFAULT 'todo',
  priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  due_at DATETIME NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY team_tasks_team_id_index (team_id),
  KEY team_tasks_assigned_to_index (assigned_to),
  KEY team_tasks_created_by_index (created_by),
  KEY team_tasks_status_index (status),
  KEY team_tasks_due_at_index (due_at),
  KEY team_tasks_team_status_due_index (team_id, status, due_at),
  CONSTRAINT team_tasks_team_fk
    FOREIGN KEY (team_id) REFERENCES project_teams(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT team_tasks_assigned_user_fk
    FOREIGN KEY (assigned_to) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT team_tasks_assignment_membership_fk
    FOREIGN KEY (team_id, assigned_to) REFERENCES team_members(team_id, user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT team_tasks_created_by_fk
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
