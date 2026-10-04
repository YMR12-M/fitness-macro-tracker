// The dashboard. Every figure on this page comes from /api/summary/dashboard,
// which aggregates the user's own logged rows — there is no fixture data behind
// any of it, and an account with nothing logged correctly shows zeroes.
//
// The page is laid out in the order the questions get asked: what can I still
// eat (the hero), how are my plates loaded (macros and water), how is the week
// going (the scoreboard), then the detail underneath.
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { summary, water as waterApi } from '../../api/endpoints.js';
import { useAuth } from '../../auth/auth-context.js';
import { Card, EmptyState, ErrorBanner, Progress, Stat } from '../../components/Card.jsx';
import { Dial } from '../../components/Dial.jsx';
import { Icon } from '../../components/Icon.jsx';
import { PlateCell } from '../../components/Plates.jsx';
import { Tally } from '../../components/Tally.jsx';
import { CaloriesChart } from '../../components/charts/CaloriesChart.jsx';
import { FullPageSpinner } from '../../components/Spinner.jsx';
import { useToast } from '../../components/toast-context.js';
import { useCountUp } from '../../hooks/useCountUp.js';
import { useMutationWithRefresh } from '../../hooks/useMutationWithRefresh.js';
import {
  formatNumber,
  formatShortDate,
  formatSigned,
  greeting,
  mealTypeIcon,
  mealTypeLabel
} from '../../lib/format.js';

