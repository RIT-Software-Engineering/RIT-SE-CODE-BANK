#!/bin/bash

# --- Workflow Configuration ---
export DB_ROOT_PASSWORD="newPassword"
export DB_HOST="localhost"
export DB_PORT="8000"
export DB_NAME_WORKFLOWS="workflows"
export DB_APP_USER="app_user"
export DB_APP_PASSWORD="app_password"
export APP_SERVER_PORT="3001"
export NODE_ENV="development"

ENV_FILE=".env"
# --- End Configuration ---

echo "--- (Step 1/3) Starting MariaDB Database Setup ---"
echo ""
# This script creates the workflows database and the dedicated app user
if ! node ./setup_db.js; then
    echo ""
    echo "ERROR: The Node.js database setup script failed."
    exit 1
fi

echo "Database and user setup completed successfully."
echo ""
echo "--- (Step 2/3) Configure Database User for Application ---"

DATABASE_URL_WORKFLOWS=""
while true; do
    echo "Which database user should the application use for its connection string?"
    echo "  1) Root User (Less Secure, for diagnostics)"
    echo "  2) App User (Recommended, more secure)"
    read -p "Enter choice [1-2]: " user_choice
    echo ""

    case $user_choice in
        1)
            echo "Configuring application to use the 'root' user."
            DATABASE_URL_WORKFLOWS="mysql://root:${DB_ROOT_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME_WORKFLOWS}"
            break
            ;;
        2)
            echo "Configuring application to use the dedicated 'app_user'."
            DATABASE_URL_WORKFLOWS="mysql://${DB_APP_USER}:${DB_APP_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME_WORKFLOWS}"
            break
            ;;
        *)
            echo "Invalid choice. Please enter 1 or 2."
            echo ""
            ;;
    esac
done
echo ""

echo "--- (Step 3/3) Creating Workflow .env file ---"

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

# --- Populate Workflow .env file ---
append_env_var "DATABASE_URL" "$DATABASE_URL_WORKFLOWS"
append_env_var "PORT" "$APP_SERVER_PORT"
append_env_var "NODE_ENV" "$NODE_ENV"

echo ""
echo "--- Workflow Setup Complete ---"
echo ""
echo "--- Final $ENV_FILE Contents ---"
echo "----------------------------------------------"
cat "$ENV_FILE"
echo "----------------------------------------------"