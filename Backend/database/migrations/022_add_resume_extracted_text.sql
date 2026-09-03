-- Stores text extracted only from an authenticated CampusX resume upload.
-- Existing resume records and file_url values are preserved.
ALTER TABLE resumes ADD COLUMN extracted_text MEDIUMTEXT NULL AFTER file_url;
