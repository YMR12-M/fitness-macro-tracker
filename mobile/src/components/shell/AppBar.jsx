import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon.jsx';
import { useCondensedHeader } from '../../hooks/useCondensedHeader.js';

/**
 * The fixed bar at the top of every screen.
 *
 * Fixed rather than sticky on purpose: on iOS the address bar collapses as you
 * scroll, and a sticky header gets dragged along with the resulting viewport
 * resize. It gains a hairline border once the screen has scrolled, which is
 * the only cue that anything is underneath a translucent bar.
 */
export function AppBar({ title, subtitle, back, trailing }) {
  const navigate = useNavigate();
  const condensed = useCondensedHeader();

  return (
    <header className={`appbar${condensed ? ' is-condensed' : ''}`}>
      <div className="appbar-row">
        {back && (
          <div className="appbar-lead">
            <button
              type="button"
              className="appbar-btn"
              // `back` may be a path to return to; falling back to history means
              // a screen opened from two places returns to whichever it came
              // from, rather than always to one of them.
              onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
              aria-label="Back"
            >
              <Icon name="back" size={22} />
            </button>
          </div>
        )}

        <div className="appbar-heading">
          <h1 className="appbar-title">{title}</h1>
          {subtitle && <p className="appbar-subtitle">{subtitle}</p>}
        </div>

        {trailing && <div className="appbar-trail">{trailing}</div>}
      </div>
    </header>
  );
}
