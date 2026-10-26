import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/publications', label: 'Publications' },
  { to: '/experience', label: 'Experience' },
];

function Nav() {
  return (
    <nav className="absolute top-0 left-0 z-10 px-6 pt-6 sm:px-8 sm:pt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-sm">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end
          className={({ isActive }) =>
            `underline-offset-4 transition-colors ${isActive
              ? 'text-neutral-900 underline'
              : 'text-neutral-500 hover:text-neutral-800 hover:underline'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default Nav;
