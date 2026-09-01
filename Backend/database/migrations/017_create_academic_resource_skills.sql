-- Deterministic academic-resource skill mappings for Learning Path recommendations.
CREATE TABLE academic_resource_skills (
  resource_id INT NOT NULL,
  skill_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (resource_id, skill_id),
  KEY academic_resource_skills_skill_id_index (skill_id),
  CONSTRAINT academic_resource_skills_resource_fk FOREIGN KEY (resource_id) REFERENCES academic_resources(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT academic_resource_skills_skill_fk FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
