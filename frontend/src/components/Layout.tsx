import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

// Nav Icons (using unicode for zero-dependency, production would use lucide-react)
const icons: Record<string, string> = {
  dashboard: '◈',
  billing: '⚡',
  catalog: '💊',
  batches: '📦',
  expiry: '📅',
  transfers: '↔️',
  reports: '📈',
  suppliers: '🏢',
  orders: '🛒',
  users: '👥',
  settings: '⚙️',
  subscription: '💎',
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', section: 'OVERVIEW' },
  { id: 'billing', label: 'POS Billing Counter', section: 'OPERATIONS' },
  { id: 'catalog', label: 'Drug Master Catalog', section: 'OPERATIONS' },
  { id: 'batches', label: 'FEFO Batch Manager', section: 'OPERATIONS' },
  { id: 'expiry', label: 'Expiry Heat Tracker', section: 'OPERATIONS' },
  { id: 'transfers', label: 'Inter-Branch Transfers', section: 'LOGISTICS' },
  { id: 'orders', label: 'Purchase Orders', section: 'LOGISTICS' },
  { id: 'suppliers', label: 'Supplier Management', section: 'LOGISTICS' },
  { id: 'reports', label: 'Analytics & Reports', section: 'ANALYTICS' },
  { id: 'users', label: 'User Management', section: 'ADMIN' },
  { id: 'subscription', label: 'SaaS Billing', section: 'ADMIN' },
  { id: 'settings', label: 'System Settings', section: 'ADMIN' },
];

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { user, tenantName, tenantSubdomain, logout, alerts, addAlert, markAlertRead, sidebarCollapsed, toggleSidebar } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  // Close notifications on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Simulate real-time Redis Streams WebSocket alert feed
  useEffect(() => {
    const demoAlerts = [
      { type: 'LOW_STOCK' as const, message: "Paracetamol 650mg (Dolo) — only 18 units remain in Branch APL-01.", branchCode: 'APL-01' },
      { type: 'NEAR_EXPIRY' as const, message: "Batch DL-4482 of Amoxicillin 500mg expires in 11 days.", branchCode: 'MED-02' },
      { type: 'TRANSFER_REQUEST' as const, message: "Branch MED-03 requested 50 units of Atorvastatin 10mg.", branchCode: 'MED-03' },
      { type: 'SUSPICIOUS_ACTIVITY' as const, message: "5 consecutive refunds processed at Counter 02 within 20 minutes.", branchCode: 'APL-01' },
    ];

    // Initial seed alert on mount
    const seedTimer = setTimeout(() => {
      addAlert(demoAlerts[0]);
    }, 3000);

    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        const pick = demoAlerts[Math.floor(Math.random() * demoAlerts.length)];
        addAlert(pick);
      }
    }, 30000);

    return () => {
      clearTimeout(seedTimer);
      clearInterval(interval);
    };
  }, [addAlert]);

  const sections = [...new Set(navItems.map((i) => i.section))];

  const alertColors: Record<string, string> = {
    LOW_STOCK: 'badge-green',
    NEAR_EXPIRY: 'badge-amber',
    SUSPICIOUS_ACTIVITY: 'badge-red',
    TRANSFER_REQUEST: 'badge-blue',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#070b13]">
      {/* ========== SIDEBAR ========== */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="flex-shrink-0 flex flex-col bg-[#0a1120] border-r border-[#1e293b]/60 relative z-40 overflow-hidden"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1e293b]/50 flex-shrink-0">
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2.5 overflow-hidden"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[#021812] font-black text-sm flex-shrink-0">
                  Rx
                </div>
                <div>
                  <div className="text-sm font-bold text-white leading-none">PharmaTrack</div>
                  <div className="text-[10px] text-emerald-400/80 font-mono tracking-widest mt-0.5 truncate">
                    {tenantSubdomain?.toUpperCase()}.PHARMATRACK
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[#021812] font-black text-sm mx-auto">
              Rx
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-all text-sm"
            >
              ◀
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {sections.map((section) => (
            <div key={section}>
              {!sidebarCollapsed && (
                <div className="px-3 mb-1.5 text-[9px] font-bold tracking-[0.2em] text-slate-600 uppercase">
                  {section}
                </div>
              )}
              <div className="space-y-0.5">
                {navItems
                  .filter((item) => item.section === section)
                  .map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="active-pill"
                            className="absolute inset-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                          />
                        )}
                        <span className="relative z-10 text-base leading-none">{icons[item.id]}</span>
                        {!sidebarCollapsed && (
                          <span className="relative z-10 truncate">{item.label}</span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-[#1e293b]/50 flex-shrink-0">
          {sidebarCollapsed ? (
            <button
              onClick={logout}
              title="Logout"
              className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-sm"
            >
              ⏻
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-xs flex-shrink-0">
                  {user?.firstName[0]}{user?.lastName[0]}
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate capitalize">
                    {user?.role.replace('_', ' ')}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full py-2 text-center rounded-lg border border-slate-800 text-[11px] font-semibold text-slate-500 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </motion.aside>

      {/* ========== MAIN PANEL ========== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-[#1e293b]/50 bg-[#070b13]/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-4">
            {sidebarCollapsed && (
              <button
                onClick={toggleSidebar}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
              >
                ▶
              </button>
            )}
            <div>
              <h2 className="text-sm font-semibold text-slate-200 capitalize">{tenantName}</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider">LIVE — All systems operational</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                id="notification-bell"
                onClick={() => setShowNotifications((v) => !v)}
                className={`relative w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                  showNotifications
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold flex items-center justify-center text-white border-2 border-[#070b13]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 glass rounded-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-[#1e293b]/60 flex justify-between items-center">
                      <div>
                        <div className="text-sm font-bold text-slate-200">System Alerts</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{unreadCount} unread notifications</div>
                      </div>
                      <button onClick={() => useAppStore.getState().clearAlerts()} className="text-[10px] text-slate-500 hover:text-rose-400 transition-all">
                        Clear all
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {alerts.length === 0 ? (
                        <div className="p-8 text-center text-slate-600 text-xs">No active alerts</div>
                      ) : (
                        <div className="divide-y divide-[#1e293b]/40">
                          {alerts.slice(0, 10).map((alert) => (
                            <button
                              key={alert.id}
                              onClick={() => markAlertRead(alert.id)}
                              className={`w-full p-3 text-left transition-all hover:bg-slate-800/30 ${!alert.isRead ? 'bg-slate-900/30' : ''}`}
                            >
                              <div className="flex items-start gap-2">
                                {!alert.isRead && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></div>}
                                <div>
                                  <span className={`badge ${alertColors[alert.type]} mb-1 inline-block`}>
                                    {alert.type.replace('_', ' ')}
                                  </span>
                                  <p className="text-[11px] text-slate-300 leading-relaxed">{alert.message}</p>
                                  {alert.branchCode && (
                                    <span className="text-[10px] text-slate-600 font-mono mt-0.5 block">Branch: {alert.branchCode}</span>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Live Shift Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[10px] font-semibold text-emerald-400 font-mono tracking-widest">SHIFT ACTIVE</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-screen-2xl mx-auto">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};
