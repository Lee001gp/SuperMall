/**
 * Database abstraction with production Postgres default and SQLite fallback for standalone dev/e2e.
 */
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

const mode = process.env.DB_MODE || 'postgres';
const sqliteFile = process.env.SQLITE_PATH || (process.env.NODE_ENV === 'test' ? 'data/test.sqlite' : 'data/dev.sqlite');

function normalizeSqlForSqlite(text) {
  return text
    .replace(/\$\d+/g, '?')
    .replace(/::uuid/g, '')
    .replace(/::jsonb/g, '')
    .replace(/now\(\)/g, "datetime('now')")
    .replace(/ILIKE/g, 'LIKE');
}

async function createDbClient({ mode: selectedMode }) {
  if (selectedMode === 'sqlite') {
    fs.mkdirSync(path.dirname(sqliteFile), { recursive: true });
    const db = new DatabaseSync(sqliteFile);
    db.exec('PRAGMA foreign_keys = ON;');
    const sqliteQuery = async (text, params = []) => {
      const sql = normalizeSqlForSqlite(text);
      const stmt = db.prepare(sql);
      const isRead = /^\s*select/i.test(sql);
      if (isRead) {
        const rows = stmt.all(...params);
        return { rows, rowCount: rows.length };
      }
      const info = stmt.run(...params);
      return { rows: [], rowCount: Number(info.changes || 0) };
    };

    return {
      async query(text, params = []) { return sqliteQuery(text, params); },
      async withTx(fn) {
        db.exec('BEGIN');
        try {
          const out = await fn({ query: sqliteQuery });
          db.exec('COMMIT');
          return out;
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
      },
      async close() { db.close(); }
    };
  }

  const pg = await import('pg');
  const pool = new pg.default.Pool({ connectionString: config.databaseUrl });
  return {
    async query(text, params = []) { return pool.query(text, params); },
    async withTx(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const out = await fn(client);
        await client.query('COMMIT');
        return out;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    async close() { await pool.end(); }
  };
}

const client = await createDbClient({ mode });

export async function query(text, params = []) { return client.query(text, params); }
export async function withTx(fn) { return client.withTx(fn); }
export async function closeDb() { return client.close(); }
