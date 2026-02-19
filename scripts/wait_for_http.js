/** Polls an HTTP endpoint until it responds with 2xx or timeout. */
const [url, timeoutMs = '60000'] = process.argv.slice(2);
const timeout = Number(timeoutMs);
const started = Date.now();

async function waitLoop() {
  while (Date.now() - started < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`ready: ${url}`);
        process.exit(0);
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.error(`timeout waiting for ${url}`);
  process.exit(1);
}

waitLoop();
