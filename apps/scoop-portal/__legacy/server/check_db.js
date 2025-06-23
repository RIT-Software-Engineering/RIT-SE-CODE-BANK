/**
 * Script to check the SCOOP Portal database
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./server/database/db_config');

// Open the database
const db = new sqlite3.Database(path.join(__dirname, 'server/database', config.dbFileName), (err) => {
    if (err) {
        console.error(`Error opening database: ${err.message}`);
        process.exit(1);
    }
    console.log(`Opened database: ${config.dbFileName}`);

    // Check tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
            console.error(`Error getting tables: ${err.message}`);
            process.exit(1);
        }
        console.log('Tables:');
        tables.forEach(table => {
            console.log(`- ${table.name}`);
        });
        console.log();

        // Check users
        db.all("SELECT system_id, fname, lname, type FROM users LIMIT 5", [], (err, users) => {
            if (err) {
                console.error(`Error getting users: ${err.message}`);
                process.exit(1);
            }
            console.log('Users:');
            users.forEach(user => {
                console.log(`- ${user.system_id}: ${user.fname} ${user.lname} (${user.type})`);
            });
            console.log();

            // Check projects
            db.all("SELECT project_id, title, status FROM projects LIMIT 5", [], (err, projects) => {
                if (err) {
                    console.error(`Error getting projects: ${err.message}`);
                    process.exit(1);
                }
                console.log('Projects:');
                projects.forEach(project => {
                    console.log(`- ${project.project_id}: ${project.title} (${project.status})`);
                });
                console.log();

                // Check teams
                db.all("SELECT team_id, name FROM teams LIMIT 5", [], (err, teams) => {
                    if (err) {
                        console.error(`Error getting teams: ${err.message}`);
                        process.exit(1);
                    }
                    console.log('Teams:');
                    teams.forEach(team => {
                        console.log(`- ${team.team_id}: ${team.name}`);
                    });
                    console.log();

                    // Close the database
                    db.close((err) => {
                        if (err) {
                            console.error(`Error closing database: ${err.message}`);
                            process.exit(1);
                        }
                        console.log('Database check completed successfully');
                    });
                });
            });
        });
    });
}); 