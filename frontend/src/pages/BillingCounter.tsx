import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, CartItem } from '../store/useAppStore';

// Mock drug catalog for barcode scanning demo
const DEMO_CATALOG: Record<string, Omit<CartItem, 'quantity'>> = {
  '8901234567890': { drugId: 'd1', brandName: 'Dolo 650mg', genericName: 'Paracetamol', batchId: 'b1', batchNumber: 'DL-4482', expiryDate: '2027-04-12', availableStock: 250, unitPrice: 1.50, taxPercentage: 12 },
  '8901234567891': { drugId: 'd2', brandName: 'Augmentin 625 DUO', genericName: 'Amoxicillin + Clavulanic Acid', batchId: 'b2', batchNumber: 'AG-9923', expiryDate: '2026-11-28', availableStock: 85, unitPrice: 128.00, taxPercentage: 18 },
  '8901234567892': { drugId: 'd3', brandName: 'Lipitor 10mg', genericName: 'Atorvastatin Calcium', batchId: 'b3', batchNumber: 'LP-3392', expiryDate: '2028-01-15', availableStock: 140, unitPrice: 8.50, taxPercentage: 12 },
  '8901234567893': { drugId: 'd4', brandName: 'Glycomet 500mg', genericName: 'Metformin HCl', batchId: 'b4', batchNumber: 'GM-7821', expiryDate: '2026-08-20', availableStock: 14, unitPrice: 3.00, taxPercentage: 12 },
  '8901234567894': { drugId: 'd5', brandName: 'Calpol Paediatric Syrup', genericName: 'Paracetamol Syrup 120mg/5ml', batchId: 'b5', batchNumber: 'CP-5541', expiryDate: '2027-07-30', availableStock: 195, unitPrice: 60.00, taxPercentage: 12 },
};

const QUICK_ADD = Object.entries(DEMO_CATALOG).slice(0, 5);

