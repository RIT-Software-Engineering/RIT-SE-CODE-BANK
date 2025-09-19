CREATE TABLE grants (
    grant_id INT AUTO_INCREMENT PRIMARY KEY,
    category ENUM('Funded', 'In Submission', 'Declined', 'In Development') NOT NULL,
    title VARCHAR(255) NOT NULL,
    funder VARCHAR(255) NOT NULL,
    amount INT(12,2) DEFAULT NULL,              
    est_amount INT(12,2) DEFAULT NULL,          
    time_period VARCHAR(100) NOT NULL,              
    faculty_role VARCHAR(150) NOT NULL,             
    faculty_share INT(12,2) DEFAULT NULL,       
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);