import { asyncHandler } from '../../utils/async-handler.js';
import * as summaryService from './summary.service.js';
import * as weightService from '../weight/weight.service.js';
import * as workoutsService from '../workouts/workouts.service.js';
import * as goalsService from '../goals/goals.service.js';
import { calculateEnergy } from './tdee.js';

export const daily = asyncHandler(async (req, res) => {
  res.json(await summaryService.dailySummary(req.user, req.validatedQuery.date));
});

export const series = asyncHandler(async (req, res) => {
  res.json(await summaryService.dailySeries(req.user, req.validatedQuery.days));
});

export const streak = asyncHandler(async (req, res) => {
  res.json(await summaryService.loggingStreak(req.user));
});

export const adherence = asyncHandler(async (req, res) => {
  res.json(await summaryService.adherence(req.user, req.validatedQuery.days));
});

/**
 * Everything the dashboard renders, in one round trip. The page used to stitch
 * this together from four separate fixtures; now it is one query batch.
 */
export const dashboard = asyncHandler(async (req, res) => {
  const [today, week, streakStats, weightTrend, training, goals, session] = await Promise.all([
    summaryService.dailySummary(req.user),
    summaryService.dailySeries(req.user, 7),
    summaryService.loggingStreak(req.user),
    weightService.trend(req.user.id, 30, req.user.timezone),
    workoutsService.stats(req.user.id, 7, req.user.timezone),
    goalsService.listGoals(req.user.id, { include_completed: false }),
    workoutsService.todaysSession(req.user.id, req.user.timezone)
  ]);

  res.json({
    today,
    week,
    streak: streakStats,
    weight: weightTrend,
    training,
    goals: goals.slice(0, 4),
    session
  });
});

export const tdee = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  res.json(
    calculateEnergy({
      sex: q.sex,
      weightKg: q.weight_kg,
      heightCm: q.height_cm,
      age: q.age,
      activityLevel: q.activity_level,
      goalType: q.goal_type
    })
  );
});
