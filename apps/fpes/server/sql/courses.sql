CREATE TABLE IF NOT EXISTS courses (
  id            INT UNIQUE AUTO_INCREMENT PRIMARY KEY,
  course_code   VARCHAR(50),
  course_name   VARCHAR(255),
  credits       INT UNSIGNED,
  department_id INT,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

INSERT INTO courses (course_code, course_name, credits, department_id) VALUES
('GCIS 123', 'Software Development & Problem Solving I', 4, 1),
('CSEC 462', 'Malware Analysis', 3, 1),
('SWEN 261', 'Introduction to Software Engineering', 3, 1);
