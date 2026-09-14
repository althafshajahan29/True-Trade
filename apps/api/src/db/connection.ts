import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { DatabaseSync as DatabaseSyncType } from 'node:sqlite';
import { config } from '../config';

// Loaded via createRequire (rather than a static `import`) because some
// bundlers/test runners (Vite/Vitest) don't yet recognize the experimental
// `node:sqlite` specifier and mis-resolve it as a bare package named "sqlite".
const nodeRequire = createRequire(__filename);
const { DatabaseSync } = nodeRequire('node:sqlite') as typeof import('node:sqlite');

let db: DatabaseSyncType | null = null;

/**
 * Lazily creates (or returns) the process-wide SQLite connection.
 * Using `node:sqlite` (built into Node 22+) avoids a native build step,
 * which keeps the API trivially installable in any environment.
 */
export function getDb(): DatabaseSyncType {
  if (db) return db;

  const dbPath = config.isTest ? ':memory:' : config.dbPath;
  if (!config.isTest) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);

  return db;
}

export function resetDbForTests(): void {
  db = null;
}
