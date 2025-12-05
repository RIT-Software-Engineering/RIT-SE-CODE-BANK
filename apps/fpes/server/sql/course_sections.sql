CREATE TABLE IF NOT EXISTS course_sections (
    id INT UNIQUE AUTO_INCREMENT PRIMARY KEY,
    room_location VARCHAR(60),
    days_of_the_week VARCHAR(20) NOT NULL,
    number_of_students INT UNSIGNED NOT NULL,
    semester ENUM('FALL', 'SPRING', 'SUMMER') NOT NULL,
    year YEAR NOT NULL, 
    first_time_teaching_course BOOLEAN DEFAULT FALSE,
    number_of_sections INT UNSIGNED  NOT NULL,
    curriculum_development TEXT,
    course_id INT,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- INSERT INTO course_sections (course_id, room_location, days_of_the_week, number_of_students, semester, scholastic_year)
-- VALUES 
-- (1, 'Building A - Room 101', 'Mon/Wed/Fri', 30, 'FALL', '2025'),
-- (2, 'Building B - Room 205', 'Tue/Thu', 25, 'SPRING', '2026'),
-- (3, 'Online', 'Wed', 50, 'SUMMER', '2025-2026'),
-- (2, 'Building C - Lab 1', 'Mon/Wed', 20, 'FALL', '2026'),
-- (1, 'Building A - Room 102', 'Tue/Thu', 35, 'SPRING', '2027'),
-- (3, 'Building D - Room 303', 'Mon/Wed/Fri', 40, 'FALL', '2025');