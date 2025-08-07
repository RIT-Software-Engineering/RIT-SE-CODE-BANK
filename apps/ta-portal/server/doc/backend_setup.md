# TA-Portal Backend Setup

## Prerequisites
1.  **Node.js**
    * Download from: [https://nodejs.org/en/download](https://nodejs.org/en/download)
2.  **Docker**
    * Download from: [https://docs.docker.com/desktop/](https://docs.docker.com/desktop/)
* **Note 1:** Ensure you add the installation PATH to your local machine's environment variables and possibly within vscode for these technologies

* **Note 2:** Libraries like express and prisma we're installed in our code base under our package.json file

## Setup Steps
### MARIADB Setup
1.  Run the following command to install a new Docker image container for a MariaDB instance.
    * **Important:** Remember to change the `project-name-maria-db-instance` and `newPassword` values to your desired settings:
        ```bash
        docker run --name project-name-maria-db-instance -e MARIADB_ROOT_PASSWORD=newPassword -p 8000:3306 -d mariadb:latest
        ```

2.  Navigate to the `config_backend` files in the `/server` folder and update the `DB_ROOT_PASSWORD` variable with the password you set in the previous step (e.g., `newPassword`). You can change some other attributes depending on the situation (e.g. changing port numbers if needed, if you want to create a new database user as well, you can that the DB_USER and DB_USER_PASSWORD).
    * For Windows, navigate to specifically the `config_backend.bat` file and make the changes neccessary there. Since it's a `.bat` file you don't need to set permissions.
    * For MacOS/Linux, navigate to specifically the `config_backend.sh` file and make the changes neccessary there. After you made the changes, set execute permissions for the script by running `chmod +x config_backend.sh`.

**NOTE** It will prompt you to choose what database user you want to configure with for your application. Chose either the root user (1) or the application user created within the config files.

3. Then, execute the script itself. This will create an `.env` file with default permissions suitable for a development server.

    **WARNING** if you have an existing .env file in the backend, delete it first beforew executing that scripts.
    * For Windows, it's `./config_backend.bat`. If it runs into an error (i.e. 'mysql' is not recognized), try navigating to a powershell terminal outside of vscode and run the script there.
    * For MacOS/Linux, it's `./config_backend.sh`.
---

### Prisma Setup
**For setting up a new Prisma instance (these steps aren't neccessary if there is an existing Prisma project within the `server/server/database` directory):**
1.  Ensure that Prisma is installed as a **development dependency** in your `package.json` file. If not, run:
    ```bash
    npm install --save-dev prisma
    ```
2.  Navigate to a directory of `server/server/database` as this will house the prsima project instance.
3.  Execute `npx prisma init` to create a new Prisma instance. During this, you will be prompted on what database provider to use. For us, we chose `mysql`. This will generate a `prisma` directory containing `schema.prisma` file.

---
**For adding new and/or additional database tables:**
1.  Define your new models (database tables) and relationships within the `prisma/schema.prisma` file.
2.  Run `npm install` (or `npm i`) to install all project dependencies, and then `npm run dev` to start the backend server.
2.  Run `npx prisma migrate dev` within the prisma folder project to create and apply a new migration for the changes you've defined in `schema.prisma` file. An easier command to do this is `npm run prisma:migrate` when you in the main `/server` folder. You will be prompted to name the migration. You will then see a `migration` folder within the Prisma project folder that will house a .sql files of all of the tables you've created in the `schema.prisma` file.

**NOTE** If there's any issues with running this commmand (i.e. it suggesting to resetting the database, but the reset command still doesn't work) re-run the config files to reset everything

---
**For dropping, creating, and then populating the data tables**
1. Run `npx prisma migrate reset` within the prisma folder project. An easier command to do this is `npm run prisma:reset` when you in the main `/server` folder. It may ask you for a confirmation and for that, just type in `y`.
---
**For generating the Prisma instance**

1. Navigate to the directory of your project** (where your `schema.prisma` file is located).

2. Execute `npx prisma generate` to (re)generate the Prisma Client based on your `schema.prisma` file. An easier command to do this is `npm run prisma:generate` when you in the main `/server` folder. This is necessary after making changes to your `schema.prisma` file, if you've pulling from someone else's code changes, or if you manually deleted your `node_modules` and need to re-generate the client.
---

### Final Backend Setup step
Finally, run `npm run dev` to start the backend server.

---
### PHPMyAdmin Setup
If you want to visually see your tables, databases, etc. then you can use the phpmyadmin application and to install it, do the following:

```bash
docker run --name myadmin -d --link project-name-maria-db-instance:db -p 8080:80 phpmyadmin/phpmyadmin
```

This will spin up a new docker container instance of phpmyadmin. Then on your preferred browser: go to localhost:8080.
Then you should be greeted to a login screen. Type in your login credentials (username: root, and password is the root password you made for mariaDB)

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

### running the mariaDB console
* `docker exec -it project-name-maria-db-instance /bin/bash`
* `mariadb -u root -p`