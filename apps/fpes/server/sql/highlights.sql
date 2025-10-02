CREATE TABLE IF NOT EXISTS highlights (
  id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  faculty_information_id   INT UNSIGNED NOT NULL,
  supervisor_id            INT UNSIGNED NULL,
  student_support_id       INT UNSIGNED NULL,

  collaborations_section   TEXT NULL,
  professional_development TEXT NULL,

  FOREIGN KEY (faculty_information_id) REFERENCES faculty_information(id),
  FOREIGN KEY (supervisor_id)          REFERENCES faculty_information(id),
  FOREIGN KEY (student_support_id)     REFERENCES student_support(id)
) 