const WATER_STEPS = [250, 500];
// One plate of water is one glass.
const GLASS_ML = 250;

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

  // Called before the early returns below, as hooks must be; counts from zero
  // the first time the data lands, then re-targets as meals are logged.
  const heroNumber = useCountUp(data ? Math.abs(data.today.calories.remaining) : 0);

  if (isPending) return <FullPageSpinner label="Loading your day" />;
  if (error) {
    return (
      <div className="page">
        <ErrorBanner error={error} />
      </div>
    );
  }

  const { today, week, streak, weight, training, goals, session } = data;
  const firstName = user?.name?.split(' ')[0];
  const remaining = today.calories.remaining;
  const over = remaining < 0;
  const glasses = Math.max(1, Math.round(today.water.goal_ml / GLASS_ML));

  return (
    <div className="page">
      {/* ── Hero: what can I still eat? ──────────────────────────────────── */}
      <section className={`hero${over ? ' is-over' : ''}`} aria-label="Today's calories">
        <div>
          <p className="hero-eyebrow">{greeting(firstName)}</p>
          <p className="hero-number numeric">{formatNumber(Math.round(heroNumber))}</p>
          <p className="hero-label">{over ? 'kcal over target' : 'kcal left today'}</p>
          {over && (
            <div className="hero-over" aria-hidden="true">
              <div className="hazard" />
            </div>
          )}

          <dl className="ledger">
            <div>
              <dt>Eaten</dt>
              <dd>{formatNumber(today.calories.eaten)}</dd>
            </div>
            <div>
              <dt>Burned</dt>
              <dd>{formatNumber(today.calories.burned)}</dd>
            </div>
            <div>
              <dt>Goal</dt>
              <dd>{formatNumber(today.calories.goal)}</dd>
            </div>
          </dl>
        </div>

        <Dial eaten={today.calories.eaten} goal={today.calories.goal} macros={today.macros} />
      </section>

      {/* ── The day's plates: protein, carbs, fat, water ─────────────────── */}
      <Card title="Today's plates" subtitle={`Against your ${formatNumber(today.targets.calories)} kcal target`}>
        <div className="quad">
          <PlateCell kind="protein" eaten={today.macros.protein_g} target={today.targets.protein_g} />
          <PlateCell kind="carbs" eaten={today.macros.carbs_g} target={today.targets.carbs_g} />
          <PlateCell kind="fat" eaten={today.macros.fat_g} target={today.targets.fat_g} />
          <PlateCell
            kind="water"
            eaten={today.water.amount_ml}
            target={today.water.goal_ml}
            unit="ml"
            plates={glasses}
          >
            <div className="chips">
              {WATER_STEPS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className="chip"
                  onClick={() => addWater.mutate(amount)}
                  disabled={addWater.isPending}
                >
                  <Icon name="plus" size={14} strokeWidth={2.5} />
                  {amount} ml
                </button>
              ))}
            </div>
          </PlateCell>
        </div>
      </Card>

      {/* ── Scoreboard ───────────────────────────────────────────────────── */}
      <section className="scoreboard" aria-label="At a glance">
        <div className="scoreboard-cell">
          <Stat
            label="Logging streak"
            value={streak.current}
            unit={streak.current === 1 ? 'day' : 'days'}
            delta={streak.longest > streak.current ? `Best: ${streak.longest}` : 'Personal best'}
            deltaTone={streak.current > 0 ? 'up' : 'flat'}
          />
          <Tally count={streak.current} />
        </div>

        <div className="scoreboard-cell">
          <Stat
            label="Weight"
            value={weight.latest ? formatNumber(weight.latest.weight_kg, 1) : '—'}
            unit={weight.latest ? 'kg' : ''}
            delta={weight.change_kg !== null ? `${formatSigned(weight.change_kg, 1, ' kg')} in 30 days` : 'Not logged'}
            deltaTone={weight.change_kg > 0 ? 'up' : weight.change_kg < 0 ? 'down' : 'flat'}
          />
        </div>

        <div className="scoreboard-cell">
          <Stat
            label="Training (7 days)"
            value={training.sessions}
            unit={training.sessions === 1 ? 'session' : 'sessions'}
            delta={`${formatNumber(training.total_minutes)} min · ${formatNumber(training.total_volume_kg)} kg volume`}
            deltaTone="flat"
          />
        </div>

        <div className="scoreboard-cell">
          <Stat
            label="Burned (7 days)"
            value={formatNumber(training.total_calories)}
            unit="kcal"
            delta={`${formatNumber(training.total_volume_kg)} kg lifted`}
            deltaTone="flat"
          />
        </div>
      </section>

      {/* ── Week and meals ───────────────────────────────────────────────── */}
      <div className="grid grid-week">
        <Card title="This week" subtitle={`${formatShortDate(week.from)} – ${formatShortDate(week.to)}`}>
          <CaloriesChart days={week.days} />
        </Card>

        <Card
          title="Today's meals"
          subtitle={`${today.meal_entries} ${today.meal_entries === 1 ? 'entry' : 'entries'}`}
          action={
            <Link to="/log" className="btn btn-ghost btn-sm">
              <Icon name="plus" size={16} strokeWidth={2.5} />
              Add food
            </Link>
          }
        >
          {today.by_meal_type.length === 0 ? (
            <EmptyState icon="plate" title="Nothing on the plate yet">
              Search the food catalog and log your first meal of the day.
            </EmptyState>
          ) : (
            <div className="list">
              {today.by_meal_type.map((row) => (
                <div className="list-row" key={row.meal_type}>
                  <span className="sticker" aria-hidden="true">
                    <Icon name={mealTypeIcon(row.meal_type)} size={20} />
                  </span>
                  <div className="list-row-body">
                    <div className="list-row-title">{mealTypeLabel(row.meal_type)}</div>
                    <div className="list-row-meta">
                      {row.entries} {row.entries === 1 ? 'item' : 'items'} · {formatNumber(row.protein_g, 1)}P ·{' '}
                      {formatNumber(row.carbs_g, 1)}C · {formatNumber(row.fat_g, 1)}F
                    </div>
                  </div>
                  <span className="row-figure">
                    <b>{formatNumber(row.calories)}</b>
                    <small>kcal</small>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Session and goals ────────────────────────────────────────────── */}
      <div className="grid grid-2">
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
            <EmptyState icon="train" title="Pick a program">
              Choose a training program and the day&rsquo;s prescribed exercises appear here automatically.
            </EmptyState>
          ) : (
            <>
              <p className="card-subtitle" style={{ marginBottom: 12 }}>
                {session.day_label}
                {session.logged_today && <span className="badge badge-solid" style={{ marginLeft: 8 }}>Logged today</span>}
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

        <Card
          title="Active goals"
          action={
            <Link to="/goals" className="btn btn-ghost btn-sm">
              Manage
            </Link>
          }
        >
          {goals.length === 0 ? (
            <EmptyState icon="goals" title="No active goals">
              Set a target — a weight, a lift, a distance — and track the distance to it here.
            </EmptyState>
          ) : (
            <div className="list">
              {goals.map((goal) => (
                <div key={goal.id} className="goal-row">
                  <div className="goal-row-head">
                    <span className="sticker" aria-hidden="true">{goal.icon}</span>
                    <div className="list-row-body">
                      <div className="list-row-title">{goal.title}</div>
                      <div className="list-row-meta">
                        {formatNumber(goal.current_value, 1)} / {formatNumber(goal.target_value, 1)} {goal.unit} ·{' '}
                        {goal.days_remaining === null
                          ? 'No deadline'
                          : goal.overdue
                            ? `${Math.abs(goal.days_remaining)} days overdue`
                            : `${goal.days_remaining} days left`}
                      </div>
                    </div>
                    <span className="row-figure">
                      <b>{goal.progress_percent}</b>
                      <small>%</small>
                    </span>
                  </div>
                  <Progress value={goal.progress_percent} max={100} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
