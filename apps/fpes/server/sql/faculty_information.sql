CREATE TABLE IF NOT EXISTS faculty_information (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rank VARCHAR(100) NOT NULL,                  -- e.g., Assistant Professor
    unit VARCHAR(150) NOT NULL,                  -- e.g., Software Engineering
    affiliations VARCHAR(255) DEFAULT NULL,      -- e.g., MAGIC, ESL GCI
    user_role SET('Faculty', 'Supervisor', 'Admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO faculty_information (name, rank, unit, affiliations, user_role)
VALUES
('Alice Johnson', 'Assistant Professor', 'Software Engineering', 'MAGIC', 'Faculty'),
('Brian Lee', 'Associate Professor', 'Computer Science', 'GCCIS','Faculty'),
('Carla Smith', 'Professor', 'Information Sciences & Technologies', 'ESL','Faculty'),
('David Kim', 'Assistant Professor', 'Human-Centered Computing', NULL,'Faculty'),
('Emily Davis', 'Lecturer', 'Data Science', 'MAGIC, GCCIS','Faculty'),
('Frank Miller', 'Senior Professor', 'Computing Security', NULL, 'Faculty,Supervisor'),
('Grace Wong', 'Chair', 'Software Engineering', 'MAGIC, ESL', 'Faculty,Supervisor'),
('Henry Patel', 'Associate Professor', 'Networking & Systems Administration', 'GCCIS','Faculty'),
('Isabella Martinez', 'Assistant Professor', 'Artificial Intelligence', NULL,'Faculty'),
('James Brown', 'RIT IT', 'FPES Support', NULL,'Admin');

