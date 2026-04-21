# Course Management Tool (CMT)

## Developer Environment Setup

### 1. Install Node 20.20.0
- This can be done through the normal Node installer, but I recomend NVM (Node Version Manager)
- Confirm your version by running `node -v` in any directory.

> Common issues:
> - If installation was successful but your OS doesn't recognize the command, try to create a new terminal and try again. If the issue persists, manually check your OS environment variables. In Windows, the variable is likely `NODE_HOME`. Ensure it points to the installed version of Node.

### 2. Install Project Dependencies

- In the root of the repository, run `npm install`

> - While unlikely, you may need to run `npm i --legacy-peer-deps`. If this happens, consider attempting to downgrade conflicting packages.

### 3. Install MariaDB

Two options: native or containerized. If you have Docker Desktop already setup or are familiar with containers, I recommend containerized.
    
- **Containerized**: Download [this image](https://www.docker.com/products/docker-desktop/) and run it
- **Native**: Download and run [the installer](https://mariadb.org/download/?t=mariadb&p=mariadb&r=12.1.2&os=windows&cpu=x86_64&pkg=msi&mirror=acorn)

> The latest version of MariaDB should work. If not, downgrade until a working version is found and then update these instructions. For reference, my version at the time of writing was 11.8.2

### 4. Setup Environment Variables
#### CMT
1. Navigate to `apps/cmt/cmt-project`
2. Copy `.env.sample` (or `.env.staging`, if it exists, is probably better) and rename it `.env`
3. Fill out values, especially your connection string
#### Workflows
1. Navigate to `apps/workflows/server` and repeat steps 2 & 3 above


### 5. Prisma Setup
This whole step is optional, since the custom setup script can do this. Using the startup setup is recommended, but these instructions remain in case of errors or preference. If you do this step, you will need your MariaDB server/container running.

To use the startup script, go to the root of the repository and run `npm run setup-cmt`

We will both create a Prisma object for the code to use, and will also push that schema to the database. This means you will need your database running.

1. Start MariaDB server/container
2. **CMT**: Navigate to `apps/cmt/cmt-project` and run `npx prisma db push`
3. **Workflows**: Navigate to `apps/workflows/server` and run `npx prisma db push`

#### Congratulations! Your environment should be set up.

You can also run `node prisma/seed.js` from `apps/cmt/cmt-project`, which will seed your database with some convenient testing data.

---

## Running The Developer Environment
You can either use the start script, or run the servers manually. Either way, you will need to start the databse, if you haven't already.

1. Start MariaDB server/container
> Common issues:
> - If you are having port problems, make sure that your MariaDB instance and your connection strings have port 3306, the default mariaDB port. 
> - If mariaDB won't start due to the port being in use, it may be due to a MySQL server running. Either way, find the process ID according to your OS and kill the process.
> - **Make sure you set your connection string correctly!**

#### 2. (Option 1): Start Script
- Navigate to the root of the repository
- Run `npm run start-cmt`
- You can navigate the resultant terminal with enter/esc and your arrow keys. If you dislike this display, then try the manual option.

#### 2. (Option 2): Manual

Open 3 terminals and run this in each.

- **CMT Frontend**: In `apps/cmt/cmt-project`, run `npm run start`
- **CMT Backend**: In `apps/cmt/cmt-project/src/backend`, run `npm run dev`
- **Workflows**: In `apps/workflow/server`, run `npm run start`

---
## Linting
Linting can catch silly mistakes! You can either use extensions that exist in your IDE, or use the tools already in the project.

The two sources of linting in this project are Typescript and ESLint. Even though this is a Javascript project, Typescript can catch some type errors that could otherwise cause runtime errors. This project's tsconfig is set to make Typescript very lenient. ESLint is standard for Javascript/Typescript, and uses the eslint config specified by create-react-app.

**IDE Extensions**: Typescript is installed by default on VSCode, and an ESLint extension is easily available.
> **Disclaimer**: ESLint will often have issues, given that this is a monorepo. To fix this, add the following to your settings.json:
> ```
> "eslint.workingDirectories": [
>         { "directory": "apps/cmt/cmt-project", "changeProcessCWD": true }
>     ]
> ```
> You can get to the settings.json by pressing `ctrl` + `,`, then searching "eslint working directory"

**Command Line Linting**: You can also lint CMT through the following commands:
- **Typescript (tsc)**: In `apps/cmt/cmt-project`, run `tsc`
- **ESLint**: In `apps/cmt/cmt-project/`, run `npm run lint`

---
## Keeping Everything in Sync
As you make changes to the codebase, your development server should detect the changes and restart automatically.

But, **when you make changes to the schema, those will not be automatically reflected**. To update the schema and database, you can use the automated scripts, or do it manually.

**Option 1: Script** 

In the root of the repo, run `npm run setup-cmt` 

**Option 2: Manual**

In `apps/cmt/cmt-project`, run `npx prisma db push`

You will likely be prompted with warnings about risky schema changes. In a lot of cases, data will have to be wiped. If you're okay with the warnings, say yes to the prompts.

Important warning about data: Likely, you are being handed a version of the project that doesn't have any migrations. We've avoided migrations because we haven't ever needed to store user data across schema changes. In the near future, this may need to be done. Look at the documentation for Prisma migrations to find out more about keeping user data safe across schema changes.
