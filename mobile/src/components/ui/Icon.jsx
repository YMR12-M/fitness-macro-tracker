/* Line icons for the app's own chrome — tab bar, app bar, chevrons, sheet
 * actions.
 *
 * Emoji stay where the glyph is content rather than chrome: meal types,
 * program badges and goal icons all come from the database and are the user's
 * or the catalogue's choice. Chrome is different — emoji render at a different
 * weight and colour on every platform, so a tab bar built from them cannot
 * follow the theme or sit on the brand green. These do both: they inherit
 * `currentColor` and scale with the box they are given.
 *
 * Drawn on a 24×24 grid with a 1.75 stroke, which is the weight that stays
 * legible at the 23px the tab bar renders them at. */

const PATHS = {
  today: 'M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  log: 'M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8 12h8M8 16h5',
  train: 'M4 9v6M20 9v6M7 6v12M17 6v12M7 12h10',
  progress: 'M4 19h16M6 16V9M11 16V5M16 16v-6',
  more: 'M4 7h16M4 12h16M4 17h10',
  plus: 'M12 5v14M5 12h14',
  back: 'm14 6-6 6 6 6',
  chevron: 'm9 6 6 6-6 6',
  close: 'M6 6l12 12M18 6 6 18',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM20 20l-4-4',
  trash: 'M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13',
  calendar: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
  water: 'M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z',
  scale: 'M5 8h14l2 12H3zM12 4v4M9 13h6',
  flame: 'M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-1.6.7-3 2-4 .2 1.4.9 2 1.7 2 .9 0 1.3-.8 1.3-2.2 0-1.4-.3-2.6 0-4.8z',
  target: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 11.5a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z',
  calculator: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
  settings:
    'M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-3-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-3l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 3 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z',
  logout: 'M15 17l5-5-5-5M20 12H9M12 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h7',
  download: 'M12 4v11M8 11l4 4 4-4M4 19h16',
  refresh: 'M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5',
  check: 'm5 12 5 5 9-10',
  lock: 'M6 10h12v10H6zM9 10V7a3 3 0 0 1 6 0v3'
};

export function Icon({ name, size = 22, className = '', strokeWidth = 1.75, ...rest }) {
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
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={path} />
    </svg>
  );
}
