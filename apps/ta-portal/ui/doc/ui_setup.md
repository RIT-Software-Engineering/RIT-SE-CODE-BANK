# CA-Portal Frontend Setup

# NOTE: THE TA_PORTAL NOW RUNS ENTIRLY WITHIN DOCKER CONTAINERS FOR EASIER DEPLOYMENT. THE SETUP METHOD DESCRIBED HERE NO LONGER FUNCTIONS CORRECLTY. SEE [ta-portal/deploy/README.md](../../deploy/README.md) FOR MORE INFORMATION.

## Setup Steps {#setup-steps}

1. Within the root of the repo(`RIT-SE-CODE-BANK\`), run the following command to install the node packages. If you had already done this as part of setting up the backend you do not need to run the command again.
```bash
npm install
```

2. Navigate to the UI directory:
```bash
cd apps/ta-portal/ui
```

2. Run the following command to copy the `example.env` file:
```bash
cp example.env .env
```

3. Now that the `.env` file has been created, you can now run `npm run dev` in the `/ui/` directory to run the developer frontend server.
```bash
npm run dev
```

> **Note:** If you do **NOT** have the backend server running, you will only be able to interact with the landing page. You will see an Next.js error in the bottom left for `failed to fetch`, as well as seeing it in red text below the user select. To run the backend server, please see the `backend_setup.md` in the `/server/doc/` directory.