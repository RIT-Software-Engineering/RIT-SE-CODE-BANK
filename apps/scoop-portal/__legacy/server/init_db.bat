@echo off
echo Initializing SCOOP Portal database...
node server/database/init_db.js
echo Done!
pause 