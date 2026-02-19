/**
 * Cross-platform local developer orchestrator.
 * - Uses Postgres via Docker when available/forced.
 * - Falls back to SQLite when Docker is unavailable.
 */
import { spawn } from 'child_process';

const args = new Set(process.argv.slice(2));
const appsOnly = args.has('--apps-only');
const forceSqlite = args.has('--force-sqlite');
const forcePostgres = args.has('--force-postgres');
const procs = [];

function runSpawn(name, command, commandArgs = [], env = process.env, ignoreExit = false) {
  const p = spawn(command, commandArgs, { stdio: 'inherit', env, shell: true });
  procs.push(p);
  p.on('error', (err) => console.error(`[orchestrator] ${name} unavailable: ${err.message}`));
  p.on('exit', (code) => {
    if (!ignoreExit && code && code !== 0) console.error(`[orchestrator] ${name} exited ${code}`);
  });
  return p;
}

function runCmd(cmd, env = process.env) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, { stdio: 'inherit', env, shell: true });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} failed with ${code}`))));
  });
}

async function hasDocker() {
  try {
    await runCmd('docker --version');
    await runCmd('docker ps');
    return true;
  } catch {
    return false;
  }
}

const env = { ...process.env };

if (!appsOnly) {
  let usePostgres = false;
  if (forceSqlite) {
    usePostgres = false;
  } else if (forcePostgres) {
    usePostgres = true;
  } else {
    usePostgres = await hasDocker();
  }

  if (usePostgres) {
    console.log('[orchestrator] Mode: postgres (docker)');
    env.DB_MODE = 'postgres';
    await runCmd('docker compose -f docker/docker-compose.yml up -d postgres', env).catch((err) => {
      if (forcePostgres) throw err;
      console.log('[orchestrator] Docker start failed, switching to sqlite fallback.');
      env.DB_MODE = 'sqlite';
      env.SQLITE_PATH = 'data/dev.sqlite';
    });
  }

  if (env.DB_MODE !== 'postgres') {
    env.DB_MODE = 'sqlite';
    env.SQLITE_PATH = env.SQLITE_PATH || 'data/dev.sqlite';
    console.log('[orchestrator] Mode: sqlite fallback');
  }

  await runCmd('npm run db:migrate', env);
  await runCmd('npm run db:seed', env);

  runSpawn('server', 'npm run dev:server', [], env);
  runSpawn('jobs', 'npm run dev -w jobs', [], env);
}

runSpawn('customer', 'npm run dev -w apps/customer-web -- --port 5173', [], env);
runSpawn('portal-store', 'npm run dev -w apps/portal-store -- --port 5174', [], env);
runSpawn('portal-mall', 'npm run dev -w apps/portal-mall -- --port 5175', [], env);
runSpawn('platform-admin', 'npm run dev -w apps/platform-admin -- --port 5176', [], env);

process.on('SIGINT', () => {
  for (const p of procs) p.kill('SIGINT');
  process.exit(0);
});
