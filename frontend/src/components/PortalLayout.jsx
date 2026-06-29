import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NavigationDrawer from "./NavigationDrawer";
import NotificationBell from "./NotificationBell";
import InstallPrompt from "./InstallPrompt";
import { registerServiceWorker, enablePush } from "../portal/push";

const adminNav = [ /* kept for backwards-compat, not used for top tabs anymore */ ];
const employeeNav = [ /* kept for backwards-compat, not used for top tabs anymore */ ];

export default function PortalLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  React.useEffect(() => {
    registerServiceWorker();
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      enablePush();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F1EB]">
      {/* Top header bar */}
      <header className="bg-[#0E1B2C] text-white shadow-lg md:ml-[260px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {/* Replace logo with text */}
            <div className="text-white font-bold text-lg">TFD WorkSpace</div>
            <div className="hidden sm:block">
              <p className="text-[10px] text-white/50 leading-tight">
                {isAdmin ? "Admin Control Panel" : "Employee Portal"}
              </p>
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

      {/* Left Navigation Drawer for portal (desktop) */}
      <div className="hidden md:block">
        <div style={{ position: "fixed", top: 64, left: 0 }}>
          <NavigationDrawer role={isAdmin ? 'admin' : 'employee'} onNavigate={(p) => navigate(p)} />
        </div>
      </div>

      {/* Page content - shifted on md screens to accommodate drawer */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:ml-[260px]">
        {children}
      </main>

      <InstallPrompt />
    </div>
  );
}
