#!/bin/bash

# --- Configuration Variables (MODIFY THESE) ---
DB_ROOT_PASSWORD="newPassword"                     # !! IMPORTANT: Use the actual password you set in your docker run command !!
DB_NAME="ca_portal"                                # !! IMPORTANT: The name of the database you want to create
DB_HOST="127.0.0.1"                                # Host where MariaDB is running (usually localhost or 127.0.0.1 for Docker)
DB_PORT="8000"                                     # Port MariaDB is listening on (host port from -p flag)

# Application Environment Variables to add to .env
APP_BASE_URL="http://localhost:3300"               # Base URL for your application (Frontend to Backend)
APP_NODE_ENV="development"                         # Node.js environment (development, production, etc.)
APP_SERVER_PORT="3300"                             # Port your Node.js Express server will listen on

ENV_FILE=".env"                                    # Path to your .env file for Prisma
# --- End Configuration ---

echo "--- Starting MariaDB Database Setup ---"

# --- Step 2: Create Your Database ---

echo "Attempting to connect to MariaDB and create database '$DB_NAME'..."

# Create database using a non-interactive approach
# We pipe the SQL command directly to the mysql client
# -p$DB_ROOT_PASSWORD allows passing password directly (less secure for production, but common for dev scripts)
if mysql -h "$DB_HOST" -P "$DB_PORT" -u root -p"$DB_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"; then
    echo "Database '$DB_NAME' created or already exists."
else
    echo "ERROR: Failed to connect to MariaDB or create database '$DB_NAME'."
    echo "Please ensure your MariaDB Docker container is running and accessible,"
    echo "and that the DB_ROOT_PASSWORD in this script is correct."
    exit 1
fi

# --- Step 3: Configure Your .env File ---

echo "Updating $ENV_FILE with DATABASE_URL..."

# Construct the DATABASE_URL string
DATABASE_URL="mysql://root:$DB_ROOT_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

# Check if .env file exists. If not, create it.
if [ ! -f "$ENV_FILE" ]; then
    echo "WARNING: $ENV_FILE not found. Creating it."
    touch "$ENV_FILE"
fi

# Function to update or add an environment variable
# Arguments: $1 = variable name, $2 = variable value
update_env_var() {
    local var_name="$1"
    local var_value="$2"
    
    echo "Setting $var_name=\"$var_value\""

    # Use sed to update or add the variable.
    # This approach first deletes any existing line for the variable, then appends the new one.

    # Detect sed version
    if sed --version 2>/dev/null | grep -q "GNU"; then
        # GNU sed (Linux)
        sed -i "/^${var_name}=/d" "$ENV_FILE"
        echo "${var_name}=\"$var_value\"" >> "$ENV_FILE"
    else
        # BSD sed (macOS)
        sed -i '' "/^${var_name}=/d" "$ENV_FILE"
        echo "${var_name}=\"$var_value\"" >> "$ENV_FILE"
    fi

    # Verify the update
    if ! grep -q "^${var_name}=\"$var_value\"" "$ENV_FILE"; then
        echo "ERROR: Failed to set ${var_name} in $ENV_FILE."
        exit 1
    fi
}

# Call the function for each variable
update_env_var "DATABASE_URL" "$DATABASE_URL"
update_env_var "BASE_URL" "$APP_BASE_URL"
update_env_var "NODE_ENV" "$APP_NODE_ENV"
update_env_var "PORT" "$APP_SERVER_PORT" # Using APP_SERVER_PORT for clarity here

echo "--- All Environment Variables Setup Complete ---"

# Optional: Display the relevant part of the .env file
echo ""
echo "--- Current $ENV_FILE (relevant section) ---"
grep -E '^(DATABASE_URL|BASE_URL|NODE_ENV|PORT)=' "$ENV_FILE" || true
echo "----------------------------------------------"