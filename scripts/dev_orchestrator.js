/**
 * Local developer orchestrator with Docker-aware fallback.
 * Postgres is default; SQLite fallback is used when Docker is unavailable.
 */
import { spawn } from 'child_process';

const appsOnly = process.argv.includes('--apps-only');
const procs = [];

function run(name, cmd, args, env = process.env) {
  const p = spawn(cmd, args, { stdio: 'inherit', env });
  procs.push(p);
  p.on('error', (err) => console.error(`[orchestrator] ${name} unavailable: ${err.code || err.message}`));
  p.on('exit', (code) => { if (code && code !== 0) console.error(`[orchestrator] ${name} exited ${code}`); });
}

function sh(cmd, env = process.env) {
  return new Promise((resolve, reject) => {
    const p = spawn('bash', ['-lc', cmd], { stdio: 'inherit', env });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} failed`))));
  });
}

async function hasDocker() {
  try {
    await sh('command -v docker >/dev/null');
    await sh('docker ps >/dev/null');
    return true;
  } catch {
    return false;
  }
}

const env = { ...process.env };

if (!appsOnly) {
  const dockerReady = await hasDocker();
  if (dockerReady) {
    env.DB_MODE = 'postgres';
    await sh('docker compose -f docker/docker-compose.yml up -d postgres', env);
  } else {
    console.log('Docker unavailable in dev mode. Using SQLite fallback.');
    env.DB_MODE = 'sqlite';
    env.SQLITE_PATH = 'data/dev.sqlite';
  }
  await sh('npm run db:migrate', env);
  await sh('npm run db:seed', env);

  run('server', 'npm', ['run', 'dev:server'], env);
  run('jobs', 'npm', ['run', 'dev', '-w', 'jobs'], env);
}
run('customer', 'npm', ['run', 'dev', '-w', 'apps/customer-web', '--', '--port', '5173'], env);
run('portal-store', 'npm', ['run', 'dev', '-w', 'apps/portal-store', '--', '--port', '5174'], env);
run('portal-mall', 'npm', ['run', 'dev', '-w', 'apps/portal-mall', '--', '--port', '5175'], env);
run('platform-admin', 'npm', ['run', 'dev', '-w', 'apps/platform-admin', '--', '--port', '5176'], env);

process.on('SIGINT', () => { procs.forEach((p) => p.kill('SIGINT')); process.exit(0); });
