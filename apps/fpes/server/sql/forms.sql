CREATE TABLE IF NOT EXISTS forms (
    id INT UNIQUE AUTO_INCREMENT PRIMARY KEY,
    faculty_information_id INT NOT NULL,
    time_submitted TIMESTAMP,
    type ENUM("Highlights", "Plan of Work", "Appraisal") NOT NULL,

    FOREIGN KEY (faculty_information_id) REFERENCES faculty_information(faculty_id)
);