// Single shared mysql2 pool. Every module queries through `query`/`withTransaction`
// so connection handling lives in exactly one place.
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/env.js';

let pool;

export function getPool() {
  if (!pool) pool = mysql.createPool(dbConfig);
  return pool;
}

/** Run a parameterised statement and return the rows. */
export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

/** Run a statement and return the first row, or null. */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

/** Run an INSERT/UPDATE/DELETE and return mysql's ResultSetHeader. */
export async function execute(sql, params = []) {
  const [result] = await getPool().execute(sql, params);
  return result;
}

/**
 * Run `fn` inside a transaction, committing on success and rolling back on any
 * throw. `fn` receives the dedicated connection — use conn.execute(...) inside.
 */
export async function withTransaction(fn) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function healthCheck() {
  const row = await queryOne('SELECT 1 AS ok');
  return row?.ok === 1;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
