import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { basalMetabolicRate, calculateEnergy, estimateTargets } from '../src/modules/summary/tdee.js';

describe('basalMetabolicRate (Mifflin-St Jeor)', () => {
  it('computes the male equation', () => {
    // 10(80) + 6.25(180) - 5(30) + 5 = 800 + 1125 - 150 + 5
    assert.equal(basalMetabolicRate({ sex: 'male', weightKg: 80, heightCm: 180, age: 30 }), 1780);
  });

  it('computes the female equation', () => {
    // 10(65) + 6.25(165) - 5(30) - 161 = 650 + 1031.25 - 150 - 161
    assert.equal(basalMetabolicRate({ sex: 'female', weightKg: 65, heightCm: 165, age: 30 }), 1370.25);
  });

  it('returns null when a measurement is missing', () => {
    assert.equal(basalMetabolicRate({ sex: 'male', weightKg: 80, heightCm: 180, age: null }), null);
    assert.equal(basalMetabolicRate({ sex: 'male', heightCm: 180, age: 30 }), null);
  });
});

describe('calculateEnergy', () => {
  const subject = { sex: 'male', weightKg: 82.5, heightCm: 178, age: 28, activityLevel: 'moderate' };

  it('applies the activity multiplier and the goal adjustment', () => {
    const result = calculateEnergy({ ...subject, goalType: 'cut' });
    assert.equal(result.bmr, 1803); // 1802.5 rounded
    assert.equal(result.tdee, 2794); // 1802.5 × 1.55
    assert.equal(result.target_calories, 2294); // −500 for a cut
  });

  it('leaves maintenance at TDEE', () => {
    const result = calculateEnergy({ ...subject, goalType: 'maintain' });
    assert.equal(result.target_calories, result.tdee);
  });

  it('adds a surplus when bulking', () => {
    const maintain = calculateEnergy({ ...subject, goalType: 'maintain' });
    const bulk = calculateEnergy({ ...subject, goalType: 'bulk' });
    assert.equal(bulk.target_calories - maintain.target_calories, 300);
  });

  it('sets protein higher in a deficit than at maintenance', () => {
    const cut = calculateEnergy({ ...subject, goalType: 'cut' });
    const maintain = calculateEnergy({ ...subject, goalType: 'maintain' });
    assert.ok(cut.macros.protein_g > maintain.macros.protein_g);
    assert.equal(cut.macros.protein_g, Math.round(82.5 * 2.2));
  });

  it("keeps the macro split's calories consistent with the target", () => {
    const { target_calories: target, macros } = calculateEnergy({ ...subject, goalType: 'cut' });
    const fromMacros = macros.protein_g * 4 + macros.carbs_g * 4 + macros.fat_g * 9;
    // Rounding each macro to whole grams moves the total by a few kcal at most.
    assert.ok(Math.abs(fromMacros - target) < 10, `macros gave ${fromMacros} kcal vs target ${target}`);
  });

  it('never prescribes a starvation-level target', () => {
    const tiny = calculateEnergy({ sex: 'female', weightKg: 40, heightCm: 150, age: 70, activityLevel: 'sedentary', goalType: 'cut' });
    assert.ok(tiny.target_calories >= 1200);
  });

  it('derives age from a birth date when age is not given', () => {
    const result = calculateEnergy({ ...subject, age: undefined, birthDate: '1998-01-01' });
    assert.ok(result.age > 20);
  });

  it('returns null when body stats are missing', () => {
    assert.equal(calculateEnergy({ sex: 'male', activityLevel: 'moderate' }), null);
  });
});

describe('estimateTargets', () => {
  it('falls back to general guidance without body stats', () => {
    assert.deepEqual(estimateTargets({}), { calories: 2000, protein_g: 150, carbs_g: 220, fat_g: 65 });
  });

  it('uses the real calculation when stats are present', () => {
    const targets = estimateTargets({ sex: 'male', weightKg: 82.5, heightCm: 178, age: 28, goalType: 'cut' });
    assert.equal(targets.calories, 2294);
    assert.equal(targets.protein_g, 182);
  });
});
