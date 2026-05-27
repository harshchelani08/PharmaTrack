import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';

// ─────────────────────────────────────────────
// MOCK DATA (wired to real APIs via TanStack Query in production)
// ─────────────────────────────────────────────
const weeklyRevenue = [
  { day: 'Mon', revenue: 52480, margin: 18240 },
  { day: 'Tue', revenue: 43900, margin: 14200 },
  { day: 'Wed', revenue: 68200, margin: 25100 },
  { day: 'Thu', revenue: 59400, margin: 20800 },
  { day: 'Fri', revenue: 82300, margin: 31200 },
  { day: 'Sat', revenue: 97500, margin: 38900 },
  { day: 'Sun', revenue: 74100, margin: 27600 },
];

const categoryBreakdown = [
  { name: 'Analgesics', value: 31, color: '#10b981' },
  { name: 'Antibiotics', value: 22, color: '#06b6d4' },
  { name: 'Cardiology', value: 18, color: '#8b5cf6' },
  { name: 'Antidiabetics', value: 15, color: '#f59e0b' },
  { name: 'Vitamins', value: 9,  color: '#ec4899' },
  { name: 'Others', value: 5, color: '#64748b' },
];

const branchPerformance = [
  { branch: 'APL-01', revenue: 185000, target: 200000 },
  { branch: 'APL-02', revenue: 142000, target: 150000 },
  { branch: 'MED-01', revenue: 97000,  target: 120000 },
  { branch: 'MED-02', revenue: 215000, target: 200000 },
  { branch: 'HLT-01', revenue: 78000,  target: 100000 },
];

const topDrugs = [
  { name: 'Dolo 650mg', generic: 'Paracetamol', category: 'Analgesics', units: 4120, revenue: 61800, stock: 380, status: 'IN_STOCK' },
  { name: 'Augmentin 625',generic: 'Amoxicillin+Clav', category: 'Antibiotics', units: 1840, revenue: 235200, stock: 72, status: 'LOW_STOCK' },
  { name: 'Lipitor 10mg', generic: 'Atorvastatin', category: 'Cardiology', units: 2310, revenue: 196350, stock: 245, status: 'IN_STOCK' },
  { name: 'Glycomet 500',  generic: 'Metformin', category: 'Antidiabetics', units: 3050, revenue: 91500, stock: 14, status: 'CRITICAL' },
  { name: 'Calpol Susp',  generic: 'Paracetamol Syrup', category: 'Pediatrics', units: 980,  revenue: 58800, stock: 195, status: 'IN_STOCK' },
];

const recentActivity = [
  { id: 'INV-88321', time: '2 min ago', drug: 'Dolo 650mg × 10', cashier: 'R. Sharma', amount: 150, mode: 'UPI' },
  { id: 'INV-88320', time: '8 min ago', drug: 'Augmentin 625 × 2', amount: 2560, cashier: 'M. Patel', mode: 'CARD' },
  { id: 'INV-88319', time: '14 min ago', drug: 'Glycomet 500 × 30', amount: 900, cashier: 'R. Sharma', mode: 'CASH' },
  { id: 'INV-88318', time: '22 min ago', drug: 'Calpol Susp × 1', amount: 60, cashier: 'S. Kumar', mode: 'UPI' },
  { id: 'INV-88317', time: '35 min ago', drug: 'Lipitor 10mg × 15', amount: 12750, cashier: 'M. Patel', mode: 'CARD' },
];

