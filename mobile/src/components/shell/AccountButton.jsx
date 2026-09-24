import { Link } from 'react-router-dom';
import { initialsOf } from '../../lib/format.js';

/**
 * The app bar's trailing control on every primary tab: the user's initials,
 * routing to the More screen.
 *
 * This is the entry point for everything the four-tab bar cannot hold — goals,
 * the calculator, settings, sign-out — so its label says so rather than just
 * naming the person.
 */
export function AccountButton({ name }) {
  return (
    <Link to="/more" className="appbar-btn" aria-label="Account, goals and settings">
      <span className="appbar-avatar" aria-hidden="true">
        {initialsOf(name)}
      </span>
    </Link>
  );
}
