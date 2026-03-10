#!/bin/bash

# --- Configuration Variables (MODIFY THESE) ---
BACKEND_URL="https://localhost:3300"
API_EXTENSION="/ta-portal-api"
DATABASE_API_EXTENSION="/db"
SLACK_API_EXTENSION="/slack"
ENV_FILE=".env"
# --- End Configuration ---


# --- Prompt user for environment selection ---
echo "Please select the node environment:"
options=("DEV" "PROD")
select opt in "${options[@]}"
do
    case $opt in
        "DEV")
            NODE_ENV="DEV"
            echo "Environment set to DEV."
            break
            ;;
        "PROD")
            NODE_ENV="PROD"
            echo "Environment set to PROD."
            break
            ;;
        *) echo "Invalid option $REPLY. Please enter 1 or 2.";;
    esac
done


echo "Deleting old $ENV_FILE..."
# --- Delete existing .env file ---
if [ -f "$ENV_FILE" ]; then
    echo "Existing $ENV_FILE found. Deleting it."
    rm "$ENV_FILE"
fi
# Create a new empty .env file to ensure it exists for appending
touch "$ENV_FILE"

echo "Configuring $ENV_FILE for frontend..."

# --- Configuration Function to update or add an environment variable ---
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

# call the function for each variable
update_env_var "NEXT_PUBLIC_BACKEND_URL" "$BACKEND_URL"
update_env_var "NEXT_PUBLIC_API_EXTENSION" "$API_EXTENSION"
update_env_var "NEXT_PUBLIC_DATABASE_API_EXTENSION" "$DATABASE_API_EXTENSION"
update_env_var "NEXT_PUBLIC_SLACK_API_EXTENSION" "$SLACK_API_EXTENSION"
update_env_var "NEXT_PUBLIC_NODE_ENV" "$NODE_ENV"


# --- Final Output ---
echo ""
echo "$ENV_FILE configured successfully. Current contents:"
echo "--------------------------------------------------------"
cat "$ENV_FILE"
echo "--------------------------------------------------------"