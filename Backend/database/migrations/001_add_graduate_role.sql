-- CampusX: allow graduates to register and authenticate.
-- Run once against the existing CampusX database. This alters only the users.role enum.
ALTER TABLE users
  MODIFY COLUMN role ENUM('student', 'graduate', 'faculty', 'recruiter', 'admin') NOT NULL;