export const BillingCounter: React.FC = () => {
  const { cart, addToCart, removeFromCart, updateCartQty, clearCart, paymentMode, setPaymentMode, activePrescriptionCode, setPrescriptionCode } = useAppStore();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [invoiceResult, setInvoiceResult] = useState<any>(null);
  const [scanError, setScanError] = useState('');

  const handleScan = (barcode: string) => {
    const b = barcode.trim();
    setScanError('');
    if (!b) return;
    const item = DEMO_CATALOG[b];
    if (item) {
      addToCart({ ...item, quantity: 1 });
      setBarcodeInput('');
    } else {
      setScanError(`Barcode "${b}" not found in catalog.`);
    }
  };

  const totals = cart.reduce(
    (acc, item) => {
      const sub = item.unitPrice * item.quantity;
      const tax = sub * (item.taxPercentage / 100);
      return { subtotal: acc.subtotal + sub, tax: acc.tax + tax };
    },
    { subtotal: 0, tax: 0 }
  );
  const grandTotal = totals.subtotal + totals.tax;

  const checkout = () => {
    if (cart.length === 0) return;
    const invoice = {
      invoiceNumber: `PT-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleString(),
      patient: patientName || 'Walk-in Patient',
      doctor: doctorName || 'OTC',
      prescription: activePrescriptionCode || 'NOT REQUIRED',
      items: [...cart],
      subtotal: totals.subtotal.toFixed(2),
      cgst: (totals.tax / 2).toFixed(2),
      sgst: (totals.tax / 2).toFixed(2),
      totalTax: totals.tax.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      paymentMode,
    };
    setInvoiceResult(invoice);
    clearCart();
    setPatientName('');
    setDoctorName('');
    setPrescriptionCode(null);
  };

  const payModes: Array<'CASH' | 'CARD' | 'UPI' | 'MIXED'> = ['CASH', 'CARD', 'UPI', 'MIXED'];
  const modeColors: Record<string, string> = { CASH: 'emerald', CARD: 'blue', UPI: 'violet', MIXED: 'amber' };

  const daysToExpiry = (dateStr: string) => {
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">POS Dispensing Counter</h1>
        <p className="text-sm text-slate-500 mt-1">Scan barcodes, apply FEFO deduction, compute GST, and generate tax invoices.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* LEFT PANEL: Scanner + Cart */}
        <div className="xl:col-span-2 space-y-4">
          {/* Barcode Scanner */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><rect x="2" y="4" width="4" height="16"/><rect x="8" y="4" width="2" height="16"/><rect x="12" y="4" width="4" height="16"/><rect x="18" y="4" width="4" height="16"/><line x1="2" y1="2" x2="2" y2="0"/><line x1="22" y1="2" x2="22" y2="0"/></svg>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-200">Barcode Scanner Interface</div>
                <div className="text-[11px] text-slate-500">Scan or type barcode. Quagga.js webcam scanning enabled in production.</div>
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => { setBarcodeInput(e.target.value); setScanError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleScan(barcodeInput)}
                placeholder="Scan barcode or type SKU (e.g. 8901234567890)…"
                className="pharma-input flex-1 font-mono"
                autoFocus
              />
              <button onClick={() => handleScan(barcodeInput)} className="btn-primary flex-shrink-0">Scan</button>
            </div>

            {scanError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs text-rose-400 flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {scanError}
              </motion.div>
            )}

            {/* Quick Add Pills */}
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#1e293b]/50">
              <span className="text-[10px] text-slate-600 font-mono self-center">QUICK ADD:</span>
              {QUICK_ADD.map(([barcode, item]) => (
                <button
                  key={barcode}
                  onClick={() => addToCart({ ...item, quantity: 1 })}
                  className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/60 text-[10px] text-slate-400 hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all font-mono"
                >
                  + {item.brandName}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Cart Table */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-bold text-slate-200">
                Billing Cart
                {cart.length > 0 && <span className="ml-2 badge badge-green">{cart.length} items</span>}
              </div>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-[11px] text-slate-500 hover:text-rose-400 transition-all font-medium">Clear all</button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-14 text-center">
                <div className="text-slate-700 text-3xl mb-2">💊</div>
                <div className="text-sm text-slate-600">Cart is empty</div>
                <div className="text-[11px] text-slate-700 mt-1">Scan a barcode or use quick add above</div>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="pharma-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Batch / Expiry</th>
                      <th className="text-right">MRP</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">GST%</th>
                      <th className="text-right">Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {cart.map((item) => {
                        const sub = item.unitPrice * item.quantity;
                        const taxAmt = sub * (item.taxPercentage / 100);
                        const total = sub + taxAmt;
                        const days = daysToExpiry(item.expiryDate);
                        return (
                          <motion.tr
                            key={`${item.drugId}-${item.batchId}`}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ duration: 0.2 }}
                          >
                            <td>
                              <div className="font-semibold text-slate-200 text-xs">{item.brandName}</div>
                              <div className="text-[10px] text-slate-600 font-mono">{item.genericName}</div>
                            </td>
                            <td>
                              <div className="font-mono text-xs text-emerald-400">{item.batchNumber}</div>
                              <div className={`text-[10px] font-mono ${days <= 30 ? 'text-amber-400' : 'text-slate-600'}`}>
                                {days <= 30 ? `⚠ ${days}d left` : `Exp: ${item.expiryDate}`}
                              </div>
                            </td>
                            <td className="text-right font-mono text-xs">₹{item.unitPrice.toFixed(2)}</td>
                            <td className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => updateCartQty(item.drugId, item.batchId, item.quantity - 1)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all text-xs"
                                >−</button>
                                <span className="w-8 text-center font-mono text-xs font-bold text-slate-200">{item.quantity}</span>
                                <button
                                  onClick={() => updateCartQty(item.drugId, item.batchId, item.quantity + 1)}
                                  disabled={item.quantity >= item.availableStock}
                                  className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all text-xs disabled:opacity-30"
                                >+</button>
                              </div>
                              <div className="text-[9px] text-slate-700 font-mono text-center mt-0.5">/{item.availableStock}</div>
                            </td>
                            <td className="text-right font-mono text-xs text-cyan-400">{item.taxPercentage}%</td>
                            <td className="text-right font-mono font-bold text-xs text-slate-200">₹{total.toFixed(2)}</td>
                            <td>
                              <button
                                onClick={() => removeFromCart(item.drugId, item.batchId)}
                                className="w-6 h-6 rounded flex items-center justify-center text-slate-700 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>

        {/* RIGHT PANEL: Checkout */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass p-5 space-y-5 h-fit">
          <div className="text-sm font-bold text-slate-200 border-b border-[#1e293b]/60 pb-3">Checkout</div>

          {/* Patient Details */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase font-mono block mb-1.5">Patient Name</label>
              <input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="e.g. Raj Sharma" className="pharma-input" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase font-mono block mb-1.5">Prescribing Doctor</label>
              <input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="e.g. Dr. A. Mehta" className="pharma-input" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase font-mono block mb-1.5">Prescription ID</label>
              <input value={activePrescriptionCode || ''} onChange={(e) => setPrescriptionCode(e.target.value || null)} placeholder="RX-0000 (optional)" className="pharma-input font-mono" />
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase font-mono mb-2">Payment Method</div>
            <div className="grid grid-cols-2 gap-2">
              {payModes.map((mode) => {
                const c = modeColors[mode];
                const isActive = paymentMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2.5 rounded-xl border text-[11px] font-bold tracking-wider transition-all ${
                      isActive
                        ? `bg-${c}-500/10 border-${c}-500/30 text-${c}-400`
                        : 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="space-y-2.5 border-t border-[#1e293b]/50 pt-4">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Subtotal</span>
              <span className="font-mono text-slate-300">₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">CGST</span>
              <span className="font-mono text-cyan-400">₹{(totals.tax / 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">SGST</span>
              <span className="font-mono text-cyan-400">₹{(totals.tax / 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-[#1e293b]/50 pt-2.5">
              <span className="text-sm font-bold text-slate-200">Grand Total</span>
              <span className="text-lg font-extrabold font-mono text-gradient">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={checkout}
            disabled={cart.length === 0}
            className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all ${
              cart.length === 0
                ? 'bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed'
                : 'btn-primary w-full justify-center text-sm shadow-xl shadow-emerald-500/10'
            }`}
          >
            {cart.length === 0 ? 'Add items to cart' : `Confirm & Dispense · ₹${grandTotal.toFixed(2)}`}
          </button>
        </motion.div>
      </div>

      {/* Invoice Success Modal */}
      <AnimatePresence>
        {invoiceResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && setInvoiceResult(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
              className="glass max-w-sm w-full p-6 space-y-4"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1, bounce: 0.5 }}
                  className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl mx-auto mb-3"
                >
                  ✓
                </motion.div>
                <div className="text-base font-extrabold text-white">Dispensing Complete!</div>
                <div className="text-[11px] text-emerald-400 font-mono mt-1 tracking-wider">{invoiceResult.invoiceNumber}</div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 text-[11px] space-y-3 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Patient</span><span className="text-slate-200 font-sans">{invoiceResult.patient}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Date</span><span className="text-slate-500">{invoiceResult.date}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 space-y-1.5">
                  {invoiceResult.items.map((item: CartItem, i: number) => (
                    <div key={i} className="flex justify-between text-slate-400">
                      <span>{item.brandName} ×{item.quantity}</span>
                      <span className="text-slate-300">₹{(item.unitPrice * item.quantity * (1 + item.taxPercentage / 100)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-800 pt-2 space-y-1">
                  <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>₹{invoiceResult.subtotal}</span></div>
                  <div className="flex justify-between text-cyan-500"><span>CGST + SGST</span><span>₹{invoiceResult.totalTax}</span></div>
                  <div className="flex justify-between font-extrabold text-sm text-emerald-400 pt-1"><span>TOTAL</span><span>₹{invoiceResult.grandTotal}</span></div>
                </div>
                <div className="text-center text-slate-600 text-[10px] pt-1">
                  Paid via <span className="text-slate-400">{invoiceResult.paymentMode}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => window.print()} className="btn-secondary flex-1 justify-center text-xs">🖨 Print</button>
                <button onClick={() => setInvoiceResult(null)} className="btn-primary flex-1 justify-center text-xs">New Sale</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
