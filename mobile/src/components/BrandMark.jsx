// The Macro Ring: a calorie ring split into protein / carbs / fat arcs, with
// the "F" of FitTrack formed by the two bars across it.
//
// Ported from the hand-built SVG in the previous version of the app. Arc
// lengths are shares of the circle's 138.23 circumference (2π × 22), so the
// three segments read as a real macro split rather than arbitrary decoration.
export function BrandMark({ size = 32, title = 'FitTrack Pro' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title}>
      <g
        transform="rotate(-90 32 32)"
        fill="none"
        stroke="currentColor"
        strokeWidth="7.5"
        strokeLinecap="round"
      >
        {/* protein — 37.5% */}
        <circle cx="32" cy="32" r="22" strokeDasharray="51.87 86.36" />
        {/* carbs — 22.5% */}
        <circle cx="32" cy="32" r="22" strokeDasharray="31.12 107.11" strokeDashoffset="-63.37" />
        {/* fat — 15% */}
        <circle cx="32" cy="32" r="22" strokeDasharray="20.75 117.48" strokeDashoffset="-105.98" />
      </g>
      <rect x="20" y="25.5" width="24" height="5" rx="2.5" fill="currentColor" />
      <rect x="20" y="33.5" width="15" height="5" rx="2.5" fill="currentColor" />
    </svg>
  );
}
