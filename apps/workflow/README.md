# Workflows

## API Documentation

### User Guide
For recommendations about how to use Workflows API see our [User Guide](https://docs.google.com/document/d/137fgw2NLPGZ5Bsush0EgImdHJGpR0SQR9-0iREY5Qqs/edit?usp=sharing).

### OpenAPI Documentation
To view our documentation regarding Workflows API you can visit [Swagger UI](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/RIT-Software-Engineering/RIT-SE-CODE-BANK/refs/heads/workflow-dev/apps/workflow/server/doc/api-docs/server_doc.yaml).

Alternatively, you can use the [OpenAPI VS Code extension](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi) and run a preview on the `server_doc.yaml` file in `/server/doc/api-docs/`.

Note: You can comment out the credentials settings in our cors policies to execute the endpoint commands in the preview. However, DON'T LEAVE THE API UNPROTECTED GOING FORWARD!

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
    - `GRANT CREATE, DROP, ALTER, REFERENCES ON {database_name}.* TO '{username}'@'localhost';` (In practice, this has failed and we are not sure why yet, but if you need to, you can fall back on `GRANT ALL PRIVILEGES ON *.* TO '{username}'@'localhost';`, but this is not a best practice.)
    - Save the changes to privileges: `FLUSH PRIVILEGES;`
    - You can check if this worked by running: `SHOW GRANTS FOR '{username}'@'localhost';`
- Exit the CLI tool: `Exit;`

#### Step 2: Setting up the environment

- Create a `.env` file in apps/workflow/server
- Add the following lines to your `.env` file:
    - A reference to your local database for prisma and the user that has permissions to it: `DATABASE_URL="mysql://{username}:{password}@localhost:3306/{database_name}"`
    - Used by the backend to specify which port to run the server on: `PORT="3001"`
- Create a `.env` file in apps/workflow/ui
- Add the following lines to your `.env` file:
    - Used by the frontend to reference the server: `SERVER_URL="http://localhost:3001"`
Warning: At this time, some of the references to the SERVER_URL on the frontend are hardcoded to `http://localhost:3001` at this time.

#### Step 3: Setting up prisma

- Navigate to the apps/workflow/server directory
- Run `npm install`
- Run `npx prisma migrate dev --name init`
- Run `npx prisma generate`

#### Step 4: Start the backend server

- Navigate to the apps/workflow/server directory
- Run `npm start`

Note: if the server fails to start because you are missing a package, please run `npm install {package name}`

#### Step 5: Interact with the API directly

You can use postman, curl, etc
