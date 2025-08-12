@ECHO OFF
SETLOCAL

REM --- Workflow Configuration ---
REM Note: DB_PORT may need to be set to something different if your OS restricts access to the preset port.
SET "DB_ROOT_PASSWORD=newPassword"
SET "DB_HOST=127.0.0.1"
SET "DB_PORT=7000"
SET "DB_NAME_WORKFLOWS=workflows"
SET "DB_APP_USER=app_user"
SET "DB_APP_PASSWORD=app_password"
SET "APP_SERVER_PORT=3001"
SET "NODE_ENV=development"

SET "ENV_FILE=.env"
REM --- End Configuration ---

ECHO --- (Step 1/3) Starting MariaDB Database Setup ---
ECHO.
REM This script creates the workflows database and the dedicated app user
node ./setup_db.js

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

SET "DATABASE_URL_WORKFLOWS="
IF "%USER_CHOICE%"=="1" (
    ECHO Configuring application to use the 'root' user.
    SET "DATABASE_URL_WORKFLOWS=mysql://root:%DB_ROOT_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME_WORKFLOWS%"
    GOTO :UserChoiceContinue
)
IF "%USER_CHOICE%"=="2" (
    ECHO Configuring application to use the dedicated 'app_user'.
    SET "DATABASE_URL_WORKFLOWS=mysql://%DB_APP_USER%:%DB_APP_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME_WORKFLOWS%"
    GOTO :UserChoiceContinue
)

ECHO Invalid choice. Please enter 1 or 2.
ECHO.
GOTO :UserChoicePrompt

:UserChoiceContinue
ECHO.
ECHO --- (Step 3/3) Creating Workflow .env file ---

IF EXIST "%ENV_FILE%" (
    ECHO WARNING: Found existing %ENV_FILE%. Deleting it.
    DEL "%ENV_FILE%"
)
type NUL > "%ENV_FILE%"

REM --- Populate Workflow .env file ---
CALL :update_env_var "DATABASE_URL" "%DATABASE_URL_WORKFLOWS%"
CALL :update_env_var "PORT" "%APP_SERVER_PORT%"
CALL :update_env_var "NODE_ENV" "%NODE_ENV%"

ECHO.
ECHO --- Workflow Setup Complete ---
ECHO.
ECHO --- Final %ENV_FILE% Contents ---
ECHO ----------------------------------------------
type "%ENV_FILE%"
ECHO ----------------------------------------------

ENDLOCAL
GOTO :EOF

:update_env_var
SETLOCAL
SET "VAR_NAME=%~1"
SET "VAR_VALUE=%~2"
SET "TARGET_FILE=.env"
SET "TEMP_FILE=%TARGET_FILE%.tmp"
ECHO Setting %VAR_NAME%...
IF EXIST "%TEMP_FILE%" DEL "%TEMP_FILE%"
FOR /F "usebackq tokens=* delims=" %%A IN ("%TARGET_FILE%") DO (
    ECHO "%%A" | findstr /B /C:"%VAR_NAME%=" >NUL
    IF ERRORLEVEL 1 (
        ECHO %%A>>"%TEMP_FILE%"
    )
)
ECHO %VAR_NAME%="%VAR_VALUE%">>"%TEMP_FILE%"
MOVE /Y "%TEMP_FILE%" "%TARGET_FILE%" >NUL
GOTO :EOF