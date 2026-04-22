# TA-Portal Backend Setup

## Prerequisites
1.  **Node.js**
    * Download from: [https://nodejs.org/en/download](https://nodejs.org/en/download)
2.  **Docker**
    * Download from: [https://docs.docker.com/desktop/](https://docs.docker.com/desktop/)
* **Note 1:** Ensure you add the installation PATH to your local machine's environment variables and possibly within vscode for these technologies

* **Note 2:** Libraries like express and prisma we're installed in our code base under our package.json file

## Setup Steps
1.  Within the root of the repo(`RIT-SE-CODE-BANK\`), run the following command to install the node packages. If you had already done this as part of setting up the frontend you do not need to run the command again.
```bash
npm install
```

2.  Run the following command to install a new Docker image container for a MariaDB instance:
```bash
docker run --name ta-portal-maria-db-instance -e MARIADB_ROOT_PASSWORD=root_password -e MYSQL_DATABASE=ta_portal_db -p 3306:3306 -d mariadb:11 
```
> **Note:** In order to use https instead of http you will need to generate certificates within the `/ta-portal/server` directory. To do this, follow the instructions regarding mkcert within [messaging_feature.md](messaging_feature.md). You do not need to set up a slack app.

3.  Navigate to the server directory:
```bash
cd apps/ta-portal/server
```

4. Run the following command to copy the `example.env` file:
```bash
cp example.env .env
```

5. Then, run this command to create a new migration of our current database schema. You may be prompted to name the migration if one is not present/out of date within the `/prisma/migrations` directory. You will then see a `migration` folder within the Prisma project folder that will house a .sql files of all of the tables you've created in the `schema.prisma` file.
```bash
npm run prisma:migrate
```

6. Then, run the following command to populate the data tables with dummy data in our `apps/ta-portal/server/server/database/test_data`.
```bash
npm run prisma:seed
```

7. Finally, execute the backend in dev mode.
```bash
npm run dev
```

---
## Extra Documentation about backend
### Prisma Setup/Instructions Guide
In case, anything goes wrong on a database perspective or you want to make a change to the database/datatables for the backend following these steps depending on the situation:
**For setting up a new Prisma instance (these steps aren't neccessary if there is an existing Prisma project within the `server/server/database` directory):**
1.  Ensure that Prisma is installed as a **development dependency** in your `package.json` file. If not, run:
    ```bash
    npm install --save-dev prisma
    ```
2.  Navigate to a directory of `server/server/database` as this will house the prisma project instance.
3.  Execute `npx prisma init` to create a new Prisma instance. During this, you will be prompted on what database provider to use. For us, we chose `mysql`. This will generate a `prisma` directory containing `schema.prisma` file.
4. Follow the rest of the instructions below
---
**For adding new additional database tables and/or updating them:**
1.  Define your new models (database tables) and relationships within the `prisma/schema.prisma` file.
2.  Delete the `migrations` folder if there's exists one within the prisma folder [here](../server/database/prisma/migrations)
3.  Run `npx prisma migrate dev` within the prisma folder project to create and apply a new migration for the changes you've defined in `schema.prisma` file. An easier command to do this is `npm run prisma:migrate` when you in the main `/server` folder. You will be prompted to name the migration. You will then see a `migration` folder within the Prisma project folder that will house a .sql files of all of the tables you've created in the `schema.prisma` file.

**NOTE** If there's any issues with running this command (i.e. it suggesting to resetting the database, but the reset command still doesn't work) re-run the config files to reset everything. Then start back up to step 2 here within this section.
4. Follow the rest of the instructions below
---
**For dropping, creating, and then (re)populating the data tables**
1. Run `npx prisma migrate reset` within the prisma folder project. An easier command to do this is `npm run prisma:reset` when you in the main `/server` folder. It may ask you for a confirmation and for that, just type in `y`.
2. Follow the rest of the instructions below
---
**For generating the Prisma client instance**
1. Navigate to the directory of your project** (where your `schema.prisma` file is located).
2. Execute `npx prisma generate` to (re)generate the Prisma Client based on your `schema.prisma` file. An easier command to do this is `npm run prisma:generate` when you in the main `/server` folder. This is necessary after making changes to your `schema.prisma` file, if you've pulling from someone else's code changes, or if you manually deleted your `node_modules` and need to re-generate the client.
3. Follow the rest of the instructions belows
---
**Run the backend**
1. Finally, run `npm run dev` to execute the backend.
---

### PHPMyAdmin Setup
If you want to visually see your tables, databases, etc. then you can use the phpmyadmin application and to install it, do the following:

```bash
docker run --name myadmin -d --link project-name-maria-db-instance:db -p 8080:80 phpmyadmin/phpmyadmin
```

This will spin up a new docker container instance of phpmyadmin. Then on your preferred browser: go to localhost:8080.
Then you should be greeted to a login screen. Type in your login credentials based on the user you chose in the config files (example: if you chose the root user in the config files, type in username: root, and password is the root password you made for mariaDB docker installation)

---
### To Stop and Delete the containers and images:
MariaDB instance
* `docker stop project-name-maria-db-instance`
* `docker rm project-name-maria-db-instance`
* `docker rmi mariadb:latest`

Phpmyadmin instance
* `docker stop myadmin`
* `docker rm myadmin`
* `docker rmi phpmyadmin/phpmyadmin:latest`

**NOTE** in some cases you may need to delete the left over data that's retained from docker after deleting these two containers and images. For that, use the command `docker volume prune` to delete all Docker volumes that are not currently being used by any container.

### MariaDB console
If you want to access the mariaDB console with our docker installation, use these commands:
* `docker exec -it project-name-maria-db-instance /bin/bash`
* `mariadb -u root -p`