# Workflows

## Getting Started with Workflows

### Developer Guide:

#### Step 1: Setting up MariaDB for prisma:

Many of you may have already done the following if you are working with MariaDB and Prisma
- Install MariaDB locally following their guide: [https://mariadb.com/docs/server/server-management/install-and-upgrade-mariadb/installing-mariadb]
- You may either set the environment variable for the MariaDB and MySQL paths to their bin directories, or use the MariaDB terminal
- Open the MariaDB CLI tool and log in as root user: If using the path variables the command will be `mysql -u root -p` (enter your root user's password)
- Create user on your local MariaDB server (remember their username and password): `CREATE USER '{username}'@'localhost' IDENTIFIED BY '{password}';`
    - Note: if you use symbols in your password, you may need to escape or decode them in a later step.

You will need to complete these steps for all
- Open the MariaDB CLI tool and log in as root user if you have not already: If using the path variables the command will be `mysql -u root -p` (enter your root user's password)
- Create a database for the Workflows data: `CREATE DATABASE {database_name};`
- Grant necessary privileges to your user:
    - `GRANT ALL PRIVILEGES ON {database_name}.* TO '{username}'@'localhost';`
    - `GRANT CREATE, DROP, ALTER, REFERENCES ON {database_name}.* TO '{username}'@'localhost';`
    - Save the changes to privileges: `FLUSH PRIVILEGES;`
    - You can check if this worked by running: `SHOW GRANTS FOR '{username}'@'localhost';`
- Exit the CLI tool: `Exit;`

#### Step 2: Setting up the environment

- Create a `.env` file in apps/workflow/server/server
- Add the following lines to your `.env` file:
    - A reference to your local database for prisma and the user that has permissions to it: `DATABASE_URL="mysql://{username}:{password}@localhost:3306/{database_name}"`
    - Used by the backend to specify which port to run the server on: `PORT="3001"`
- Create a `.env` file in apps/workflow/ui
- Add the following lines to your `.env` file:
    - - Used by the frontend to reference the server: `SERVER_URL="http://localhost:3001"`
Warning: At this time, some of the references to the SERVER_URL on the frontend are hardcoded to `http://localhost:3001` at this time.

#### Step 3: Setting up prisma

- navigate to the 