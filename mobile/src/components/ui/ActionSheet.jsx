import { Icon } from './Icon.jsx';
import { Sheet } from './Sheet.jsx';

/**
 * A sheet whose whole body is a short list of destinations — the quick-add
 * menu behind the tab bar's + button.
 *
 * Each row is 64px tall and full width, so it is a target you can hit without
 * looking. `icon` is the name of a drawn icon; the tile is ink on paper, so
 * colour stays reserved for data.
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
            <span className="actionsheet-icon" aria-hidden="true">
              <Icon name={action.icon} size={24} />
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
