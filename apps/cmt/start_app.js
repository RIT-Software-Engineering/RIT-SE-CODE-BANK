const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Console colors to make output easier to read
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to run shell commands and wait for them to finish
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(" ")}`, colors.blue);

    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      cwd: process.cwd(),
      ...options,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

// Check if we already have Prisma installed to avoid duplicate installs
function checkPrismaInstalled() {
  const packageJsonPath = path.join(process.cwd(), "package.json");

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const hasPrisma = deps.prisma;
      const hasPrismaClient = deps["@prisma/client"];
      const hasMysql2 = deps.mysql2;

      if (hasPrisma && hasPrismaClient && hasMysql2) {
        log("Prisma dependencies already installed!", colors.green);
        return true;
      }
    } catch (error) {
      log("Could not read package.json", colors.yellow);
    }
  }

  log("Prisma dependencies not found", colors.yellow);
  return false;
}

// Check if Workflows server dependencies are installed
function checkWorkflowsDepsInstalled() {
  const workflowsPath = path.join(process.cwd(), "..", "..", "workflow", "server");
  const packageJsonPath = path.join(workflowsPath, "package.json");

  if (!fs.existsSync(workflowsPath)) {
    log("Workflows server directory not found", colors.yellow);
    return false;
  }

  if (!fs.existsSync(packageJsonPath)) {
    log("Workflows server package.json not found", colors.yellow);
    return false;
  }

  const nodeModulesPath = path.join(workflowsPath, "node_modules");
  if (fs.existsSync(nodeModulesPath)) {
    log("Workflows server dependencies already installed!", colors.green);
    return true;
  }

  log("Workflows server dependencies not found", colors.yellow);
  return false;
}

async function main() {
  try {
    log("=".repeat(60), colors.cyan);
    log("🚀 Starting RIT-SE-CODE-BANK Development Environment", colors.cyan);
    log("=".repeat(60), colors.cyan);

    // Only install Prisma if it's not already there
    log("\n📦 Checking Prisma installation...", colors.blue);
    const prismaInstalled = checkPrismaInstalled();

    if (!prismaInstalled) {
      log("Installing Prisma 5 dependencies...", colors.blue);
      await runCommand("npm", [
        "install",
        "prisma@^5.0.0",
        "@prisma/client@^5.0.0",
        "mysql2",
        "--save-dev",
        "--legacy-peer-deps",
      ]);
    } else {
      log("✅ Skipping Prisma installation (already installed)", colors.green);
    }

    // Set up the database schema
    log("\n🗄️  Running Prisma setup...", colors.blue);
    await runCommand("npx", ["prisma", "generate"]);
    await runCommand("npx", ["prisma", "db", "push", "--skip-generate"]);

    // Install dependencies for backend (CMT Backend)
    const backendPath = path.join(process.cwd(), "src", "backend");
    if (fs.existsSync(backendPath)) {
      log("\n📦 Installing CMT backend dependencies...", colors.blue);
      await runCommand("npm", ["install", "--legacy-peer-deps"], {
        cwd: backendPath,
      });
    }

    // Install dependencies for Workflows server
    const workflowsPath = path.join(process.cwd(), "..", "..", "workflow", "server");
    if (fs.existsSync(workflowsPath)) {
      const workflowsDepsInstalled = checkWorkflowsDepsInstalled();
      
      if (!workflowsDepsInstalled) {
        log("\n📦 Installing Workflows server dependencies...", colors.blue);
        await runCommand("npm", ["install", "--legacy-peer-deps"], {
          cwd: workflowsPath,
        });
      } else {
        log("✅ Skipping Workflows server installation (already installed)", colors.green);
      }

      // Generate Prisma client for workflows server
      log("\n🗄️  Running Prisma setup for Workflows server...", colors.blue);
      await runCommand("npx", ["prisma", "generate"], {
        cwd: workflowsPath,
      });
      
      // Push database schema for workflows server (creates DB if doesn't exist)
      log("🗄️  Creating/updating Workflows database...", colors.blue);
      await runCommand("npx", ["prisma", "db", "push", "--skip-generate"], {
        cwd: workflowsPath,
      });
      
    } else {
      log("\n⚠️  Workflows server not found at ../../workflow/server", colors.yellow);
      log("   Workflows features will not be available", colors.yellow);
    }

    // Install frontend dependencies
    log("\n📦 Installing frontend dependencies...", colors.blue);
    await runCommand("npm", ["install", "--legacy-peer-deps"]);

    // Development mode: Start services in background
    log("\n" + "=".repeat(60), colors.cyan);
    log("🎯 Starting all services...", colors.cyan);
    log("=".repeat(60), colors.cyan);

    const pids = {
      timestamp: Date.now(),
    };

    // Start CMT Backend (port 5010)
    if (fs.existsSync(backendPath)) {
      log("\n🔧 Starting CMT Backend (port 5010)...", colors.magenta);
      const backendProcess = spawn("npm", ["start"], {
        cwd: backendPath,
        stdio: "inherit",
        shell: true,
        detached: true,
      });
      pids.backend = backendProcess.pid;

      // Give the backend time to start up
      await new Promise((resolve) => setTimeout(resolve, 3000));
      log("✅ CMT Backend started (PID: " + backendProcess.pid + ")", colors.green);
    }

    // Start Workflows Server (port 5001)
    if (fs.existsSync(workflowsPath)) {
      log("\n⚙️  Starting Workflows Server (port 5001)...", colors.magenta);
      const workflowsProcess = spawn("npm", ["start"], {
        cwd: workflowsPath,
        stdio: "inherit",
        shell: true,
        detached: true,
      });
      pids.workflows = workflowsProcess.pid;

      // Give the workflows server time to start up
      await new Promise((resolve) => setTimeout(resolve, 3000));
      log("✅ Workflows Server started (PID: " + workflowsProcess.pid + ")", colors.green);
    } else {
      log("\n⚠️  Skipping Workflows Server (not found)", colors.yellow);
    }

    // Start Frontend (port 3000)
    log("\n🌐 Starting Frontend (port 3000)...", colors.magenta);
    const frontendProcess = spawn("npm", ["start"], {
      stdio: "inherit",
      shell: true,
      detached: true,
      env:{
        ...process.env,
        PORT: "3000",
      },
    });
    pids.frontend = frontendProcess.pid;

    await new Promise((resolve) => setTimeout(resolve, 2000));
    log("✅ Frontend started (PID: " + frontendProcess.pid + ")", colors.green);

    // Save the process IDs so we can stop later
    fs.writeFileSync(".dev-pids.json", JSON.stringify(pids, null, 2));
    
    log("\n" + "=".repeat(60), colors.cyan);
    log("✅ All servers started successfully!", colors.green);
    log("=".repeat(60), colors.cyan);
    
    log("\n📋 Service Information:", colors.blue);
    log("   • Frontend:        http://localhost:3000", colors.white);
    log("   • CMT Backend:     http://localhost:5010", colors.white);
    if (pids.workflows) {
      log("   • Workflows API:   http://localhost:5001", colors.white);
    }
    
    log("\n🔧 Process IDs saved to .dev-pids.json", colors.blue);
    if (pids.backend) log(`   • Backend PID:   ${pids.backend}`, colors.white);
    if (pids.workflows) log(`   • Workflows PID: ${pids.workflows}`, colors.white);
    if (pids.frontend) log(`   • Frontend PID:  ${pids.frontend}`, colors.white);
    
    log("\n💡 Useful Commands:", colors.yellow);
    log("   • Stop all servers:  node stop_app.js", colors.white);
    log("   • View logs:         tail -f .dev-pids.json", colors.white);
    
    log("\n✨ Your terminal is now free to use!", colors.green);
    log("=".repeat(60), colors.cyan);

    // Exit this script but leave the servers running
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  } catch (error) {
    log("\n" + "=".repeat(60), colors.red);
    log(`❌ Error: ${error.message}`, colors.red);
    log("=".repeat(60), colors.red);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  log("\n⚠️  Process interrupted", colors.yellow);
  process.exit(0);
});

main();