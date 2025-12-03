@ECHO OFF
SETLOCAL

REM --- TA-Portal Configuration (MODIFY THESE IF NEEDED) ---
SET "DB_ROOT_PASSWORD=newPassword"
SET "DB_HOST=localhost"
SET "DB_PORT=8000"
SET "DB_NAME_TAPORTAL=ta_portal"
SET "DB_APP_USER=app_user"
SET "DB_APP_PASSWORD=app_password"

SET "APP_BACKEND_URL=https://localhost:3300"
SET "APP_FRONTEND_URL=http://localhost:3000"
SET "WORKFLOWS_URL=http://localhost:3001"
SET "NOTIFICATION_SERVICE_URL=http://localhost:4000"
SET "APP_NODE_ENV=DEV"
SET "APP_SERVER_PORT=3300"

SET "SLACK_CLIENT_ID=8356401273568.9110035154276"
SET "SLACK_CLIENT_SECRET=03750f2fb26d6cc604010e4d306dafdc"
SET "SLACK_REDIRECT_URI=https://localhost:3300/api/slack/oauth_redirect"

SET "ENV_FILE=.env"
REM --- End Configuration ---

ECHO --- (Step 1/3) Starting MariaDB Database Setup ---
ECHO.
REM This script creates the ta_portal database and the dedicated app user using the env variables set above while in the command prompt session
node ./server/database/setup_db.js

IF %ERRORLEVEL% NEQ 0 (
    ECHO.
    ECHO ERROR: The Node.js database setup script failed.
    GOTO :EOF
)

ECHO Database and user setup completed successfully.
ECHO.
ECHO --- (Step 2/3) Configure Database User for Application ---

:UserChoicePrompt
ECHO Which database user should the application use for its connection string?
ECHO   1) Root User (Less Secure, for diagnostics)
ECHO   2) App User (Recommended, more secure)
SET /P "USER_CHOICE=Enter choice [1-2]: "
ECHO.

SET "DATABASE_URL_TAPORTAL="
IF "%USER_CHOICE%"=="1" (
    ECHO Configuring application to use the 'root' user.
    SET "DATABASE_URL_TAPORTAL=mysql://root:%DB_ROOT_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME_TAPORTAL%"
    GOTO :UserChoiceContinue
)
IF "%USER_CHOICE%"=="2" (
    ECHO Configuring application to use the dedicated 'app_user'.
    SET "DATABASE_URL_TAPORTAL=mysql://%DB_APP_USER%:%DB_APP_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME_TAPORTAL%"
    GOTO :UserChoiceContinue
)

ECHO Invalid choice. Please enter 1 or 2.
ECHO.
GOTO :UserChoicePrompt

:UserChoiceContinue
ECHO.
ECHO --- (Step 3/3) Creating TA-Portal .env file ---

IF EXIST "%ENV_FILE%" (
    ECHO WARNING: Found existing %ENV_FILE%. Deleting it.
    DEL "%ENV_FILE%"
)
type NUL > "%ENV_FILE%"

(
    ECHO DATABASE_URL="%DATABASE_URL_TAPORTAL%"
    ECHO DB_ROOT_PASSWORD="%DB_ROOT_PASSWORD%"
    ECHO BACKEND_URL="%APP_BACKEND_URL%"
    ECHO FRONTEND_URL="%APP_FRONTEND_URL%"
    ECHO WORKFLOWS_URL="%WORKFLOWS_URL%"
    ECHO NOTIFICATION_SERVICE_URL="%NOTIFICATION_SERVICE_URL%"
    ECHO NODE_ENV="%APP_NODE_ENV%"
    ECHO PORT="%APP_SERVER_PORT%"
    ECHO SLACK_CLIENT_ID="%SLACK_CLIENT_ID%"
    ECHO SLACK_CLIENT_SECRET="%SLACK_CLIENT_SECRET%"
    ECHO SLACK_REDIRECT_URI="%SLACK_REDIRECT_URI%"
) > "%ENV_FILE%"

ECHO.
ECHO --- TA-Portal Setup Complete ---
ECHO.
ECHO --- Final %ENV_FILE% Contents ---
ECHO ----------------------------------------------
type "%ENV_FILE%"
ECHO ----------------------------------------------

ENDLOCAL
GOTO :EOF