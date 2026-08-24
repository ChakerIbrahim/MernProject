import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ links }) {
  if (!links.length) return null;

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="w-full shrink-0 border-b border-border bg-surface py-3 md:w-64 md:border-b-0 md:border-e md:bg-transparent md:py-6 md:pe-6"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 md:block md:space-y-1 md:overflow-visible md:pb-0">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex min-h-[44px] shrink-0 items-center rounded-md px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-1 focus-visible:outline-registry-green ${
                isActive ? 'bg-registry-green text-surface' : 'text-ink hover:bg-paper hover:text-registry-green'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

Sidebar.propTypes = {
  links: PropTypes.arrayOf(PropTypes.shape({
    to: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired
};
