// The food log for one day.
//
// Structured back-to-front from the desktop version: there the search box is
// the first thing on the page, here the day's entries are, because on a phone
// the common action is checking what you have already eaten and the second
// most common is repeating something you eat every day. Adding something new
// is one tap on the button that sits above the list.
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { foods as foodsApi, meals as mealsApi, summary } from '../../api/endpoints.js';
import { Screen } from '../../components/shell/Screen.jsx';
import { AccountButton } from '../../components/shell/AccountButton.jsx';
import { useAuth } from '../../auth/auth-context.js';
import { Card, EmptyState, ErrorBanner, Progress, Stat } from '../../components/ui/Card.jsx';
import { DateStrip } from '../../components/ui/DateStrip.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { SkeletonList } from '../../components/ui/Skeleton.jsx';
import { DeleteButton, SwipeRow } from '../../components/ui/SwipeRow.jsx';
import { useToast } from '../../components/ui/toast-context.js';
import { useMutationWithRefresh } from '../../hooks/useMutationWithRefresh.js';
import { useQuickAdd } from '../../hooks/useQuickAdd.js';
import { FoodSearchSheet } from './FoodSearchSheet.jsx';
import { PortionSheet } from './PortionSheet.jsx';
import { CustomFoodSheet } from './CustomFoodSheet.jsx';
import { MEAL_TYPES, formatNumber, formatRelativeDay, mealTypeIcon, mealTypeLabel, todayISO } from '../../lib/format.js';

