@ECHO OFF
SETLOCAL

REM --- Configuration Variables (MODIFY THESE) ---
SET "DB_ROOT_PASSWORD=newPassword"
SET "DB_NAME=ca_portal"
SET "DB_HOST=127.0.0.1"
SET "DB_PORT=8000"

SET "APP_BASE_URL=http://localhost:3300"
SET "APP_NODE_ENV=development"
SET "APP_SERVER_PORT=3300"

SET "SLACK_CLIENT_ID=8356401273568.9110035154276"
SET "SLACK_CLIENT_SECRET=03750f2fb26d6cc604010e4d306dafdc"
SET "SLACK_REDIRECT_URI=https://localhost:3300/slack/oauth_redirect"

SET "ENV_FILE=.env"
REM --- End Configuration ---

ECHO --- Starting MariaDB Database Setup ---

ECHO.
ECHO Attempting to connect to MariaDB and create database '%DB_NAME%'...
REM Note: Ensure mysql.exe is in your system's PATH

mysql -h "%DB_HOST%" -P "%DB_PORT%" -u root -p"%DB_ROOT_PASSWORD%" -e "CREATE DATABASE IF NOT EXISTS %DB_NAME%;"

REM Check the exit code of the mysql command. 0 is success.
IF %ERRORLEVEL% NEQ 0 (
    ECHO.
    ECHO ERROR: Failed to connect to MariaDB or create database '%DB_NAME%'.
    ECHO Please ensure your MariaDB Docker container is running and accessible,
    ECHO and that the DB_ROOT_PASSWORD in this script is correct.
    GOTO :EOF
)

ECHO Database '%DB_NAME%' created or already exists.

ECHO.
ECHO --- Updating %ENV_FILE% ---

REM Construct the DATABASE_URL string
SET "DATABASE_URL=mysql://root:%DB_ROOT_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%"

REM Check if .env file exists. If not, create it.
IF NOT EXIST "%ENV_FILE%" (
    ECHO WARNING: %ENV_FILE% not found. Creating it.
    ECHO.>"%ENV_FILE%"
)

REM Call the subroutine to update each variable
CALL :update_env_var "DATABASE_URL" "%DATABASE_URL%"
CALL :update_env_var "BASE_URL" "%APP_BASE_URL%"
CALL :update_env_var "NODE_ENV" "%APP_NODE_ENV%"
CALL :update_env_var "PORT" "%APP_SERVER_PORT%"

CALL :update_env_var "SLACK_CLIENT_ID" "%SLACK_CLIENT_ID%"
CALL :update_env_var "SLACK_CLIENT_SECRET" "%SLACK_CLIENT_SECRET%"
CALL :update_env_var "SLACK_REDIRECT_URI" "%SLACK_REDIRECT_URI%"

ECHO.
ECHO --- All Environment Variables Setup Complete ---

ECHO.
ECHO --- Current %ENV_FILE% (relevant section) ---
findstr /R /C:"^DATABASE_URL=" /C:"^BASE_URL=" /C:"^NODE_ENV=" /C:"^PORT=" "%ENV_FILE%"
ECHO ----------------------------------------------

ENDLOCAL
GOTO :EOF


REM --- SUBROUTINE to update or add an environment variable ---
:update_env_var
SETLOCAL
SET "VAR_NAME=%~1"
SET "VAR_VALUE=%~2"
SET "TEMP_FILE=%ENV_FILE%.tmp"

ECHO Setting %VAR_NAME%="%VAR_VALUE%"

REM Batch has no simple way to edit a file. We must:
REM 1. Create a temporary file.
REM 2. Read the original .env file line by line.
REM 3. If a line does NOT contain our variable, copy it to the temp file.
REM 4. After checking all lines, append our NEW variable line to the temp file.
REM 5. Replace the original .env file with the temp file.

REM Ensure a clean temp file
IF EXIST "%TEMP_FILE%" DEL "%TEMP_FILE%"

FOR /F "usebackq tokens=* delims=" %%A IN ("%ENV_FILE%") DO (
    ECHO "%%A" | findstr /B /C:"%VAR_NAME%=" >NUL
    IF ERRORLEVEL 1 (
        REM If findstr returns errorlevel 1, the string was not found, so we keep the line
        ECHO %%A>>"%TEMP_FILE%"
    )
)

REM Now, add the new or updated value to the end of the temp file
ECHO %VAR_NAME%="%VAR_VALUE%">>"%TEMP_FILE%"

REM Replace the original file with the updated temporary file
MOVE /Y "%TEMP_FILE%" "%ENV_FILE%" >NUL

GOTO :EOF