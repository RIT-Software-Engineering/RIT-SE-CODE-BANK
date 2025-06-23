/*
 run "sqlite3" from the database directory to run the sqlite shell
 connect to the test database via ".open senior_project.db"
 then run ".read create_test_db.sql"
 */
-- Create test database for SCOOP Portal
\i table_sql/create_all_tables.sql

-- Load test data in correct order
\i test_data/semester_dummy.sql
\i test_data/user_dummy.sql
\i test_data/projects_dummy.sql
\i test_data/teams_dummy.sql
\i test_data/actions_dummy.sql
\i test_data/action_log_dummy.sql
\i test_data/time_log_dummy.sql
\i test_data/page_html_dummy.sql
\i test_data/archive_dummy.sql 
