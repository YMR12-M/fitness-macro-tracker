// GET /api/tdee?weight_kg=&height_cm=&age=&gender=&activity=&goal=
// Mifflin-St Jeor TDEE + macro targets. Not called by app.js (calcTDEE()
// computes this client-side), kept for API parity/completeness.
module.exports = (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const weightKg = Number(req.query.weight_kg);
  const heightCm = Number(req.query.height_cm);
  const age = Number(req.query.age);
  const gender = req.query.gender || 'male';
  const activity = req.query.activity || 'moderate';
  const goal = req.query.goal || 'maintain';

  const bmr = gender === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  const tdee = bmr * (multipliers[activity] ?? 1.55);

  const adjustments = { cut: -500, maintain: 0, bulk: 300 };
  const targetCalories = tdee + (adjustments[goal] ?? 0);

  return res.status(200).json({
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    target_calories: Math.round(targetCalories),
    macros: {
      protein_g: Math.round(weightKg * 2.2),
      fat_g: Math.round(targetCalories * 0.25 / 9),
      carbs_g: Math.round((targetCalories - weightKg * 2.2 * 4 - targetCalories * 0.25) / 4)
    }
  });
};
