DROP TABLE course_sections;

CREATE TABLE IF NOT EXIST course_sections (
    id INT UNSIGNED UNIQUE auto_increment PRIMARY KEY,
    course_id INT UNSIGNED FOREIGN KEY,
    room_location VARCHAR(60),
    days_of_the_week (20),
    number_of_students INT UNSIGNED,
    semester ENUM('FALL', 'SPRING', 'SUMMER'),
    scholastic_year YEAR
);

INSERT INTO course_sections (course_id, room_location, days_of_the_week, number_of_students, semester, scholastic_year)
VALUES 
(1, 'Building A - Room 101', 'Mon/Wed/Fri', 30, 'FALL', 2025),
(2, 'Building B - Room 205', 'Tue/Thu', 25, 'SPRING', 2026),
(3, 'Online', 'Wed', 50, 'SUMMER', 2025),
(4, 'Building C - Lab 1', 'Mon/Wed', 20, 'FALL', 2025),
(1, 'Building A - Room 102', 'Tue/Thu', 35, 'SPRING', 2026),
(5, 'Building D - Room 303', 'Mon/Wed/Fri', 40, 'FALL', 2024);