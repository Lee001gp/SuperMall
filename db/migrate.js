/** Runs schema migration for Postgres default and SQLite fallback mode. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const mode = process.env.DB_MODE || 'postgres';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (mode === 'sqlite') {
  const sqlitePath = process.env.SQLITE_PATH || (process.env.NODE_ENV === 'test' ? 'data/test.sqlite' : 'data/dev.sqlite');
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const db = new DatabaseSync(sqlitePath);
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sqlite.sql'), 'utf-8');
  db.exec(sql);
  db.close();
  console.log(`SQLite migration complete: ${sqlitePath}`);
} else {
  const pg = await import('pg');
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  const client = new pg.default.Client({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/supermall' });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log('Postgres migration complete');
}
