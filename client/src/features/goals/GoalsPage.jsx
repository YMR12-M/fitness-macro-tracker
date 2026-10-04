import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { goals as goalsApi } from '../../api/endpoints.js';
import { Card, EmptyState, ErrorBanner, Progress, Stat } from '../../components/Card.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Segmented, TextField } from '../../components/Field.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { useToast } from '../../components/toast-context.js';
import { useMutationWithRefresh } from '../../hooks/useMutationWithRefresh.js';
import { formatNumber, formatLongDate } from '../../lib/format.js';
import { Icon } from '../../components/Icon.jsx';

const ICONS = ['🎯', '⚖️', '💪', '🏃', '🔥', '🏋️', '🚴', '🧘', '📏', '⏱️'];

const DIRECTION_OPTIONS = [
  { value: 'decrease', label: '↓ Lower is better' },
  { value: 'increase', label: '↑ Higher is better' }
];

export function GoalsPage() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data, isPending, error } = useQuery({ queryKey: ['goals'], queryFn: () => goalsApi.list() });
  const invalidate = [['goals'], ['dashboard']];

  const createGoal = useMutationWithRefresh({
    mutationFn: (payload) => goalsApi.create(payload),
    invalidate,
    onSuccess: () => {
      toast.success('Goal created');
      setModalOpen(false);
    }
  });

  const updateGoal = useMutationWithRefresh({
    mutationFn: ({ id, patch }) => goalsApi.update(id, patch),
    invalidate,
    onSuccess: ({ goal }) => {
      toast.success(goal.completed ? `${goal.title} — done!` : 'Progress updated');
      setEditing(null);
    }
  });

  const deleteGoal = useMutationWithRefresh({
    mutationFn: (id) => goalsApi.remove(id),
    invalidate,
    onSuccess: () => toast.success('Goal removed')
  });

  const allGoals = data?.goals ?? [];
  const active = allGoals.filter((g) => !g.completed);
  const done = allGoals.filter((g) => g.completed);

  return (
    <div className="page">
      <div className="grid grid-3">
        <Card><Stat label="Active goals" value={active.length} /></Card>
        <Card><Stat label="Completed" value={done.length} /></Card>
        <Card><Stat label="Overdue" value={active.filter((g) => g.overdue).length} /></Card>
      </div>

      <Card
        title="Your goals"
        action={
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            New goal
          </button>
        }
      >
        {isPending ? (
          <Spinner label="Loading goals" />
        ) : error ? (
          <ErrorBanner error={error} />
        ) : allGoals.length === 0 ? (
          <EmptyState icon="goals" title="No goals yet">
            Set a target — a body weight, a lift, a distance — and track how far you've come toward it.
          </EmptyState>
        ) : (
          <div className="grid grid-2">
            {allGoals.map((goal) => (
              <article className="goal-tile" key={goal.id}>
                <div className="card-header" style={{ marginBottom: 0 }}>
                  <span className="sticker" aria-hidden="true">{goal.icon}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {goal.completed && <span className="badge badge-solid">Done</span>}
                    {goal.overdue && <span className="badge badge-bad">Overdue</span>}
                    <button
                      type="button"
                      className="btn-icon"
                      aria-label={`Remove ${goal.title}`}
                      onClick={() => deleteGoal.mutate(goal.id)}
                      disabled={deleteGoal.isPending}
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                </div>

                <div className="card-title">{goal.title}</div>
                <p className="card-subtitle" style={{ margin: '4px 0 10px' }}>
                  {formatNumber(goal.start_value, 1)} → {formatNumber(goal.target_value, 1)} {goal.unit}
                  {goal.deadline && ` · by ${formatLongDate(goal.deadline)}`}
                </p>

                <Progress value={goal.progress_percent} max={100} />

                <div className="goal-scale">
                  <span>{formatNumber(goal.start_value, 1)}</span>
                  <span>{formatNumber(goal.target_value, 1)} {goal.unit}</span>
                </div>

                <div className="macro-head">
                  <span className="row-figure">
                    <b>{goal.progress_percent}</b>
                    <small>% · now {formatNumber(goal.current_value, 1)} {goal.unit}</small>
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(goal)}>
                    Update
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      <GoalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(payload) => createGoal.mutate(payload)}
        submitting={createGoal.isPending}
        error={createGoal.error}
      />

      {editing && (
        <UpdateProgressModal
          goal={editing}
          onClose={() => setEditing(null)}
          onSubmit={(value) => updateGoal.mutate({ id: editing.id, patch: { current_value: value } })}
          submitting={updateGoal.isPending}
          error={updateGoal.error}
        />
      )}
    </div>
  );
}

const EMPTY_GOAL = { title: '', current_value: '', target_value: '', unit: '', deadline: '' };

function GoalModal({ open, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState(EMPTY_GOAL);
  const [icon, setIcon] = useState('🎯');
  const [direction, setDirection] = useState('decrease');

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));
  const fieldError = (name) => error?.fieldErrors?.[name];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New goal"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting || !form.title || form.current_value === '' || form.target_value === ''}
            onClick={() =>
              onSubmit({
                title: form.title,
                icon,
                direction,
                current_value: Number(form.current_value),
                start_value: Number(form.current_value),
                target_value: Number(form.target_value),
                unit: form.unit,
                ...(form.deadline ? { deadline: form.deadline } : {})
              })
            }
          >
            {submitting ? <Spinner label="Saving" /> : 'Create goal'}
          </button>
        </>
      }
    >
      {error && <ErrorBanner error={error} />}

      <TextField label="Goal" value={form.title} onChange={update('title')} placeholder="Reach 77 kg" error={fieldError('title')} />

      <div className="field">
        <span className="field-label" id="icon-label">Icon</span>
        <div className="chips" role="group" aria-labelledby="icon-label">
          {ICONS.map((option) => (
            <button
              key={option}
              type="button"
              className="chip"
              aria-pressed={icon === option}
              aria-label={`Icon ${option}`}
              onClick={() => setIcon(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <Segmented name="direction" label="Direction" value={direction} onChange={setDirection} options={DIRECTION_OPTIONS} />

      <div className="form-row">
        <TextField
          label="Current value"
          type="number"
          step="0.1"
          value={form.current_value}
          onChange={update('current_value')}
          error={fieldError('current_value')}
          hint="Also used as your starting point."
        />
        <TextField
          label="Target value"
          type="number"
          step="0.1"
          value={form.target_value}
          onChange={update('target_value')}
          error={fieldError('target_value')}
        />
      </div>

      <div className="form-row">
        <TextField label="Unit" value={form.unit} onChange={update('unit')} placeholder="kg, min, reps…" />
        <TextField label="Deadline" type="date" value={form.deadline} onChange={update('deadline')} hint="Optional" />
      </div>
    </Modal>
  );
}

function UpdateProgressModal({ goal, onClose, onSubmit, submitting, error }) {
  const [value, setValue] = useState(String(goal.current_value));

  return (
    <Modal
      open
      onClose={onClose}
      title={`Update: ${goal.title}`}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting || value === ''}
            onClick={() => onSubmit(Number(value))}
          >
            {submitting ? <Spinner label="Saving" /> : 'Save progress'}
          </button>
        </>
      }
    >
      {error && <ErrorBanner error={error} />}
      <p className="card-subtitle">
        Target is {formatNumber(goal.target_value, 1)} {goal.unit}. Reaching it marks the goal complete automatically.
      </p>
      <TextField
        label={`Current value (${goal.unit || 'value'})`}
        type="number"
        step="0.1"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </Modal>
  );
}
