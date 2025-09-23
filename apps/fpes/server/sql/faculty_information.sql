CREATE TABLE faculty_information (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rank VARCHAR(100) NOT NULL,                  -- e.g., Assistant Professor
    unit VARCHAR(150) NOT NULL,                  -- e.g., Software Engineering
    affiliations VARCHAR(255) DEFAULT NULL,      -- e.g., MAGIC, ESL GCI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
