# CA-Portal Messaging Feature through Slack

## Prerequisites 
Same as the backend_setup.md file. However, for this feature, you will need to also install mkcert as well for local development.

## Installing mkcert Manually

First, go to the official releases page:  
[https://github.com/FiloSottile/mkcert/releases](https://github.com/FiloSottile/mkcert/releases)

Find the latest release and look for the file that matches your operating system and architecture. Here’s how to handle it for each major OS:

---

### On Windows

1. **Download**  
   Find the file ending in `-windows-amd64.exe`. Click to download it.

2. **Rename**  
   Rename the downloaded file from `mkcert-v1.4.4-windows-amd64.exe` to `mkcert.exe` for convenience.

3. **Move the File**  
   Create a simple folder, such as `C:\tools`, and move `mkcert.exe` into it.

4. **Add to PATH**  
   Add that folder to your system’s PATH environment variable:

   - Press the **Windows Key**, type `env`, and select **"Edit the system environment variables."**
   - Click **"Environment Variables..."**
   - Under **"System variables,"** select **Path** and click **"Edit..."**
   - Click **"New"** and type the path to your folder (e.g., `C:\tools`).
   - Click **OK** on all windows to save.

---

### On macOS

1. **Download**

- For Apple Silicon (M1/M2/M3): download the file ending in `-darwin-arm64`.
- For Intel Macs: download the file ending in `-darwin-amd64`.

2. **Make Executable**

Open **Terminal**, navigate to your Downloads folder, and run:

```bash
cd ~/Downloads
# Replace with the actual filename you downloaded
chmod +x mkcert-v1.4.4-darwin-arm64
```

3. **Move to PATH**

Move the file to `/usr/local/bin` and rename it:

```bash
# Replace with the actual filename
sudo mv mkcert-v1.4.4-darwin-arm64 /usr/local/bin/mkcert
```

You’ll be prompted for your password.

---

### On Linux

The steps are nearly identical to macOS.

1. **Download**

Find the appropriate file for your architecture (commonly `-linux-amd64`).

2. **Make Executable**

```bash
cd ~/Downloads
chmod +x mkcert-v1.4.4-linux-amd64
```

3. **Move to PATH**

```bash
sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert
```

You’ll be prompted for your password.

---

## Verify the Installation

After installation, **close and reopen your terminal**, then run:

```bash
mkcert -version
```

If it prints a version number, the installation was successful and you're ready to use `mkcert`.

--

## Configuring mkcert to generate the certificate files

### Step 1: Install the Local Certificate Authority (CA)

This is a one-time setup command for your computer. It creates your own personal CA and configures your system and browsers to trust it automatically.

1. Open a new Terminal or PowerShell window.
2. Run the following command:

```bash
mkcert -install
```

You may see a security prompt from your operating system asking for your password or permission to make changes. This is required to add the CA to your system's trust store. Approve it.

---

### Step 2: Generate Certificates for Your Project

Now, you can create the actual certificate files for your local server.

1. Navigate in your terminal to the directory where you want your certificate files to be saved (usually the root of your server project, e.g., `.../ca-portal/server/`).
2. Run the following command to generate certificates for `localhost`:

```bash
mkcert localhost 127.0.0.1 ::1
```

This will create two files in your current directory:

- `localhost+2.pem` (the certificate)
- `localhost+2-key.pem` (the private key) 


## Setup of Slack App
**Note:** Normally, if the slack app hasn't been made yet for this feature yet, then only one member of the team needs to look at the first four step here, then the rest of the team just needs to start at step 5 and below.

1. Create the App: Go to the Slack API website and click "Create New App". Choose "From scratch," name it (e.g., "CA Portal"), and select the workspace you want to install it on.

2. Add Permissions (Scopes): In the sidebar, navigate to OAuth & Permissions. Scroll down to the User Token Scopes section and add the following scopes:

    * users:read.email
    * chat:write
    * im:write
    * users:read

3. Set Up Redirect URI: While still on the OAuth & Permissions page, scroll down to the Redirect URLs section. Add the following URL exactly as written: `https://localhost:3300/api/slack/oauth_redirect`
 
4. Get Credentials: Navigate to the Basic Information page in the sidebar. Scroll down to the App Credentials section to find your Client ID and Client Secret. You will need these for the backend setup in the `config_backend.bat` or `config_backend.bat.sh` files. Make sure the other team members use the same Client ID and Client Secret so that they to can connect to your app that you just made here.

5. After that run one of these configuration scripts depending on the following local machine:
    * For Windows, it's `./config_backend.bat` and `./config_frontend.bat`. If it runs into an error (i.e. 'mysql' is not recognized), try navigating to a powershell terminal outside of vscode and run the script there.
    * For MacOS/Linux, it's `./config_backend.sh` and `./config_frontend.sh`. You may need to do set execute permissions for the script by running `chmod +x config_backend.sh` and/or `chmod +x config_frontend.sh` beforehand if it's your first time running the script. 