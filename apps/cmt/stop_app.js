const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Console colors
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function killProcessTree(pid, serviceName) {
  if (!pid) {
    log(`⚠️  No PID found for ${serviceName}`, colors.yellow);
    return false;
  }

  try {
    log(`🛑 Stopping ${serviceName} (PID: ${pid})...`, colors.blue);

    if (process.platform === 'win32') {
      // Windows: Kill entire process tree including console window
      try {
        execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
        log(`✅ ${serviceName} stopped (including terminal window)`, colors.green);
        return true;
      } catch (error) {
        // Process might already be dead
        log(`⚠️  ${serviceName} (PID: ${pid}) is not running`, colors.yellow);
        return false;
      }
    } else {
      // Unix/Linux/Mac: Kill process group
      try {
        process.kill(-pid, 'SIGTERM');
        
        // Wait a bit for graceful shutdown
        setTimeout(() => {
          try {
            process.kill(-pid, 'SIGKILL');
          } catch (e) {
            // Already dead
          }
        }, 2000);
        
        log(`✅ ${serviceName} stopped`, colors.green);
        return true;
      } catch (error) {
        log(`⚠️  ${serviceName} (PID: ${pid}) is not running`, colors.yellow);
        return false;
      }
    }
  } catch (error) {
    log(`❌ Error stopping ${serviceName}: ${error.message}`, colors.red);
    return false;
  }
}

async function main() {
  log("\n" + "=".repeat(60), colors.cyan);
  log("🛑 Stopping RIT-SE-CODE-BANK Development Servers", colors.cyan);
  log("=".repeat(60), colors.cyan);

  const pidsFilePath = path.join(process.cwd(), ".dev-pids.json");

  // Check if PIDs file exists
  if (!fs.existsSync(pidsFilePath)) {
    log("\n❌ No .dev-pids.json file found", colors.red);
    log("   Servers may not be running or were started manually", colors.yellow);
    log("\n💡 To manually stop all node processes:", colors.blue);
    if (process.platform === 'win32') {
      log("   taskkill /F /IM node.exe", colors.white);
    } else {
      log("   killall node", colors.white);
    }
    process.exit(1);
  }

  // Read PIDs
  let pids;
  try {
    pids = JSON.parse(fs.readFileSync(pidsFilePath, "utf8"));
  } catch (error) {
    log(`\n❌ Error reading .dev-pids.json: ${error.message}`, colors.red);
    process.exit(1);
  }

  log("\n📋 Found process IDs:", colors.blue);
  if (pids.backend) log(`   • CMT Backend:   ${pids.backend}`, colors.white);
  if (pids.workflows) log(`   • Workflows API: ${pids.workflows}`, colors.white);
  if (pids.frontend) log(`   • Frontend:      ${pids.frontend}`, colors.white);

  // Stop all servers
  log("\n🛑 Stopping services and closing terminal windows...\n", colors.blue);

  let stopped = 0;
  let total = 0;

  if (pids.backend) {
    total++;
    if (killProcessTree(pids.backend, "CMT Backend")) stopped++;
  }

  if (pids.workflows) {
    total++;
    if (killProcessTree(pids.workflows, "Workflows API")) stopped++;
  }

  if (pids.frontend) {
    total++;
    if (killProcessTree(pids.frontend, "Frontend")) stopped++;
  }

  // Wait for processes to terminate
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Delete the PIDs file
  try {
    fs.unlinkSync(pidsFilePath);
    log("\n🗑️  Removed .dev-pids.json", colors.blue);
  } catch (error) {
    log(`\n⚠️  Could not remove .dev-pids.json: ${error.message}`, colors.yellow);
  }

  log("\n" + "=".repeat(60), colors.cyan);
  if (stopped === total) {
    log(`✅ All servers stopped successfully! (${stopped}/${total})`, colors.green);
    log(`✅ Terminal windows closed`, colors.green);
  } else {
    log(`⚠️  Stopped ${stopped}/${total} servers`, colors.yellow);
    log("   Some processes may still be running", colors.yellow);
  }
  log("=".repeat(60), colors.cyan);

  log("\n💡 To restart servers, run: node start_app.js\n", colors.blue);
}

main();