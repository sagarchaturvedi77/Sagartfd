import React from 'react';
import PropTypes from 'prop-types';
import './NavigationDrawer.css';

// Simple Navigation Drawer component. Integrate into your layout (e.g. App.js)
// Usage: <NavigationDrawer role={user.role} onNavigate={(path) => history.push(path)} mobile={false} />

const adminItems = [
  { key: 'dashboard', label: 'Dashboard', path: '/portal/admin' },
  { key: 'attendance', label: 'Attendance', path: '/portal/admin/attendance' },
  { key: 'pipelines', label: 'Pipelines', path: '/portal/admin/pipelines' },
  { key: 'employees', label: 'Employees', path: '/portal/admin/employees' },
  { key: 'assign', label: 'Assign Pipeline', path: '/portal/admin/pipelines/assign' },
  { key: 'salary', label: 'Salary', path: '/portal/admin/salary' },
  { key: 'tasks', label: 'Tasks', path: '/portal/admin/tasks' },
  { key: 'targets', label: 'Targets', path: '/portal/admin/targets' },
  { key: 'reports', label: 'Reports', path: '/portal/admin/reports' },
  { key: 'website', label: 'Website / Content', path: '/portal/admin/website' },
  { key: 'settings', label: 'Settings', path: '/portal/admin/settings' },
  { key: 'logout', label: 'Logout', path: '/logout' },
];

const employeeItems = [
  { key: 'dashboard', label: 'Dashboard', path: '/portal/employee' },
  { key: 'attendance', label: 'Attendance', path: '/portal/employee/attendance' },
  { key: 'pipelines', label: 'My Pipelines', path: '/portal/employee/pipelines' },
  { key: 'salary', label: 'Salary', path: '/portal/employee/salary' },
  { key: 'tasks', label: 'Tasks', path: '/portal/employee/tasks' },
  { key: 'targets', label: 'Targets', path: '/portal/employee/targets' },
  { key: 'profile', label: 'My Profile', path: '/portal/employee/profile' },
  { key: 'documents', label: 'Documents', path: '/portal/employee/documents' },
  { key: 'settings', label: 'Settings', path: '/portal/employee/settings' },
  { key: 'logout', label: 'Logout', path: '/logout' },
];

export default function NavigationDrawer({ role = 'employee', onNavigate, mobile = false }) {
  const items = role === 'admin' ? adminItems : employeeItems;

  return (
    <nav className={`nav-drawer ${mobile ? 'mobile' : ''}`} aria-label="Portal navigation">
      <div className="nav-header">TFD WorkSpace</div>
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
  role: PropTypes.oneOf(['admin','employee']),
  onNavigate: PropTypes.func.isRequired,
  mobile: PropTypes.bool,
};
