#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const portalServerDir = path.join(root, "apps", "scoop-portal", "server");
const portalUIDir = path.join(root, "apps", "scoop-portal", "ui");
const workflowServerDir = path.join(root, "apps", "workflow", "server");

// Command to run from root
function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

// Command to run from a specific directory
function runInDir(cmd, dir) {
  run(cmd, { cwd: dir });
}

// Install dependencies
console.log("Installing dependencies...");
runInDir("npm install", portalServerDir);
runInDir("npm install", portalUIDir);
runInDir("npm install", workflowServerDir);

// Create environment files
const envFilePortalServer = path.join(portalServerDir, ".env");
const envFilePortalUI = path.join(portalUIDir, ".env");
const envFilePortalUIDev = path.join(portalUIDir, ".env.development");
const envFileWorkflowServer = path.join(workflowServerDir, ".env");

if (!fs.existsSync(envFilePortalServer)) {
  console.log("Creating scoop portal server .env file...");
  const defaultEnv = `DATABASE_URL="mysql://root:password@127.0.0.1:3306/scoop_portal_demo"
WORKFLOWS_URL="mysql://root:password@127.0.0.1:3307/scoop_portal_demo"
PORT=5000
`;
  fs.writeFileSync(envFilePortalServer, defaultEnv);
}

if (!fs.existsSync(envFilePortalUI)) {
  console.log("Creating scoop portal ui .env file...");
  const defaultEnv = `PORT=3000
API_PORT=5000
`;
  fs.writeFileSync(envFilePortalUI, defaultEnv);
}

if (!fs.existsSync(envFilePortalUIDev)) {
  console.log("Creating scoop portal ui .env.development file...");
  const defaultEnv = `NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WORKFLOWS_API_URL=http://localhost:5001
`;
  fs.writeFileSync(envFilePortalUIDev, defaultEnv);
}

if (!fs.existsSync(envFileWorkflowServer)) {
  console.log("Creating workflow server .env file...");
  const defaultEnv = `DATABASE_URL=mysql://root:password@localhost:3307/workflows
PORT=5001
BASE_URL=http://localhost:3000
NODE_ENV=development
`;
  fs.writeFileSync(envFileWorkflowServer, defaultEnv);
}

// Start databases
console.log("Starting MariaDB containers...");
run("docker compose up -d");

// Run Prisma migrations & seeds for both DBs
console.log("Applying schema & seeding workflows DB...");
runInDir(`npx prisma migrate dev --name init`, workflowServerDir);

console.log("Applying schema & seeding scoop portal DB...");
runInDir(`npx prisma migrate dev --name init`, portalServerDir);
runInDir(`npx prisma db seed`, portalServerDir);

// End
console.log("\nPortal setup complete! Run `startportal` to launch.");