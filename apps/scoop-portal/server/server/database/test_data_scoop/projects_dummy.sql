INSERT INTO projects (status, title, description, semester) 
VALUES
    ('in progress', 'SCOOP Portal Migration', 
     'Migration of the Senior Project Portal to the new SCOOP Portal system', 1),
    ('in progress', 'AI Code Review Tool', 
     'Development of an AI-powered code review assistant', 1),
    ('in progress', 'SCOOP Demo Master List', 'Master list of project workflow phases, including selection, oboarding, etc.', 1)
ON CONFLICT (project_id) DO NOTHING; 