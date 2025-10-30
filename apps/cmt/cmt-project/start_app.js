const { spawn, exec } = require("child_process");
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

// Wait for a service to be available on a specific port
function waitForService(port, serviceName, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkService = () => {
      exec(
        `curl -f http://localhost:${port} || nc -z localhost ${port}`,
        (error) => {
          if (!error) {
            log(`${serviceName} is ready on port ${port}`, colors.green);
            resolve();
          } else if (Date.now() - startTime > timeout) {
            reject(
              new Error(`${serviceName} failed to start within ${timeout}ms`)
            );
          } else {
            setTimeout(checkService, 1000);
          }
        }
      );
    };

    checkService();
  });
}

async function main() {
  try {
    const isCI =
      process.env.CI === "true" || process.env.NODE_ENV === "production";
    log(
      isCI ? "Running in CI/CD mode" : "Running in development mode",
      colors.yellow
    );

    // Only install Prisma if it's not already there
    log("Checking Prisma installation...", colors.blue);
    const prismaInstalled = checkPrismaInstalled();

    if (!prismaInstalled) {
      log("Installing Prisma dependencies...", colors.blue);
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
    await runCommand("npx", ["prisma", "generate"]);
    await runCommand("npx", ["prisma", "db", "push"]);

    // Install dependencies for both frontend and backend
    const backendPath = path.join(process.cwd(), "src", "backend");

    if (fs.existsSync(backendPath)) {
      log("Installing backend dependencies...", colors.blue);
      await runCommand("npm", ["install", "--legacy-peer-deps"], {
        cwd: backendPath,
      });
    }

    log("Installing frontend dependencies...", colors.blue);
    await runCommand("npm", ["install", "--legacy-peer-deps"]);

    if (isCI) {
      // CI/CD mode: Start services and keep them running
      log("Starting services for CI/CD...", colors.yellow);

      if (fs.existsSync(backendPath)) {
        log("Starting backend server...", colors.blue);
        const backendProcess = spawn("npm", ["start"], {
          cwd: backendPath,
          stdio: ["pipe", "pipe", "pipe"],
          shell: true,
          detached: false,
        });

        backendProcess.stdout.on("data", (data) => {
          process.stdout.write(`[BACKEND] ${data}`);
        });

        backendProcess.stderr.on("data", (data) => {
          process.stderr.write(`[BACKEND] ${data}`);
        });

        await waitForService(5000, "Backend", 60000);
      }

      log("Starting frontend server...", colors.blue);
      const frontendProcess = spawn("npm", ["start"], {
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
        detached: false,
        env: { ...process.env, BROWSER: "none" },
      });

      frontendProcess.stdout.on("data", (data) => {
        process.stdout.write(`[FRONTEND] ${data}`);
      });

      frontendProcess.stderr.on("data", (data) => {
        process.stderr.write(`[FRONTEND] ${data}`);
      });

      await waitForService(3000, "Frontend", 60000);

      log("All services are ready!", colors.green);
      log(
        "Services will continue running in foreground for CI/CD",
        colors.blue
      );

      // Keep the script alive - CI will manage the lifecycle
      process.on("SIGTERM", () => {
        log("Received SIGTERM, shutting down gracefully...", colors.yellow);
        process.exit(0);
      });

      process.on("SIGINT", () => {
        log("Received SIGINT, shutting down gracefully...", colors.yellow);
        process.exit(0);
      });

      await new Promise(() => {});
    } else {
      // Development mode
      log("Starting services for development...", colors.yellow);

      let backendPid = null;
      let frontendPid = null;

      if (fs.existsSync(backendPath)) {
        log("Starting backend in background...", colors.blue);
        const backendProcess = spawn("npm", ["start"], {
          cwd: backendPath,
          stdio: "inherit",
          shell: true,
          detached: true,
        });
        backendPid = backendProcess.pid;

        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      log("Starting frontend in background...", colors.blue);
      const frontendProcess = spawn("npm", ["start"], {
        stdio: "inherit",
        shell: true,
        detached: true,
      });
      frontendPid = frontendProcess.pid;

      // Save the process IDs so we can stop later
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

      setTimeout(() => {
        log("Setup complete! Script exiting...", colors.green);
        process.exit(0);
      }, 2000);
    }
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
