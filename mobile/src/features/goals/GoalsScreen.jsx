// Goals. Progress is a real calculation against start, target and direction,
// done server-side — this screen only renders what comes back.
//
// Reached from the More screen rather than the tab bar, so it gets a back
// chevron in its app bar.
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { goals as goalsApi } from '../../api/endpoints.js';
import { Screen } from '../../components/shell/Screen.jsx';
import { Card, EmptyState, ErrorBanner, Progress, StatTile } from '../../components/ui/Card.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { SkeletonCards } from '../../components/ui/Skeleton.jsx';
import { DeleteButton, SwipeRow } from '../../components/ui/SwipeRow.jsx';
import { useToast } from '../../components/ui/toast-context.js';
import { useMutationWithRefresh } from '../../hooks/useMutationWithRefresh.js';
import { NewGoalSheet, UpdateGoalSheet } from './GoalSheets.jsx';
import { formatLongDate, formatNumber } from '../../lib/format.js';

export function GoalsScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data, isPending, error } = useQuery({ queryKey: ['goals'], queryFn: () => goalsApi.list() });
  const invalidate = [['goals'], ['dashboard']];

  const createGoal = useMutationWithRefresh({
    mutationFn: (payload) => goalsApi.create(payload),
    invalidate,
    onSuccess: () => {
      toast.success('Goal created');
      setNewOpen(false);
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
    <Screen
      title="Goals"
      subtitle={`${active.length} active · ${done.length} done`}
      back="/more"
      trailing={
        <button type="button" className="appbar-btn" onClick={() => setNewOpen(true)} aria-label="New goal">
          <Icon name="plus" size={22} strokeWidth={2.2} />
        </button>
      }
      onRefresh={() => queryClient.refetchQueries({ queryKey: ['goals'] })}
    >
      <div className="rail">
        <StatTile label="Active" value={active.length} />
        <StatTile label="Completed" value={done.length} />
        <StatTile label="Overdue" value={active.filter((g) => g.overdue).length} />
      </div>

      {isPending ? (
        <SkeletonCards count={3} height={140} />
      ) : error ? (
        <ErrorBanner error={error} />
      ) : allGoals.length === 0 ? (
        <Card>
          <EmptyState
            icon="goals"
            title="No goals yet"
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setNewOpen(true)}>
                Create one
              </button>
            }
          >
            Set a target — a body weight, a lift, a distance — and track how far you've come toward it.
          </EmptyState>
        </Card>
      ) : (
        <div className="stack">
          {allGoals.map((goal) => (
            <SwipeRow
              key={goal.id}
              onDelete={() => deleteGoal.mutate(goal.id)}
              deleteLabel={`Remove ${goal.title}`}
              disabled={deleteGoal.isPending}
            >
              <article className="card">
                <div className="row-between">
                  <span className="row">
                    <span className="sticker" aria-hidden="true">{goal.icon}</span>
                    <span className="card-title">{goal.title}</span>
                  </span>
                  <span className="row" style={{ gap: 4 }}>
                    {goal.completed && <span className="badge badge-solid">Done</span>}
                    {goal.overdue && <span className="badge badge-bad">Overdue</span>}
                    <DeleteButton
                      label={`Remove ${goal.title}`}
                      onClick={() => deleteGoal.mutate(goal.id)}
                      disabled={deleteGoal.isPending}
                    />
                  </span>
                </div>

                <p className="card-subtitle" style={{ margin: '6px 0 10px' }}>
                  {formatNumber(goal.start_value, 1)} → {formatNumber(goal.target_value, 1)} {goal.unit}
                  {goal.deadline && ` · by ${formatLongDate(goal.deadline)}`}
                </p>

                <Progress value={goal.progress_percent} max={100} />

                <div className="goal-scale" style={{ marginTop: 6 }}>
                  <span>{formatNumber(goal.start_value, 1)}</span>
                  <span>{formatNumber(goal.target_value, 1)} {goal.unit}</span>
                </div>

                <div className="row-between" style={{ marginTop: 10 }}>
                  <span className="row-figure">
                    <b>{goal.progress_percent}</b>
                    <small>% · now {formatNumber(goal.current_value, 1)} {goal.unit}</small>
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(goal)}>
                    Update
                  </button>
                </div>
              </article>
            </SwipeRow>
          ))}
        </div>
      )}

      {newOpen && (
        <NewGoalSheet
          open
          onClose={() => setNewOpen(false)}
          onSubmit={(payload) => createGoal.mutate(payload)}
          submitting={createGoal.isPending}
          error={createGoal.error}
        />
      )}

      {editing && (
        <UpdateGoalSheet
          goal={editing}
          onClose={() => setEditing(null)}
          onSubmit={(value) => updateGoal.mutate({ id: editing.id, patch: { current_value: value } })}
          submitting={updateGoal.isPending}
          error={updateGoal.error}
        />
      )}
    </Screen>
  );
}
