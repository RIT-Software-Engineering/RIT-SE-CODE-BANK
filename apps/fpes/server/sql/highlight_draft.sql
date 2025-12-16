CREATE TABLE IF NOT EXISTS highlight_drafts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_information_id INT NOT NULL UNIQUE,
  draft_json LONGTEXT NOT NULL
);
