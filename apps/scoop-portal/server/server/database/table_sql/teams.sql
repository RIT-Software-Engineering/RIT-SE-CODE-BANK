CREATE TABLE teams (
    team_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT,
    semester        INTEGER,
    project_id      TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (semester) REFERENCES semester_group(semester_id),
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
); 