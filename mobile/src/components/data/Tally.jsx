/**
 * A streak, kept the way it is kept on a gym wall: four strokes and a strike
 * through them make five.
 *
 * Capped at `max` marks so a long streak does not run off its card; the number
 * beside it in the page carries the full count, so this is a picture of the
 * streak rather than its record.
 */
const PITCH = 8; // distance between strokes
const GROUP_GAP = 16;
const HEIGHT = 26;

export function Tally({ count, max = 30 }) {
  const shown = Math.min(Math.max(Math.floor(count), 0), max);
  if (!shown) return null;

  const groups = Math.ceil(shown / 5);
  const groupWidth = 4 * PITCH;
  const width = groups * groupWidth + (groups - 1) * GROUP_GAP + 6;

  return (
    <svg className="tally" viewBox={`-3 0 ${width} ${HEIGHT}`} width={width} height={HEIGHT} aria-hidden="true">
      {Array.from({ length: groups }, (_, g) => {
        const marks = Math.min(5, shown - g * 5);
        const x0 = g * (groupWidth + GROUP_GAP);
        const strokes = Math.min(marks, 4);
        return (
          <g key={g}>
            {Array.from({ length: strokes }, (_, m) => (
              <line key={m} x1={x0 + m * PITCH} y1="2" x2={x0 + m * PITCH} y2={HEIGHT - 2} />
            ))}
            {marks === 5 && (
              <line className="strike" x1={x0 - 5} y1={HEIGHT - 5} x2={x0 + 3 * PITCH + 5} y2="5" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
