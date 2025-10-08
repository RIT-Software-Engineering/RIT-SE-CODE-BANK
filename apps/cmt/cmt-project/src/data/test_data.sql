INSERT INTO Professor (fname, lname, email) VALUES
('Kenn', 'Martinez', 'kbmvse@rit.edu');

INSERT INTO CourseCreation (id, name, semester, professorId) VALUES
('Swen261', 'Intro to Software Engineering', 'Fall', 1),
('Swen344', 'Engineering of Web Based Software Systems', 'Fall', 1),
('Swen262', 'Engineering Software Subsystems', 'Fall', 1);

INSERT INTO Section (sectionNum, courseId, professorId) VALUES
(1, 'Swen261', 1),
(2, 'Swen261', 1),
(1, 'Swen344', 1),
(2, 'Swen344', 1),
(3, 'Swen344', 1),
(1, 'Swen262', 1);