import React from 'react';
import PropTypes from 'prop-types';
import './NavigationDrawer.css';

// Simple Navigation Drawer component. Integrate into your layout (e.g. App.js)
// Usage: <NavigationDrawer role={user.role} onNavigate={(path) => history.push(path)} />

const menuItems = {
  admin: [
    { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { key: 'profile', label: 'Profile', path: '/profile' },
    { key: 'attendance', label: 'Attendance', path: '/attendance' },
    { key: 'pipelines', label: 'Pipelines', path: '/pipelines' },
    { key: 'employees', label: 'Employees', path: '/employees' },
    { key: 'assign', label: 'Assign Pipeline', path: '/pipelines/assign' },
    { key: 'settings', label: 'Settings', path: '/settings' },
    { key: 'logout', label: 'Logout', path: '/logout' }
  ],
  employee: [
    { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { key: 'profile', label: 'Profile', path: '/profile' },
    { key: 'attendance', label: 'Attendance', path: '/attendance' },
    { key: 'pipelines', label: 'My Pipelines', path: '/pipelines' },
    { key: 'settings', label: 'Settings', path: '/settings' },
    { key: 'logout', label: 'Logout', path: '/logout' }
  ]
};

export default function NavigationDrawer({ role = 'employee', onNavigate }) {
  const items = menuItems[role] || menuItems.employee;

  return (
    <nav className="nav-drawer">
      <div className="nav-header">App</div>
      <ul className="nav-list">
        {items.map(item => (
          <li key={item.key} className="nav-item" onClick={() => onNavigate(item.path)}>
            {item.label}
          </li>
        ))}
      </ul>
    </nav>
  );
}

NavigationDrawer.propTypes = {
  role: PropTypes.oneOf(['admin', 'employee']),
  onNavigate: PropTypes.func.isRequired
};
