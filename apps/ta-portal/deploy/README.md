# RIT-SE-CODE-BANK: TA-Portal

The TA-Portal is composed of 3 docker containers in a docker compose.

1. The Mariadb database that stores all persistent data.
2. The JavaScript backend that uses Express for routing and uses Prisma to structure and manipulate the database.
3. The React frontend that uses the next.js framework.

Docker composes can be created out of multiple yaml files, allowing us to have a single shared [compose.yaml](compose.yaml) and distinct overrides for a local [compose.dev.yaml](compose.dev.yaml) and a staging [compose.prod.yaml](compose.prod.yaml). 

[.env](.env) contains variables that may need to change in the future if host ports need to be changed.

## Local

### Prerequisites
1.  **Node.js**
    * Download from: [https://nodejs.org/en/download](https://nodejs.org/en/download)
2.  **Docker**
    * Download from: [https://docs.docker.com/desktop/](https://docs.docker.com/desktop/)
* **Note 1:** Ensure you add the installation PATH to your local machine's environment variables and possibly within vscode for these technologies

* **Note 2:** Libraries like express and prisma were installed in our code base under our package.json file

### Setup Steps
1. Launch Docker.

2. Start up a docker compose with local parameters by running the following command within the [`/apps/ta-portal/deploy`](.) directory:

    ```bash
    docker compose -f compose.yaml -f compose.dev.yaml up --build
    ```

    `-d` can be added to the command to detatch the compose from the command line, allowing you to use the cli. You can also press `d` after the container starts.

3. \(Optional\) Populate the database with test data by running the seed command within the backend container. Run the following command within the [`/apps/ta-portal/deploy`](.) directory after the containers are running:

    ```bash
    docker compose exec backend npm run prisma:seed
    ```

Once running, the site can be accessed at [http://localhost:3000/ta-portal](http://localhost:3000/ta-portal)

## Staging

Setting up the application on the staging server is done automatically on a pull request or commit to a branch ending in -dev or -cicd-testing.

The CI/CD process defined in [`/.github/workflows`](/.github/workflows/ta-portal-ci.yml) runs the deployment script [`/scripts/deploy-ta-portal.sh`](/scripts/deploy-ta-portal.sh) when the workflow is successful. This script enters the staging server with ssh and runs to following command:

    ```bash
    docker compose -f compose.yaml -f compose.prod.yaml up -d --build
    ```


