@ECHO OFF
SETLOCAL

REM --------------------------------------------------------------------
REM This script configures the .env file for the FRONTEND application.
REM It intelligently updates existing variables or adds them if missing.
REM --------------------------------------------------------------------

REM --- Configuration Variables (MODIFY THESE FOR YOUR SETUP) ---
SET "BACKEND_URL=https://localhost:3300"
SET "API_EXTENSION=/api"
SET "DB_API_EXTENSION=/db"
SET "SLACK_API_EXTENSION=/slack"
SET "ENV_FILE=.env"
REM --- End Configuration ---

REM --- Prompt user for environment selection ---
:PROMPT_ENV
ECHO Please select the node environment:
ECHO 1) DEV
ECHO 2) PROD
SET /P "CHOICE=Enter your choice (1 or 2): "

IF "%CHOICE%"=="1" (
    SET "NODE_ENV=DEV"
    ECHO Environment set to DEV.
    GOTO :CONTINUE_SCRIPT
)
IF "%CHOICE%"=="2" (
    SET "NODE_ENV=PROD"
    ECHO Environment set to PROD.
    GOTO :CONTINUE_SCRIPT
)

ECHO Invalid choice. Please enter 1 or 2.
ECHO.
GOTO :PROMPT_ENV

:CONTINUE_SCRIPT


ECHO Deleting old %ENV_FILE%...
REM --- Delete existing .env file ---
IF EXIST "%ENV_FILE%" (
    ECHO Existing %ENV_FILE% found. Deleting it.
    DEL "%ENV_FILE%"
)
REM Create a new empty file to prevent errors
type NUL > "%ENV_FILE%"


ECHO.
ECHO --- Updating Frontend %ENV_FILE% ---

REM Call the subroutine to update each variable
CALL :update_env_var "NEXT_PUBLIC_BACKEND_URL" "%BACKEND_URL%"
CALL :update_env_var "NEXT_PUBLIC_API_EXTENSION" "%API_EXTENSION%"
CALL :update_env_var "NEXT_PUBLIC_DATABASE_API_EXTENSION" "%DB_API_EXTENSION%"
CALL :update_env_var "NEXT_PUBLIC_SLACK_API_EXTENSION" "%SLACK_API_EXTENSION%"
CALL :update_env_var "NEXT_PUBLIC_NODE_ENV" "%NODE_ENV%"
REM Add calls for other variables here


ECHO.
ECHO --- Frontend Environment Variables Setup Complete ---

ECHO.
ECHO --- Current %ENV_FILE% (relevant section) ---
findstr /R /C:"^NEXT_PUBLIC_BACKEND_URL=" /C:"^NEXT_PUBLIC_API_EXTENSION=" /C:"^NEXT_PUBLIC_DATABASE_API_EXTENSION=" /C:"^NEXT_PUBLIC_SLACK_API_EXTENSION=" /C:"^NEXT_PUBLIC_NODE_ENV=" "%ENV_FILE%"
ECHO --------------------------------------------------

ENDLOCAL
GOTO :EOF


REM --- SUBROUTINE to update or add an environment variable ---
:update_env_var
SETLOCAL
SET "VAR_NAME=%~1"
SET "VAR_VALUE=%~2"
SET "TEMP_FILE=%ENV_FILE%.tmp"

ECHO Setting %VAR_NAME%="%VAR_VALUE%"

REM This subroutine safely edits a file by:
REM 1. Creating a temporary file.
REM 2. Copying all lines from the original .env that DON'T match our variable.
REM 3. Appending our new, correct variable line to the temp file.
REM 4. Replacing the original .env with the temp file.

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
