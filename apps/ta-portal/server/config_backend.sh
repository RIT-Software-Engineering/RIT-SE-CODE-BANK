#!/bin/bash

# --- TA-Portal Configuration (MODIFY THESE IF NEEDED) ---
export DB_ROOT_PASSWORD="newPassword"
export DB_HOST="localhost"
export DB_PORT="8000"
export DB_NAME_TAPORTAL="ta_portal"
export DB_APP_USER="app_user"
export DB_APP_PASSWORD="app_password"

export APP_BACKEND_URL="https://localhost:3300"
export APP_FRONTEND_URL="http://localhost:3000"
export WORKFLOWS_URL="http://localhost:3001"
export APP_NODE_ENV="DEV"
export APP_SERVER_PORT="3300"

export SLACK_CLIENT_ID="8356401273568.9110035154276"
export SLACK_CLIENT_SECRET="03750f2fb26d6cc604010e4d306dafdc"
export SLACK_REDIRECT_URI="https://localhost:3300/api/slack/oauth_redirect"

ENV_FILE=".env"
# --- End Configuration ---

echo "--- (Step 1/3) Starting MariaDB Database Setup ---"
echo ""
#  This script creates the ta_portal database and the dedicated app user using the env variables set above while in the command prompt session
if ! node ./server/database/setup_db.js; then
    echo ""
    echo "ERROR: The Node.js database setup script failed."
    exit 1
fi

echo "Database and user setup completed successfully."
echo ""
echo "--- (Step 2/3) Configure Database User for Application ---"

DATABASE_URL_TAPORTAL=""
while true; do
    echo "Which database user should the application use for its connection string?"
    echo "  1) Root User (Less Secure, for diagnostics)"
    echo "  2) App User (Recommended, more secure)"
    read -p "Enter choice [1-2]: " user_choice
    echo ""

    case $user_choice in
        1)
            echo "Configuring application to use the 'root' user."
            DATABASE_URL_TAPORTAL="mysql://root:${DB_ROOT_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME_TAPORTAL}"
            break
            ;;
        2)
            echo "Configuring application to use the dedicated 'app_user'."
            DATABASE_URL_TAPORTAL="mysql://${DB_APP_USER}:${DB_APP_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME_TAPORTAL}"
            break
            ;;
        *)
            echo "Invalid choice. Please enter 1 or 2."
            echo ""
            ;;
    esac
done
echo ""

echo "--- (Step 3/3) Creating TA-Portal .env file ---"

if [ -f "$ENV_FILE" ]; then
    echo "WARNING: Found existing $ENV_FILE. Deleting it."
    rm "$ENV_FILE"
fi
touch "$ENV_FILE"

# Function to append a variable to the .env file
append_env_var() {
    local var_name="$1"
    local var_value="$2"
    echo "Setting $var_name..."
    echo "${var_name}=\"$var_value\"" >> "$ENV_FILE"
}

# --- Populate TA Portal .env file ---
append_env_var "DATABASE_URL" "$DATABASE_URL_TAPORTAL"
append_env_var "DB_ROOT_PASSWORD" "$DB_ROOT_PASSWORD"
append_env_var "BACKEND_URL" "$APP_BACKEND_URL"
append_env_var "FRONTEND_URL" "$APP_FRONTEND_URL"
append_env_var "WORKFLOWS_URL" "$WORKFLOWS_URL"
append_env_var "NODE_ENV" "$APP_NODE_ENV"
append_env_var "PORT" "$APP_SERVER_PORT"
append_env_var "SLACK_CLIENT_ID" "$SLACK_CLIENT_ID"
append_env_var "SLACK_CLIENT_SECRET" "$SLACK_CLIENT_SECRET"
append_env_var "SLACK_REDIRECT_URI" "$SLACK_REDIRECT_URI"

echo ""
echo "--- TA-Portal Setup Complete ---"
echo ""
echo "--- Final $ENV_FILE Contents ---"
echo "----------------------------------------------"
cat "$ENV_FILE"
echo "----------------------------------------------"