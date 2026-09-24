import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { daysRemaining, isReached, progressPercent } from '../src/modules/goals/goal-progress.js';

describe('progressPercent', () => {
  it('measures distance travelled toward a lower target', () => {
    // 82.5 → 77, currently 82.1: 0.4 of 5.5 covered
    assert.equal(progressPercent({ direction: 'decrease', start_value: 82.5, current_value: 82.1, target_value: 77 }), 7);
  });

  it('measures distance travelled toward a higher target', () => {
    // 80 → 100, currently 90: halfway
    assert.equal(progressPercent({ direction: 'increase', start_value: 80, current_value: 90, target_value: 100 }), 50);
  });

  it('reports 100 once the target is reached', () => {
    assert.equal(progressPercent({ direction: 'decrease', start_value: 82.5, current_value: 77, target_value: 77 }), 100);
    assert.equal(progressPercent({ direction: 'increase', start_value: 80, current_value: 105, target_value: 100 }), 100);
  });

  it('clamps at 0 when moving the wrong way', () => {
    assert.equal(progressPercent({ direction: 'decrease', start_value: 82.5, current_value: 85, target_value: 77 }), 0);
  });

  it('treats a goal already at its target as complete', () => {
    assert.equal(progressPercent({ direction: 'increase', start_value: 100, current_value: 100, target_value: 100 }), 100);
  });

  it('handles values crossing zero', () => {
    assert.equal(progressPercent({ direction: 'decrease', start_value: 10, current_value: 0, target_value: -10 }), 50);
  });
});

describe('isReached', () => {
  it('is true at or below the target when lower is better', () => {
    assert.equal(isReached({ direction: 'decrease', current_value: 77, target_value: 77 }), true);
    assert.equal(isReached({ direction: 'decrease', current_value: 76, target_value: 77 }), true);
    assert.equal(isReached({ direction: 'decrease', current_value: 78, target_value: 77 }), false);
  });

  it('is true at or above the target when higher is better', () => {
    assert.equal(isReached({ direction: 'increase', current_value: 100, target_value: 100 }), true);
    assert.equal(isReached({ direction: 'increase', current_value: 99, target_value: 100 }), false);
  });
});

describe('daysRemaining', () => {
  const now = Date.parse('2026-09-12T00:00:00Z');

  it('counts days to a future deadline', () => {
    assert.equal(daysRemaining('2026-09-22', now), 10);
  });

  it('goes negative once the deadline has passed', () => {
    assert.equal(daysRemaining('2026-09-02', now), -10);
  });

  it('returns null without a deadline', () => {
    assert.equal(daysRemaining(null, now), null);
  });
});
