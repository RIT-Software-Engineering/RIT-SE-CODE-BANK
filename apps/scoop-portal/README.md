# Scoop Portal Setup Guide
How to set up and run the Scoop Portal project locally using **Express**, **Prisma**, **React**, **Next.js** and **MariaDB**.
## Prerequisites

Ensure the following are installed:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/)

## Environment Variables

**DO NOT CREATE THE ENVIRONMENT VARIABLES THE SCRIPT WILL DO IT AUTOMATICALLY**

If you want Slack notifactions you will have to add the SLACK_BOT_TOKEN to the .env file in ./services/notification-service 

## (OPTIONAL) Install Dependencies
If you want to manually install the dependencies:

In the monorepo root directory, run `npm install`


## Run The Server
Open Docker. On most Docker installations, this involves opening Docker Desktop.

In the monorepo root directory, run `npm run setupportal`, followed by `npm run startportal`.


**NOTE**   
There is a known issue where the database seeding may not be executed on setup. If this happens, run the setup script again and it should populate.

## API Endpoints
API endpoints can be found under `api/` in the server directory.

Workflow API endpoints can be found under `api/` in the workflow/server directory.

Notification API endpoints can be found under `routes/` in the notification-service/src directory.

## Prisma
**THE FOLLOWING STEPS ARE DEPRECATED FOR SETUP DUE TO SCRIPTS BUT ARE USEFUL FOR ERROR CORRECTIONS:**   
To generate a Prisma client:  
Navigate to the `/server` directory.
Run `npx prisma generate`

### Useful Prisma Commands
For setup and after any changes to the Prisma schema, push the schema to the database:
`npx prisma db push`

The database can be seeded with:  
`npx prisma db seed`

You can use Prisma Studio as a GUI to see data held in the Prisma Schema:   
`npx prisma studio`

Generate the Prisma schema from the current database schema:  
`npx prisma db pull`

Reset database (drops all tables)  
`npx prisma migrate reset`

If modifying or adding Prisma models, delete schema.prisma inside `src/generated/prisma` (NOT schema.prisma inside `prisma/models/`), the generate the Prisma client with:  
`npx prisma generate`
This will generate a new schema.prisma inside the `src/generated/prisma` and update the schema.


**NOTE**   
DO NOT have MariaDB or MySQL running locally on your computer. It will run inside of the Docker Containers.

After creating the database, most table and schema creation and manipulation will be done through Prisma.
Manipulating the database or schema directly will cause incongruencies between your database and the Prisma schema.

### Useful MySQL Shell Commands

`show databases` shows all databases  
`use [database]` switch to the specified database  
`show tables` show all tables in a database  
`select * in [table]` show all records in the specified table  