export function LogScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(todayISO());
  const [selectedFood, setSelectedFood] = useState(null);
  const [customOpen, setCustomOpen] = useState(false);
  // Quick-add from the tab bar lands here asking for the search sheet.
  const [searchOpen, setSearchOpen] = useQuickAdd('food');

  const dayQuery = useQuery({ queryKey: ['meals', date], queryFn: () => mealsApi.list({ date }) });
  const totalsQuery = useQuery({ queryKey: ['summary', date], queryFn: () => summary.daily(date) });
  const frequentQuery = useQuery({ queryKey: ['meals', 'frequent'], queryFn: mealsApi.frequent });
  // Powers the dots under the date strip: which of the last two weeks have logs.
  const seriesQuery = useQuery({ queryKey: ['summary', 'series', 14], queryFn: () => summary.series(14) });

  const invalidate = [['meals'], ['summary'], ['dashboard']];

  const logMeal = useMutationWithRefresh({
    mutationFn: (payload) => mealsApi.create(payload),
    invalidate,
    onSuccess: ({ meal }) => {
      toast.success(`${meal.name} logged`);
      setSelectedFood(null);
    }
  });

  const deleteMeal = useMutationWithRefresh({
    mutationFn: (id) => mealsApi.remove(id),
    invalidate,
    onSuccess: () => toast.success('Meal removed')
  });

  const createFood = useMutationWithRefresh({
    mutationFn: (payload) => foodsApi.create(payload),
    invalidate: [['foods']],
    onSuccess: ({ food }) => {
      toast.success(`${food.name} added to your catalog`);
      setCustomOpen(false);
      setSelectedFood(food);
    }
  });

  const totals = totalsQuery.data;
  const meals = dayQuery.data?.meals ?? [];

  const loggedDates = useMemo(
    () => new Set((seriesQuery.data?.days ?? []).filter((d) => d.calories_eaten > 0).map((d) => d.date)),
    [seriesQuery.data]
  );

  // Grouped by meal, in meal order — how a day actually reads, rather than the
  // flat reverse-chronological list the desktop table shows.
  const grouped = useMemo(
    () =>
      MEAL_TYPES.map((type) => ({
        ...type,
        entries: meals.filter((meal) => meal.meal_type === type.value)
      })).filter((group) => group.entries.length > 0),
    [meals]
  );

  /** Repeat a previously logged meal verbatim, onto the day being viewed. */
  const logAgain = (meal) =>
    logMeal.mutate({
      food_id: meal.food_id ?? undefined,
      name: meal.name,
      emoji: meal.emoji ?? undefined,
      meal_type: meal.meal_type,
      quantity: Number(meal.quantity),
      unit: meal.unit,
      calories: Number(meal.calories),
      protein_g: Number(meal.protein_g),
      carbs_g: Number(meal.carbs_g),
      fat_g: Number(meal.fat_g),
      logged_on: date
    });

  return (
    <Screen
      title="Food log"
      subtitle={formatRelativeDay(date)}
      trailing={<AccountButton name={user?.name} />}
      onRefresh={() => queryClient.refetchQueries({ queryKey: ['meals'] })}
    >
      <DateStrip value={date} onChange={setDate} days={14} loggedDates={loggedDates} />

      {/* ── Day totals ──────────────────────────────────────────────────── */}
      <Card>
        {totalsQuery.isPending ? (
          <SkeletonList count={2} />
        ) : totals ? (
          <>
            <div className="row-between">
              <Stat
                label="Calories"
                value={formatNumber(totals.calories.eaten)}
                unit={`/ ${formatNumber(totals.calories.goal)}`}
              />
              <span className={`badge ${totals.calories.remaining < 0 ? 'badge-orange' : 'badge-green'}`}>
                {totals.calories.remaining < 0
                  ? `${formatNumber(Math.abs(totals.calories.remaining))} over`
                  : `${formatNumber(totals.calories.remaining)} left`}
              </span>
            </div>

            <div style={{ marginTop: 10 }}>
              <Progress value={totals.calories.eaten} max={totals.calories.goal} />
            </div>

            <div className="grid-3" style={{ marginTop: 16 }}>
              <Stat label="Protein" value={formatNumber(totals.macros.protein_g, 1)} unit={`/ ${totals.targets.protein_g}g`} />
              <Stat label="Carbs" value={formatNumber(totals.macros.carbs_g, 1)} unit={`/ ${totals.targets.carbs_g}g`} />
              <Stat label="Fat" value={formatNumber(totals.macros.fat_g, 1)} unit={`/ ${totals.targets.fat_g}g`} />
            </div>
          </>
        ) : (
          <ErrorBanner error={totalsQuery.error} />
        )}
      </Card>

      <button type="button" className="btn btn-primary btn-block" onClick={() => setSearchOpen(true)}>
        <Icon name="search" size={18} /> Add food
      </button>

      {/* ── Repeat something ────────────────────────────────────────────── */}
      {frequentQuery.data?.meals?.length > 0 && (
        <>
          <p className="screen-section-title">Log again</p>
          <div className="rail">
            {frequentQuery.data.meals.slice(0, 8).map((meal) => (
              <button
                key={`${meal.name}-${meal.meal_type}`}
                type="button"
                className="card card-tappable"
                disabled={logMeal.isPending}
                onClick={() => logAgain(meal)}
              >
                <div style={{ fontSize: 22 }} aria-hidden="true">{meal.emoji ?? '🍽️'}</div>
                <div className="list-row-title" style={{ marginTop: 6 }}>{meal.name}</div>
                <div className="list-row-meta">
                  {formatNumber(meal.calories)} kcal · {mealTypeLabel(meal.meal_type)}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── The day's entries ───────────────────────────────────────────── */}
      <p className="screen-section-title">
        {meals.length} {meals.length === 1 ? 'entry' : 'entries'}
      </p>

      {dayQuery.isPending ? (
        <SkeletonList count={4} />
      ) : dayQuery.error ? (
        <ErrorBanner error={dayQuery.error} />
      ) : meals.length === 0 ? (
        <Card>
          <EmptyState icon="🍽️" title="Nothing logged for this day">
            Tap “Add food” to search the catalog, or repeat something you eat often.
          </EmptyState>
        </Card>
      ) : (
        <div className="stack-lg">
          {grouped.map((group) => (
            <div key={group.value}>
              <div className="row-between" style={{ marginBottom: 8 }}>
                <span className="screen-section-title" style={{ marginTop: 0 }}>
                  {group.icon} {group.label}
                </span>
                <span className="badge badge-green numeric">
                  {formatNumber(group.entries.reduce((sum, meal) => sum + Number(meal.calories), 0))} kcal
                </span>
              </div>

              <div className="list">
                {group.entries.map((meal) => (
                  <SwipeRow
                    key={meal.id}
                    onDelete={() => deleteMeal.mutate(meal.id)}
                    deleteLabel={`Remove ${meal.name}`}
                    disabled={deleteMeal.isPending}
                  >
                    <div className="list-row">
                      <span className="list-row-emoji" aria-hidden="true">
                        {meal.emoji ?? mealTypeIcon(meal.meal_type)}
                      </span>
                      <div className="list-row-body">
                        <div className="list-row-title">{meal.name}</div>
                        <div className="list-row-meta">
                          {formatNumber(meal.quantity)}
                          {meal.unit} · {formatNumber(meal.protein_g, 1)}P · {formatNumber(meal.carbs_g, 1)}C ·{' '}
                          {formatNumber(meal.fat_g, 1)}F
                        </div>
                      </div>
                      <span className="badge numeric">{formatNumber(meal.calories)}</span>
                      <DeleteButton
                        label={`Remove ${meal.name}`}
                        onClick={() => deleteMeal.mutate(meal.id)}
                        disabled={deleteMeal.isPending}
                      />
                    </div>
                  </SwipeRow>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Sheets ──────────────────────────────────────────────────────── */}
      <FoodSearchSheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(food) => {
          setSearchOpen(false);
          setSelectedFood(food);
        }}
        onCreateCustom={() => {
          setSearchOpen(false);
          setCustomOpen(true);
        }}
      />

      {selectedFood && (
        <PortionSheet
          food={selectedFood}
          date={date}
          onClose={() => setSelectedFood(null)}
          onSubmit={(payload) => logMeal.mutate(payload)}
          submitting={logMeal.isPending}
        />
      )}

      {/* Mounted only while open so the form is empty every time. */}
      {customOpen && (
        <CustomFoodSheet
          open
          onClose={() => setCustomOpen(false)}
          onSubmit={(payload) => createFood.mutate(payload)}
          submitting={createFood.isPending}
          error={createFood.error}
        />
      )}
    </Screen>
  );
}
