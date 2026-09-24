// Energy-expenditure and macro maths, in one place so the calculator page, the
// signup flow and the daily summary can never disagree with each other.
//
// BMR:    Mifflin-St Jeor (1990) — the equation with the best validated
//         accuracy for non-obese and obese adults alike.
// Macros: protein scaled to body weight (1.6-2.2 g/kg is the range supported by
//         resistance-training literature), fat held at 25% of intake as an
//         endocrine floor, carbohydrate taking the remainder.
import { ageFromBirthDate } from '../../utils/dates.js';

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

export const GOAL_ADJUSTMENTS = {
  cut: -500,
  maintain: 0,
  bulk: 300
};

export const PROTEIN_G_PER_KG = {
  cut: 2.2, // highest, to protect lean mass in a deficit
  maintain: 1.8,
  bulk: 1.8
};

const FAT_FRACTION_OF_CALORIES = 0.25;
const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 };

const round = (n, dp = 0) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

export function basalMetabolicRate({ sex, weightKg, heightCm, age }) {
  if (!weightKg || !heightCm || age == null) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'female' ? base - 161 : base + 5;
}

/**
 * Full calculation. Returns null-safe defaults when body stats are missing, so
 * a user who has not filled in their profile still gets sane starting targets.
 */
export function calculateEnergy({
  sex = 'male',
  weightKg,
  heightCm,
  age,
  birthDate,
  activityLevel = 'moderate',
  goalType = 'maintain'
}) {
  const resolvedAge = age ?? ageFromBirthDate(birthDate);
  const bmr = basalMetabolicRate({ sex, weightKg, heightCm, age: resolvedAge });
  if (bmr == null) return null;

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? ACTIVITY_MULTIPLIERS.moderate;
  const tdee = bmr * multiplier;
  const targetCalories = Math.max(1200, tdee + (GOAL_ADJUSTMENTS[goalType] ?? 0));

  const proteinG = weightKg * (PROTEIN_G_PER_KG[goalType] ?? PROTEIN_G_PER_KG.maintain);
  const fatG = (targetCalories * FAT_FRACTION_OF_CALORIES) / KCAL_PER_G.fat;
  const carbsG = Math.max(
    0,
    (targetCalories - proteinG * KCAL_PER_G.protein - fatG * KCAL_PER_G.fat) / KCAL_PER_G.carbs
  );

  return {
    age: resolvedAge,
    bmr: round(bmr),
    tdee: round(tdee),
    activity_multiplier: multiplier,
    target_calories: round(targetCalories),
    macros: {
      protein_g: round(proteinG),
      carbs_g: round(carbsG),
      fat_g: round(fatG)
    },
    macro_split: {
      protein_pct: round((proteinG * KCAL_PER_G.protein * 100) / targetCalories),
      carbs_pct: round((carbsG * KCAL_PER_G.carbs * 100) / targetCalories),
      fat_pct: round((fatG * KCAL_PER_G.fat * 100) / targetCalories)
    }
  };
}

/** Starting targets for a new account — falls back to general guidance when body stats are absent. */
export function estimateTargets(input) {
  const energy = calculateEnergy(input);
  if (energy) {
    return {
      calories: energy.target_calories,
      protein_g: energy.macros.protein_g,
      carbs_g: energy.macros.carbs_g,
      fat_g: energy.macros.fat_g
    };
  }
  return { calories: 2000, protein_g: 150, carbs_g: 220, fat_g: 65 };
}
