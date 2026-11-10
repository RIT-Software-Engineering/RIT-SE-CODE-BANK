#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const portalServerDir = path.join(root, "apps", "scoop-portal", "server");
const portalUIDir = path.join(root, "apps", "scoop-portal", "ui");
const workflowServerDir = path.join(root, "apps", "workflow", "server");

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

try {
  console.log("Starting MariaDB containers...");
  run("docker compose up -d");

  console.log("Starting all servers concurrently...");

  const concurrentlyCmd = [
    `"cd ${workflowServerDir} && npm start dev"`,
    `"cd ${portalServerDir} && node server.js"`,
    `"cd ${portalUIDir} && npm run dev"`,
  ].join(" ");

  run(`npx concurrently ${concurrentlyCmd}`);

  console.log("\nAll services started. Visit your app in the browser at localhost:3000!");
} catch (err) {
  console.error("Failed to start some services:", err);
  process.exit(1);
}
