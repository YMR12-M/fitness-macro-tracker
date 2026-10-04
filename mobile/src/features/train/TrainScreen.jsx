// Training. The programs and their prescribed exercises come from the database,
// and "today's session" is derived from where the user is in their program's
// rotation — it is not a fixed list.
//
// The desktop version puts the programs in a three-column grid; here they are a
// vertical list of full-width cards, each one a single large tap target, since
// picking a program is a deliberate choice rather than something you scan.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { programs as programsApi, workouts as workoutsApi } from '../../api/endpoints.js';
import { useAuth } from '../../auth/auth-context.js';
import { Screen } from '../../components/shell/Screen.jsx';
import { AccountButton } from '../../components/shell/AccountButton.jsx';
import { Card, EmptyState, ErrorBanner, StatTile } from '../../components/ui/Card.jsx';
import { SkeletonList } from '../../components/ui/Skeleton.jsx';
import { DeleteButton, SwipeRow } from '../../components/ui/SwipeRow.jsx';
import { useToast } from '../../components/ui/toast-context.js';
import { useMutationWithRefresh } from '../../hooks/useMutationWithRefresh.js';
import { useQuickAdd } from '../../hooks/useQuickAdd.js';
import { LogWorkoutSheet } from './LogWorkoutSheet.jsx';
import { formatNumber, formatShortDate } from '../../lib/format.js';

export function TrainScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [logOpen, setLogOpen] = useQuickAdd('workout');

  const todayQuery = useQuery({ queryKey: ['workouts', 'today'], queryFn: workoutsApi.today });
  const programsQuery = useQuery({ queryKey: ['programs'], queryFn: programsApi.list });
  const historyQuery = useQuery({ queryKey: ['workouts', 'history'], queryFn: () => workoutsApi.list({ days: 30 }) });
  const statsQuery = useQuery({ queryKey: ['workouts', 'stats'], queryFn: () => workoutsApi.stats(30) });

  const invalidate = [['workouts'], ['programs'], ['dashboard']];

  const selectProgram = useMutationWithRefresh({
    mutationFn: (id) => programsApi.select(id),
    invalidate,
    onSuccess: ({ program }) => toast.success(`Now following ${program.name}`)
  });

  const logWorkout = useMutationWithRefresh({
    mutationFn: (payload) => workoutsApi.create(payload),
    invalidate,
    onSuccess: () => {
      toast.success('Workout logged');
      setLogOpen(false);
    }
  });

  const deleteWorkout = useMutationWithRefresh({
    mutationFn: (id) => workoutsApi.remove(id),
    invalidate,
    onSuccess: () => toast.success('Workout removed')
  });

  const session = todayQuery.data;
  const stats = statsQuery.data;
  const workouts = historyQuery.data?.workouts ?? [];

  return (
    <Screen
      title="Training"
      subtitle={session?.program ? session.program.name : 'No program selected'}
      trailing={<AccountButton name={user?.name} />}
      onRefresh={() => queryClient.refetchQueries({ queryKey: ['workouts'] })}
    >
      {stats && (
        <div className="rail">
          <StatTile label="Sessions 30d" value={stats.sessions} />
          <StatTile label="Total time" value={formatNumber(stats.total_minutes)} unit="min" />
          <StatTile label="Burned" value={formatNumber(stats.total_calories)} unit="kcal" />
          <StatTile label="Volume" value={formatNumber(stats.total_volume_kg)} unit="kg" />
        </div>
      )}

      <button type="button" className="btn btn-primary btn-block" onClick={() => setLogOpen(true)}>
        Log a workout
      </button>

      {/* ── Today's session ─────────────────────────────────────────────── */}
      <Card
        title="Today's session"
        subtitle={session?.program ? session.day_label ?? 'Rest day' : 'Pick a program below'}
        action={
          session?.logged_today ? <span className="badge badge-solid">Logged</span> : null
        }
      >
        {todayQuery.isPending ? (
          <SkeletonList count={3} />
        ) : !session?.program ? (
          <EmptyState icon="train" title="Choose a program">
            Once you pick a program, the exercises prescribed for each day appear here automatically.
          </EmptyState>
        ) : session.exercises.length === 0 ? (
          <EmptyState icon="moon" title="Rest day">
            Nothing is prescribed today. Log something anyway if you trained off-plan.
          </EmptyState>
        ) : (
          <div className="list">
            {session.exercises.map((exercise) => (
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
        )}
      </Card>

      {/* ── Programs ────────────────────────────────────────────────────── */}
      <p className="screen-section-title">Programs</p>

      {programsQuery.isPending ? (
        <SkeletonList count={3} />
      ) : programsQuery.error ? (
        <ErrorBanner error={programsQuery.error} />
      ) : (
        <div className="stack-sm">
          {programsQuery.data.programs.map((program) => (
            <button
              key={program.id}
              type="button"
              className="card program-tile"
              onClick={() => selectProgram.mutate(program.id)}
              disabled={selectProgram.isPending}
              aria-pressed={Boolean(program.is_active)}
            >
              <div className="row-between">
                <span className="program-days">
                  <b>{program.days_per_week}</b>days / week
                </span>
                {program.is_active ? (
                  <span className="badge badge-accent">Active</span>
                ) : (
                  <span className="badge">{program.level}</span>
                )}
              </div>
              <div className="card-title">{program.name}</div>
              <p className="card-subtitle">{program.description}</p>
              <p className="list-row-meta">{program.exercise_count} exercises</p>
            </button>
          ))}
        </div>
      )}

      {/* ── History ─────────────────────────────────────────────────────── */}
      <p className="screen-section-title">Last 30 days</p>

      {historyQuery.isPending ? (
        <SkeletonList count={3} />
      ) : workouts.length === 0 ? (
        <Card>
          <EmptyState icon="log" title="No workouts logged yet">
            Log your first session and your volume and streak stats start building.
          </EmptyState>
        </Card>
      ) : (
        <Card>
        <div className="list">
          {workouts.map((workout) => (
            <SwipeRow
              key={workout.id}
              onDelete={() => deleteWorkout.mutate(workout.id)}
              deleteLabel={`Remove ${workout.workout_type}`}
              disabled={deleteWorkout.isPending}
            >
              <div className="list-row">
                <div className="list-row-body">
                  <div className="list-row-title">{workout.workout_type}</div>
                  <div className="list-row-meta">
                    {formatShortDate(workout.performed_on)} · {workout.duration_minutes} min ·{' '}
                    {formatNumber(workout.calories_burned)} kcal · {workout.intensity}
                    {workout.sets.length > 0 && ` · ${workout.sets.length} sets`}
                  </div>
                </div>
                <DeleteButton
                  label={`Remove ${workout.workout_type}`}
                  onClick={() => deleteWorkout.mutate(workout.id)}
                  disabled={deleteWorkout.isPending}
                />
              </div>
            </SwipeRow>
          ))}
        </div>
        </Card>
      )}

      {/* Mounted only while open, so each session starts from today's date and
          the program's own prescribed name rather than the last one typed. */}
      {logOpen && (
        <LogWorkoutSheet
          open
          onClose={() => setLogOpen(false)}
          onSubmit={(payload) => logWorkout.mutate(payload)}
          submitting={logWorkout.isPending}
          error={logWorkout.error}
          suggestedType={session?.day_label ?? ''}
          programId={session?.program?.id}
        />
      )}
    </Screen>
  );
}
