# RIT-SE-CODE-BANK: TA-Portal

The TA-Portal is composed of 3 docker containers in a docker compose.

1. The Mariadb database that stores all persistent data.
2. The JavaScript backend that uses Express for routing and uses Prisma to structure and manipulate the database.
3. The React frontend that uses the next.js framework.

[.env](.env) contains variables that may need to change in the future if host ports need to be changed.

## rationale

In order to make staging and produciton more consistent and the process of moving an update from stanging to production more streamlined, the compose file has been split into 2 parts.

1. [`compose.build.yaml`](compose.build.yaml)
    * Is used soley to create the images of the application. Takes the arguments needed for the building process and creates frontend and backend images that should function in both staging or production. 
    * Note that it uses the LOGIN_MODE .env variable as an argument and so switching between login methods currenlty requires rebuilding the frontend image after changing the .env file.

2. [`compose.run.yaml`](compose.staging.yaml)
    * Is used to run the application on both the staging and production server. Takes the images built by [`compose.build.yaml`](compose.build.yaml) and sets them up according to the .env file.

[`.env.example`](.env.example) provides the variables needed during building and runtime. Unless ports need to be changed, the only major changes to the .env include:
* `DB_ROOT_PASSWORD` and `DB_USER_PASSWORD`, which should be set to secure passwords.
* `ORIGIN_URL`, which should be set depending on the url of the staging or prod server.
* `LOGIN_MODE`, which should be set to `"PROD"` or `"DEV"` depending on which login method is needed.

## Staging

Setting up the application on the staging server is done automatically on a pull request or commit to a branch ending in -dev or -cicd-testing.

The CI/CD process defined in [`/.github/workflows`](/.github/workflows/ta-portal-ci.yml) runs the deployment script [`/scripts/deploy-ta-portal.sh`](/scripts/deploy-ta-portal.sh) when the workflow is successful. 

This script uses ssh to access the staging server and then runs a git fetch and reset to bring the up to date repository onto the server. 



## Production

TAG=v0.1.0 docker compose -f compose.build.yaml build

docker images | grep ta-portal

docker save -o ta-portal-images.tar \
  ta-portal-frontend:${TAG} \
  ta-portal-backend:${TAG}

scp ta-portal-images.tar user@production-server:/home/user/ta-portal/
scp compose.run.yaml user@production-server:/home/user/ta-portal/
scp .env user@production-server:/home/user/ta-portal/

ssh production

docker load -i ta-portal-images.tar

docker images | grep ta-portal

TAG=v0.1.0 docker compose -f compose.run.yaml up -d

