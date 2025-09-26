CREATE TABLE archived_actions (
    action_id       INTEGER PRIMARY KEY,
    semester        INTEGER NOT NULL, 
    project         INTEGER,
    action_title    TEXT,   -- The title of the action
    action_target   TEXT,   -- individual, coach, team, admin, peer_evaluation
    date_deleted    TEXT,   -- Empty string if active, Datetime of when deactivated if unactive
    short_desc      TEXT,
    start_date      TEXT,
    due_date        TEXT,
    page_html       TEXT,   -- HTML for the page of
    file_types      TEXT,   -- Value of filetypes to accept - If blank, no filetypes required
    file_size       INTEGER,
    parent_id       INTEGER DEFAULT 0, -- id of parent action - If 0, is a parent
    created_by_id   TEXT,   
    FOREIGN KEY (semester) REFERENCES semester_group(semester_id),
    FOREIGN KEY (project) REFERENCES projects(project_id),
    FOREIGN KEY (parent_id) REFERENCES actions(action_id),
    FOREIGN Key (created_by_id) REFERENCES user(system_id)
);
