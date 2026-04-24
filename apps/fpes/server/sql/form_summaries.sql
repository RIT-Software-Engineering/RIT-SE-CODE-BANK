CREATE TABLE IF NOT EXISTS form_summaries (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  form_id      INT NULL,
  faculty_id   VARCHAR(64) NULL,
  summary_type ENUM('form', 'annual', 'teaching_eval') NOT NULL DEFAULT 'form',
  summary_json LONGTEXT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_form_summary (form_id, summary_type),
  UNIQUE KEY uq_annual_summary (faculty_id, summary_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
