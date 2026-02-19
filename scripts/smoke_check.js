/**
 * Cross-platform smoke check.
 * Uses Postgres via Docker when available, otherwise SQLite fallback.
 */
import { spawn } from 'child_process';

const env = { ...process.env };

const runCmd = (cmd, envObj = env) => new Promise((resolve, reject) => {
  const p = spawn(cmd, { stdio: 'inherit', env: envObj, shell: true });
  p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} failed ${code}`))));
});

async function hasDocker() {
  try {
    await runCmd('docker --version');
    await runCmd('docker ps');
    return true;
  } catch {
    return false;
  }
}

const dockerReady = await hasDocker();
if (dockerReady) {
  console.log('[smoke] Mode: postgres (docker)');
  env.DB_MODE = 'postgres';
  await runCmd('docker compose -f docker/docker-compose.yml up -d postgres', env);
} else {
  console.log('[smoke] Mode: sqlite fallback');
  env.DB_MODE = 'sqlite';
  env.SQLITE_PATH = 'data/test.sqlite';
}

await runCmd('npm run db:migrate', env);
await runCmd('npm run db:seed', env);

const server = spawn('PORT=4300 npm run dev -w server', { stdio: 'inherit', env, shell: true });
try {
  await runCmd('node scripts/wait_for_http.js http://localhost:4300/healthz 60000', env);
  await runCmd('node scripts/wait_for_http.js http://localhost:4300/readyz 60000', env);
  console.log('[smoke] OK /healthz and /readyz');
} finally {
  server.kill('SIGINT');
}
