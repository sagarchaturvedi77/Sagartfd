import React from 'react';
import PropTypes from 'prop-types';
import './NavigationDrawer.css';

// Simple Navigation Drawer component. Integrate into your layout (e.g. App.js)
// Usage: <NavigationDrawer role={user.role} onNavigate={(path) => history.push(path)} mobile={false} />

const adminItems = [
  { key: 'dashboard',   label: '📊 Dashboard',        path: '/portal/admin' },
  { key: 'attendance',  label: '🕐 Attendance',        path: '/portal/admin/attendance' },
  { key: 'leads',       label: '📋 Leads',             path: '/portal/admin/leads' },
  { key: 'pipelines',   label: '🔀 Pipelines',         path: '/portal/admin/pipelines' },
  { key: 'salary',      label: '💰 Salary',            path: '/portal/admin/salary' },
  { key: 'tasks',       label: '✅ Tasks',             path: '/portal/admin/tasks' },
  { key: 'targets',     label: '🎯 Targets',           path: '/portal/admin/targets' },
  { key: 'reports',     label: '📈 Reports',           path: '/portal/admin/reports' },
  { key: 'leaves',      label: '🌴 Leave Requests',    path: '/portal/admin/leaves' },
  { key: 'chat',        label: '💬 Team Chat',         path: '/portal/admin/chat' },
  { key: 'access',      label: '🔑 Access Control',    path: '/portal/admin/access' },
  { key: 'announce',    label: '📢 Announcements',     path: '/portal/admin/announce' },
  { key: 'website',     label: '🌐 Website / Content', path: '/portal/admin/website' },
];

const employeeItems = [
  { key: 'dashboard',    label: '📊 Dashboard',       path: '/portal/employee' },
  { key: 'attendance',   label: '🕐 Attendance',       path: '/portal/employee/attendance' },
  { key: 'leads',        label: '📋 My Leads',         path: '/portal/employee/leads' },
  { key: 'calculators',  label: '🧮 Calculators',      path: '/portal/employee/calculators' },
  { key: 'id-card',      label: '🪪 ID & Visiting Card', path: '/portal/employee/id-card' },
  { key: 'salary',       label: '💰 Salary',           path: '/portal/employee/salary' },
  { key: 'tasks',        label: '✅ Tasks',            path: '/portal/employee/tasks' },
  { key: 'targets',      label: '🎯 Targets',          path: '/portal/employee/targets' },
  { key: 'leaves',       label: '🌴 My Leaves',        path: '/portal/employee/leaves' },
  { key: 'chat',         label: '💬 Team Chat',        path: '/portal/employee/chat' },
  { key: 'profile',      label: '👤 My Profile',       path: '/portal/employee/profile' },
  { key: 'settings',     label: '⚙️ Settings',         path: '/portal/employee/settings' },
];

export default function NavigationDrawer({ role = 'employee', onNavigate, mobile = false, desktop = false, collapsed = false, className = '' }) {
  const items = role === 'admin' ? adminItems : employeeItems;

  return (
    <nav
      className={`nav-drawer ${mobile ? 'mobile' : ''} ${desktop ? 'desktop' : ''} ${collapsed ? 'collapsed' : ''} ${className}`.trim().replace(/\s+/g, ' ')}
      aria-label="Portal navigation"
    >
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
  desktop: PropTypes.bool,
  collapsed: PropTypes.bool,
  className: PropTypes.string,
};
