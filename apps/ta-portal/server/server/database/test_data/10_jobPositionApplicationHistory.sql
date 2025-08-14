INSERT INTO `JobPositionApplicationHistory` (`username`, `candidateUID`, `jobPositionId`, `resumeId`, `jobApplicationStatus`, `candidateFName`, `candidateLName`, `candidatePronouns`, `candidateEmail`, `candidateMajor`, `candidateYear`, `candidateGrade`, `wasPriorEmployeeForThisCourse`, `wasPriorEmployeeForOtherCourses`, `priorEmploymentHistory`, `coverLetterName`, `coverLetterURL`) VALUES
-- Student 301 (Charlie Coder) Applications
('cc5678', 301, '2241-SWEN-344-1', 1, 'APPLIED', 'Charlie', 'Coder', 'he/him', 'student1@example.com', 'Software Engineering', 2, 'B_PLUS', FALSE, TRUE, 'SWEN-261', NULL, NULL),
('cc5678', 301, '2241-SWEN-261-1', 1, 'INTERVIEW', 'Charlie', 'Coder', 'he/him', 'student1@example.com', 'Software Engineering', 2, 'A', TRUE, TRUE, 'SWEN-261', NULL, NULL),
('cc5678', 301, '2241-SWEN-261-2', 1, 'HIRED', 'Charlie', 'Coder', 'he/him', 'student1@example.com', 'Software Engineering', 2, 'A', TRUE, TRUE, 'SWEN-261', NULL, NULL),
('cc5678', 301, '2241-SWEN-344-3', 1, 'ONHOLD', 'Charlie', 'Coder', 'he/him', 'student1@example.com', 'Software Engineering', 2, 'A', TRUE, TRUE, 'SWEN-261', NULL, NULL),

-- Student 302 (Denise Designer) Applications
('dd6789', 302, '2241-MATH-123-1', 2, 'HIRED', 'Denise', 'Designer', 'she/her', 'student2@example.com', 'Mathematics', 5, 'A', TRUE, TRUE, 'MATH-123', NULL, NULL),
('dd6789', 302, '2241-SWEN-561-1', 2, 'REJECTED', 'Denise', 'Designer', 'she/her', 'student2@example.com', 'Mathematics', 5, NULL, FALSE, TRUE, 'MATH-123', NULL, NULL),

-- Student 303 (Evan Engineer) Application
('ee8901', 303, '2241-SWEN-344-1', 3, 'ACCEPTED_OFFER', 'Evan', 'Engineer', 'they/them', 'student3@example.com', 'Computer Engineering', 2, 'B_PLUS', FALSE, TRUE, 'MATH-123, SWEN-561, SWEN-383', NULL, NULL),

-- Student 304 (Tyler Tester) Application
('tt7890', 304, '2241-SWEN-561-2', 3, 'APPLIED', 'Tyler', 'Tester', 'they/them', 'student4@example.com', 'Mathematics', 6, NULL, FALSE, TRUE, 'MATH-123', NULL, NULL),
('tt7890', 304, '2237-SWEN-344-1', 3, 'INACTIVE', 'Tyler', 'Tester', 'they/them', 'student4@example.com', 'Mathematics', 6, NULL, FALSE, TRUE, 'MATH-123', NULL, NULL),

-- Student 305 (Sally Student) Applications
('ss9012', 305, '2241-SWEN-344-1', 4, 'REJECTED', 'Sally', 'Student', 'they/them', 'student5@example.com', 'Computer Engineering', 3, 'A_MINUS', FALSE, FALSE, NULL, NULL, NULL),
('ss9012', 305, '2241-SWEN-261-1', 4, 'APPLIED', 'Sally', 'Student', 'they/them', 'student5@example.com', 'Computer Engineering', 3, NULL, FALSE, FALSE, NULL, NULL, NULL);
