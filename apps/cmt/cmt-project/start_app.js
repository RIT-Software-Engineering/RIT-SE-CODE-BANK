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
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to run shell commands and wait for them to finish
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(" ")}`, colors.blue);

    const child = spawn(command, args, {
      stdio: "inherit", // Show output in our terminal
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

      // Check for all three required packages
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

async function main() {
  try {
    log("Starting setup...", colors.yellow);

    // Only install Prisma if it's not already there
    log("Checking Prisma installation...", colors.blue);
    const prismaInstalled = checkPrismaInstalled();

    if (!prismaInstalled) {
      log("Installing Prisma dependencies...", colors.blue);
      // Using legacy-peer-deps to avoid version conflicts
      await runCommand("npm", [
        "install",
        "prisma",
        "@prisma/client",
        "mysql2",
        "--save-dev",
        "--legacy-peer-deps",
      ]);
    } else {
      log("Skipping Prisma installation (already installed)", colors.green);
    }

    // Set up the database schema
    log("Running Prisma setup...", colors.blue);

    // Try multiple ways to run Prisma commands - different systems handle paths differently
    const isWindows = process.platform === "win32";

    try {
      if (isWindows) {
        // Windows: try the .cmd version first
        await runCommand("node_modules\\.bin\\prisma.cmd", ["generate"]);
        await runCommand("node_modules\\.bin\\prisma.cmd", ["db", "push"]);
      } else {
        // Unix/Mac: use the regular version
        await runCommand("node_modules/.bin/prisma", ["generate"]);
        await runCommand("node_modules/.bin/prisma", ["db", "push"]);
      }
    } catch (error) {
      // Fallback: try using npx if direct path fails
      log("Direct path failed, trying npx fallback...", colors.yellow);
      try {
        await runCommand("npx", ["prisma", "generate"]);
        await runCommand("npx", ["prisma", "db", "push"]);
      } catch (npxError) {
        // Last resort: try running with node directly
        log("npx failed, trying node fallback...", colors.yellow);
        await runCommand("node", [
          "./node_modules/prisma/build/index.js",
          "generate",
        ]);
        await runCommand("node", [
          "./node_modules/prisma/build/index.js",
          "db",
          "push",
        ]);
      }
    }

    // Start backend server
    const backendPath = path.join(process.cwd(), "src", "backend");
    let backendPid = null;
    let frontendPid = null;

    if (fs.existsSync(backendPath)) {
      log("Installing backend dependencies...", colors.blue);
      await runCommand("npm", ["install", "--legacy-peer-deps"], {
        cwd: backendPath,
      });

      log("Starting backend in background...", colors.blue);
      const backendProcess = spawn("npm", ["start"], {
        cwd: backendPath,
        stdio: "inherit",
        shell: true,
        detached: true, // Run independently so we can close this terminal
      });
      backendPid = backendProcess.pid;

      // Give the backend time to start up
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Start frontend server
    log("Installing frontend dependencies...", colors.blue);
    await runCommand("npm", ["install", "--legacy-peer-deps"]);

    log("Starting frontend in background...", colors.blue);
    const frontendProcess = spawn("npm", ["start"], {
      stdio: "inherit",
      shell: true,
      detached: true, // Run independently
    });
    frontendPid = frontendProcess.pid;

    // Save the process IDs so we can stop them later
    const pids = {
      backend: backendPid,
      frontend: frontendPid,
      timestamp: Date.now(),
    };

    fs.writeFileSync(".dev-pids.json", JSON.stringify(pids, null, 2));
    log("Process IDs saved to .dev-pids.json", colors.blue);

    log("Both servers started in background!", colors.green);
    log(
      `Backend PID: ${backendPid}, Frontend PID: ${frontendPid}`,
      colors.yellow
    );
    log("Your terminal is now free to use.", colors.yellow);
    log("To stop servers, run: node stop_app.js", colors.blue);

    // Exit this script but leave the servers running
    setTimeout(() => {
      log("Setup complete! Script exiting...", colors.green);
      process.exit(0);
    }, 2000);
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  log("Process interrupted", colors.yellow);
  process.exit(0);
});

main();
