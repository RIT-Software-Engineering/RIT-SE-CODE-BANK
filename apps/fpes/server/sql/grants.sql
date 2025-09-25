CREATE TABLE grants (
    id INT UNSIGNED UNIQUE AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    funder VARCHAR(255) NOT NULL,
    amount INT DEFAULT NULL,              
    est_amount INT DEFAULT NULL,          
    time_period VARCHAR(100) NOT NULL,              
    faculty_role VARCHAR(100) NOT NULL,             
    faculty_share INT DEFAULT NULL,       
    grant_status ENUM('Funded', 'In Submission', 'Declined', 'In Development') NOT NULL
    comments TEXT,
);

INSERT INTO grants (form_id, title, funder, amount, est_amount, time_period, faculty_role, faculty_share, grant_status)
VALUES (
    0,
    'Title',
    'test',
    50,
    51,
    'test',
    'test',
    52,
    'Funded',
    'test'

);