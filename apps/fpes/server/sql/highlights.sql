CREATE TABLE IF NOT EXISTS highlights (
  id                         INT AUTO_INCREMENT PRIMARY KEY,

  faculty_information_id     INT NOT NULL,
  supervisor_id              INT NULL,
  student_support_id         INT NULL,

  significant_outcomes       TEXT NULL,
  collaborations_section     TEXT NULL,
  professional_development   TEXT NULL,
  administrative_responsibilities TEXT NULL,

-- Requires faculty_information and student_support tables to exist first

  FOREIGN KEY (faculty_information_id) REFERENCES faculty_information(faculty_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (supervisor_id)          REFERENCES faculty_information(faculty_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (student_support_id)     REFERENCES student_support(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
