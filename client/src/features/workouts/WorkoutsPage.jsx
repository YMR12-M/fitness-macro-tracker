// Training. The programs and their prescribed exercises come from the database,
// and "today's session" is derived from where the user is in their program's
// rotation — it is not a fixed list.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { programs as programsApi, workouts as workoutsApi } from '../../api/endpoints.js';
import { Card, EmptyState, ErrorBanner, Stat } from '../../components/Card.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Segmented, TextField } from '../../components/Field.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { useToast } from '../../components/toast-context.js';
import { useMutationWithRefresh } from '../../hooks/useMutationWithRefresh.js';
import { formatNumber, formatShortDate, todayISO } from '../../lib/format.js';
import { Icon } from '../../components/Icon.jsx';

const INTENSITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' }
];

export function WorkoutsPage() {
  const toast = useToast();
  const [logOpen, setLogOpen] = useState(false);

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

  return (
    <div className="page">
      {stats && (
        <div className="grid grid-4">
          <Card><Stat label="Sessions (30 days)" value={stats.sessions} /></Card>
          <Card><Stat label="Total time" value={formatNumber(stats.total_minutes)} unit="min" /></Card>
          <Card><Stat label="Calories burned" value={formatNumber(stats.total_calories)} unit="kcal" /></Card>
          <Card><Stat label="Volume lifted" value={formatNumber(stats.total_volume_kg)} unit="kg" /></Card>
        </div>
      )}

      <Card
        title="Today's session"
        subtitle={session?.program ? `${session.program.name} — ${session.day_label ?? ''}` : 'No program selected'}
        action={
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setLogOpen(true)}>
            Log a workout
          </button>
        }
      >
        {todayQuery.isPending ? (
          <Spinner label="Loading session" />
        ) : !session?.program ? (
          <EmptyState icon="train" title="Choose a program below">
            Once you pick a program, the exercises prescribed for each day appear here automatically.
          </EmptyState>
        ) : (
          <div className="list">
            {session.exercises.map((exercise) => (
              <div className="list-row" key={exercise.id}>
                <div className="list-row-body">
                  <div className="list-row-title">{exercise.name}</div>
                  <div className="list-row-meta">{exercise.muscle}</div>
                </div>
                <span className="badge">{exercise.target_sets} × {exercise.target_reps}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Programs" subtitle="Pick the routine you're following">
        {programsQuery.isPending ? (
          <Spinner label="Loading programs" />
        ) : programsQuery.error ? (
          <ErrorBanner error={programsQuery.error} />
        ) : (
          <div className="grid grid-3">
            {programsQuery.data.programs.map((program) => (
              <button
                key={program.id}
                type="button"
                className="card program-tile"
                onClick={() => selectProgram.mutate(program.id)}
                disabled={selectProgram.isPending}
                aria-pressed={Boolean(program.is_active)}
              >
                <div className="card-header" style={{ marginBottom: 0 }}>
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
      </Card>

      <Card title="Recent workouts" subtitle="Last 30 days">
        {historyQuery.isPending ? (
          <Spinner label="Loading history" />
        ) : (historyQuery.data?.workouts ?? []).length === 0 ? (
          <EmptyState icon="log" title="No workouts logged yet">
            Log your first session and your volume and streak stats start building.
          </EmptyState>
        ) : (
          <div className="list">
            {historyQuery.data.workouts.map((workout) => (
              <div className="list-row" key={workout.id}>
                <div className="list-row-body">
                  <div className="list-row-title">{workout.workout_type}</div>
                  <div className="list-row-meta">
                    {formatShortDate(workout.performed_on)} · {workout.duration_minutes} min ·{' '}
                    {formatNumber(workout.calories_burned)} kcal · {workout.intensity}
                    {workout.sets.length > 0 && ` · ${workout.sets.length} sets`}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label={`Remove ${workout.workout_type}`}
                  onClick={() => deleteWorkout.mutate(workout.id)}
                  disabled={deleteWorkout.isPending}
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <LogWorkoutModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onSubmit={(payload) => logWorkout.mutate(payload)}
        submitting={logWorkout.isPending}
        error={logWorkout.error}
        suggestedType={session?.day_label ?? ''}
        programId={session?.program?.id}
      />
    </div>
  );
}

function LogWorkoutModal({ open, onClose, onSubmit, submitting, error, suggestedType, programId }) {
  const [form, setForm] = useState({
    workout_type: '',
    duration_minutes: '45',
    calories_burned: '',
    performed_on: todayISO()
  });
  const [intensity, setIntensity] = useState('moderate');

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));
  const fieldError = (name) => error?.fieldErrors?.[name];
  const workoutType = form.workout_type || suggestedType;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log a workout"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting || !workoutType || !form.duration_minutes}
            onClick={() =>
              onSubmit({
                workout_type: workoutType,
                duration_minutes: Number(form.duration_minutes),
                calories_burned: form.calories_burned === '' ? 0 : Number(form.calories_burned),
                intensity,
                performed_on: form.performed_on,
                ...(programId ? { program_id: programId } : {})
              })
            }
          >
            {submitting ? <Spinner label="Saving" /> : 'Save workout'}
          </button>
        </>
      }
    >
      {error && <ErrorBanner error={error} />}

      <TextField
        label="Session"
        value={workoutType}
        onChange={update('workout_type')}
        placeholder={suggestedType || 'Push day, 5K run, …'}
        error={fieldError('workout_type')}
      />

      <div className="form-row">
        <TextField
          label="Duration (minutes)"
          type="number"
          min="1"
          max="600"
          value={form.duration_minutes}
          onChange={update('duration_minutes')}
          error={fieldError('duration_minutes')}
        />
        <TextField
          label="Calories burned"
          type="number"
          min="0"
          value={form.calories_burned}
          onChange={update('calories_burned')}
          error={fieldError('calories_burned')}
          hint="Optional — leave blank if unknown."
        />
      </div>

      <TextField label="Date" type="date" max={todayISO()} value={form.performed_on} onChange={update('performed_on')} />

      <Segmented name="intensity" label="Intensity" value={intensity} onChange={setIntensity} options={INTENSITY_OPTIONS} />
    </Modal>
  );
}
