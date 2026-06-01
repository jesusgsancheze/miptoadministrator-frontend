import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/periods', label: 'Periods' },
  { to: '/incomes', label: 'Incomes' },
  { to: '/payments', label: 'Payments' },
  { to: '/projects', label: 'Projects' },
  { to: '/clients', label: 'Clients' },
  { to: '/categories', label: 'Categories' },
  { to: '/people', label: 'People' },
  { to: '/loans', label: 'Loans' },
  { to: '/settings', label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="layout">
      <nav className="sidebar">
        <h1>Mipto Administrator</h1>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            {l.label}
          </NavLink>
        ))}
        <div className="spacer" />
        <span className="muted" style={{ padding: '0 8px', fontSize: 13 }}>
          {user?.name}
        </span>
        <button className="ghost" onClick={logout}>Log out</button>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
