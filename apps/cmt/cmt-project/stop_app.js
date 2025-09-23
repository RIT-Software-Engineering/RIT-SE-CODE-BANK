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

async function main() {
  try {
    log("Stopping development servers using saved process IDs...", colors.blue);

    // Use the saved process IDs (most reliable method)
    const pids = loadSavedPids();

    if (pids) {
      // Kill the exact processes we started
      await killProcessById(pids.backend, "backend");
      await killProcessById(pids.frontend, "frontend");

      // Clean up the file so it doesn't confuse us later
      fs.unlinkSync(".dev-pids.json");
      log("Cleaned up process ID file", colors.blue);

      // Give processes a moment to actually terminate
      await new Promise((resolve) => setTimeout(resolve, 1000));

      log("Development servers stopped!", colors.green);
    } else {
      log("Cannot stop servers - no saved process IDs found", colors.red);
      log(
        "Servers may have been started manually or already stopped",
        colors.yellow
      );
      process.exit(1);
    }
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();
