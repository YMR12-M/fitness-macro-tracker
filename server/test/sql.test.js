import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildUpdate, safeLimit } from '../src/utils/sql.js';

describe('buildUpdate', () => {
  it('builds a clause from whitelisted columns only', () => {
    const { clause, params } = buildUpdate({ name: 'Oats', calories: 300 }, ['name', 'calories', 'fat_g']);
    assert.equal(clause, '`name` = ?, `calories` = ?');
    assert.deepEqual(params, ['Oats', 300]);
  });

  it('ignores keys that are not whitelisted', () => {
    // The critical property: a crafted request key can never reach the SQL text.
    const { clause, params } = buildUpdate({ name: 'Oats', 'id = 1; DROP TABLE users; --': 'x' }, ['name']);
    assert.equal(clause, '`name` = ?');
    assert.deepEqual(params, ['Oats']);
  });

  it('reports an empty patch', () => {
    assert.equal(buildUpdate({}, ['name']).isEmpty, true);
    assert.equal(buildUpdate({ unknown: 1 }, ['name']).isEmpty, true);
  });

  it('keeps falsy values that were explicitly set', () => {
    const { params } = buildUpdate({ calories: 0 }, ['calories']);
    assert.deepEqual(params, [0]);
  });
});

describe('safeLimit', () => {
  it('accepts a valid bound', () => {
    assert.equal(safeLimit(25, 20, 200), 25);
  });

  it('caps at the maximum', () => {
    assert.equal(safeLimit(9999, 20, 200), 200);
  });

  it('falls back on junk input', () => {
    assert.equal(safeLimit('; DROP TABLE users', 20, 200), 20);
    assert.equal(safeLimit(undefined, 20, 200), 20);
    assert.equal(safeLimit(-5, 20, 200), 20);
  });

  it('always returns a number', () => {
    for (const input of [null, NaN, '10abc', {}, []]) {
      assert.equal(typeof safeLimit(input, 20, 200), 'number');
    }
  });
});
