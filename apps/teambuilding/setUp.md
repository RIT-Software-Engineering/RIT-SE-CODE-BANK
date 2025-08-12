Teambuilding is a microserivce designed to help manage teams within the SE department. To do this it as 2 major views. One for "managers" that want to create teams from a group of people, and the other for "users" who are put into teams. The application lets managers manage team building in a varity of ways and creates an easy interface for users to view all teams that they are apart of.

To run this application you will need to set up the back and front end: 

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
    - `GRANT CREATE, DROP, ALTER, REFERENCES ON {database_name}.* TO '{username}'@'localhost';` (In practice, this has failed and we are not sure why yet, but if you need to, you can fall back on `GRANT ALL PRIVILEGES ON *.* TO '{username}'@'localhost';`, but this is not a best practice.)
    - Save the changes to privileges: `FLUSH PRIVILEGES;`
    - You can check if this worked by running: `SHOW GRANTS FOR '{username}'@'localhost';`
- Exit the CLI tool: `Exit;`

#### Step 2: Setting up the environment

For a head start, you can copy the .env.sample file in the same location, change the name to .env and just modify the lines that relate to the instructions below.
- Create a `.env` file in teambuilding/express
- Add the following lines to your `.env` file:
    - A reference to your local database for prisma and the user that has permissions to it: `DATABASE_URL=mysql://{username}:{password}@localhost:3306/{database_name}`
        - Note: `3306` is the default port that MariaDB uses. If you used a different one, you should change it to that.
    - Used by the backend to specify which port to run the server on: `PORT=3001`
    - Used by the API's cors policy to specify where the API expects to receive requests from: `BASE_URL={your_app_url}`
    - Used to specify what stage (e.g., development, production) this app is running on: `NODE_ENV=development`

#### Step 3: Setting up prisma

- Navigate to the teambuilding/express directory
- Run `npm install`
- Run `npx prisma migrate reset`
- Run `npx prisma generate`

#### Step 4: Start the backend server

- Navigate to the apps/workflow/server directory
- Run `npm run dev`

Note: if the server fails to start because you are missing a package, please run `npm install {package name}`

#### Step 5: Interact with the API directly

You can use postman, curl, etc


#### Step 1: For setting up the Frontend
- Navigate to the teambuilding/ui directory
- Run `npm install`
- Run `npm run dev`

Note: if the ui fails to start because you are missing a package, please run `npm install {package name}`