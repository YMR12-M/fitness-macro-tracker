// The dashboard. Every figure on this page comes from /api/summary/dashboard,
// which aggregates the user's own logged rows — there is no fixture data behind
// any of it, and an account with nothing logged correctly shows zeroes.
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { summary, water as waterApi } from '../../api/endpoints.js';
import { useAuth } from '../../auth/auth-context.js';
import { Card, EmptyState, ErrorBanner, Progress, Stat } from '../../components/Card.jsx';
import { CalorieRing } from '../../components/CalorieRing.jsx';
import { MacroBars } from '../../components/MacroBars.jsx';
import { CaloriesChart } from '../../components/charts/CaloriesChart.jsx';
import { MacroDonut } from '../../components/charts/MacroChart.jsx';
import { FullPageSpinner } from '../../components/Spinner.jsx';
import { useToast } from '../../components/toast-context.js';
import { useMutationWithRefresh } from '../../hooks/useMutationWithRefresh.js';
import { formatNumber, formatSigned, mealTypeIcon, mealTypeLabel } from '../../lib/format.js';

const WATER_STEPS = [250, 500];

export function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();

  const { data, isPending, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: summary.dashboard
  });

  const addWater = useMutationWithRefresh({
    mutationFn: (amount) => waterApi.add(amount),
    invalidate: [['dashboard'], ['water']],
    onSuccess: () => toast.success('Water logged')
  });

  if (isPending) return <FullPageSpinner label="Loading your day" />;
  if (error) {
    return (
      <div className="page">
        <ErrorBanner error={error} />
      </div>
    );
  }

  const { today, week, streak, weight, training, goals, session } = data;
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="page">
      {/* ── Top row: today's calories and macros ─────────────────────────── */}
      <div className="grid grid-dashboard">
        <Card title={`Good to see you, ${firstName}`} subtitle="Today's energy balance">
          <CalorieRing eaten={today.calories.eaten} goal={today.calories.goal} />

          <div className="grid grid-3" style={{ marginTop: 16 }}>
            <Stat label="Eaten" value={formatNumber(today.calories.eaten)} unit="kcal" />
            <Stat label="Burned" value={formatNumber(today.calories.burned)} unit="kcal" />
            <Stat
              label="Remaining"
              value={formatNumber(today.calories.remaining)}
              unit="kcal"
              delta={today.calories.remaining < 0 ? 'Over target' : null}
              deltaTone={today.calories.remaining < 0 ? 'down' : 'flat'}
            />
          </div>
        </Card>

        <Card title="Macros" subtitle={`Against your ${formatNumber(today.targets.calories)} kcal target`}>
          <MacroBars macros={today.macros} targets={today.targets} />
          <div style={{ marginTop: 18 }}>
            <MacroDonut {...today.macros} />
          </div>
        </Card>
      </div>

      {/* ── Quick stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-4">
        <Card>
          <Stat
            label="Logging streak"
            value={streak.current}
            unit={streak.current === 1 ? 'day' : 'days'}
            delta={streak.longest > streak.current ? `Best: ${streak.longest}` : 'Personal best'}
            deltaTone={streak.current > 0 ? 'up' : 'flat'}
          />
        </Card>

        <Card>
          <Stat
            label="Weight"
            value={weight.latest ? formatNumber(weight.latest.weight_kg, 1) : '—'}
            unit={weight.latest ? 'kg' : ''}
            delta={weight.change_kg !== null ? `${formatSigned(weight.change_kg, 1, ' kg')} in 30 days` : 'Not logged'}
            deltaTone={weight.change_kg > 0 ? 'up' : weight.change_kg < 0 ? 'down' : 'flat'}
          />
        </Card>

        <Card>
          <Stat
            label="Training (7 days)"
            value={training.sessions}
            unit={training.sessions === 1 ? 'session' : 'sessions'}
            delta={`${formatNumber(training.total_minutes)} min · ${formatNumber(training.total_volume_kg)} kg volume`}
            deltaTone="flat"
          />
        </Card>

        <Card>
          <Stat label="Water" value={formatNumber(today.water.amount_ml)} unit={`/ ${today.water.goal_ml} ml`} />
          <div style={{ marginTop: 10 }}>
            <Progress value={today.water.amount_ml} max={today.water.goal_ml} color="var(--blue)" />
          </div>
          <div className="segmented" style={{ marginTop: 10 }}>
            {WATER_STEPS.map((amount) => (
              <button
                key={amount}
                type="button"
                className="segmented-option"
                onClick={() => addWater.mutate(amount)}
                disabled={addWater.isPending}
              >
                +{amount} ml
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Week chart ───────────────────────────────────────────────────── */}
      <Card title="This week" subtitle={`${week.from} to ${week.to}`}>
        <CaloriesChart days={week.days} />
      </Card>

      {/* ── Today's meals and session ────────────────────────────────────── */}
      <div className="grid grid-2">
        <Card
          title="Today's meals"
          subtitle={`${today.meal_entries} ${today.meal_entries === 1 ? 'entry' : 'entries'}`}
          action={
            <Link to="/log" className="btn btn-ghost btn-sm">
              Add food
            </Link>
          }
        >
          {today.by_meal_type.length === 0 ? (
            <EmptyState icon="🍽️" title="Nothing logged yet">
              Search the food catalog and log your first meal of the day.
            </EmptyState>
          ) : (
            <div className="list">
              {today.by_meal_type.map((row) => (
                <div className="list-row" key={row.meal_type}>
                  <span className="list-row-emoji" aria-hidden="true">{mealTypeIcon(row.meal_type)}</span>
                  <div className="list-row-body">
                    <div className="list-row-title">{mealTypeLabel(row.meal_type)}</div>
                    <div className="list-row-meta">
                      {row.entries} {row.entries === 1 ? 'item' : 'items'} · {formatNumber(row.protein_g, 1)}P ·{' '}
                      {formatNumber(row.carbs_g, 1)}C · {formatNumber(row.fat_g, 1)}F
                    </div>
                  </div>
                  <span className="badge badge-green numeric">{formatNumber(row.calories)} kcal</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Today's session"
          subtitle={session.program ? session.program.name : 'No program selected'}
          action={
            <Link to="/workouts" className="btn btn-ghost btn-sm">
              Open training
            </Link>
          }
        >
          {!session.program ? (
            <EmptyState icon="🏋️" title="Pick a program">
              Choose a training program and the day's prescribed exercises appear here automatically.
            </EmptyState>
          ) : (
            <>
              <p className="card-subtitle" style={{ marginBottom: 10 }}>
                {session.day_label}
                {session.logged_today && <span className="badge badge-green" style={{ marginLeft: 8 }}>Logged today</span>}
              </p>
              <div className="list">
                {session.exercises.slice(0, 5).map((exercise) => (
                  <div className="list-row" key={exercise.id}>
                    <div className="list-row-body">
                      <div className="list-row-title">{exercise.name}</div>
                      <div className="list-row-meta">{exercise.muscle}</div>
                    </div>
                    <span className="badge">
                      {exercise.target_sets} × {exercise.target_reps}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── Goals ────────────────────────────────────────────────────────── */}
      <Card
        title="Active goals"
        action={
          <Link to="/goals" className="btn btn-ghost btn-sm">
            Manage
          </Link>
        }
      >
        {goals.length === 0 ? (
          <EmptyState icon="🎯" title="No active goals">
            Set a target — a weight, a lift, a distance — and track the distance to it here.
          </EmptyState>
        ) : (
          <div className="grid grid-2">
            {goals.map((goal) => (
              <div key={goal.id}>
                <div className="macro-head">
                  <span className="macro-name">
                    <span aria-hidden="true">{goal.icon}</span>
                    {goal.title}
                  </span>
                  <span className="macro-amount">
                    {formatNumber(goal.current_value, 1)} / {formatNumber(goal.target_value, 1)} {goal.unit}
                  </span>
                </div>
                <Progress value={goal.progress_percent} max={100} />
                <p className="list-row-meta" style={{ marginTop: 5 }}>
                  {goal.progress_percent}% ·{' '}
                  {goal.days_remaining === null
                    ? 'No deadline'
                    : goal.overdue
                      ? `${Math.abs(goal.days_remaining)} days overdue`
                      : `${goal.days_remaining} days left`}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
