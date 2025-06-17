@echo off
echo Checking PostgreSQL database...

for /f "tokens=*" %%i in ('where psql 2^>nul') do (
    set "PGBIN=%%~dpi"
    goto :found_psql
)

for %%v in (17 16 15 14 13 12 11 10) do (
    if exist "C:\Program Files\PostgreSQL\%%v\bin\psql.exe" (
        set "PGBIN=C:\Program Files\PostgreSQL\%%v\bin\"
        goto :found_psql
    )
)

echo Error: PostgreSQL not found. Please add PostgreSQL bin directory to PATH
pause
exit /b 1

:found_psql
echo Found PostgreSQL at: %PGBIN%

for /f "tokens=*" %%i in ('type server\.env') do (
    set %%i
)

echo.
echo Testing database connection...
"%PGBIN%psql" "host=%DB_HOST% port=%DB_PORT% user=%DB_USER% password=%DB_PASSWORD% dbname=postgres" -c "\conninfo"
if errorlevel 1 (
    echo Error: Failed to connect to PostgreSQL
    pause
    exit /b 1
)

echo.
echo Checking if database exists...
"%PGBIN%psql" "host=%DB_HOST% port=%DB_PORT% user=%DB_USER% password=%DB_PASSWORD% dbname=postgres" -c "SELECT 1 FROM pg_database WHERE datname = '%DB_NAME%'" | findstr 1
if errorlevel 1 (
    echo Creating database %DB_NAME%...
    "%PGBIN%psql" "host=%DB_HOST% port=%DB_PORT% user=%DB_USER% password=%DB_PASSWORD% dbname=postgres" -c "CREATE DATABASE %DB_NAME%"
    if errorlevel 1 (
        echo Error: Failed to create database
        pause
        exit /b 1
    )
)

echo.
echo Creating tables...
"%PGBIN%psql" "host=%DB_HOST% port=%DB_PORT% user=%DB_USER% password=%DB_PASSWORD% dbname=%DB_NAME%" -f server/server/database/table_sql/create_all_tables.sql
if errorlevel 1 (
    echo Error: Failed to create tables
    pause
    exit /b 1
)

echo.
echo Adding test data...
echo - Adding semester data...
"%PGBIN%psql" "host=%DB_HOST% port=%DB_PORT% user=%DB_USER% password=%DB_PASSWORD% dbname=%DB_NAME%" -f server/server/database/test_data/semester_dummy.sql
echo - Adding user data...
"%PGBIN%psql" "host=%DB_HOST% port=%DB_PORT% user=%DB_USER% password=%DB_PASSWORD% dbname=%DB_NAME%" -f server/server/database/test_data/user_dummy.sql
echo - Adding project data...
"%PGBIN%psql" "host=%DB_HOST% port=%DB_PORT% user=%DB_USER% password=%DB_PASSWORD% dbname=%DB_NAME%" -f server/server/database/test_data/projects_dummy.sql
echo - Adding team data...
"%PGBIN%psql" "host=%DB_HOST% port=%DB_PORT% user=%DB_USER% password=%DB_PASSWORD% dbname=%DB_NAME%" -f server/server/database/test_data/teams_dummy.sql
echo - Adding time log data...
"%PGBIN%psql" "host=%DB_HOST% port=%DB_PORT% user=%DB_USER% password=%DB_PASSWORD% dbname=%DB_NAME%" -f server/server/database/test_data/time_log_dummy.sql

echo.
echo Verifying database content...
"%PGBIN%psql" "host=%DB_HOST% port=%DB_PORT% user=%DB_USER% password=%DB_PASSWORD% dbname=%DB_NAME%" -f check_queries.sql

echo.
echo Database setup complete!
pause 