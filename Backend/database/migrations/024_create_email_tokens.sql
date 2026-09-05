CREATE TABLE email_tokens (
  id INT NOT NULL AUTO_INCREMENT, user_id INT NOT NULL, token_hash CHAR(64) NOT NULL,
  token_type ENUM('verification','password_reset') NOT NULL, expires_at DATETIME NOT NULL, used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY email_tokens_hash_unique (token_hash), KEY email_tokens_user_type_index (user_id, token_type), KEY email_tokens_expiry_index (expires_at),
  CONSTRAINT email_tokens_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
