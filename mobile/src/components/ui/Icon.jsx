/* The app's own icon set.
 *
 * Emoji stay where the glyph is content — a food's sticker, a goal's badge,
 * both chosen by the catalogue or the user. Chrome is different: emoji render
 * at a different weight and colour on every platform and cannot follow the
 * theme, so navigation, actions and empty states use these instead.
 *
 * Drawn on a 24×24 grid with square caps and mitred joins at a 2px stroke —
 * deliberately blunt, to sit next to the condensed display type rather than
 * the soft round-capped line icons every UI kit ships. They inherit
 * `currentColor` and scale with the box they are given. */

const PATHS = {
  // Navigation
  today: 'M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z',
  log: 'M5 3h14v18H5zM9 8h6M9 12h6M9 16h4',
  train: 'M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12',
  progress: 'M3 18l6-6 4 4 8-9M15 7h6v6',
  goals:
    'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 1v3M12 20v3M1 12h3M20 12h3',
  calculator: 'M5 3h14v18H5zM8 6h8v4H8zM8 14h2M14 14h2M8 18h2M14 18h2',
  settings: 'M3 7h11M18 7h3M14 4h4v6h-4zM3 17h3M10 17h11M6 14h4v6H6z',
  more: 'M3 6h18M3 12h18M3 18h12',
  user: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21a8 8 0 0 1 16 0',

  // Actions
  plus: 'M12 4v16M4 12h16',
  minus: 'M4 12h16',
  back: 'M15 4l-8 8 8 8',
  chevron: 'M9 4l8 8-8 8',
  close: 'M5 5l14 14M19 5L5 19',
  search: 'M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM16 16l5 5',
  trash: 'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
  check: 'M4 12l5 5 11-12',
  refresh: 'M20 12a8 8 0 1 1-2.5-5.8M20 3v5h-5',
  download: 'M12 3v13M6 11l6 6 6-6M4 21h16',
  logout: 'M10 4H4v16h6M15 8l5 4-5 4M20 12H9',
  lock: 'M5 10h14v11H5zM8 10V7a4 4 0 0 1 8 0v3',
  calendar: 'M3 5h18v16H3zM3 10h18M8 2v5M16 2v5',
  up: 'M12 20V5M5 12l7-7 7 7',
  down: 'M12 4v15M5 12l7 7 7-7',
  warn: 'M12 3L2 21h20zM12 10v5M12 18v.5',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.5',

  // Things the app tracks
  water: 'M12 2.5c4.5 5.2 7 8.4 7 12a7 7 0 0 1-14 0c0-3.6 2.5-6.8 7-12z',
  scale: 'M3 4h18v16H3zM7 12a5 5 0 0 1 10 0M12 12l2.5-3.5',
  flame: 'M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-2.5 1-4 2.5-5.5C9 10 10 11 11 11c0-3-1-5 1-9z',
  plate: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  clock: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4.5l3 2M9 1h6',

  // Meals, by time of day
  sunrise: 'M3 19h18M7 19a5 5 0 0 1 10 0M12 7v4M4.5 12l2 2M19.5 12l-2 2',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M19.4 4.6l-2.1 2.1M6.7 17.3l-2.1 2.1',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z',
  snack: 'M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 4 4 0 0 1-5-5zM8 14v.5M13 16v.5M9 9.5v.5'
};

export function Icon({ name, size = 20, className = '', strokeWidth = 2, ...rest }) {
  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={path} />
    </svg>
  );
}

/** True when `name` is one of the drawn icons — lets a prop accept either an
 *  icon name or a literal glyph (a food's emoji) without guessing. */
export const hasIcon = (name) => Object.hasOwn(PATHS, name);
