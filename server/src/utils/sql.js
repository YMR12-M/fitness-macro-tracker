// Helpers for building the small amount of dynamic SQL the app needs, without
// ever letting a caller-supplied string reach the query text.

/**
 * Build a `SET a = ?, b = ?` clause from a patch object, keeping only keys in
 * `allowed`. Column names come from that whitelist, never from user input.
 */
export function buildUpdate(patch, allowed) {
  const fields = allowed.filter((column) => patch[column] !== undefined);
  return {
    clause: fields.map((column) => `\`${column}\` = ?`).join(', '),
    params: fields.map((column) => patch[column]),
    isEmpty: fields.length === 0
  };
}

/**
 * MySQL prepared statements reject placeholders in LIMIT on some versions and
 * drivers, so the bound is coerced to a safe integer and inlined instead.
 */
export function safeLimit(value, fallback = 20, max = 200) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}
