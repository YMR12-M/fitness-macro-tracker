// The Macro Ring: a calorie ring split into protein / carbs / fat arcs, with an
// "F" standing in the middle of it.
//
// Arc lengths are shares of the circle's 138.23 circumference (2π × 22), so the
// three segments read as a real macro split — 37.5 / 22.5 / 15 % — rather than
// arbitrary decoration, and the open fifth of the ring is the day still to eat.
//
// `tone="plates"` paints the arcs in the three plate colours; the default draws
// everything in currentColor so the mark can sit on any surface in one ink.
export function BrandMark({ size = 32, title = 'FitTrack Pro', tone = 'ink' }) {
  const plates = tone === 'plates';
  const arc = (name) => (plates ? `var(--${name})` : 'currentColor');

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title}>
      <g transform="rotate(-90 32 32)" fill="none" strokeWidth="9" strokeLinecap="butt">
        {/* the whole ring, faint: what a full day would look like */}
        <circle cx="32" cy="32" r="22" stroke="currentColor" opacity="0.16" />
        {/* protein — 37.5% */}
        <circle cx="32" cy="32" r="22" stroke={arc('protein')} strokeDasharray="51.84 86.39" />
        {/* carbs — 22.5% */}
        <circle cx="32" cy="32" r="22" stroke={arc('carbs')} strokeDasharray="31.1 107.13" strokeDashoffset="-55.34" />
        {/* fat — 15% */}
        <circle cx="32" cy="32" r="22" stroke={arc('fat')} strokeDasharray="20.73 117.5" strokeDashoffset="-89.94" />
      </g>
      {/* the F */}
      <path fill="currentColor" d="M20 22h22v5.5H25.5v3.5H35v5.5h-9.5V42H20z" />
    </svg>
  );
}
