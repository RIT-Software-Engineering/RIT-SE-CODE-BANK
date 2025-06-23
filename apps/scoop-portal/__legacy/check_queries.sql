\echo 'Users:'
SELECT system_id, fname, lname, role, user_type FROM users;

\echo 'Projects and Teams:'
SELECT 
    p.title,
    t.name as team_name,
    u1.fname || ' ' || u1.lname as coach,
    u2.fname || ' ' || u2.lname as coordinator
FROM projects p
JOIN teams t ON t.project_id = p.project_id
JOIN users u1 ON u1.system_id = t.coach_id
JOIN users u2 ON u2.system_id = t.coordinator_id;

\echo 'Team Members:'
SELECT 
    t.name as team_name,
    string_agg(u.fname || ' ' || u.lname, ', ') as team_members
FROM teams t
JOIN team_students ts ON ts.team_id = t.team_id
JOIN users u ON u.system_id = ts.student_id
GROUP BY t.name; 