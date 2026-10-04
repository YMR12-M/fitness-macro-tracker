// Today — the mobile dashboard. Every figure comes from /api/summary/dashboard,
// which aggregates the user's own logged rows: an account with nothing logged
// correctly shows zeroes rather than a demo day.
//
// The desktop version lays this out as a hero and a row of columns. On a phone
// there is only one column, so the order is the priority order: the number that
// answers "can I eat this?" first, then how the plates are loaded, then the
// glanceable week, then the detail.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { summary, water as waterApi } from '../../api/endpoints.js';
import { useAuth } from '../../auth/auth-context.js';
import { Screen } from '../../components/shell/Screen.jsx';
import { AccountButton } from '../../components/shell/AccountButton.jsx';
import { Card, EmptyState, ErrorBanner, Progress, Stat } from '../../components/ui/Card.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { SkeletonCards } from '../../components/ui/Skeleton.jsx';
import { Dial } from '../../components/data/Dial.jsx';
import { PlateCell } from '../../components/data/Plates.jsx';
import { Tally } from '../../components/data/Tally.jsx';
// Deferred: see components/charts/lazy.jsx for why this screen's chart loads
// separately from the rest of it.
import { LazyCaloriesChart } from '../../components/charts/lazy.jsx';
import { useToast } from '../../components/ui/toast-context.js';
import { useCountUp } from '../../hooks/useCountUp.js';
import { useMutationWithRefresh } from '../../hooks/useMutationWithRefresh.js';
import {
  formatBarDate,
  formatNumber,
  formatShortDate,
  formatSigned,
  greeting,
  mealTypeIcon,
  mealTypeLabel,
  todayISO
} from '../../lib/format.js';

const WATER_STEPS = [250, 500];
// One plate of water is one glass.
const GLASS_ML = 250;

export function TodayScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

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

  const refresh = () => queryClient.refetchQueries({ queryKey: ['dashboard'] });
  const firstName = user?.name?.split(' ')[0];

  const chrome = {
    title: 'Today',
    // The bar already says "Today"; the subtitle carries the date it stands for.
    subtitle: formatBarDate(todayISO()),
    trailing: <AccountButton name={user?.name} />,
    onRefresh: refresh
  };

  if (isPending) {
    return (
      <Screen {...chrome}>
        <SkeletonCards count={2} height={260} />
        <SkeletonCards count={2} height={110} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen {...chrome}>
        <ErrorBanner error={error} />
        <button type="button" className="btn btn-ghost btn-block" onClick={refresh}>
          Try again
        </button>
      </Screen>
    );
  }

  const { today, week, streak, weight, training, goals, session } = data;
  const remaining = today.calories.remaining;
  const over = remaining < 0;
  const glasses = Math.max(1, Math.round(today.water.goal_ml / GLASS_ML));

  return (
    <Screen {...chrome}>
      {/* ── Hero: what can I still eat? ─────────────────────────────────── */}
      <section className={`hero${over ? ' is-over' : ''}`} aria-label="Today's calories">
        <div className="hero-top">
          <div>
            <p className="hero-eyebrow">{greeting(firstName)}</p>
            <p className="hero-number numeric">{formatNumber(Math.round(heroNumber))}</p>
          </div>
          <div className="hero-dial">
            <Dial eaten={today.calories.eaten} goal={today.calories.goal} macros={today.macros} />
          </div>
        </div>

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
      </section>

      {/* ── The day's plates: protein, carbs, fat, water ────────────────── */}
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
                  <Icon name="plus" size={14} strokeWidth={2.6} />
                  {amount}
                </button>
              ))}
            </div>
          </PlateCell>
        </div>
      </Card>

      {/* ── Scoreboard ──────────────────────────────────────────────────── */}
      <section className="scoreboard" aria-label="At a glance">
        <div className="scoreboard-cell">
          <Stat
            label="Streak"
            value={streak.current}
            unit={streak.current === 1 ? 'day' : 'days'}
            delta={streak.longest > streak.current ? `Best: ${streak.longest}` : 'Personal best'}
            deltaTone={streak.current > 0 ? 'up' : 'flat'}
          />
          <Tally count={streak.current} max={20} />
        </div>
        <div className="scoreboard-cell">
          <Stat
            label="Weight"
            value={weight.latest ? formatNumber(weight.latest.weight_kg, 1) : '—'}
            unit={weight.latest ? 'kg' : ''}
            delta={weight.change_kg !== null ? `${formatSigned(weight.change_kg, 1, ' kg')} / 30d` : 'Not logged'}
            deltaTone={weight.change_kg > 0 ? 'up' : weight.change_kg < 0 ? 'down' : 'flat'}
          />
        </div>
        <div className="scoreboard-cell">
          <Stat
            label="Training 7d"
            value={training.sessions}
            unit={training.sessions === 1 ? 'session' : 'sessions'}
            delta={`${formatNumber(training.total_minutes)} min`}
            deltaTone="flat"
          />
        </div>
        <div className="scoreboard-cell">
          <Stat
            label="Burned 7d"
            value={formatNumber(training.total_calories)}
            unit="kcal"
            delta={`${formatNumber(training.total_volume_kg)} kg lifted`}
            deltaTone="flat"
          />
        </div>
      </section>

      {/* ── This week ───────────────────────────────────────────────────── */}
      <Card title="This week" subtitle={`${formatShortDate(week.from)} – ${formatShortDate(week.to)}`}>
        <LazyCaloriesChart days={week.days} />
      </Card>

      {/* ── Meals ───────────────────────────────────────────────────────── */}
      <Card
        title="Today's meals"
        subtitle={`${today.meal_entries} ${today.meal_entries === 1 ? 'entry' : 'entries'}`}
        action={
          <Link to="/log" className="btn btn-ghost btn-sm">
            <Icon name="plus" size={16} strokeWidth={2.5} />
            Add
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
                  <Icon name={mealTypeIcon(row.meal_type)} size={21} />
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

      {/* ── Today's session ─────────────────────────────────────────────── */}
      <Card
        title="Today's session"
        subtitle={session.program ? session.program.name : 'No program selected'}
        action={
          <Link to="/train" className="btn btn-ghost btn-sm">
            Open
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
              {session.logged_today && (
                <span className="badge badge-solid" style={{ marginLeft: 8 }}>Logged today</span>
              )}
            </p>
            <div className="list">
              {session.exercises.slice(0, 4).map((exercise) => (
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
            {session.exercises.length > 4 && (
              <p className="field-hint" style={{ marginTop: 10 }}>
                +{session.exercises.length - 4} more in Training.
              </p>
            )}
          </>
        )}
      </Card>

      {/* ── Goals ───────────────────────────────────────────────────────── */}
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
    </Screen>
  );
}