// ─────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: '8px 12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        fontSize: 11,
      }}>
        <div style={{ color: '#475569', fontFamily: 'JetBrains Mono', marginBottom: 6, fontWeight: 700 }}>{label}</div>
        {payload.map((entry: any, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: entry.color, flexShrink: 0 }} />
            <span style={{ color: '#1e293b', fontWeight: 600 }}>
              {entry.name}: <span style={{ color: entry.color }}>₹{(entry.value / 1000).toFixed(1)}K</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─────────────────────────────────────────────
// METRIC CARD
// ─────────────────────────────────────────────
interface MetricCardProps {
  title: string;
  value: string;
  sub: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  delay: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, sub, trend, trendLabel, icon, gradientFrom, gradientTo, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
    className="glass glass-hover p-5 relative overflow-hidden"
  >
    <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top right, ${gradientFrom}12 0%, transparent 60%)` }} />
    <div className="flex justify-between items-start mb-4">
      <div className="text-xs font-medium text-slate-400">{title}</div>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${gradientFrom}20`, color: gradientFrom }}>
        {icon}
      </div>
    </div>
    <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
    <div className="flex items-center gap-2 mt-1.5">
      {trendLabel && (
        <span className={`text-[10px] font-bold ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-amber-400'}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'} {trendLabel}
        </span>
      )}
      <span className="text-[10px] text-slate-600">{sub}</span>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { navigateTo } = useAppStore();
  const totalRevenue = useMemo(() => weeklyRevenue.reduce((s, d) => s + d.revenue, 0), []);
  const totalMargin = useMemo(() => weeklyRevenue.reduce((s, d) => s + d.margin, 0), []);

  const exportCSV = () => {
    const sections = [
      // Section 1: Weekly Revenue
      ['PharmaTrack — Operations Report', `Generated: ${new Date().toLocaleString()}`],
      [],
      ['=== WEEKLY REVENUE & MARGIN ==='],
      ['Day', 'Revenue (₹)', 'Margin (₹)', 'Margin %'],
      ...weeklyRevenue.map(d => [d.day, d.revenue, d.margin, `${((d.margin / d.revenue) * 100).toFixed(1)}%`]),
      ['TOTAL', totalRevenue, totalMargin, `${((totalMargin / totalRevenue) * 100).toFixed(1)}%`],
      [],
      ['=== BRANCH PERFORMANCE ==='],
      ['Branch', 'Revenue (₹)', 'Target (₹)', 'Achievement %'],
      ...branchPerformance.map(b => [b.branch, b.revenue, b.target, `${((b.revenue / b.target) * 100).toFixed(1)}%`]),
      [],
      ['=== TOP DISPENSED SKUs ==='],
      ['Brand Name', 'Generic', 'Category', 'Units Sold', 'Revenue (₹)', 'Stock', 'Status'],
      ...topDrugs.map(d => [d.name, d.generic, d.category, d.units, d.revenue, d.stock, d.status]),
      [],
      ['=== RECENT TRANSACTIONS ==='],
      ['Invoice ID', 'Drug', 'Cashier', 'Amount (₹)', 'Payment Mode', 'Time'],
      ...recentActivity.map(t => [t.id, t.drug, t.cashier, t.amount, t.mode, t.time]),
    ];

    const csvContent = sections
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PharmaTrack_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time intelligence across all pharmacy branches — Last synced 30s ago
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={exportCSV} className="btn-secondary text-xs">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Report
          </button>
          <button onClick={() => navigateTo('billing')} className="btn-primary text-xs">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Dispense
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Weekly Revenue"
          value={`₹${(totalRevenue / 100000).toFixed(2)}L`}
          sub="vs ₹4.58L last week"
          trend="up" trendLabel="+12.4%"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
          gradientFrom="#10b981" gradientTo="#06b6d4"
          delay={0}
        />
        <MetricCard
          title="Gross Margin"
          value={`₹${(totalMargin / 100000).toFixed(2)}L`}
          sub="31.1% margin rate"
          trend="up" trendLabel="+2.8%"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>}
          gradientFrom="#06b6d4" gradientTo="#8b5cf6"
          delay={0.05}
        />
        <MetricCard
          title="Low Stock SKUs"
          value="14 items"
          sub="across 3 branches"
          trend="down" trendLabel="Urgent"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          gradientFrom="#f59e0b" gradientTo="#ef4444"
          delay={0.1}
        />
        <MetricCard
          title="Expiring ≤30 Days"
          value="8 batches"
          sub="Est. loss: ₹18,400"
          trend="neutral" trendLabel="FEFO active"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          gradientFrom="#8b5cf6" gradientTo="#ec4899"
          delay={0.15}
        />
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass p-5"
        >
          <div className="flex justify-between items-center mb-5">
            <div>
              <div className="text-sm font-bold text-slate-200">Revenue & Margin Trend</div>
              <div className="text-[11px] text-slate-500 mt-0.5">7-day performance overview</div>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-medium text-slate-500">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80"></div>Revenue</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-cyan-500/60"></div>Margin</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyRevenue} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gMargin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.6} />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `₹${v / 1000}K`} tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#gRevenue)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
              <Area type="monotone" dataKey="margin" name="Margin" stroke="#06b6d4" strokeWidth={2} fill="url(#gMargin)" dot={false} activeDot={{ r: 4, fill: '#06b6d4' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass p-5"
        >
          <div className="text-sm font-bold text-slate-200 mb-1">Category Mix</div>
          <div className="text-[11px] text-slate-500 mb-4">Revenue by therapeutic segment</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={42} outerRadius={60} paddingAngle={3} dataKey="value">
                {categoryBreakdown.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value}%`, name]}
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 11,
                  color: '#1e293b',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }}
                itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                labelStyle={{ color: '#475569', fontWeight: 700 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {categoryBreakdown.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }}></div>
                  <span className="text-slate-400">{c.name}</span>
                </div>
                <span className="font-mono font-semibold" style={{ color: c.color }}>{c.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* BRANCH PERFORMANCE + TOP DRUGS + ACTIVITY */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Branch Performance Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-5"
        >
          <div className="text-sm font-bold text-slate-200 mb-1">Branch Performance</div>
          <div className="text-[11px] text-slate-500 mb-4">Revenue vs target (monthly)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={branchPerformance} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `₹${v / 1000}K`} tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="branch" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={45} />
              <Tooltip
                formatter={(v: number) => [`₹${(v / 1000).toFixed(0)}K`]}
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 11,
                  color: '#1e293b',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }}
                itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                labelStyle={{ color: '#475569', fontWeight: 700 }}
              />
              <Bar dataKey="target" fill="#1e293b" radius={3} name="Target" />
              <Bar dataKey="revenue" fill="#10b981" radius={3} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Selling Drugs Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass p-5 xl:col-span-2"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-sm font-bold text-slate-200">Top Dispensed SKUs</div>
              <div className="text-[11px] text-slate-500 mt-0.5">This week's highest volume molecules</div>
            </div>
            <button className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold transition-all">View all →</button>
          </div>
          <table className="pharma-table">
            <thead>
              <tr>
                <th>Brand / Generic</th>
                <th>Category</th>
                <th className="text-right">Units Dispensed</th>
                <th className="text-right">Revenue</th>
                <th>Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {topDrugs.map((d, i) => (
                <tr key={i}>
                  <td>
                    <div className="font-semibold text-slate-200 text-xs">{d.name}</div>
                    <div className="text-[10px] text-slate-600 font-mono">{d.generic}</div>
                  </td>
                  <td><span className="text-[11px] text-slate-400">{d.category}</span></td>
                  <td className="text-right font-mono font-bold text-emerald-400 text-xs">{d.units.toLocaleString()}</td>
                  <td className="text-right font-mono text-xs text-slate-300">₹{d.revenue.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${
                      d.status === 'IN_STOCK' ? 'badge-green' :
                      d.status === 'LOW_STOCK' ? 'badge-amber' : 'badge-red'
                    }`}>
                      {d.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>

      {/* LIVE ACTIVITY FEED */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass p-5"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-sm font-bold text-slate-200">Live Transaction Feed</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Real-time dispensing activity</div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-[10px] text-emerald-400 font-mono">STREAMING LIVE</span>
          </div>
        </div>
        <div className="space-y-2">
          {recentActivity.map((tx, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 transition-all border border-[#1e293b]/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 font-mono flex-shrink-0">
                  Rx
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">{tx.drug}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{tx.id} · {tx.cashier}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className={`badge ${tx.mode === 'CASH' ? 'badge-green' : tx.mode === 'CARD' ? 'badge-blue' : 'badge-cyan'}`}>
                  {tx.mode}
                </span>
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-slate-200">₹{tx.amount.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-600">{tx.time}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
