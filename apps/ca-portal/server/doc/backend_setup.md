# CA-Portal Backend Setup

## Prerequisites
1.  **MySQL Community Server**
    * Download from: [https://dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)
2.  **Node.js**
    * Download from: [https://nodejs.org/en/download](https://nodejs.org/en/download)
3.  **Docker**
    * Download from: [https://docs.docker.com/desktop/](https://docs.docker.com/desktop/)
* **Note:** Ensure you add the installation PATH to your local machine's environment variables for these technologies

## Setup Steps

1.  Run the following command to install a new Docker image container for a MariaDB instance.
    * **Important:** Remember to change the `project-name-maria-db-instance` and `newPassword` values to your desired settings:
        ```bash
        docker run --name project-name-maria-db-instance -e MARIADB_ROOT_PASSWORD=newPassword -p 8000:3306 -d mariadb:latest
        ```

2.  Navigate to the `config_backend` files and update the `DB_ROOT_PASSWORD` variable with the password you set in the previous step (e.g., `newPassword`). You can change some other attributes depending on the situation (e.g. changing port numbers if needed).
    * For Windows, navigate to specifically the `config_backend.bat` file and make the changes neccessary there. Since it's a `.bat` file you don't need to set permissions.
    * For MacOS/Linux, navigate to specifically the `config_backend.sh` file and make the changes neccessary there. After you made the changes, set execute permissions for the script by running `chmod +x config_backend.sh`.

3. Then, execute the script itself. This will create an `.env` file with default permissions suitable for a development server.
    * For Windows, it's `./config_backend.bat`
    * For MacOS/Linux, it's `./config_backend.sh`

### If you need to set up a Prisma instance and/or add new database tables:

**4a-1. For setting up a new Prisma instance:**
1.  Ensure that Prisma is installed as a **development dependency** in your `package.json` file. If not, run:
    ```bash
    npm install --save-dev prisma
    ```
2.  Navigate to a directory of your project (where your `package.json` is located or where you want the `prisma` directory and `schema.prisma` file to reside).
3.  Execute `npx prisma init` to create a new Prisma instance. This will generate a `prisma` directory containing `schema.prisma` file.

**4a-2. For adding new and/or additional database tables:**
1.  Define your new models (database tables) within the `prisma/schema.prisma` file.
2.  Run `npx prisma migrate dev` to create and apply a new migration for the changes you've defined in `schema.prisma`. You will be prompted to name the migration.

### If you just need to generate the Prisma Client for an existing Prisma instance:

**4b-1. Navigate to the directory of your project** (where your `schema.prisma` file is located).

**4b-2. Execute `npx prisma generate`** to regenerate the Prisma Client based on your `schema.prisma` file. This is necessary after making changes to your `schema.prisma` that don't involve database schema changes (e.g., adding `@@map` or `@@id` attributes without changing the underlying table structure) or if you've manually deleted your `node_modules` and need to re-generate the client.

5.  Finally, run `npm install` (or `npm i`) to install all project dependencies, and then `npm run dev` to start the backend server.


**Note** if you visually see your tables, databases, etc. then you can use the phpmyadmin application and to install it, do the following:

`docker run --name myadmin -d --link project-name-maria-db-instance:db -p 8080:80 phpmyadmin/phpmyadmin` 

This will spin up a new docker container instance of phpmyadmin. Then on your preferred browser: go to localhost:8080.
Then you should be greeted to a login screen. Type in your login credentials (username: root, and password is the root password you made for mariaDB)


## To Stop and Delete the containers and images:
MariaDB instance
* `docker stop project-name-maria-db-instance`
* `docker rm project-name-maria-db-instance`
* `docker rmi mariadb:latest`

Phpmyadmin instance
* `docker stop myadmin`
* `docker rm myadmin`
* `docker rmi phpmyadmin/phpmyadmin:latest`
