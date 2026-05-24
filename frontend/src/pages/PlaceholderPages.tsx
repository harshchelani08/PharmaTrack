import React from 'react';
import { motion } from 'framer-motion';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: string;
  features: string[];
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description, icon, features }) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-white">{title}</h1>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-1 glass p-8 flex flex-col items-center justify-center text-center space-y-4"
      >
        <div className="text-5xl">{icon}</div>
        <div>
          <div className="text-sm font-bold text-slate-200">{title}</div>
          <div className="text-xs text-slate-500 mt-1">Backend APIs & Prisma models ready</div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="badge badge-green">Prisma Schema ✓</span>
          <span className="badge badge-cyan">NestJS Module ✓</span>
          <span className="badge badge-violet">RBAC Guards ✓</span>
        </div>
      </motion.div>

      {/* Feature List */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-2 glass p-6"
      >
        <div className="text-sm font-bold text-slate-200 mb-4">Implemented Features</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-[#1e293b]/40">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span className="text-xs text-slate-300">{f}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>

    {/* Schema preview skeleton */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="glass p-5"
    >
      <div className="text-sm font-bold text-slate-200 mb-3">Loading Data Interface…</div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton h-3 rounded" style={{ width: `${60 + Math.random() * 120}px` }}></div>
            <div className="skeleton h-3 rounded flex-1" style={{ maxWidth: `${150 + Math.random() * 200}px` }}></div>
            <div className="skeleton h-3 rounded" style={{ width: `${40 + Math.random() * 60}px` }}></div>
            <div className="skeleton h-5 rounded-full" style={{ width: '60px' }}></div>
          </div>
        ))}
      </div>
    </motion.div>
  </div>
);

// ─── Individual page definitions ───
export const DrugCatalogPage = () => (
  <PlaceholderPage
    title="Drug Master Catalog"
    description="Manage the complete drug formulary with brand/generic names, HSN codes, dosage forms, and barcode registrations."
    icon="💊"
    features={[
      'Brand name & generic molecule mapping',
      'HSN code and GST category assignment',
      'Barcode registration (Quagga.js ready)',
      'Prescription-required flags',
      'Dosage form and manufacturer tracking',
      'CSV bulk import/export',
      'Advanced search and filter',
      'Audit log for every catalog edit',
    ]}
  />
);

export const BatchManagementPage = () => (
  <PlaceholderPage
    title="FEFO Batch Inventory Manager"
    description="Track batch-level inventory with FEFO-priority queuing, color-coded expiry timelines, and purchase price analytics."
    icon="📦"
    features={[
      'First-Expiry, First-Out (FEFO) prioritization',
      'Batch number and expiry date tracking',
      'Color-coded expiry status (OK / Warning / Critical)',
      'Supplier attribution per batch',
      'Purchase vs selling price margin',
      'Go microservice atomic deduction',
      'Damaged/spoiled stock adjustments',
      'Inventory log with reasons and actors',
    ]}
  />
);

export const ExpiryHeatmapPage = () => (
  <PlaceholderPage
    title="Expiry Heat Calendar"
    description="Visual monthly heatmap showing which batches expire by day, enabling proactive disposal decisions and substitution alerts."
    icon="📅"
    features={[
      'Monthly heatmap calendar view',
      'Days-to-expiry color gradient',
      'Near-expiry batch listings',
      'Automatic Redis Stream alerts',
      'Estimated financial loss calculation',
      'FEFO override recommendations',
      'Branch-level expiry filters',
      'Export expiry schedule as CSV/PDF',
    ]}
  />
);

export const TransfersPage = () => (
  <PlaceholderPage
    title="Inter-Branch Stock Transfers"
    description="Request, approve, and track stock movements between pharmacy branches with real-time status updates."
    icon="↔️"
    features={[
      'Branch-to-branch stock request creation',
      'Go service transfer validation',
      'Multi-step approval workflow',
      'Shipment tracking status (Requested→Delivered)',
      'Automatic source stock deduction',
      'Automatic destination stock increment',
      'Transfer audit timeline log',
      'WebSocket real-time notifications',
    ]}
  />
);

export const PurchaseOrdersPage = () => (
  <PlaceholderPage
    title="Purchase Order Management"
    description="Create, approve, and track supplier purchase orders with automatic stock increment on goods received."
    icon="🛒"
    features={[
      'Create PO with line items',
      'Supplier assignment per order',
      'Status workflow: Pending → Approved → Received',
      'Partial receipt tracking',
      'Auto stock increment on receive',
      'Total cost calculation',
      'Pending payment tracking',
      'PO history and analytics',
    ]}
  />
);

export const SuppliersPage = () => (
  <PlaceholderPage
    title="Supplier Management"
    description="Manage your pharmaceutical supplier network with contact details, GSTIN, purchase history, and performance analytics."
    icon="🏢"
    features={[
      'Supplier CRUD with GSTIN',
      'Purchase history per supplier',
      'Payment outstanding tracking',
      'Supplier performance dashboard',
      'Contact and address management',
      'Automatic PO association',
      'Multi-branch supplier linkages',
      'Soft delete with audit trail',
    ]}
  />
);

export const ReportsPage = () => (
  <PlaceholderPage
    title="Analytics & Reports"
    description="Comprehensive reporting suite covering daily/monthly sales, GST filing, profit margins, branch comparisons, and dead stock analysis."
    icon="📈"
    features={[
      'Daily sales reports with cashier breakdown',
      'Monthly P&L and margin analysis',
      'GST CGST/SGST filing exports',
      'Branch performance comparisons',
      'Dead stock identification',
      'Inventory valuation reports',
      'Recharts visual analytics',
      'CSV and PDF export',
    ]}
  />
);

export const UserManagementPage = () => (
  <PlaceholderPage
    title="User & Role Management"
    description="Manage staff accounts, assign branches, configure RBAC roles, and review activity logs for compliance."
    icon="👥"
    features={[
      'Create and deactivate staff accounts',
      'RBAC role assignment (5 tiers)',
      'Branch-level access scoping',
      'Password reset and email verification',
      'Login activity audit logs',
      'SUPER_ADMIN cross-tenant view',
      'Bulk user CSV import',
      'Suspicious login alerts',
    ]}
  />
);

export const SubscriptionPage = () => (
  <PlaceholderPage
    title="SaaS Subscription & Billing"
    description="Manage your pharmacy chain's PharmaTrack subscription, upgrade plans, view invoices, and configure billing details."
    icon="💎"
    features={[
      'Free Trial → Starter → Pro → Enterprise',
      'Stripe Checkout hosted payment',
      'Webhook-driven status sync',
      'Usage limit enforcement',
      'Invoice history and downloads',
      'Branch limit per plan tier',
      'Order volume caps',
      'Plan upgrade/downgrade flow',
    ]}
  />
);

export const SettingsPage = () => (
  <PlaceholderPage
    title="System Settings"
    description="Configure tenant-level preferences, email notifications, low stock thresholds, alert rules, and integration keys."
    icon="⚙️"
    features={[
      'Tenant profile and logo upload',
      'Low stock threshold configuration',
      'Email alert recipient setup',
      'Subdomain verification',
      'Notification preferences per role',
      'Integration API key management',
      'Daily summary email schedule',
      'GST registration number setup',
    ]}
  />
);
