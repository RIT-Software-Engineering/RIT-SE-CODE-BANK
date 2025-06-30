#!/bin/bash

# --- Configuration Variables (MODIFY THESE) ---
BASE_API_URL="http://localhost:3300/api"
DATABASE_API_EXTENSION="/db"
SLACK_API_EXTENSION="/slack"
ENV_FILE=".env"
# --- End Configuration ---

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
update_env_var "NEXT_PUBLIC_BASE_API_URL" "$BASE_API_URL"
update_env_var "NEXT_PUBLIC_DATABASE_API_EXTENSION" "$DATABASE_API_EXTENSION"
update_env_var "NEXT_PUBLIC_SLACK_API_EXTENSION" "$SLACK_API_EXTENSION"


# --- Final Output ---
echo ""
echo "$ENV_FILE configured successfully. Current contents:"
echo "--------------------------------------------------------"
cat "$ENV_FILE"
echo "--------------------------------------------------------"