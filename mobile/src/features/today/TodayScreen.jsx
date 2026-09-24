// Today — the mobile dashboard. Every figure comes from /api/summary/dashboard,
// which aggregates the user's own logged rows: an account with nothing logged
// correctly shows zeroes rather than a demo day.
//
// The desktop version lays this out as a two-column grid of equal cards. On a
// phone there is only one column, so the order is the priority order: the ring
// and the macros first, because they answer "can I eat this?", then the
// glanceable stats, then the week, then the detail.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { summary, water as waterApi } from '../../api/endpoints.js';
import { useAuth } from '../../auth/auth-context.js';
import { Screen } from '../../components/shell/Screen.jsx';
import { AccountButton } from '../../components/shell/AccountButton.jsx';
import { Card, EmptyState, ErrorBanner, Progress, Stat, StatTile } from '../../components/ui/Card.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { SkeletonCards } from '../../components/ui/Skeleton.jsx';
import { CalorieRing } from '../../components/data/CalorieRing.jsx';
import { MacroBars } from '../../components/data/MacroBars.jsx';
// Deferred: see components/charts/lazy.jsx for why this screen's charts load
// separately from the rest of it.
import { LazyCaloriesChart, LazyMacroDonut } from '../../components/charts/lazy.jsx';
import { useToast } from '../../components/ui/toast-context.js';
import { useMutationWithRefresh } from '../../hooks/useMutationWithRefresh.js';
import { formatBarDate, formatNumber, formatSigned, mealTypeIcon, mealTypeLabel, todayISO } from '../../lib/format.js';

const WATER_STEPS = [250, 500];

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

  const refresh = () => queryClient.refetchQueries({ queryKey: ['dashboard'] });
  const firstName = user?.name?.split(' ')[0] ?? 'there';

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

  return (
    <Screen {...chrome}>
      {/* ── Energy balance ──────────────────────────────────────────────── */}
      <Card title={`Good to see you, ${firstName}`} subtitle="Today's energy balance">
        <CalorieRing
          eaten={today.calories.eaten}
          goal={today.calories.goal}
          burned={today.calories.burned}
          remaining={today.calories.remaining}
        />
      </Card>

      {/* ── Macros ──────────────────────────────────────────────────────── */}
      <Card title="Macros" subtitle={`Against your ${formatNumber(today.targets.calories)} kcal target`}>
        <MacroBars macros={today.macros} targets={today.targets} />
        <div style={{ marginTop: 16 }}>
          <LazyMacroDonut {...today.macros} />
        </div>
      </Card>

      {/* ── Glanceable stats ────────────────────────────────────────────── */}
      <div className="rail">
        <StatTile
          label="Streak"
          value={streak.current}
          unit={streak.current === 1 ? 'day' : 'days'}
          delta={streak.longest > streak.current ? `Best: ${streak.longest}` : 'Personal best'}
          deltaTone={streak.current > 0 ? 'up' : 'flat'}
        />
        <StatTile
          label="Weight"
          value={weight.latest ? formatNumber(weight.latest.weight_kg, 1) : '—'}
          unit={weight.latest ? 'kg' : ''}
          delta={weight.change_kg !== null ? `${formatSigned(weight.change_kg, 1, ' kg')} / 30d` : 'Not logged'}
          deltaTone={weight.change_kg > 0 ? 'up' : weight.change_kg < 0 ? 'down' : 'flat'}
        />
        <StatTile
          label="Training 7d"
          value={training.sessions}
          unit={training.sessions === 1 ? 'session' : 'sessions'}
          delta={`${formatNumber(training.total_minutes)} min`}
          deltaTone="flat"
        />
        <StatTile
          label="Burned 7d"
          value={formatNumber(training.total_calories)}
          unit="kcal"
          delta={`${formatNumber(training.total_volume_kg)} kg lifted`}
          deltaTone="flat"
        />
      </div>

      {/* ── Water ───────────────────────────────────────────────────────── */}
      <Card>
        <div className="row-between" style={{ marginBottom: 10 }}>
          <Stat label="Water" value={formatNumber(today.water.amount_ml)} unit={`/ ${today.water.goal_ml} ml`} />
          <span className="badge badge-blue">{today.water.percent}%</span>
        </div>
        <Progress value={today.water.amount_ml} max={today.water.goal_ml} color="var(--blue)" />
        <div className="row" style={{ marginTop: 12 }}>
          {WATER_STEPS.map((amount) => (
            <button
              key={amount}
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ flex: 1 }}
              onClick={() => addWater.mutate(amount)}
              disabled={addWater.isPending}
            >
              <Icon name="water" size={15} /> +{amount} ml
            </button>
          ))}
        </div>
      </Card>

      {/* ── This week ───────────────────────────────────────────────────── */}
      <Card title="This week" subtitle={`${week.from} to ${week.to}`}>
        <LazyCaloriesChart days={week.days} />
      </Card>

      {/* ── Meals ───────────────────────────────────────────────────────── */}
      <Card
        title="Today's meals"
        subtitle={`${today.meal_entries} ${today.meal_entries === 1 ? 'entry' : 'entries'}`}
        action={
          <Link to="/log" className="btn btn-ghost btn-sm">
            Add
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
                <span className="badge badge-green numeric">{formatNumber(row.calories)}</span>
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
          <EmptyState icon="🏋️" title="Pick a program">
            Choose a training program and the day's prescribed exercises appear here automatically.
          </EmptyState>
        ) : (
          <>
            <p className="card-subtitle" style={{ marginBottom: 10 }}>
              {session.day_label}
              {session.logged_today && (
                <span className="badge badge-green" style={{ marginLeft: 8 }}>Logged today</span>
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
              <p className="field-hint" style={{ marginTop: 8 }}>
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
          <EmptyState icon="🎯" title="No active goals">
            Set a target — a weight, a lift, a distance — and track the distance to it here.
          </EmptyState>
        ) : (
          <div className="stack">
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
    </Screen>
  );
}
