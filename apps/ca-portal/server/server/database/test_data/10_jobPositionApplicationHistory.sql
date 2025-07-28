INSERT INTO `JobPositionApplicationHistory` (`candidateUID`, `jobPositionId`, `resumeId`, `jobApplicationStatus`, `candidateName`, `candidateEmail`, `candidateMajor`, `candidateYear`, `candidateGrade`, `wasPriorEmployeeForThisCourse`, `wasPriorEmployeeForOtherCourses`, `priorEmploymentHistory`) VALUES
-- Student 301 (Charlie Coder) Applications
(301, '2241-SWEN-344-1', 1, 'APPLIED', 'Charlie Coder', 'student1@example.com', 'Software Engineering', 2, 'B_PLUS', 0, 1, 'SWEN-261'),
(301, '2241-SWEN-261-1', 1, 'SELECTED', 'Charlie Coder', 'student1@example.com', 'Software Engineering', 2, 'A', 1, 1, 'SWEN-261'),
(301, '2241-SWEN-261-2', 1, 'INACTIVE', 'Charlie Coder', 'student1@example.com', 'Software Engineering', 2, 'A', 1, 1, 'SWEN-261'),

-- Student 302 (Denise Designer) Applications
(302, '2241-MATH-123-1', 2, 'SELECTED', 'Denise Designer', 'student2@example.com', 'Mathematics', 5, 'A', 1, 1, 'MATH-123'),
(302, '2241-SWEN-561-1', 2, 'REJECTED', 'Denise Designer', 'student2@example.com', 'Mathematics', 5, 'B_MINUS', 0, 1, 'MATH-123'),

-- Student 304 (Tyler Tester) Application
(304, '2241-SWEN-561-2', 3, 'SELECTED', 'Tyler Tester', 'student4@example.com', 'Mathematics', 6, NULL, 0, 1, 'MATH-123'),
(304, '2237-SWEN-344-1', 3, 'APPLIED', 'Tyler Tester', 'student4@example.com', 'Mathematics', 6, NULL, 0, 1, 'MATH-123'),

-- Student 305 (Sally Student) Applications
(305, '2241-SWEN-344-1', 4, 'REJECTED', 'Sally Student', 'student5@example.com', 'Computer Engineering', 3, 'A_MINUS', 0, 0, NULL),
(305, '2241-SWEN-261-1', 4, 'APPLIED', 'Sally Student', 'student5@example.com', 'Computer Engineering', 3, NULL, 0, 0, NULL);