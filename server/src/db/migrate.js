#!/usr/bin/env node
// Forward-only SQL migration runner.
//
//   npm run db:migrate          apply every pending migration
//   npm run db:migrate:status   show applied vs pending
//   npm run db:reset            drop every table and re-apply (destructive)
//
// Each file in migrations/ runs once, inside a transaction, and is recorded in
// schema_migrations with a checksum so an edited-after-the-fact migration is
// caught instead of silently diverging from what the database actually has.
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/env.js';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

const TRACKING_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name        VARCHAR(255) NOT NULL,
    checksum    CHAR(64)     NOT NULL,
    applied_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const checksum = (text) => createHash('sha256').update(text).digest('hex');

async function connect() {
  // multipleStatements lets one migration file hold several CREATE TABLEs.
  return mysql.createConnection({ ...dbConfig, multipleStatements: true, connectionLimit: undefined });
}

async function loadMigrations() {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  return Promise.all(
    files.map(async (name) => {
      const sql = await readFile(join(MIGRATIONS_DIR, name), 'utf8');
      return { name, sql, checksum: checksum(sql) };
    })
  );
}

async function appliedMigrations(conn) {
  const [rows] = await conn.query('SELECT name, checksum FROM schema_migrations ORDER BY name');
  return new Map(rows.map((r) => [r.name, r.checksum]));
}

async function up(conn) {
  await conn.query(TRACKING_TABLE);
  const migrations = await loadMigrations();
  const applied = await appliedMigrations(conn);

  const drifted = migrations.filter((m) => applied.has(m.name) && applied.get(m.name) !== m.checksum);
  if (drifted.length) {
    throw new Error(
      `These migrations changed after being applied: ${drifted.map((m) => m.name).join(', ')}.\n` +
        'Add a new migration instead of editing an applied one (or run db:reset in development).'
    );
  }

  const pending = migrations.filter((m) => !applied.has(m.name));
  if (!pending.length) {
    console.log(`Database is up to date (${applied.size} migration(s) applied).`);
    return;
  }

  for (const migration of pending) {
    process.stdout.write(`  applying ${migration.name} ... `);
    await conn.beginTransaction();
    try {
      await conn.query(migration.sql);
      await conn.query('INSERT INTO schema_migrations (name, checksum) VALUES (?, ?)', [
        migration.name,
        migration.checksum
      ]);
      await conn.commit();
      console.log('done');
    } catch (error) {
      await conn.rollback();
      console.log('FAILED');
      throw error;
    }
  }
  console.log(`Applied ${pending.length} migration(s).`);
}

async function status(conn) {
  await conn.query(TRACKING_TABLE);
  const migrations = await loadMigrations();
  const applied = await appliedMigrations(conn);
  for (const m of migrations) {
    const state = !applied.has(m.name)
      ? 'pending'
      : applied.get(m.name) === m.checksum
        ? 'applied'
        : 'MODIFIED AFTER APPLY';
    console.log(`  ${state.padEnd(20)} ${m.name}`);
  }
}

async function reset(conn) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to reset the database in production.');
  }
  const [rows] = await conn.query(
    'SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE()'
  );
  if (rows.length) {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const { name } of rows) await conn.query(`DROP TABLE IF EXISTS \`${name}\``);
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log(`Dropped ${rows.length} table(s).`);
  }
  await up(conn);
}

const commands = { up, status, reset };

async function main() {
  const command = process.argv[2] ?? 'up';
  const run = commands[command];
  if (!run) {
    console.error(`Unknown command "${command}". Use one of: ${Object.keys(commands).join(', ')}`);
    process.exit(1);
  }

  let conn;
  try {
    conn = await connect();
    await run(conn);
  } catch (error) {
    console.error(`\nMigration ${command} failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await conn?.end();
  }
}

main();
