INSERT INTO time_log (semester, system_id, project, work_date, time_amount, work_comment) 
VALUES
    (1, 'ghi789', '123e4567-e89b-12d3-a456-426614174000', '2024-01-15', 4, 'Database schema design'),
    (1, 'jkl135', '123e4567-e89b-12d3-a456-426614174000', '2024-01-15', 3, 'API endpoints implementation'),
    (1, 'mno246', '223e4567-e89b-12d3-a456-426614174000', '2024-01-15', 5, 'AI model integration')
ON CONFLICT DO NOTHING;