// Process entry point: verify the database is reachable and migrated, then
// listen. A server that boots while the schema is missing only fails later, in
// front of a user.
import { createApp } from './app.js';
import { env, isProduction } from './config/env.js';
import { closePool, healthCheck, query } from './db/pool.js';
import { pruneSessions } from './modules/auth/auth.service.js';

// Expired and long-revoked rows are dead weight; without this the sessions
// table only ever grows.
const SESSION_PRUNE_INTERVAL_MS = 6 * 60 * 60 * 1000;

async function assertDatabaseReady() {
  const reachable = await healthCheck().catch((error) => {
    throw new Error(`Cannot reach MySQL: ${error.message}`);
  });
  if (!reachable) throw new Error('MySQL health check failed');

  const tables = await query(
    "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'"
  );
  if (!tables.length) {
    throw new Error('Schema is missing. Run: npm run db:migrate');
  }
}

function startSessionPruning() {
  const prune = () =>
    pruneSessions()
      .then((removed) => {
        if (removed) console.log(`Pruned ${removed} expired session(s).`);
      })
      .catch((error) => console.error(`Session pruning failed: ${error.message}`));

  prune();
  // unref so a pending timer never holds the process open during shutdown.
  return setInterval(prune, SESSION_PRUNE_INTERVAL_MS).unref();
}

async function main() {
  try {
    await assertDatabaseReady();
  } catch (error) {
    console.error(`Startup failed: ${error.message}`);
    process.exit(1);
  }

  const server = createApp().listen(env.PORT, () => {
    console.log(`FitTrack API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  startSessionPruning();

  let shuttingDown = false;
  const shutdown = async (signal, exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n${signal} received, shutting down.`);

    // Stop accepting connections, let in-flight requests finish, then release
    // the pool so MySQL does not keep the sockets open.
    server.close(async () => {
      await closePool().catch(() => {});
      process.exit(exitCode);
    });
    // Don't let a hung connection hold the process open forever.
    setTimeout(() => process.exit(exitCode || 1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Without these a rejected promise outside a request handler takes the
  // process down with no log line explaining why.
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
    if (isProduction) shutdown('unhandledRejection', 1);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    // The process is in an undefined state after this; exiting lets the
    // supervisor restart it cleanly rather than serving from broken memory.
    shutdown('uncaughtException', 1);
  });
}

main();
