@echo off
echo Initializing SCOOP Portal database...
node server/database/init_db.js
if %ERRORLEVEL% NEQ 0 (
    echo Database initialization failed!
    exit /b %ERRORLEVEL%
)
echo Starting SCOOP Portal server...
set NODE_ENV=development
nodemon main.js 