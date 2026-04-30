INSERT INTO `JobPositionApplicationHistory` (`username`, `candidateUID`, `jobPositionId`, `resumeId`, `jobApplicationStatus`, `candidateFName`, `candidateLName`, `candidatePronouns`, `candidateEmail`, `candidateMajor`, `candidateYear`, `candidateGrade`, `wasPriorEmployeeForThisCourse`, `wasPriorEmployeeForOtherCourses`, `priorEmploymentHistory`) VALUES
-- Student 301 (Charlie Coder) Applications
('ccc0000', 301, '2241-SWEN-344-1', 1, 'APPLIED', 'Charlie', 'Coder', 'he/him', 'ccc0000@rit.edu', 'Software Engineering', 2, 'B_PLUS', FALSE, TRUE, 'SWEN-261'),
('ccc0000', 301, '2241-SWEN-261-1', 1, 'INTERVIEW', 'Charlie', 'Coder', 'he/him', 'ccc0000@rit.edu', 'Software Engineering', 2, 'A', TRUE, TRUE, 'SWEN-261'),
('ccc0000', 301, '2241-SWEN-261-2', 1, 'HIRED', 'Charlie', 'Coder', 'he/him', 'ccc0000@rit.edu', 'Software Engineering', 2, 'A', TRUE, TRUE, 'SWEN-261'),
('ccc0000', 301, '2241-SWEN-344-3', 1, 'ONHOLD', 'Charlie', 'Coder', 'he/him', 'ccc0000@rit.edu', 'Software Engineering', 2, 'A', TRUE, TRUE, 'SWEN-261'),

-- Student 302 (Denise Designer) Applications
('ddd0000', 302, '2241-MATH-123-1', 2, 'HIRED', 'Denise', 'Designer', 'she/her', 'ddd0000@rit.edu', 'Mathematics', 5, 'A', TRUE, TRUE, 'MATH-123'),
('ddd0000', 302, '2241-SWEN-561-1', 2, 'REJECTED', 'Denise', 'Designer', 'she/her', 'ddd0000@rit.edu', 'Mathematics', 5, NULL, FALSE, TRUE, 'MATH-123'),

-- Student 303 (Evan Engineer) Application
('eee0000', 303, '2241-SWEN-344-1', 3, 'ACCEPTED_OFFER', 'Evan', 'Engineer', 'they/them', 'eee0000@rit.edu', 'Computer Engineering', 2, 'B_PLUS', FALSE, TRUE, 'MATH-123, SWEN-561, SWEN-383'),

-- Student 304 (Tyler Tester) Application
('ttt0000', 304, '2241-SWEN-561-2', 3, 'APPLIED', 'Tyler', 'Tester', 'they/them', 'ttt0000@rit.edu', 'Mathematics', 6, NULL, FALSE, TRUE, 'MATH-123'),
('ttt0000', 304, '2237-SWEN-344-1', 3, 'INACTIVE', 'Tyler', 'Tester', 'they/them', 'ttt0000@rit.edu', 'Mathematics', 6, NULL, FALSE, TRUE, 'MATH-123'),

-- Student 305 (Sally Student) Applications
('sss0000', 305, '2241-SWEN-344-1', 4, 'REJECTED', 'Sally', 'Student', 'they/them', 'sss0000@rit.edu', 'Computer Engineering', 3, 'A_MINUS', FALSE, FALSE, NULL),
('sss0000', 305, '2241-SWEN-261-1', 4, 'APPLIED', 'Sally', 'Student', 'they/them', 'sss0000@rit.edu', 'Computer Engineering', 3, NULL, FALSE, FALSE, NULL);