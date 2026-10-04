import { BrandMark } from './BrandMark.jsx';

/**
 * The left half of the sign-in and sign-up screens: a one-colour poster, the
 * way a gym puts its rules on the wall. The strip of plates at the bottom is
 * decoration — a bar being loaded in the three macro colours — and carries no
 * data.
 */
const DECORATION = [
  ...Array.from({ length: 8 }, () => 'protein'),
  ...Array.from({ length: 7 }, () => 'carbs'),
  ...Array.from({ length: 5 }, () => 'fat')
];

export function AuthPoster() {
  return (
    <aside className="auth-poster">
      <div className="auth-lockup">
        <BrandMark size={54} tone="plates" />
        <span className="auth-wordmark">FitTrack</span>
      </div>

      <p className="auth-headline">
        Eat to the
        <br />
        <em>number.</em>
        <br />
        Lift to the
        <br />
        <em>plan.</em>
      </p>

      <div className="auth-poster-foot" aria-hidden="true">
        <div className="plates">
          {DECORATION.map((kind, i) => (
            <span key={i} className="plate is-on" style={{ '--c': `var(--${kind})`, '--i': i }} />
          ))}
        </div>
        <p className="auth-poster-note">
          Calories, macros, training and body weight in one logbook. Nutrition numbers come from USDA FoodData
          Central.
        </p>
      </div>
    </aside>
  );
}
