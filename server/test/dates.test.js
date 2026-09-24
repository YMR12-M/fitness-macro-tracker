import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addDays, ageFromBirthDate, dateRange, todayISO } from '../src/utils/dates.js';

describe('addDays', () => {
  it('moves forward and backward', () => {
    assert.equal(addDays('2026-09-12', 1), '2026-09-13');
    assert.equal(addDays('2026-09-12', -1), '2026-09-11');
  });

  it('crosses month and year boundaries', () => {
    assert.equal(addDays('2026-01-31', 1), '2026-02-01');
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  });

  it('handles a leap day', () => {
    assert.equal(addDays('2028-02-28', 1), '2028-02-29');
    assert.equal(addDays('2028-02-29', 1), '2028-03-01');
  });
});

describe('dateRange', () => {
  it('is inclusive of both ends', () => {
    assert.deepEqual(dateRange('2026-09-10', '2026-09-12'), ['2026-09-10', '2026-09-11', '2026-09-12']);
  });

  it('returns a single day when start equals end', () => {
    assert.deepEqual(dateRange('2026-09-12', '2026-09-12'), ['2026-09-12']);
  });
});

describe('todayISO', () => {
  it('returns a YYYY-MM-DD string', () => {
    assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/);
  });

  it('falls back gracefully on an unknown timezone', () => {
    assert.match(todayISO('Not/AZone'), /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('ageFromBirthDate', () => {
  it('counts a birthday that has passed', () => {
    assert.equal(ageFromBirthDate('1998-01-01', '2026-09-12'), 28);
  });

  it('does not count a birthday still to come', () => {
    assert.equal(ageFromBirthDate('1998-12-01', '2026-09-12'), 27);
  });

  it('counts the birthday itself', () => {
    assert.equal(ageFromBirthDate('1998-09-12', '2026-09-12'), 28);
  });

  it('returns null without a birth date', () => {
    assert.equal(ageFromBirthDate(null), null);
  });
});
