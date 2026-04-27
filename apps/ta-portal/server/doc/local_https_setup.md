# TA-Portal https

While not necessary for most functionallity, https certification may be needed to test some features when running the app locally

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

### Step 1: Install the Local Certificate Authority (TA)

This is a one-time setup command for your computer. It creates your own personal TA and configures your system and browsers to trust it automatically.

1. Open a new Terminal or PowerShell window.
2. Run the following command:

```bash
mkcert -install
```

You may see a security prompt from your operating system asking for your password or permission to make changes. This is required to add the TA to your system's trust store. Approve it.

---

### Step 2: Generate Certificates for Your Project

Now, you can create the actual certificate files for your local server.

1. Navigate in your terminal to the directory where you want your certificate files to be saved (usually the root of your server project, e.g., `.../ta-portal/server/`).
2. Run the following command to generate certificates for `localhost`:

```bash
mkcert localhost 127.0.0.1 ::1
```

This will create two files in your current directory:

- `localhost+2.pem` (the certificate)
- `localhost+2-key.pem` (the private key) 

Remember to change the .env files so that frontend and backend URLs use https