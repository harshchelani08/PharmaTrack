import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'SUPER_ADMIN' | 'CHAIN_OWNER' | 'BRANCH_MANAGER' | 'PHARMACIST' | 'CASHIER';

export interface UserSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  branchId?: string;
  tenantId: string;
}

export interface CartItem {
  drugId: string;
  brandName: string;
  genericName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  availableStock: number;
  unitPrice: number;
  taxPercentage: number;
}

export interface AlertNotification {
  id: string;
  type: 'LOW_STOCK' | 'NEAR_EXPIRY' | 'TRANSFER_REQUEST' | 'SUSPICIOUS_ACTIVITY';
  message: string;
  branchCode?: string;
  createdAt: string;
  isRead: boolean;
}

interface AppState {
  user: UserSession | null;
  token: string | null;
  tenantName: string | null;
  tenantSubdomain: string | null;
  activeBranchId: string | null;
  alerts: AlertNotification[];
  cart: CartItem[];
  paymentMode: 'CASH' | 'CARD' | 'UPI' | 'MIXED';
  activePrescriptionCode: string | null;
  sidebarCollapsed: boolean;
  pendingNav: string | null;

  login: (user: UserSession, token: string, tenantSubdomain: string, tenantName: string) => void;
  logout: () => void;
  setActiveBranch: (branchId: string) => void;
  addAlert: (alert: Omit<AlertNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAlertRead: (id: string) => void;
  clearAlerts: () => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (drugId: string, batchId: string) => void;
  updateCartQty: (drugId: string, batchId: string, qty: number) => void;
  clearCart: () => void;
  setPaymentMode: (mode: 'CASH' | 'CARD' | 'UPI' | 'MIXED') => void;
  setPrescriptionCode: (code: string | null) => void;
  toggleSidebar: () => void;
  navigateTo: (tab: string) => void;
  clearNav: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      tenantName: null,
      tenantSubdomain: null,
      activeBranchId: null,
      alerts: [],
      cart: [],
      paymentMode: 'CASH',
      activePrescriptionCode: null,
      sidebarCollapsed: false,
      pendingNav: null,

      login: (user, token, tenantSubdomain, tenantName) =>
        set({ user, token, tenantSubdomain, tenantName, activeBranchId: user.branchId || null }),

      logout: () =>
        set({ user: null, token: null, tenantName: null, tenantSubdomain: null, activeBranchId: null, cart: [], alerts: [] }),

      setActiveBranch: (branchId) => set({ activeBranchId: branchId }),

      addAlert: (alertData) =>
        set((state) => ({
          alerts: [
            {
              ...alertData,
              id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              isRead: false,
            },
            ...state.alerts,
          ].slice(0, 50),
        })),

      markAlertRead: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
        })),

      clearAlerts: () => set({ alerts: [] }),

      addToCart: (item) =>
        set((state) => {
          const idx = state.cart.findIndex((c) => c.drugId === item.drugId && c.batchId === item.batchId);
          if (idx > -1) {
            const updated = [...state.cart];
            updated[idx] = { ...updated[idx], quantity: Math.min(updated[idx].quantity + 1, item.availableStock) };
            return { cart: updated };
          }
          return { cart: [...state.cart, item] };
        }),

      removeFromCart: (drugId, batchId) =>
        set((state) => ({ cart: state.cart.filter((c) => !(c.drugId === drugId && c.batchId === batchId)) })),

      updateCartQty: (drugId, batchId, qty) =>
        set((state) => ({
          cart: state.cart.map((c) =>
            c.drugId === drugId && c.batchId === batchId
              ? { ...c, quantity: Math.max(1, Math.min(qty, c.availableStock)) }
              : c
          ),
        })),

      clearCart: () => set({ cart: [], activePrescriptionCode: null, paymentMode: 'CASH' }),
      setPaymentMode: (paymentMode) => set({ paymentMode }),
      setPrescriptionCode: (activePrescriptionCode) => set({ activePrescriptionCode }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      navigateTo: (tab) => set({ pendingNav: tab }),
      clearNav: () => set({ pendingNav: null }),
    }),
    {
      name: 'pharmatrack-session',
      partialize: (state) => ({ user: state.user, token: state.token, tenantName: state.tenantName, tenantSubdomain: state.tenantSubdomain }),
    }
  )
);
