CREATE TABLE student_mentorship (
    mentorship_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id       TEXT,
    coach_id         TEXT,
    team_id          INTEGER,
    start_date       DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_date         DATETIME,
    notes            TEXT,
    FOREIGN KEY (student_id) REFERENCES users(system_id),
    FOREIGN KEY (coach_id) REFERENCES users(system_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id)
); 