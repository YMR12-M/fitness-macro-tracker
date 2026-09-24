import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isRealDate, isoDate, pastIsoDate } from '../src/utils/date-schema.js';

describe('isRealDate', () => {
  it('accepts real dates', () => {
    for (const value of ['2026-09-12', '2024-02-29', '2026-01-01', '2026-12-31']) {
      assert.equal(isRealDate(value), true, `${value} should be valid`);
    }
  });

  it('rejects days that do not exist', () => {
    // These all match /^\d{4}-\d{2}-\d{2}$/ — the shape was never the problem.
    for (const value of ['2026-02-31', '2026-02-30', '2026-04-31', '2026-13-01', '2026-00-10', '2026-01-00']) {
      assert.equal(isRealDate(value), false, `${value} should be rejected`);
    }
  });

  it('rejects a non-leap year 29 February', () => {
    assert.equal(isRealDate('2026-02-29'), false);
    assert.equal(isRealDate('2024-02-29'), true);
    // 2100 is divisible by 100 but not 400, so it is not a leap year.
    assert.equal(isRealDate('2100-02-29'), false);
    assert.equal(isRealDate('2000-02-29'), true);
  });

  it('rejects malformed input', () => {
    for (const value of ['not-a-date', '2026-9-12', '26-09-12', '2026/09/12', '', '2026-09-12T00:00:00Z']) {
      assert.equal(isRealDate(value), false, `${value} should be rejected`);
    }
  });
});

describe('isoDate schema', () => {
  it('passes a real date through', () => {
    assert.equal(isoDate.parse('2026-09-12'), '2026-09-12');
  });

  it('rejects an impossible date with a usable message', () => {
    const result = isoDate.safeParse('2026-02-31');
    assert.equal(result.success, false);
    assert.match(result.error.issues[0].message, /real date/i);
  });

  it('allows a future date — deadlines and range filters need it', () => {
    assert.equal(isoDate.safeParse('2099-01-01').success, true);
  });
});

describe('pastIsoDate schema', () => {
  it('accepts today and the past', () => {
    const today = new Date().toISOString().slice(0, 10);
    assert.equal(pastIsoDate.safeParse(today).success, true);
    assert.equal(pastIsoDate.safeParse('2020-01-01').success, true);
  });

  it('rejects a date far in the future', () => {
    const result = pastIsoDate.safeParse('2099-01-01');
    assert.equal(result.success, false);
    assert.match(result.error.issues[0].message, /future/i);
  });

  it('tolerates one day ahead, for clients in timezones ahead of the server', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    assert.equal(pastIsoDate.safeParse(tomorrow).success, true);
  });

  it('still rejects an impossible date', () => {
    assert.equal(pastIsoDate.safeParse('2020-02-31').success, false);
  });
});
