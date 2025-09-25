CREATE TABLE IF NOT EXISTS faculty_information (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rank VARCHAR(100) NOT NULL,                  -- e.g., Assistant Professor
    unit VARCHAR(150) NOT NULL,                  -- e.g., Software Engineering
    affiliations VARCHAR(255) DEFAULT NULL,      -- e.g., MAGIC, ESL GCI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO faculty_information (name, rank, unit, affiliations)
VALUES
('Alice Johnson', 'Assistant Professor', 'Software Engineering', 'MAGIC'),
('Brian Lee', 'Associate Professor', 'Computer Science', 'GCCIS'),
('Carla Smith', 'Professor', 'Information Sciences & Technologies', 'ESL'),
('David Kim', 'Assistant Professor', 'Human-Centered Computing', NULL),
('Emily Davis', 'Lecturer', 'Data Science', 'MAGIC, GCCIS'),
('Frank Miller', 'Assistant Professor', 'Computing Security', NULL),
('Grace Wong', 'Professor', 'Software Engineering', 'MAGIC, ESL'),
('Henry Patel', 'Associate Professor', 'Networking & Systems Administration', 'GCCIS'),
('Isabella Martinez', 'Assistant Professor', 'Artificial Intelligence', NULL),
('James Brown', 'Professor', 'Game Design & Development', 'MAGIC');
