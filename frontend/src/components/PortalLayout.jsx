import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NavigationDrawer from "./NavigationDrawer";
import NotificationBell from "./NotificationBell";
import InstallPrompt from "./InstallPrompt";
import { registerServiceWorker, enablePush } from "../portal/push";
import './NavigationDrawer.css';

export default function PortalLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  React.useEffect(() => {
    registerServiceWorker();
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      enablePush();
    }
  }, []);

  const sidebarMarginClass = sidebarCollapsed ? "md:ml-0" : "md:ml-[260px]";

  return (
    <div className="min-h-screen bg-[#F5F1EB]">
      {/* Top header bar */}
      <header className={`bg-[#0E1B2C] text-white shadow-lg transition-[margin] duration-300 ${sidebarMarginClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              className="md:hidden mr-2 p-2 rounded-md text-white/90 hover:bg-white/5"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Replace logo with text */}
            <div className="text-white font-bold text-lg">TFD WorkSpace</div>
            <div className="hidden sm:block">
              <p className="text-[10px] text-white/50 leading-tight">{isAdmin ? "Admin Control Panel" : "Employee Portal"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-[10px] text-white/50">{user?.designation || user?.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#024396] to-[#0356c4] flex items-center justify-center text-sm font-bold shadow">
              {user?.name?.charAt(0) || "U"}
            </div>
            <button
              onClick={logout}
              className="text-xs text-white/60 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Left Navigation Drawer for portal (desktop) - slides in/out */}
      <div className="hidden md:block">
        <NavigationDrawer
          role={isAdmin ? 'admin' : 'employee'}
          onNavigate={(p) => navigate(p)}
          desktop
          collapsed={sidebarCollapsed}
        />
        {/* 3-dot slider toggle to show/hide sidebar */}
        <button
          className={`sidebar-toggle-btn ${sidebarCollapsed ? 'collapsed' : ''}`}
          onClick={() => setSidebarCollapsed((v) => !v)}
          aria-label={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
          title={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 60 }}>
            <NavigationDrawer
              mobile
              role={isAdmin ? 'admin' : 'employee'}
              onNavigate={(p) => { navigate(p); setDrawerOpen(false); }}
              className={drawerOpen ? 'open' : ''}
            />
          </div>
        </div>
      )}

      {/* Page content - shifted on md screens to accommodate drawer, slides with it */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 py-6 transition-[margin] duration-300 ${sidebarMarginClass}`}>
        {children}
      </main>

      <InstallPrompt />
    </div>
  );
}
