DROP TABLE service;

CREATE TABLE IF NOT EXISTS service (
    id INT UNSIGNED auto_increment PRIMARY KEY,
    form_id INT NOT NULL,
    service_type ENUM('internal', 'external') NOT NULL,
    title VARCHAR(40) NOT NULL,
    hours_worked INT NOT NULL,
    other_contributions VARCHAR(250) NOT NULL
);

INSERT INTO service (form_id, service_type, title, hours_worked, other_contributions) VALUES 
    (0,'internal','Title', 50, '')
    (2, 'internal', 'Student Mentorship Program', 85, 'Met weekly with mentees'),
    (4, 'external', 'Local Community Health Fair', 112, 'Helped organize logistics'),
    (1, 'internal', 'Faculty Diversity Committee', 76, 'Drafted annual diversity report'),
    (5, 'external', 'High School STEM Outreach', 93, 'Delivered 3 interactive workshops'),
    (3, 'internal', 'Academic Integrity Review Board', 68, 'Reviewed 4 cases'),
    (2, 'external', 'Environmental Clean-Up Drive', 102, 'Led volunteer team'),
    (5, 'internal', 'First-Year Orientation Planning', 59, 'Coordinated welcome events'),
    (1, 'external', 'Public Library Tech Support Service', 121, 'Assisted with software installation'),
    (4, 'internal', 'Graduate Admissions Committee', 77, 'Interviewed applicants'),
    (3, 'external', 'Nonprofit Digital Strategy Consulting', 88, 'Developed outreach plan');



