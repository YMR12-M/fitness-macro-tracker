// Food search, as a sheet rather than an inline field.
//
// On a phone the keyboard covers half the screen the moment a search field
// takes focus, so an inline search box leaves two or three results visible
// under it. A sheet that opens at full height gives the results the whole
// remaining screen, and closes back to the log the instant one is chosen.
//
// Results come from the local catalog first and from USDA FoodData Central when
// the local catalog is thin for a term — the result header says which, so the
// origin of the numbers is never a mystery.
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { foods } from '../../api/endpoints.js';
import { useDebounced } from '../../hooks/useDebounced.js';
import { EmptyState } from '../../components/ui/Card.jsx';
import { Sheet } from '../../components/ui/Sheet.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { SkeletonList } from '../../components/ui/Skeleton.jsx';
import { formatNumber } from '../../lib/format.js';

export function FoodSearchSheet({ open, onClose, onSelect, onCreateCustom }) {
  const [term, setTerm] = useState('');
  const debouncedTerm = useDebounced(term, 350);
  const inputRef = useRef(null);

  // Focus the field as the sheet settles. Deliberately *not* autoFocus: iOS
  // ignores it inside an element that animates in, and focusing mid-animation
  // makes the keyboard shove the half-open sheet up the screen.
  useEffect(() => {
    if (!open) {
      setTerm('');
      return undefined;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 340);
    return () => clearTimeout(timer);
  }, [open]);

  const { data, isFetching, error } = useQuery({
    queryKey: ['foods', 'search', debouncedTerm],
    queryFn: ({ signal }) => foods.search(debouncedTerm, 20, signal),
    enabled: open && debouncedTerm.trim().length > 0,
    // USDA lookups are comparatively slow, so a term's results are worth keeping.
    staleTime: 5 * 60_000
  });

  const results = data?.foods ?? [];
  const searching = isFetching && debouncedTerm.trim().length > 0;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add food"
      footer={
        <button type="button" className="btn btn-ghost" onClick={onCreateCustom}>
          + Custom food
        </button>
      }
    >
      <div className="field">
        <label className="field-label" htmlFor="food-search">
          Search foods
        </label>
        <input
          id="food-search"
          ref={inputRef}
          className="input"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Chicken breast, oats, banana…"
        />
        {debouncedTerm && (
          <p className="field-hint" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {searching && <Spinner label="Searching" />}
            {!searching && results.length > 0 && (
              <>
                {results.length} result{results.length === 1 ? '' : 's'}
                {data?.source === 'usda' && ' · USDA FoodData Central'}
                {data?.source === 'local' && ' · from your catalog'}
              </>
            )}
          </p>
        )}
      </div>

      {error && <p className="field-error">{error.message}</p>}

      {!debouncedTerm && (
        <EmptyState icon="🔍" title="Search the catalog">
          Start typing and results appear as you go — from your own foods first, then USDA FoodData Central.
        </EmptyState>
      )}

      {searching && results.length === 0 && <SkeletonList count={5} />}

      {debouncedTerm && !searching && results.length === 0 && (
        <EmptyState icon="🔍" title="No matches">
          Nothing matches “{debouncedTerm}”. You can add it as a custom food instead.
        </EmptyState>
      )}

      {results.length > 0 && (
        <div className="search-results">
          {results.map((food) => (
            <button
              key={food.id}
              type="button"
              className="list-row list-row-tappable"
              onClick={() => onSelect(food)}
            >
              <span className="list-row-emoji" aria-hidden="true">{food.emoji ?? '🍽️'}</span>
              <span className="list-row-body">
                <span className="search-result-name">{food.name}</span>
                <span className="search-result-macros">
                  {formatNumber(food.calories)} kcal · {formatNumber(food.protein_g, 1)}P ·{' '}
                  {formatNumber(food.carbs_g, 1)}C · {formatNumber(food.fat_g, 1)}F per{' '}
                  {formatNumber(food.serving_size)}
                  {food.serving_unit}
                  {food.brand ? ` · ${food.brand}` : ''}
                </span>
              </span>
              <span className={`badge ${food.source === 'custom' ? 'badge-blue' : ''}`}>
                {food.source === 'custom' ? 'Yours' : 'USDA'}
              </span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
