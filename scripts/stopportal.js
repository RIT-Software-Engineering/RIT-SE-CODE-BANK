#!/usr/bin/env node
const { execSync } = require("child_process");

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

try {
  console.log("Stopping MariaDB containers...");
  run("docker compose down");

  console.log("Stopping all running node/npm processes for the portal apps on Windows...");

  // Kills node services
  // Currently only compatible with windows. Will need a different linux script or custom kill method for both services.
  try {
    run('taskkill /IM node.exe /F /T'); // CAUTION THIS WILL KILL ALL NODE SERVICES - TODO: Look into storing PIDs locally when starting apps for kill.
  } catch {}

  console.log("\nAll services stopped.");
} catch (err) {
  console.error("Failed to stop some services:", err);
  process.exit(1);
}
