CREATE TABLE IF NOT EXISTS highlights (
  id                         INT UNIQUE AUTO_INCREMENT PRIMARY KEY,
  form_id                    INT NOT NULL,

  student_support_id         INT NULL,

  significant_outcomes       TEXT NULL,
  collaborations_section     TEXT NULL,
  professional_development   TEXT NULL,
  administrative_responsibilities TEXT NULL,
  curriculum_development TEXT NULL,

-- Requires form and student_support tables to exist first

  FOREIGN KEY (student_support_id)     REFERENCES student_support(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (form_id)                REFERENCES forms(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE highlights 
ADD COLUMN status ENUM('DRAFT', 'SUBMITTED') NOT NULL DEFAULT 'DRAFT',
ADD COLUMN last_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN pdf_filename VARCHAR(255) NULL;
