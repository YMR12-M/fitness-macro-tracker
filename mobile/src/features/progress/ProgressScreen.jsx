// Progress. Weight trend and macro history, both computed server-side from the
// user's own entries over a window they choose.
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { summary, weight as weightApi } from '../../api/endpoints.js';
import { useAuth } from '../../auth/auth-context.js';
import { Screen } from '../../components/shell/Screen.jsx';
import { AccountButton } from '../../components/shell/AccountButton.jsx';
import { Card, EmptyState, ErrorBanner, Stat, StatTile } from '../../components/ui/Card.jsx';
import { Segmented } from '../../components/ui/Field.jsx';
import { SkeletonList } from '../../components/ui/Skeleton.jsx';
import { DeleteButton, SwipeRow } from '../../components/ui/SwipeRow.jsx';
import { useToast } from '../../components/ui/toast-context.js';
import { useMutationWithRefresh } from '../../hooks/useMutationWithRefresh.js';
import { useQuickAdd } from '../../hooks/useQuickAdd.js';
import { WeightChart } from '../../components/charts/WeightChart.jsx';
import { MacroHistoryChart } from '../../components/charts/MacroChart.jsx';
import { CaloriesChart } from '../../components/charts/CaloriesChart.jsx';
import { LogWeightSheet } from './LogWeightSheet.jsx';
import { formatNumber, formatShortDate, formatSigned } from '../../lib/format.js';

const WINDOWS = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
  { value: 180, label: '6m' }
];

export function ProgressScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [days, setDays] = useState(30);
  const [logOpen, setLogOpen] = useQuickAdd('weight');

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
    <Screen
      title="Progress"
      subtitle={`Last ${days} days`}
      trailing={<AccountButton name={user?.name} />}
      onRefresh={() => queryClient.refetchQueries({ queryKey: ['weight'] })}
    >
      <Segmented
        name="window"
        value={days}
        onChange={setDays}
        options={WINDOWS}
      />

      {adherence && (
        <div className="rail">
          <StatTile label="Days logged" value={adherence.days_logged} unit={`/ ${adherence.window_days}`} />
          <StatTile label="Avg calories" value={formatNumber(adherence.avg_calories)} unit="kcal" />
          <StatTile label="Avg protein" value={formatNumber(adherence.avg_protein_g)} unit="g" />
          <StatTile
            label="Within 10%"
            value={adherence.on_target_days}
            unit={adherence.on_target_days === 1 ? 'day' : 'days'}
          />
        </div>
      )}

      <button type="button" className="btn btn-primary btn-block" onClick={() => setLogOpen(true)}>
        Log weight
      </button>

      {/* ── Body weight ─────────────────────────────────────────────────── */}
      <Card title="Body weight" subtitle={`Last ${days} days`}>
        {trendQuery.isPending ? (
          <SkeletonList count={3} />
        ) : trendQuery.error ? (
          <ErrorBanner error={trendQuery.error} />
        ) : (
          <>
            {trend.entries.length > 0 && (
              <div className="grid-3" style={{ marginBottom: 14 }}>
                <Stat label="Current" value={formatNumber(trend.latest.weight_kg, 1)} unit="kg" />
                <Stat
                  label="Change"
                  value={formatSigned(trend.change_kg, 1)}
                  unit="kg"
                  deltaTone={trend.change_kg < 0 ? 'down' : trend.change_kg > 0 ? 'up' : 'flat'}
                />
                <Stat label="Weekly" value={formatSigned(trend.weekly_rate_kg, 2)} unit="kg/w" />
              </div>
            )}
            <WeightChart entries={trend.entries} movingAverage={trend.moving_average} />
          </>
        )}
      </Card>

      {/* ── Calories and macros ─────────────────────────────────────────── */}
      <Card title="Calories" subtitle={`Eaten vs burned, last ${days} days`}>
        {seriesQuery.isPending ? <SkeletonList count={2} /> : <CaloriesChart days={seriesQuery.data?.days ?? []} />}
      </Card>

      <Card title="Macro history" subtitle="Grams per day">
        {seriesQuery.isPending ? <SkeletonList count={2} /> : <MacroHistoryChart days={seriesQuery.data?.days ?? []} />}
      </Card>

      {/* ── Entries ─────────────────────────────────────────────────────── */}
      <p className="screen-section-title">Weight entries</p>

      {!trend?.entries?.length ? (
        <Card>
          <EmptyState icon="⚖️" title="No entries in this window">
            Log your weight regularly — the 7-day average is what shows a real trend.
          </EmptyState>
        </Card>
      ) : (
        <div className="list">
          {[...trend.entries].reverse().map((entry) => (
            <SwipeRow
              key={entry.id}
              onDelete={() => deleteWeight.mutate(entry.id)}
              deleteLabel={`Remove entry for ${entry.recorded_on}`}
              disabled={deleteWeight.isPending}
            >
              <div className="list-row">
                <div className="list-row-body">
                  <div className="list-row-title numeric">{formatNumber(entry.weight_kg, 1)} kg</div>
                  <div className="list-row-meta">
                    {formatShortDate(entry.recorded_on)}
                    {entry.body_fat_pct ? ` · ${formatNumber(entry.body_fat_pct, 1)}% body fat` : ''}
                    {entry.notes ? ` · ${entry.notes}` : ''}
                  </div>
                </div>
                <DeleteButton
                  label={`Remove entry for ${entry.recorded_on}`}
                  onClick={() => deleteWeight.mutate(entry.id)}
                  disabled={deleteWeight.isPending}
                />
              </div>
            </SwipeRow>
          ))}
        </div>
      )}

      {/* Mounted only while open: the form seeds its fields from the latest
          reading, and a sheet kept mounted would capture whatever was loaded
          the first time this screen rendered. */}
      {logOpen && (
        <LogWeightSheet
          open
          onClose={() => setLogOpen(false)}
          onSubmit={(payload) => logWeight.mutate(payload)}
          submitting={logWeight.isPending}
          error={logWeight.error}
          latestWeight={trend?.latest?.weight_kg}
        />
      )}
    </Screen>
  );
}
