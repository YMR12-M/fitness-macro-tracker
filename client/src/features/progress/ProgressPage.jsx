// Progress. Weight trend and macro history, both computed server-side from the
// user's own entries over a window they choose.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { summary, weight as weightApi } from '../../api/endpoints.js';
import { Card, EmptyState, ErrorBanner, Stat } from '../../components/Card.jsx';
import { Modal } from '../../components/Modal.jsx';
import { TextField } from '../../components/Field.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { useToast } from '../../components/toast-context.js';
import { useMutationWithRefresh } from '../../hooks/useMutationWithRefresh.js';
import { WeightChart } from '../../components/charts/WeightChart.jsx';
import { MacroHistoryChart } from '../../components/charts/MacroChart.jsx';
import { CaloriesChart } from '../../components/charts/CaloriesChart.jsx';
import { formatNumber, formatShortDate, formatSigned, todayISO } from '../../lib/format.js';

const WINDOWS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '6 months' }
];

export function ProgressPage() {
  const toast = useToast();
  const [days, setDays] = useState(30);
  const [logOpen, setLogOpen] = useState(false);

  const trendQuery = useQuery({ queryKey: ['weight', 'trend', days], queryFn: () => weightApi.trend(days) });
  const seriesQuery = useQuery({ queryKey: ['summary', 'series', days], queryFn: () => summary.series(days) });
  const adherenceQuery = useQuery({ queryKey: ['summary', 'adherence', days], queryFn: () => summary.adherence(days) });

  const logWeight = useMutationWithRefresh({
    mutationFn: (payload) => weightApi.create(payload),
    invalidate: [['weight'], ['dashboard']],
    onSuccess: () => {
      toast.success('Weight logged');
      setLogOpen(false);
    }
  });

  const deleteWeight = useMutationWithRefresh({
    mutationFn: (id) => weightApi.remove(id),
    invalidate: [['weight'], ['dashboard']],
    onSuccess: () => toast.success('Entry removed')
  });

  const trend = trendQuery.data;
  const adherence = adherenceQuery.data;

  return (
    <div className="page">
      <div className="segmented" role="group" aria-label="Time window">
        {WINDOWS.map((option) => (
          <button
            key={option.value}
            type="button"
            className="segmented-option"
            aria-pressed={days === option.value}
            onClick={() => setDays(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {adherence && (
        <div className="grid grid-4">
          <Card><Stat label="Days logged" value={adherence.days_logged} unit={`/ ${adherence.window_days}`} /></Card>
          <Card><Stat label="Average calories" value={formatNumber(adherence.avg_calories)} unit="kcal" /></Card>
          <Card><Stat label="Average protein" value={formatNumber(adherence.avg_protein_g)} unit="g" /></Card>
          <Card>
            <Stat
              label="Within 10% of target"
              value={adherence.on_target_days}
              unit={adherence.on_target_days === 1 ? 'day' : 'days'}
            />
          </Card>
        </div>
      )}

      <Card
        title="Body weight"
        subtitle={`Last ${days} days`}
        action={
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setLogOpen(true)}>
            Log weight
          </button>
        }
      >
        {trendQuery.isPending ? (
          <Spinner label="Loading weight" />
        ) : trendQuery.error ? (
          <ErrorBanner error={trendQuery.error} />
        ) : (
          <>
            {trend.entries.length > 0 && (
              <div className="grid grid-3" style={{ marginBottom: 16 }}>
                <Stat label="Current" value={formatNumber(trend.latest.weight_kg, 1)} unit="kg" />
                <Stat
                  label="Change"
                  value={formatSigned(trend.change_kg, 1)}
                  unit="kg"
                  delta={trend.change_kg < 0 ? 'Trending down' : trend.change_kg > 0 ? 'Trending up' : 'Holding'}
                  deltaTone={trend.change_kg < 0 ? 'down' : trend.change_kg > 0 ? 'up' : 'flat'}
                />
                <Stat label="Weekly rate" value={formatSigned(trend.weekly_rate_kg, 2)} unit="kg / week" />
              </div>
            )}
            <WeightChart entries={trend.entries} movingAverage={trend.moving_average} />
          </>
        )}
      </Card>

      <div className="grid grid-2">
        <Card title="Calories" subtitle={`Eaten vs burned, last ${days} days`}>
          {seriesQuery.isPending ? <Spinner /> : <CaloriesChart days={seriesQuery.data?.days ?? []} />}
        </Card>

        <Card title="Macro history" subtitle="Grams per day">
          {seriesQuery.isPending ? <Spinner /> : <MacroHistoryChart days={seriesQuery.data?.days ?? []} />}
        </Card>
      </div>

      <Card title="Weight entries">
        {!trend?.entries?.length ? (
          <EmptyState icon="⚖️" title="No entries in this window">
            Log your weight regularly — the 7-day average is what shows a real trend.
          </EmptyState>
        ) : (
          <div className="list">
            {[...trend.entries].reverse().map((entry) => (
              <div className="list-row" key={entry.id}>
                <div className="list-row-body">
                  <div className="list-row-title">{formatNumber(entry.weight_kg, 1)} kg</div>
                  <div className="list-row-meta">
                    {formatShortDate(entry.recorded_on)}
                    {entry.body_fat_pct ? ` · ${formatNumber(entry.body_fat_pct, 1)}% body fat` : ''}
                    {entry.notes ? ` · ${entry.notes}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label={`Remove entry for ${entry.recorded_on}`}
                  onClick={() => deleteWeight.mutate(entry.id)}
                  disabled={deleteWeight.isPending}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <LogWeightModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onSubmit={(payload) => logWeight.mutate(payload)}
        submitting={logWeight.isPending}
        error={logWeight.error}
      />
    </div>
  );
}

function LogWeightModal({ open, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState({ weight_kg: '', body_fat_pct: '', notes: '', recorded_on: todayISO() });
  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));
  const fieldError = (name) => error?.fieldErrors?.[name];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log your weight"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting || !form.weight_kg}
            onClick={() => onSubmit(Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '')))}
          >
            {submitting ? <Spinner label="Saving" /> : 'Save'}
          </button>
        </>
      }
    >
      {error && <ErrorBanner error={error} />}
      <p className="card-subtitle">Logging twice on the same day updates that day rather than adding a second point.</p>

      <div className="form-row">
        <TextField
          label="Weight (kg)"
          type="number"
          step="0.1"
          min="25"
          max="400"
          value={form.weight_kg}
          onChange={update('weight_kg')}
          error={fieldError('weight_kg')}
        />
        <TextField
          label="Body fat (%)"
          type="number"
          step="0.1"
          min="1"
          max="70"
          value={form.body_fat_pct}
          onChange={update('body_fat_pct')}
          error={fieldError('body_fat_pct')}
          hint="Optional"
        />
      </div>

      <TextField label="Date" type="date" max={todayISO()} value={form.recorded_on} onChange={update('recorded_on')} />
      <TextField label="Notes" value={form.notes} onChange={update('notes')} placeholder="Optional" />
    </Modal>
  );
}
