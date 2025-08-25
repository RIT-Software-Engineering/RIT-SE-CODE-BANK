# Scoop Portal Backend Setup Guide
How to set up and run the backend server for the Scoop Portal project using **Express**, **Prisma**, and **MariaDB**.
## Prerequisites

Ensure the following are installed:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)
- [MariaDB](https://mariadb.org/)
- [Prisma CLI](https://www.prisma.io/docs/reference/api-reference/command-reference)
- [Docker](https://www.docker.com/)

## MariaDB Local Setup
Download and install MariaDB. In the setup wizard, choose a password for the root user 
(Since this is only for local development "password" is ok. This is not recommended for a production environment). **This
password will be used in the .env file.** Ensure the TCP port is set to 3306. Continue the install. 

### Useful MySQL Shell Commands

`show databases` shows all databases  
`use [database]` switch to the specified database  
`show tables` show all tables in a database  
`select * in [table]` show all records in the specified table  

**NOTE**   
After creating the database, most table and schema creation and manipulation will be done through Prisma.
Manipulating the database or schema directly will cause incongruencies between your database and the Prisma schema. 

## Environment Variables
In the `server/` directory:
Create a `.env` file according to the `.env.example`, replacing `<USER>`, `<PASSWORD>`, and `<DATABASE_NAME>` with your actual database credentials. This database URL allows Prisma to connect to your local MariaDB/MySQL database at the default port 3306. There is a setup script that will overwrite this file with the information needed to run the portal.


In the `ui/` directory:
Create a `.env.development` file according to the `.env.development.example`. We are integrating Express with Next.js, where Express is handling the requests and then routing them to Next.js for page rendering, so Next.js and Express will need to be on the same port (5000). Set NEXT_PUBLIC_API_URL to http://localhost:5000.

Create a `.env.production` file according to the `.env.production.example`.

There is a setup script that will overwrite this file with the information needed to run the portal.

## Install Dependencies
In the monorepo root directory, run `npm install`

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

Ensure .gitignore includes the Prisma Generated files:
`**/generated/prisma`

## Run The Server
Open and run Docker.

In the monorepo root directory, run `npm run setupportal`, followed by `npm run startportal`.

**NOTE**   
There is a known issue where the database seeding may not be executed on setup. If this happens, run the setup script again and it should populate.

## API Endpoints
API endpoints can be found under `api/` in the server directory.
