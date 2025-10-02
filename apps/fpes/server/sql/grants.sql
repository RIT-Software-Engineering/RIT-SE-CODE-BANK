CREATE TABLE IF NOT EXISTS grants (
    id INT UNSIGNED UNIQUE AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    funder VARCHAR(255) NOT NULL,
    amount INT DEFAULT NULL,              
    est_amount INT DEFAULT NULL,          
    time_period VARCHAR(100) NOT NULL,              
    faculty_role VARCHAR(100) NOT NULL,             
    faculty_share INT DEFAULT NULL,       
    grant_status ENUM('Funded', 'In Submission', 'Declined', 'In Development') NOT NULL,
    comments TEXT
);

INSERT INTO grants (form_id, title, funder, amount, est_amount, time_period, faculty_role, faculty_share, grant_status, comments) VALUES 
(0, 'Title', 'test', 50, 51, 'test', 'test', 52,'Funded', 'test' ),
(1, 'Education', 'NSF', 50000, NULL, '2024-2025', 'Principal Investigator', 30000, 'Funded', 'National Science Foundation grant on AI tools for education'),
(2, 'Sustainable Energy Systems', 'DOE', 75000, NULL, '2025-2027', 'Co-PI', 25000, 'Funded', 'Research on renewable energy integration'),
(3, 'Cybersecurity Workforce Training', 'NSA', 60000, NULL, '2024-2026', 'Lead Researcher', 40000, 'Funded', 'Cybersecurity education and outreach'),
(4, 'Robotics in Healthcare', 'NIH', NULL, 80000, '2025-2028', 'Principal Investigator', 50000, 'In Submission', 'Pending NIH review'),
(5, 'Climate Change Adaptation', 'EPA', NULL, 90000, '2025-2029', 'Co-PI', 30000, 'In Submission', 'Awaiting feedback from EPA review panel'),
(4, 'Supply Chains', 'NSF', NULL, 70000, '2024-2026', 'Co-PI', 20000, 'Declined', 'Proposal not selected in final round'),
(6, 'Quantum Computing for Security', 'DARPA', NULL, 120000, '2025-2027', 'Principal Investigator', 60000, 'Declined', 'Highly competitive program, declined'),
(3, 'Smart Cities IoT', 'NSF', NULL, 110000, '2025-2028', 'Principal Investigator', 70000, 'In Development', 'Drafting proposal and preparing collaborators'),
(7, 'Precision Agriculture with Drones', 'USDA', NULL, 95000, '2025-2029', 'Co-PI', 35000, 'In Development', 'Significant progress made, data collection underway');