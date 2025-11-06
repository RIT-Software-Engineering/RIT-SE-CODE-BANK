// stop_app.js
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
};
const log = (m, c = C.reset) => console.log(`${c}${m}${C.reset}`);

function isPid(v) {
  return Number.isInteger(v) && v > 0;
}

function killProcessById(pid, name) {
  return new Promise((resolve) => {
    if (!isPid(pid)) {
      log(`No valid PID for ${name}`, C.yellow);
      return resolve();
    }
    const isWin = process.platform === "win32";
    log(`Stopping ${name} (PID ${pid})...`, C.blue);

    if (isWin) {
      // Force + children on Windows
      exec(`taskkill /PID ${pid} /F /T`, (err) => {
        if (err) log(`Could not kill ${name} ${pid} (maybe already stopped)`, C.yellow);
        else log(`Stopped ${name} (PID ${pid})`, C.green);
        resolve();
      });
    } else {
      // Try SIGTERM, then SIGKILL if needed
      try {
        process.kill(pid, "SIGTERM");
      } catch (_) { /* ignore */ }
      setTimeout(() => {
        try {
          process.kill(pid, 0); // still alive?
          try { process.kill(pid, "SIGKILL"); } catch (_) {}
        } catch (_) { /* already dead */ }
        log(`Stopped ${name} (PID ${pid})`, C.green);
        resolve();
      }, 500);
    }
  });
}

function loadSavedPids() {
  const pidFile = path.join(process.cwd(), ".dev-pids.json");
  if (!fs.existsSync(pidFile)) {
    log("No .dev-pids.json found", C.yellow);
    return null;
  }
  try {
    const pids = JSON.parse(fs.readFileSync(pidFile, "utf8"));
    // normalize to integers
    pids.backend = Number(pids.backend);
    pids.frontend = Number(pids.frontend);
    log("Found saved PIDs:", C.blue);
    log(`  Backend PID: ${pids.backend}`, C.reset);
    log(`  Frontend PID: ${pids.frontend}`, C.reset);
    return pids;
  } catch {
    log("Could not read .dev-pids.json", C.red);
    return null;
  }
}

(async function main() {
  try {
    log("Stopping development servers...", C.blue);
    const pids = loadSavedPids();
    if (!pids) {
      log("Nothing to stop (maybe already stopped).", C.yellow);
      process.exit(0);
    }

    await killProcessById(pids.backend, "backend");
    await killProcessById(pids.frontend, "frontend");

    try {
      fs.unlinkSync(".dev-pids.json");
      log("Removed .dev-pids.json", C.blue);
    } catch { /* ignore */ }

    log("All done. ✅", C.green);
  } catch (e) {
    log(`Error: ${e.message}`, C.red);
    process.exit(1);
  }
})();

