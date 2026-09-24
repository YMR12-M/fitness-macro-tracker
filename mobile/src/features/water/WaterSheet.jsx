// Water logging. Small enough to live entirely in a sheet, which is why it has
// no screen of its own — it is reachable from quick-add anywhere in the app,
// and its total is shown on Today.
import { useQuery } from '@tanstack/react-query';
import { water as waterApi } from '../../api/endpoints.js';
import { Progress, Stat } from '../../components/ui/Card.jsx';
import { Sheet } from '../../components/ui/Sheet.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { useToast } from '../../components/ui/toast-context.js';
import { useMutationWithRefresh } from '../../hooks/useMutationWithRefresh.js';
import { formatNumber, todayISO } from '../../lib/format.js';

/** The sizes people actually drink from, rather than an arbitrary slider. */
const POURS = [
  { amount: 200, label: 'Glass', emoji: '🥛' },
  { amount: 330, label: 'Can', emoji: '🥤' },
  { amount: 500, label: 'Bottle', emoji: '🍶' },
  { amount: 750, label: 'Flask', emoji: '🧴' }
];

export function WaterSheet({ open, onClose }) {
  const toast = useToast();
  const today = todayISO();

  const { data, isPending } = useQuery({
    queryKey: ['water', today],
    queryFn: () => waterApi.get(today),
    enabled: open
  });

  const invalidate = [['water'], ['dashboard'], ['summary']];

  const add = useMutationWithRefresh({
    mutationFn: (amount) => waterApi.add(amount),
    invalidate,
    onSuccess: (_result, amount) => toast.success(`${amount} ml logged`)
  });

  const undo = useMutationWithRefresh({
    mutationFn: () => waterApi.undo(today),
    invalidate,
    onSuccess: () => toast.info('Last drink removed')
  });

  const busy = add.isPending || undo.isPending;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Water"
      footer={
        <>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => undo.mutate()}
            disabled={busy || !data?.entries}
          >
            {undo.isPending ? <Spinner label="Removing" /> : 'Undo last'}
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      {isPending ? (
        <Spinner label="Loading today's intake" />
      ) : (
        <>
          <div className="row-between">
            <Stat label="Today" value={formatNumber(data?.amount_ml ?? 0)} unit={`/ ${data?.goal_ml ?? 0} ml`} />
            <span className="badge badge-blue">{data?.percent ?? 0}%</span>
          </div>
          <Progress value={data?.amount_ml ?? 0} max={data?.goal_ml ?? 1} color="var(--blue)" />

          <div className="grid-2">
            {POURS.map((pour) => (
              <button
                key={pour.amount}
                type="button"
                className="actionsheet-item"
                disabled={busy}
                onClick={() => add.mutate(pour.amount)}
              >
                <span
                  className="actionsheet-icon"
                  style={{ background: 'rgba(74, 158, 255, 0.16)' }}
                  aria-hidden="true"
                >
                  {pour.emoji}
                </span>
                <span>
                  <span className="actionsheet-label">{pour.label}</span>
                  <span className="actionsheet-hint">{pour.amount} ml</span>
                </span>
              </button>
            ))}
          </div>

          <p className="field-hint">
            Every drink is stored as its own entry, so “undo last” removes exactly the one you just tapped.
          </p>
        </>
      )}
    </Sheet>
  );
}
