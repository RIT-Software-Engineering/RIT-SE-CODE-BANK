INSERT INTO semester_group (name, dept, start_date, end_date)
VALUES
    ('2025 Spring', 'SE', '2025-01-27', '2025-05-10')
ON CONFLICT (name) DO NOTHING;