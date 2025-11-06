// start_app.js (root)
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BACKEND_ENTRY = path.join(ROOT, 'src', 'backend', 'server.js');
const SCHEMA = path.join(ROOT, 'prisma', 'schema.prisma');

function run(name, cmd, args, opts = {}) {
  const child = spawn(cmd, args, {
    cwd: ROOT,
    env: process.env,
    shell: process.platform === 'win32', // windows-friendly
    ...opts,
  });

  const logFile = path.join(ROOT, `${name}.log`);
  const out = fs.createWriteStream(logFile, { flags: 'a' });
  child.stdout.pipe(out);
  child.stderr.pipe(out);

  child.stdout.on('data', d => process.stdout.write(`[${name}] ${d}`));
  child.stderr.on('data', d => process.stderr.write(`[${name}] ${d}`));
  child.on('exit', c => console.log(`[${name}] exited with code ${c}`));

  return child;
}

async function runOnce(name, cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      cwd: ROOT,
      env: process.env,
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });
    p.on('exit', code => (code === 0 ? resolve() : reject(new Error(`${name} failed (${code})`))));
    p.on('error', reject);
  });
}

(async function main() {
  console.log('Running in development mode');

  // 1) Prisma (root only). No backend installs.
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  await runOnce('prisma generate', npx, ['--yes', 'prisma@6.16.3', 'generate', '--schema', SCHEMA]);
  await runOnce('prisma db push', npx, ['--yes', 'prisma@6.16.3', 'db', 'push', '--schema', SCHEMA]);

  // 2) Start backend (from ROOT, not src/backend)
  const backend = run('backend', process.execPath, [BACKEND_ENTRY], {
    env: { ...process.env, NODE_ENV: 'development', PORT: '5000' },
    detached: true,
  });

  // 3) Start frontend (CRA at root)
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const frontend = run('frontend', npmCmd, ['run', 'start'], { detached: true });

  // 4) Save PIDs
  const pids = { backend: backend.pid, frontend: frontend.pid, startedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(ROOT, '.dev-pids.json'), JSON.stringify(pids, null, 2));
  console.log('Process IDs saved to .dev-pids.json');
  console.log('Both servers started in background!');
  console.log(`Backend PID: ${backend.pid}, Frontend PID: ${frontend.pid}`);
  console.log('To stop: node stop_app.js');
  setTimeout(() => process.exit(0), 500); // free your terminal
})();
