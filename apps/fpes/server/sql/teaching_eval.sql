-- Parent table: one row per teaching evaluation session
CREATE TABLE IF NOT EXISTS teaching_evals (
    id INT UNIQUE AUTO_INCREMENT PRIMARY KEY,
    form_id INT,
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