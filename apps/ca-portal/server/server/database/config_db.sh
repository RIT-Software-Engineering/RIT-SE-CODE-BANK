#!/bin/bash

# --- Configuration Variables (MODIFY THESE) ---
DB_ROOT_PASSWORD="XXXXXX"                          # !! IMPORTANT: Use the actual password you set in your docker run command !!
DB_NAME="ca_portal"                                # !! IMPORTANT: The name of the database you want to create
DB_HOST="127.0.0.1"                                # Host where MariaDB is running (usually localhost or 127.0.0.1 for Docker)
DB_PORT="3306"                                     # Port MariaDB is listening on (host port from -p flag, usually 3306)
ENV_FILE="../../.env"                              # !! IMPORTANT: Path to your .env file for Prisma
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

# --- Step 3: Configure Your .env File for Prisma ---

echo "Updating $ENV_FILE with DATABASE_URL..."

# Construct the DATABASE_URL string
DATABASE_URL="mysql://root:$DB_ROOT_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

# Check if .env file exists. If not, create it.
if [ ! -f "$ENV_FILE" ]; then
    echo "WARNING: $ENV_FILE not found. Creating it."
    touch "$ENV_FILE"
fi

# Use sed to update or add the DATABASE_URL.
# This approach first deletes any existing DATABASE_URL line, then appends the new one.
# This is more robust than a direct 'change' command for potentially inconsistent formats.

# Detect sed version
if sed --version 2>/dev/null | grep -q "GNU"; then
  # GNU sed (Linux)
  # 1. Delete any line starting with DATABASE_URL
  sed -i "/^DATABASE_URL=/d" "$ENV_FILE"
  # 2. Append the new DATABASE_URL
  echo "DATABASE_URL=\"$DATABASE_URL\"" >> "$ENV_FILE"
else
  # BSD sed (macOS)
  # 1. Delete any line starting with DATABASE_URL
  sed -i '' "/^DATABASE_URL=/d" "$ENV_FILE"
  # 2. Append the new DATABASE_URL
  echo "DATABASE_URL=\"$DATABASE_URL\"" >> "$ENV_FILE"
fi

# Verify the update (optional, but good for debugging)
if grep -q "^DATABASE_URL=\"$DATABASE_URL\"" "$ENV_FILE"; then
    echo "DATABASE_URL successfully set in $ENV_FILE:"
    grep "^DATABASE_URL=" "$ENV_FILE"
else
    echo "ERROR: Failed to set DATABASE_URL in $ENV_FILE. Please check the script and file permissions."
    exit 1
fi

echo "--- MariaDB Database Setup Complete ---"
