import { Sheet } from './Sheet.jsx';

/**
 * A sheet whose whole body is a short list of destinations — the quick-add
 * menu behind the tab bar's + button.
 *
 * Each row is 60px tall and full width, so it is a target you can hit without
 * looking. `tone` colours only the icon chip: the label stays at text contrast
 * rather than being tinted into something harder to read.
 */
export function ActionSheet({ open, onClose, title = 'Quick add', actions }) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="actionsheet">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="actionsheet-item"
            onClick={() => {
              onClose();
              action.onSelect();
            }}
          >
            <span
              className="actionsheet-icon"
              style={{ background: `color-mix(in srgb, ${action.tone} 16%, transparent)`, color: action.tone }}
              aria-hidden="true"
            >
              {action.icon}
            </span>
            <span>
              <span className="actionsheet-label">{action.label}</span>
              {action.hint && <span className="actionsheet-hint"> · {action.hint}</span>}
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
