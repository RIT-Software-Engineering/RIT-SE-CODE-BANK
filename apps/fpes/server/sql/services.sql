DROP TABLE IF EXISTS services;

CREATE TABLE IF NOT EXISTS services (
    id INT UNSIGNED auto_increment PRIMARY KEY,
    form_id INT NOT NULL,
    service_type ENUM('internal', 'external') NOT NULL,
    title VARCHAR(255) NOT NULL,
    hours_worked INT NOT NULL,
    other_contributions VARCHAR(255) NOT NULL
);

INSERT INTO services (form_id, service_type, title, hours_worked, other_contributions) VALUES
(2, 'internal', 'Student Mentorship Program', 85, 'Met weekly with mentees'),
(4, 'external', 'Local Community Health Fair', 112, 'Helped organize logistics'),
(1, 'internal', 'Faculty Diversity Committee', 76, 'Drafted annual diversity report'),
(5, 'external', 'High School STEM Outreach', 93, 'Delivered 3 interactive workshops'),
(3, 'internal', 'Academic Integrity Review Board', 68, 'Reviewed 4 cases'),
(2, 'external', 'Environmental Clean-Up Drive', 102, 'Led volunteer team'),
(5, 'internal', 'First-Year Orientation Planning', 59, 'Coordinated welcome events'),
(1, 'external', 'Public Library Tech Support Service', 121, 'Assisted with software installation'),
(4, 'internal', 'Graduate Admissions Committee', 77, 'Interviewed applicants'),
(3, 'external', 'Nonprofit Digital Strategy Consulting', 88, 'Developed outreach plan'),
(1, 'internal', 'Undergraduate Curriculum Committee', 65, 'Revised core course requirements'),
(2, 'internal', 'Faculty Research Collaboration Committee', 92, ''),
(7, 'external', 'City Parks Restoration Project', 104, ''),
(1, 'internal', 'Undergraduate Admissions Review Team', 88, ''),
(5, 'external', 'Mobile Health Clinic Initiative', 113, 'Assisted with patient intake'),
(3, 'internal', 'Teaching and Learning Innovation Council', 73, ''),
(10, 'external', 'Senior Wellness Outreach Program', 95, ''),
(6, 'internal', 'Laboratory Safety Compliance Audit', 78, ''),
(8, 'external', 'Digital Access for Low-Income Communities', 99, 'Installed Wi-Fi hotspots'),
(9, 'internal', 'Faculty Workload Review Panel', 82, ''),
(4, 'external', 'Rural Education Access Program', 107, ''),
(3, 'internal', 'Academic Integrity Policy Review', 90, ''),
(2, 'external', 'Veteran Support Service Expansion', 85, 'Helped write program grant'),
(5, 'internal', 'Graduate Student Retention Committee', 64, ''),
(7, 'external', 'Affordable Housing Advocacy Project', 97, ''),
(1, 'internal', 'Library Open Access Policy Team', 80, ''),
(10, 'external', 'Climate Action Planning Workshop', 102, 'Facilitated breakout sessions'),
(6, 'internal', 'Mental Health Task Force', 86, ''),
(4, 'external', 'Technology Support for Seniors', 91, ''),
(8, 'internal', 'Curriculum Development Working Group', 75, ''),
(9, 'external', 'Neighborhood Literacy Campaign', 109, '');