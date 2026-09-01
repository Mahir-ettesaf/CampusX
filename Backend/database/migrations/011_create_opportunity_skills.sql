-- CampusX required skills for opportunities. This migration is additive only.
CREATE TABLE opportunity_skills (
  opportunity_id INT NOT NULL,
  skill_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (opportunity_id, skill_id),
  KEY opportunity_skills_skill_id_index (skill_id),
  CONSTRAINT opportunity_skills_opportunity_fk
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT opportunity_skills_skill_fk
    FOREIGN KEY (skill_id) REFERENCES skills(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
