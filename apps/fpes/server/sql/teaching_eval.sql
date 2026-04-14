-- Parent table: one row per teaching evaluation session
CREATE TABLE IF NOT EXISTS teaching_evals (
    id INT UNIQUE AUTO_INCREMENT PRIMARY KEY,
    form_id INT,
    course_name VARCHAR(255),
    professor_name VARCHAR(255),
    semester VARCHAR(50),
    year VARCHAR(10),
    FOREIGN KEY (form_id) REFERENCES forms(id)
);

-- Child table: one row per question in an eval
CREATE TABLE IF NOT EXISTS teaching_eval_questions (
    id INT UNIQUE AUTO_INCREMENT PRIMARY KEY,
    teaching_eval_id INT NOT NULL,
    question_number VARCHAR(10) NOT NULL,
    question TEXT NOT NULL,
    n INT,

    -- Q1 only (yes/no)
    yes VARCHAR(10),
    no VARCHAR(10),

    -- All other questions (5-point scale)
    str_agree VARCHAR(10),
    agree VARCHAR(10),
    neutral VARCHAR(10),
    disagree VARCHAR(10),
    str_disagree VARCHAR(10),

    -- Shared averages
    uni_avg VARCHAR(10),
    col_avg VARCHAR(10),
    swen_avg VARCHAR(10),
    avg VARCHAR(10),
    top_two VARCHAR(10),

    FOREIGN KEY (teaching_eval_id) REFERENCES teaching_evals(id)
);

-- Lookup table: one row per unique open-ended question prompt
CREATE TABLE IF NOT EXISTS teaching_eval_text_questions (
    id INT UNIQUE AUTO_INCREMENT PRIMARY KEY,
    question TEXT NOT NULL UNIQUE
);

-- Child table: one row per student response to an open-ended question
CREATE TABLE IF NOT EXISTS teaching_eval_text_responses (
    id INT UNIQUE AUTO_INCREMENT PRIMARY KEY,
    teaching_eval_id INT NOT NULL,
    question_id INT NOT NULL,
    response TEXT NOT NULL,
    FOREIGN KEY (teaching_eval_id) REFERENCES teaching_evals(id),
    FOREIGN KEY (question_id) REFERENCES teaching_eval_text_questions(id)
);

-- Mock data for testing teaching eval percentile calculations and averages
-- faculty_information_id 1-9 map to seeded faculty rows
INSERT INTO forms (faculty_information_id, time_submitted, pdf_data, type) VALUES
(1, '2024-01-15 10:00:00', NULL, 'Highlights'),
(2, '2024-01-20 11:00:00', NULL, 'Highlights'),
(3, '2024-02-10 09:30:00', NULL, 'Highlights'),
(5, '2024-02-20 10:00:00', NULL, 'Highlights'),
(6, '2024-03-01 10:00:00', NULL, 'Highlights'),
(7, '2024-03-05 10:00:00', NULL, 'Highlights'),
(8, '2024-03-10 10:00:00', NULL, 'Highlights'),
(9, '2024-03-15 10:00:00', NULL, 'Highlights');

INSERT INTO teaching_evals (form_id, course_name, professor_name, semester, year)
SELECT id, 'SWEN-101 Software Development', 'Instructor A', 'Fall', '2023' FROM forms WHERE faculty_information_id = 1 AND time_submitted = '2024-01-15 10:00:00';
INSERT INTO teaching_evals (form_id, course_name, professor_name, semester, year)
SELECT id, 'CSCI-250 Data Structures', 'Instructor B', 'Fall', '2023' FROM forms WHERE faculty_information_id = 2 AND time_submitted = '2024-01-20 11:00:00';
INSERT INTO teaching_evals (form_id, course_name, professor_name, semester, year)
SELECT id, 'ISTE-340 Web Development', 'Instructor C', 'Spring', '2024' FROM forms WHERE faculty_information_id = 3 AND time_submitted = '2024-02-10 09:30:00';
INSERT INTO teaching_evals (form_id, course_name, professor_name, semester, year)
SELECT id, 'DSCI-310 Machine Learning', 'Instructor E', 'Fall', '2023' FROM forms WHERE faculty_information_id = 5 AND time_submitted = '2024-02-20 10:00:00';
INSERT INTO teaching_evals (form_id, course_name, professor_name, semester, year)
SELECT id, 'CSEC-101 Security Fundamentals', 'Instructor F', 'Spring', '2024' FROM forms WHERE faculty_information_id = 6 AND time_submitted = '2024-03-01 10:00:00';
INSERT INTO teaching_evals (form_id, course_name, professor_name, semester, year)
SELECT id, 'SWEN-261 Intro to Software Engineering', 'Instructor G', 'Spring', '2024' FROM forms WHERE faculty_information_id = 7 AND time_submitted = '2024-03-05 10:00:00';
INSERT INTO teaching_evals (form_id, course_name, professor_name, semester, year)
SELECT id, 'NSSA-220 Networking Fundamentals', 'Instructor H', 'Fall', '2023' FROM forms WHERE faculty_information_id = 8 AND time_submitted = '2024-03-10 10:00:00';
INSERT INTO teaching_evals (form_id, course_name, professor_name, semester, year)
SELECT id, 'CSCI-431 Artificial Intelligence', 'Instructor I', 'Spring', '2024' FROM forms WHERE faculty_information_id = 9 AND time_submitted = '2024-03-15 10:00:00';

INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '2', 'The instructor was well prepared for class', 25, '18', '5', '2', '0', '0', '4.5', '4.6', '4.7', '4.64', '92' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 1 AND te.course_name = 'SWEN-101 Software Development';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '3', 'The instructor explained concepts clearly', 25, '16', '7', '2', '0', '0', '4.3', '4.4', '4.5', '4.56', '92' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 1 AND te.course_name = 'SWEN-101 Software Development';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '4', 'The instructor was available for help', 25, '20', '4', '1', '0', '0', '4.6', '4.7', '4.8', '4.76', '96' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 1 AND te.course_name = 'SWEN-101 Software Development';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '2', 'The instructor was well prepared for class', 30, '12', '10', '5', '2', '1', '4.5', '4.6', '4.7', '4.00', '73' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 2 AND te.course_name = 'CSCI-250 Data Structures';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '3', 'The instructor explained concepts clearly', 30, '10', '12', '6', '2', '0', '4.3', '4.4', '4.5', '4.00', '73' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 2 AND te.course_name = 'CSCI-250 Data Structures';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '4', 'The instructor was available for help', 30, '14', '9', '5', '2', '0', '4.6', '4.7', '4.8', '4.17', '77' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 2 AND te.course_name = 'CSCI-250 Data Structures';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '2', 'The instructor was well prepared for class', 28, '22', '4', '2', '0', '0', '4.5', '4.6', '4.7', '4.71', '93' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 3 AND te.course_name = 'ISTE-340 Web Development';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '3', 'The instructor explained concepts clearly', 28, '20', '6', '2', '0', '0', '4.3', '4.4', '4.5', '4.64', '93' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 3 AND te.course_name = 'ISTE-340 Web Development';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '4', 'The instructor was available for help', 28, '24', '3', '1', '0', '0', '4.6', '4.7', '4.8', '4.82', '96' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 3 AND te.course_name = 'ISTE-340 Web Development';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '2', 'The instructor was well prepared for class', 20, '5', '6', '5', '3', '1', '4.5', '4.6', '4.7', '3.25', '55' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 5 AND te.course_name = 'DSCI-310 Machine Learning';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '3', 'The instructor explained concepts clearly', 20, '4', '5', '7', '3', '1', '4.3', '4.4', '4.5', '3.15', '45' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 5 AND te.course_name = 'DSCI-310 Machine Learning';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '4', 'The instructor was available for help', 20, '6', '6', '5', '2', '1', '4.6', '4.7', '4.8', '3.50', '60' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 5 AND te.course_name = 'DSCI-310 Machine Learning';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '2', 'The instructor was well prepared for class', 26, '10', '9', '5', '1', '1', '4.5', '4.6', '4.7', '3.85', '73' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 6 AND te.course_name = 'CSEC-101 Security Fundamentals';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '3', 'The instructor explained concepts clearly', 26, '9', '10', '5', '1', '1', '4.3', '4.4', '4.5', '3.85', '73' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 6 AND te.course_name = 'CSEC-101 Security Fundamentals';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '4', 'The instructor was available for help', 26, '11', '9', '4', '1', '1', '4.6', '4.7', '4.8', '4.00', '77' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 6 AND te.course_name = 'CSEC-101 Security Fundamentals';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '2', 'The instructor was well prepared for class', 24, '14', '7', '2', '1', '0', '4.5', '4.6', '4.7', '4.25', '88' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 7 AND te.course_name = 'SWEN-261 Intro to Software Engineering';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '3', 'The instructor explained concepts clearly', 24, '13', '8', '2', '1', '0', '4.3', '4.4', '4.5', '4.21', '88' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 7 AND te.course_name = 'SWEN-261 Intro to Software Engineering';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '4', 'The instructor was available for help', 24, '15', '7', '2', '0', '0', '4.6', '4.7', '4.8', '4.42', '92' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 7 AND te.course_name = 'SWEN-261 Intro to Software Engineering';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '2', 'The instructor was well prepared for class', 18, '7', '5', '4', '1', '1', '4.5', '4.6', '4.7', '3.67', '67' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 8 AND te.course_name = 'NSSA-220 Networking Fundamentals';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '3', 'The instructor explained concepts clearly', 18, '6', '5', '5', '1', '1', '4.3', '4.4', '4.5', '3.56', '61' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 8 AND te.course_name = 'NSSA-220 Networking Fundamentals';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '4', 'The instructor was available for help', 18, '8', '5', '3', '1', '1', '4.6', '4.7', '4.8', '3.83', '72' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 8 AND te.course_name = 'NSSA-220 Networking Fundamentals';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '2', 'The instructor was well prepared for class', 15, '3', '4', '5', '2', '1', '4.5', '4.6', '4.7', '3.07', '47' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 9 AND te.course_name = 'CSCI-431 Artificial Intelligence';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '3', 'The instructor explained concepts clearly', 15, '2', '4', '5', '3', '1', '4.3', '4.4', '4.5', '2.93', '40' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 9 AND te.course_name = 'CSCI-431 Artificial Intelligence';
INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two)
SELECT te.id, '4', 'The instructor was available for help', 15, '4', '4', '4', '2', '1', '4.6', '4.7', '4.8', '3.27', '53' FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.faculty_information_id = 9 AND te.course_name = 'CSCI-431 Artificial Intelligence';