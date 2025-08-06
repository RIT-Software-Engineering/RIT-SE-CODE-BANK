# CA-Portal Frontend Setup

## Setup Steps {#setup-steps}

1. Navigate to the `/ui/` folder.
2. Run the following command to install the node packages: `npm install`

The next steps create a `.env` file in your `/ui/` directory. Please read carefully to ensure that this is setup correctly.
> :warning: **Warning:** Please note that if you already have a `.env` file in the `/ui/` directory, it **needs** to be deleted before proceeding to the next steps.

To navigate to the correct setup steps, for **Windows** please see the [Windows Steps](#windows-windows-steps). For **MacOS/Linux**, please see the [MacOS/Linux Steps](#macoslinux-unix-steps).

### Windows {#windows-steps}
3. Open up a terminal (or reuse the current one) and run `./config_frontend.bat` to create the `.env` file.
> :memo: **Note:** If the file runs into an error (i.e. `mysql is not recognized`), try running this batch file in a powershell terminal.

Once the `.env` file has been created, please ensure that it contains the following information
```shell
NEXT_PUBLIC_BASE_API_URL="https://localhost:3300/api"
NEXT_PUBLIC_RESUME_API_URL="https://localhost:3300"
NEXT_PUBLIC_DATABASE_API_EXTENSION="/db"
NEXT_PUBLIC_SLACK_API_EXTENSION="/slack"
```
After confirming that the information matches, proceed to the [final steps](#running-the-ui-server-ui-final-steps).


### MacOS/Linux {#unix-steps}
3. Open up a terminal (or reuse the current one) and run `chmod +x config_frontend.sh` to give executable permissions to the shell script.
4. Run `./config_frontend.sh` (if that does not work, you might have to run it via `sh ./config_frontend.sh`) to create the `.env` file.

Once the `.env` file has been created, please ensure that it contains the following information
```shell
NEXT_PUBLIC_BASE_API_URL="https://localhost:3300/api"
NEXT_PUBLIC_RESUME_API_URL="https://localhost:3300"
NEXT_PUBLIC_DATABASE_API_EXTENSION="/db"
NEXT_PUBLIC_SLACK_API_EXTENSION="/slack"
```
After confirming that the information matches, proceed to the [final steps](#running-the-ui-server-ui-final-steps).

### Running the UI server {#ui-final-steps}
5. Now that the `.env` file has been created, you can now run `npm run dev` in the `/ui/` directory to run the developer frontend server.
> :memo: **Note:** If you do **NOT** have the backend server running, you will only be able to interact with the landing page. You will see an Next.js error in the bottom left for `failed to fetch`, as well as seeing it in red text below the user select. To run the backend server, please see the `backend_setup.md` in the `/server/doc/` directory.