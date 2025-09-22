const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// Console colors to make the output more readable
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Kill a specific process by its ID - this is the most reliable method
function killProcessById(pid, name) {
  return new Promise((resolve) => {
    if (!pid) {
      log(`No PID found for ${name}`, colors.yellow);
      resolve();
      return;
    }

    log(`Killing ${name} process (PID: ${pid})...`, colors.blue);

    const isWindows = process.platform === "win32";
    // /F = force kill, /T = kill child processes too
    const killCommand = isWindows
      ? `taskkill /PID ${pid} /F /T`
      : `kill -9 ${pid}`;

    exec(killCommand, (error, stdout, stderr) => {
      if (error) {
        log(
          `Could not kill ${name} process ${pid} (may already be stopped)`,
          colors.yellow
        );
      } else {
        log(`Successfully stopped ${name} (PID: ${pid})`, colors.green);
      }
      resolve();
    });
  });
}

// Read the process IDs that were saved when we started the servers
function loadSavedPids() {
  const pidFile = path.join(process.cwd(), ".dev-pids.json");

  if (!fs.existsSync(pidFile)) {
    log("No saved process IDs found (.dev-pids.json not found)", colors.yellow);
    return null;
  }

  try {
    const pids = JSON.parse(fs.readFileSync(pidFile, "utf8"));
    log("Found saved process IDs:", colors.blue);
    log(`  Backend PID: ${pids.backend}`, colors.reset);
    log(`  Frontend PID: ${pids.frontend}`, colors.reset);
    return pids;
  } catch (error) {
    log("Could not read saved process IDs", colors.red);
    return null;
  }
}

// Fallback method - find processes running on specific ports
function killProcessesByPort(port) {
  return new Promise((resolve) => {
    log(`Checking port ${port} as fallback...`, colors.blue);

    const isWindows = process.platform === "win32";

    if (isWindows) {
      // Find what's using this port
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error || !stdout) {
          log(`No processes found on port ${port}`, colors.yellow);
          resolve();
          return;
        }

        const lines = stdout.split("\n");
        const pids = new Set(); // Use Set to avoid duplicates

        // Extract process IDs from netstat output
        lines.forEach((line) => {
          const match = line.match(/\s+(\d+)$/);
          if (match) {
            pids.add(match[1]);
          }
        });

        if (pids.size > 0) {
          pids.forEach((pid) => {
            exec(`taskkill /PID ${pid} /F`, (killError) => {
              if (!killError) {
                log(`Killed process ${pid} on port ${port}`, colors.green);
              }
            });
          });
        }
        resolve();
      });
    } else {
      // Unix/Mac version using lsof
      exec(`lsof -ti:${port}`, (error, stdout) => {
        if (error || !stdout) {
          log(`No processes found on port ${port}`, colors.yellow);
          resolve();
          return;
        }

        const pids = stdout.trim().split("\n");
        pids.forEach((pid) => {
          if (pid) {
            exec(`kill -9 ${pid}`, (killError) => {
              if (!killError) {
                log(`Killed process ${pid} on port ${port}`, colors.green);
              }
            });
          }
        });
        resolve();
      });
    }
  });
}

async function main() {
  try {
    log("Stopping development servers using saved process IDs...", colors.blue);

    // Try to use the saved process IDs first (most reliable method)
    const pids = loadSavedPids();

    if (pids) {
      // Kill the exact processes we started
      await killProcessById(pids.backend, "backend");
      await killProcessById(pids.frontend, "frontend");

      // Clean up the file so it doesn't confuse us later
      fs.unlinkSync(".dev-pids.json");
      log("Cleaned up process ID file", colors.blue);
    } else {
      // If we can't find the PID file, fall back to port-based killing
      log("Falling back to port-based termination...", colors.yellow);
      await killProcessesByPort(3000); // React dev server
      await killProcessesByPort(5000); // Backend server
    }

    // Give processes a moment to actually terminate
    await new Promise((resolve) => setTimeout(resolve, 1000));

    log("Development servers stopped!", colors.green);
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();
