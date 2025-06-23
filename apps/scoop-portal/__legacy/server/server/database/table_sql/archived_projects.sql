CREATE TABLE archived_projects (
    project_id              INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_datetime     DATETIME DEFAULT CURRENT_TIMESTAMP,
    status                  TEXT,   -- active, in_progress, completed, archived
    title                   TEXT,
    display_name            TEXT,   -- Optional display name, falls back to title if not set
    description             TEXT,
    project_challenges      TEXT,
    constraints_assumptions TEXT,
    project_search_keywords TEXT,
    team_name               TEXT,
    poster                  TEXT,
    video                   TEXT,
    website                 TEXT,
    synopsis                TEXT,
    semester                INTEGER,
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (semester) REFERENCES semester_group(semester_id)
);
