INSERT INTO `JobPositionApplicationHistory` (`candidateUID`, `jobPositionId`, `resumeId`, `jobApplicationStatus`, `applicationData`, `commentHistory`) VALUES
-- Student 301 (Charlie Coder) Applications
(301, '2241-SWEN-344-1', 1, 'APPLIED', '{"name":"Charlie Coder","email":"student1@example.com","major":"Software Engineering","year":2,"grade":"B+","wasPriorEmployeeForThisCourse":false,"wasPriorEmployeeForAnyOtherJobPosition":true,"priorEmployeeHistory":["SWEN-261"]}', NULL),
(301, '2241-SWEN-261-1', 1, 'SELECTED', '{"name":"Charlie Coder","email":"student1@example.com","major":"Software Engineering","year":2,"grade":"A","wasPriorEmployeeForThisCourse":true,"wasPriorEmployeeForAnyOtherJobPosition":true,"priorEmployeeHistory":["SWEN-261"]}', NULL),
(301, '2241-SWEN-261-2', 1, 'INACTIVE', '{"name":"Charlie Coder","email":"student1@example.com","major":"Software Engineering","year":2,"grade":"A","wasPriorEmployeeForThisCourse":true,"wasPriorEmployeeForAnyOtherJobPosition":true,"priorEmployeeHistory":["SWEN-261"]}', NULL),

-- Student 302 (Denise Designer) Applications
(302, '2241-MATH-123-1', 2, 'SELECTED', '{"name":"Denise Designer","email":"student2@example.com","major":"Mathematics","year":5,"grade":"A","wasPriorEmployeeForThisCourse":true,"wasPriorEmployeeForAnyOtherJobPosition":true,"priorEmployeeHistory":["MATH-123"]}', NULL),
(302, '2241-SWEN-561-1', 2, 'REJECTED', '{"name":"Denise Designer","email":"student2@example.com","major":"Mathematics","year":5,"grade":"B-","wasPriorEmployeeForThisCourse":false,"wasPriorEmployeeForAnyOtherJobPosition":true,"priorEmployeeHistory":["MATH-123"]}', NULL),

-- Student 304 (Tyler Tester) Application
(304, '2241-SWEN-561-2', 3, 'SELECTED', '{"name":"Tyler Tester","email":"student4@example.com","major":"Mathematics","year":6,"grade":null,"wasPriorEmployeeForThisCourse":false,"wasPriorEmployeeForAnyOtherJobPosition":true,"priorEmployeeHistory":["MATH-123"]}', NULL),

-- Student 305 (Sally Student) Applications
(305, '2241-SWEN-344-1', 4, 'REJECTED', '{"name":"Sally Student","email":"student5@example.com","major":"Computer Engineering","year":3,"grade":"A-","wasPriorEmployeeForThisCourse":false,"wasPriorEmployeeForAnyOtherJobPosition":false,"priorEmployeeHistory":[]}', NULL),
(305, '2241-SWEN-261-1', 4, 'APPLIED', '{"name":"Sally Student","email":"student5@example.com","major":"Computer Engineering","year":3,"grade":null,"wasPriorEmployeeForThisCourse":false,"wasPriorEmployeeForAnyOtherJobPosition":false,"priorEmployeeHistory":[]}', NULL);
