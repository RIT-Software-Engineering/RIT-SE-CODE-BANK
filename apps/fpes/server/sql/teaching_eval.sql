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
INSERT INTO forms (faculty_information_id, time_submitted, pdf_data, type) VALUES 
(1, '2024-01-15 10:00:00', NULL, 'Highlights'),
(2, '2024-01-20 11:00:00', NULL, 'Highlights'),
(3, '2024-02-10 09:30:00', NULL, 'Highlights');

INSERT INTO teaching_evals (form_id, course_name, professor_name, semester, year) VALUES
(1, 'SWEN-101 Software Development', 'Alice Johnson', 'Fall', '2023'),
(2, 'CSCI-250 Data Structures', 'Brian Lee', 'Fall', '2023'),
(3, 'ISTE-340 Web Development', 'Carla Smith', 'Spring', '2024');

INSERT INTO teaching_eval_questions (teaching_eval_id, question_number, question, n, str_agree, agree, neutral, disagree, str_disagree, uni_avg, col_avg, swen_avg, avg, top_two) VALUES
(1, '2', 'The instructor was well prepared for class', 25, '18', '5', '2', '0', '0', '4.5', '4.6', '4.7', '4.64', '92'),
(1, '3', 'The instructor explained concepts clearly', 25, '16', '7', '2', '0', '0', '4.3', '4.4', '4.5', '4.56', '92'),
(1, '4', 'The instructor was available for help', 25, '20', '4', '1', '0', '0', '4.6', '4.7', '4.8', '4.76', '96'),
(2, '2', 'The instructor was well prepared for class', 30, '12', '10', '5', '2', '1', '4.5', '4.6', '4.7', '4.00', '73'),
(2, '3', 'The instructor explained concepts clearly', 30, '10', '12', '6', '2', '0', '4.3', '4.4', '4.5', '4.00', '73'),
(2, '4', 'The instructor was available for help', 30, '14', '9', '5', '2', '0', '4.6', '4.7', '4.8', '4.17', '77'),
(3, '2', 'The instructor was well prepared for class', 28, '22', '4', '2', '0', '0', '4.5', '4.6', '4.7', '4.71', '93'),
(3, '3', 'The instructor explained concepts clearly', 28, '20', '6', '2', '0', '0', '4.3', '4.4', '4.5', '4.64', '93'),
(3, '4', 'The instructor was available for help', 28, '24', '3', '1', '0', '0', '4.6', '4.7', '4.8', '4.82', '96');