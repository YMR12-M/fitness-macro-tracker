import { BrandMark } from './BrandMark.jsx';

/**
 * The top of the sign-in and sign-up screens: a block of solid ink with the
 * wordmark and, on the full version, a headline set in stencil like a rule on a
 * gym wall. The strip of plates is decoration — a bar being loaded in the
 * three macro colours — and carries no data.
 *
 * `compact` keeps only the wordmark, for the registration wizard where the
 * form needs the room.
 */
const DECORATION = [
  ...Array.from({ length: 8 }, () => 'protein'),
  ...Array.from({ length: 7 }, () => 'carbs'),
  ...Array.from({ length: 5 }, () => 'fat')
];

export function AuthPoster({ compact = false }) {
  return (
    <header className="auth-poster">
      <div className="auth-lockup">
        <BrandMark size={compact ? 40 : 48} tone="plates" />
        <span className="auth-wordmark">FitTrack</span>
      </div>

      {!compact && (
        <>
          <p className="auth-headline">
            Eat to the
        <br />
        <em>number.</em>
        <br />
        Lift to the
        <br />
        <em>plan.</em>
          </p>

          <div className="plates" aria-hidden="true">
            {DECORATION.map((kind, i) => (
              <span key={i} className="plate is-on" style={{ '--c': `var(--${kind})`, '--i': i }} />
            ))}
          </div>
        </>
      )}
    </header>
  );
}
