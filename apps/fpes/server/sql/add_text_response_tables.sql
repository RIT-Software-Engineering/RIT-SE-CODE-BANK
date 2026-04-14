CREATE TABLE IF NOT EXISTS teaching_eval_text_questions (
    id INT UNIQUE AUTO_INCREMENT PRIMARY KEY,
    question TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS teaching_eval_text_responses (
    id INT UNIQUE AUTO_INCREMENT PRIMARY KEY,
    teaching_eval_id INT NOT NULL,
    question_id INT NOT NULL,
    response TEXT NOT NULL,
    FOREIGN KEY (teaching_eval_id) REFERENCES teaching_evals(id),
    FOREIGN KEY (question_id) REFERENCES teaching_eval_text_questions(id)
);
