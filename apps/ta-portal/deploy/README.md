# TA-Portal Staging and Production Setup

When fully built on the staging or produciton servers, the TA-Portal is composed of 3 docker containers duilt from a docker compose.

1. The Mariadb database that stores all persistent SQL data.
2. The JavaScript backend that uses ExpressJS for routing and uses Prisma to structure and manipulate the database.
3. The React frontend that uses the next.js framework.

[.env](.env) files contain variables that may need to change depending on the environment the app is running in. Since they can potentionally conatin sensative information such as API keys, it is recommended to never commit a .env file to the github. Instead, it is best to copy the .env.example file, rename it to .env so it is detected automatically, and then manually edit it to contain the missing or incorrect information. Since .env files are not tracked by git, once they are set up on staging or production you do not need to worry about overwritting or changing them. Basically, .env files should describe the environemnt they are currently in and should not be moved to other enviromnents.

## Rationale

In order to make staging and production more consistent and the process of moving an update from stanging to production more streamlined, the compose file that sets up the docker containers has been split into 2 parts.

1. [`compose.build.yaml`](compose.build.yaml)
    * Is used soley to create the images of the application. It takes the arguments needed for the building process and creates frontend and backend images that should function in both staging or production. Think of images like blueprints containing compiled code that can be used by docker to create the defined containers.
    * The services here only need to define context, dockerfile location, and arguments, as they are the only attributes that matter in the build step.
    * The `Image:` attribute defines the name of the image after the build step. ${TAG} is an environmental variable that can be defined when making a build for production to give the images a tag to indicate version.
    * Note that there is no mention of the Mariadb since it is an pre-exisiting image that can be pulled to anywhere. This means that it only needs to be defined in the run compose and does not need to be transfered from staging to production like the other images.

2. [`compose.run.yaml`](compose.staging.yaml)
    * Is used to run the application on both the staging and production server. Takes the images built by [`compose.build.yaml`](compose.build.yaml) and sets them up according to the .env file located wherever the docker build command is ran.
    * Attributes needed for runtime, such as environmental variables, exposed ports, dependencies, restart behavior, and healthchecks, are defined here. This also includes all mariadb setup and the definitions of volumes.

[`.env.example`](.env.example) provides the variables needed during building and runtime. Unless ports need to be changed, the only major changes to the .env include:
* `DB_ROOT_PASSWORD` and `DB_USER_PASSWORD`, which should be set to secure passwords.
* `ORIGIN_URL`, which should be set depending on the url of the staging or prod server.
* `LOGIN_MODE`, which should be set to `"prod"`, `"dev"`, or `"shibb"` depending on which login method is needed.
Env vars used in the build.yaml are built into the images, so any changes needed there requires the image to be rebuilt. Vars used by the run.yaml are taken from the .env file and set every time docker compose up is ran. (Database login information is partially stored in the mariadb volume, so any change to that may require the restarting of the volume)

## Staging

Setting up the application on the staging server is done automatically on a pull request or commit to branches that meet the criteria defined in [`/.github/workflows/ta-portal-ci.yml`](/.github/workflows/ta-portal-ci.yml).

The CI/CD process defined in [`/.github/workflows`](/.github/workflows/ta-portal-ci.yml) runs the deployment script [`/scripts/deploy-ta-portal.sh`](/scripts/deploy-ta-portal.sh) when the workflow is successful. 

This script uses ssh to access the staging server and then runs a git fetch and reset to bring the up to date repository onto the server. 

```bash
#Can be used to seed the server if the volume was not populated.
docker exec ta-portal-backend-1 npm run prisma:seed
#If that does not work:
docker compose -f compose.run.yaml exec backend npm run prisma:seed
```

## Production

**For a more detailed explanation and walkthrough, look at the following documents:**
* TA-Portal specific: `TAP Staging and CI/CD Documentation`
* Shared: `Staging to Production Process and Rationale`

1. Navigate to opt/ta-portal/apps/ta-portal/deploy on the staging server. You must have read, write, and execute permissions.

2. Ensure that there is a .env file with the necessary build properties, and that they are set to the correct property.

3. Set TAG as a temporary env variable for your ssh session. Set this to the relevant version. This means that the images will be created and packaged with the same tag.
```bash
export TAG="v0.1.0"
```

4. Build the images:
```bash
docker compose -f compose.build.yaml build
```
```bash
#Can be used to see if the images were correctly created.
docker images | grep ta-portal 
```

5. Save the images to a .tar file using docker save. **This can take a while and may seem like it is not doing anything**
```bash
docker save -o ta-portal-images.tar ta-portal-frontend:${TAG} ta-portal-backend:${TAG}
```

6. Use scp to transefer the .tar file to the production server. This must be done with an account that has write and execute permissions for the destination folder.
```bash
scp ta-portal-images.tar username@apps.se.rit.edu:/opt/ta-portal/
```
If they have changed or are missing from the production server you may need to move over the .env and compose.run.
```bash
scp compose.run.yaml username@apps.se.rit.edu:/opt/ta-portal/
scp .env username@apps.se.rit.edu:/opt/ta-portal/
```

7. Navigate to /opt/ta-portal/ on the Production server.

8. Load the docker images into the production server.
```bash
docker load -i ta-portal-images.tar
``` 
```bash
#Can be used to see if the images were correctly loaded. Pay attention to tags.
docker images | grep ta-portal 
```

10. Run the new images. Make sure you are using the same TAG value as the images that you just moved over.
```bash
TAG=v0.1.0 docker compose -f compose.run.yaml up -d
```

