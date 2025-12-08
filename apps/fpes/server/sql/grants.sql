CREATE TABLE IF NOT EXISTS grants (
    grant_id INT UNIQUE AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    funder VARCHAR(255) NOT NULL,
    amount INT DEFAULT NULL,                     
    start_date DATE, 
    end_date DATE,           
    faculty_role VARCHAR(255) NOT NULL,             
    faculty_share INT DEFAULT NULL,       
    grant_status ENUM('Funded', 'In Submission', 'Declined', 'In Development') NOT NULL,
    other_contributions VARCHAR(255) NOT NULL
);