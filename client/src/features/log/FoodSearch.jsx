// Food search against the catalog. Results come from the local cache first and
// from USDA FoodData Central when the local catalog is thin for a term — the
// result header says which, so the origin of the numbers is never a mystery.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { foods } from '../../api/endpoints.js';
import { useDebounced } from '../../hooks/useDebounced.js';
import { EmptyState } from '../../components/Card.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { formatNumber } from '../../lib/format.js';
import { Icon } from '../../components/Icon.jsx';

export function FoodSearch({ onSelect }) {
  const [term, setTerm] = useState('');
  const debouncedTerm = useDebounced(term, 350);

  const { data, isFetching, error } = useQuery({
    queryKey: ['foods', 'search', debouncedTerm],
    queryFn: ({ signal }) => foods.search(debouncedTerm, 20, signal),
    enabled: debouncedTerm.trim().length > 0,
    // USDA lookups are comparatively slow, so a term's results are worth keeping.
    staleTime: 5 * 60_000
  });

  const results = data?.foods ?? [];

  return (
    <div className="field">
      <label className="field-label" htmlFor="food-search">
        Search foods
      </label>
      <input
        id="food-search"
        className="input"
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Chicken breast, oats, banana…"
        autoComplete="off"
      />

      {debouncedTerm && (
        <p className="field-hint" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isFetching && <Spinner label="Searching" />}
          {!isFetching && results.length > 0 && (
            <>
              {results.length} result{results.length === 1 ? '' : 's'}
              {data?.source === 'usda' && ' · fetched from USDA FoodData Central'}
              {data?.source === 'local' && ' · from your catalog'}
            </>
          )}
        </p>
      )}

      {error && <p className="field-error">{error.message}</p>}

      {debouncedTerm && !isFetching && results.length === 0 && (
        <EmptyState icon="search" title="No matches">
          Nothing in the catalog matches “{debouncedTerm}”. You can add it as a custom food instead.
        </EmptyState>
      )}

      {results.length > 0 && (
        <div className="search-results">
          {results.map((food) => (
            <button key={food.id} type="button" className="search-result" onClick={() => onSelect(food)}>
              <span className="list-row-emoji" aria-hidden="true">{food.emoji ?? <Icon name="plate" size={20} />}</span>
              <span className="list-row-body">
                <span className="search-result-name">{food.name}</span>
                <span className="search-result-macros">
                  {formatNumber(food.calories)} kcal · {formatNumber(food.protein_g, 1)}P ·{' '}
                  {formatNumber(food.carbs_g, 1)}C · {formatNumber(food.fat_g, 1)}F
                  {' per '}
                  {formatNumber(food.serving_size)}
                  {food.serving_unit}
                  {food.brand ? ` · ${food.brand}` : ''}
                </span>
              </span>
              <span className={`badge ${food.source === 'custom' ? 'badge-info' : ''}`}>
                {food.source === 'custom' ? 'Yours' : 'USDA'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
