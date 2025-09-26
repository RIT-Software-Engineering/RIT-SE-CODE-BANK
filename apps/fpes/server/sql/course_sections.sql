DROP TABLE course_section;

CREATE TABLE IF NOT EXIST course_section (
    id INT UNSIGNED UNIQUE auto_increment PRIMARY KEY,
    course_id INT UNSIGNED FOREIGN KEY,
    room_location VARCHAR(60),
    days_of_the_week (20),
    number_of_students INT UNSIGNED,
    semester ENUM('FALL', 'SPRING', 'SUMMER'),
    scholastic_year YEAR
);