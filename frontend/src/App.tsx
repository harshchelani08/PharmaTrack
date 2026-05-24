import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { BillingCounter } from './pages/BillingCounter';
import {
  DrugCatalogPage, BatchManagementPage, ExpiryHeatmapPage,
  TransfersPage, PurchaseOrdersPage, SuppliersPage,
  ReportsPage, UserManagementPage, SubscriptionPage, SettingsPage,
} from './pages/PlaceholderPages';

// ─────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────
const DEMO_TENANTS = [
  { subdomain: 'apollo', name: 'Apollo Pharmacy Group', role: 'CHAIN_OWNER' as const },
  { subdomain: 'medplus', name: 'MedPlus Healthcare Ltd', role: 'BRANCH_MANAGER' as const },
  { subdomain: 'healthline', name: 'HealthLine Pharma', role: 'PHARMACIST' as const },
];

const LoginPage: React.FC = () => {
  const { login } = useAppStore();
  const [selectedTenant, setSelectedTenant] = useState(DEMO_TENANTS[0]);
  const [email, setEmail] = useState('admin@apollo.pharmatrack.in');
  const [password, setPassword] = useState('Demo@123');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API authentication delay
    await new Promise((r) => setTimeout(r, 800));
    login(
      {
        id: 'usr_demo_001',
        email,
        firstName: selectedTenant.name.split(' ')[0],
        lastName: 'Admin',
        role: selectedTenant.role,
        branchId: 'br_demo_001',
        tenantId: `ten_${selectedTenant.subdomain}`,
      },
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_token',
      selectedTenant.subdomain,
      selectedTenant.name
    );
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#040810] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow spheres */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/6 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-500/6 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/4 blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md relative z-10 space-y-6"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', bounce: 0.4 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[#021812] font-black text-2xl mx-auto shadow-2xl shadow-emerald-500/20"
          >
            Rx
          </motion.div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">PharmaTrack</h1>
          <p className="text-[13px] text-slate-500 font-mono tracking-widest">ENTERPRISE · MULTI-TENANT · SAAS</p>
        </div>

        {/* Login Card */}
        <div className="glass p-7 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-200">Sign in to your chain</h2>
            <p className="text-xs text-slate-500 mt-1">Select a demo tenant to explore the platform</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Tenant Selector */}
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase font-mono block mb-2">Select Pharmacy Chain</label>
              <div className="space-y-2">
                {DEMO_TENANTS.map((tenant) => (
                  <button
                    key={tenant.subdomain}
                    type="button"
                    onClick={() => { setSelectedTenant(tenant); setEmail(`admin@${tenant.subdomain}.pharmatrack.in`); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedTenant.subdomain === tenant.subdomain
                        ? 'border-emerald-500/40 bg-emerald-500/8'
                        : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/30'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      selectedTenant.subdomain === tenant.subdomain
                        ? 'bg-gradient-to-br from-emerald-400 to-cyan-500 text-[#021812]'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {tenant.subdomain[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{tenant.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{tenant.subdomain}.pharmatrack.in · {tenant.role}</div>
                    </div>
                    {selectedTenant.subdomain === tenant.subdomain && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center flex-shrink-0">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#021812" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase font-mono block mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pharma-input" />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase font-mono block mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="pharma-input" />
              <div className="text-[10px] text-slate-600 mt-1.5">Demo password: Demo@123 (any value works)</div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center text-sm py-3.5 mt-2 shadow-xl shadow-emerald-500/15"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeOpacity="0.3"/>
                    <path d="M21 12a9 9 0 0 1-9 9"/>
                  </svg>
                  Authenticating…
                </div>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  Access Dashboard
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo Notice */}
        <div className="glass-sm px-4 py-3 text-center">
          <div className="text-[11px] text-slate-500">
            🔒 Demo Mode — No real API calls. All data is simulated.{' '}
            <span className="text-emerald-400/80">Backend, Go microservice & database schemas are fully written.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────
// PAGE ROUTER
// ─────────────────────────────────────────────
const pageComponents: Record<string, React.FC> = {
  dashboard: Dashboard,
  billing: BillingCounter,
  catalog: DrugCatalogPage,
  batches: BatchManagementPage,
  expiry: ExpiryHeatmapPage,
  transfers: TransfersPage,
  orders: PurchaseOrdersPage,
  suppliers: SuppliersPage,
  reports: ReportsPage,
  users: UserManagementPage,
  subscription: SubscriptionPage,
  settings: SettingsPage,
};

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────
export const App: React.FC = () => {
  const { user, pendingNav, clearNav } = useAppStore();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Handle programmatic navigation from any page component via Zustand
  useEffect(() => {
    if (pendingNav) {
      setActiveTab(pendingNav);
      clearNav();
    }
  }, [pendingNav, clearNav]);

  if (!user) {
    return <LoginPage />;
  }

  const ActivePage = pageComponents[activeTab] || Dashboard;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <ActivePage />
    </Layout>
  );
};
