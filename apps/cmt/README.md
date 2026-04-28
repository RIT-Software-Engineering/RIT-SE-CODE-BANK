# Course Management Tool (CMT)

## Developer Environment Setup

### 1. Install Node 20.20.0
- This can be done through the normal Node installer, but I recomend NVM (Node Version Manager)
- Confirm your version by running `node -v` in any directory.

> Common issues:
> 
> If installation was successful but your OS doesn't recognize the command, try to create a new terminal and try again. If the issue persists, manually check your OS environment variables. In Windows, the variable is likely `NODE_HOME`. Ensure it points to the installed version of Node.

### 3. Install MariaDB

Two options: native or containerized. If you have Docker Desktop already setup or are familiar with containers, I recommend containerized.
    
- **Containerized**: Inside the Docker Desktop terminal (or your normal terminal), run this command:
    
    `docker run --name mariadb -p 3306:3306 -e MARIADB_ROOT_PASSWORD=root_password mariadb`

- **Native**: Download and run [the installer](https://mariadb.org/download/?t=mariadb&p=mariadb&r=12.1.2&os=windows&cpu=x86_64&pkg=msi&mirror=acorn)

> The latest version of MariaDB should work. If not, downgrade until a working version is found and then update these instructions. For reference, my version at the time of writing was 11.8.2

> When using containers, note that the value for "--name" and "-e MARAIDB_ROOT_PASSWORD" is abritrary but must remain consistent with other parts of your setup.
> The password is important for obvious reasons (it should be the same as in your .env)
> The name only matters when sending requests from containers to other containers. In that case, youll want docker "networks".

### 4. Setup Environment Variables
#### CMT
1. Navigate to `apps/cmt`
2. Copy `.env.sample` (or `.env.staging`, if it exists, is probably better) and rename it `.env`
3. Fill out values, especially your connection string. If copying the staging file, any "https://apps-staging.se.rit.edu" should turn into "http://localhost:(port_number)" where port_number is probably 3306 (but not always, use your own judgement).
#### Workflows
1. Navigate to `apps/workflows/server` and repeat steps 2 & 3 above

> Common issues
>
> Both your cmt and workflows server environment file should have the same connection string, unless you want a MariaDB server for each of your services.

#### Congratulations! Your environment should be set up.

---

## Running The Developer Environment
You can either use the start script, or run the servers manually. Either way, you will need to start the databse, if you haven't already.

**1. Start MariaDB server/container**
> Common issues:
> - If you are having port problems, make sure that your MariaDB instance and your connection strings have port 3306, the default mariaDB port. 
> - If mariaDB won't start due to the port being in use, it may be due to a MySQL server running. Either way, find the process ID according to your OS and kill the process.
> - **Make sure you set your connection string correctly!**

#### 2. (Option 1): Start Script
CMT uses VSCode Tasks to coordinate the multiple services needed. If you press `ctrl`+`shift`+`p` to enter the command pallete (or open the top-bar and type ">") then search and select `Tasks: Run Task` you can see several tasks (configured in `.vscode/tasks.json`).

To automatically install dependencies, check/apply database migrations, and start CMT's services, select the `Start CMT` task. This should open multiple terminal windows in VSCode.

Tips for usage:
- If a service crashes and fails to start again, hover over the terminal name and press the restart button.
- To exit a task, press the trash can button, or `ctrl`+`c`
- If a task is getting stuck for no reason, exit and restart it. You can restart tasks by name by selecting them instead of `Start CMT`

#### 2. (Option 2): Manual

Run `npm i` in the root, then open 3 terminals and run this in each.

- **CMT Frontend**: In `apps/cmt/frontend`, run `npm run start-cmt`
- **CMT Backend**: In `apps/cmt/backend`, run `npm run start-cmt`
- **Workflows**: In `apps/workflow/server`, run `npm run start-cmt`

> These scripts use extra commands to hopefully help your database stay in sync, stop the previously running server, etc. If you want minimal extra commands, use `npm run start`. There are some `dotenv -e` commands but those are generally neccesary.

---
## Linting
Linting can catch silly mistakes! You can either use extensions that exist in your IDE, or use the tools already in the project.

The two sources of linting in this project are Typescript and ESLint. Even though this is a Javascript project, Typescript can catch some type errors that could otherwise cause runtime errors. This project's tsconfig is set to make Typescript very lenient. ESLint is standard for Javascript/Typescript, and uses the eslint config specified by create-react-app. In the future, it may be a good idea to specify more eslint configs in other folders.

**IDE Extensions**: Typescript is installed by default on VSCode, and an ESLint extension is easily available.
> **Disclaimer**: ESLint will often have issues, given that this is a monorepo. To fix this, add the following (or similar) to your settings.json:
> ```
> "eslint.workingDirectories": [
>         { "directory": "apps/cmt", "changeProcessCWD": true }
>     ]
> ```
> You can get to the settings.json by pressing `ctrl` + `,`, then searching "eslint working directory"
>
> Of course, the documentation for eslint is the best place to go for this stuff.
>
> I'm not sure of the best solution when it comes to other workspaces, but Typescript is the biggest source of help anyways.

**Command Line Linting**: You can also lint CMT through the following commands:
- **Typescript (tsc)**: In `apps/cmt`, run `tsc`
- **ESLint**: In `apps/cmt`, run `npm run lint`

---
## Keeping Everything in Sync
As you make changes to the codebase, your development server should detect the changes and restart automatically.

But, **when you make changes to the schema, those will not be automatically reflected**. To update the schema and database, you can re-run the `Start CMT` task, or use prisma commands yourself.

There is a reset-all-data command in the cmt package.json. Running this can be helpful if your database ever gets into a weird state and you're fine with data loss.

> You will likely be prompted with warnings about risky schema changes. In a lot of cases, data will have to be wiped. If you're okay with the warnings, say yes to the prompts.

> **Important warning about data**: Likely, you are being handed a version of the project that doesn't have any migrations. We've avoided migrations because we haven't ever needed to store user data across schema changes. In the near future, this may need to be done. Look at the documentation for Prisma migrations to find out more about keeping user data safe across schema changes.

---

# CMT's startup Scripts
> This reading is optional and only if you are wondering why the start scripts are how they are.

While there is more high level information on how this repository uses npm in [this document](https://docs.google.com/document/d/1zm7hI2R7Hz0tgCx5eHXF9r4FrxAF3QfVFQjCfUWRb9g/edit?tab=t.0#heading=h.rquxpzgjogju), there are some specifics about how CMT leverages npm scripts to replace what might typically be a .js file.

In a repository, it is helpful to have a command that someone can run that will do all the work of making sure databases are in-sync and migrated, and then also run the servers.

Typically, one master script would spawn windows and call commands, but it leads to an "all-or-nothing" approach that can be annoying. If I just want to restart my frontend to make sure my environment variables are refreshed, I don't really want to wait a full minute for all the startup scripts, BUT, I still would like the convenience of having some commands called for me.

Also, the script was 300 lines of vibe coded slop, so I didn't particularly like it.

That's why in the package.jsons of the cmt frontend-and-backend, workflows server, and root directories, there are "start-cmt" scripts alongside the normal "start" scripts (exlcuding the "start" script at the root directory). While the "start" script contains the bare minimum for function, the "start-cmt" scripts contain several helper functions that try to cover several bases like db migration.

## Debugging

A few pieces of advice when working with package.jsons and Nx:

- When configuring a project's targets, both the `project.json` and the `nx` field in the `package.json` are read.
    - Nx will automatically determine lots of things from your `package.json`, like turning scripts into targets, and inheriting the name.
- We use dotenv-cli and --schema because we want our CMT frontend and backend to share the same .env file, BUT prisma and create-react-app need some extra guidance to still find the right environment/schema files.
- The "--" that appears in `dotenv -e file --` is not a builtin operator like "&&" and any commands after a "&&" will NOT have those environment variables. Its just how dotenv works.
- Prefer composability. A package's scripts should only be concered with that package, and if a script exists at a high level while only affecting one package, ask yourself if that script should instead exist inside the package.

## Last Resort

If there's anything truly confusing, feel free to contact Scott Happy at sdh8796@rit.edu on Slack, preferrably. But, since most of the features of the setup are fairly conventional, an agentic AI model (either GitHub Copilot or a model running in Claude Code, Cline, etc) should be able to help you out.