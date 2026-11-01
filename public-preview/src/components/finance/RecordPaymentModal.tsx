'use client';

import { useState } from 'react';
import { X, CreditCard, AlertCircle, CheckCircle2, ShieldCheck, Banknote } from 'lucide-react';
import type { FinanceInvoice, PaymentMethod } from '@/types/demo';

interface RecordPaymentModalProps {
  invoice: FinanceInvoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoiceId: string, amount: number, method: PaymentMethod, refNumber: string, notes?: string) => void;
}

export function RecordPaymentModal({ invoice, isOpen, onClose, onSubmit }: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<number>(invoice ? invoice.outstandingBalance : 0);
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [refNumber, setRefNumber] = useState(`REF-${Math.floor(10000 + Math.random() * 90000)}`);
  const [notes, setNotes] = useState('Payment settled at front desk finance counter');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !invoice) return null;

  const maxPayable = invoice.outstandingBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }
    if (amount > maxPayable) {
      setError(`Payment cannot exceed outstanding balance of ₹${maxPayable.toLocaleString('en-IN')}.`);
      return;
    }

    onSubmit(invoice.id, amount, method, refNumber.trim(), notes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-ink-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-ink-950">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-lime-500/20 text-lime-400 flex items-center justify-center">
              <Banknote className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Record Payment</h3>
              <p className="text-[10px] text-mist-400">{invoice.id} · Room {invoice.roomNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-mist-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Invoice Summary Strip */}
        <div className="p-4 bg-ink-950/60 border-b border-white/5 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-mist-400">Guest:</span>
            <span className="font-semibold text-white">{invoice.guestName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mist-400">Total Invoice:</span>
            <span className="font-mono text-mist-200">₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mist-400">Paid to Date:</span>
            <span className="font-mono text-emerald-400">₹{invoice.paidAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-white/5 font-bold">
            <span className="text-rose-400">Outstanding Due:</span>
            <span className="font-mono text-white text-sm">₹{invoice.outstandingBalance.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-mist-300 font-medium">Payment Amount (₹) <span className="text-rose-400">*</span></label>
              <button
                type="button"
                onClick={() => setAmount(maxPayable)}
                className="text-[10px] text-lime-400 hover:text-lime-300 font-semibold"
              >
                Full Balance (₹{maxPayable.toLocaleString('en-IN')})
              </button>
            </div>
            <input
              type="number"
              min={1}
              max={maxPayable}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-lime-500"
            />
          </div>

          <div>
            <label className="block text-mist-300 font-medium mb-1">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-lime-500"
            >
              <option value="UPI">UPI (GPay / PhonePe / Paytm / QR)</option>
              <option value="Credit Card">Credit Card (POS Terminal)</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Net Banking">Net Banking / NEFT / RTGS</option>
              <option value="Cash">Cash (Front Desk Till)</option>
              <option value="Direct Bill">Corporate Direct Bill</option>
            </select>
          </div>

          <div>
            <label className="block text-mist-300 font-medium mb-1">Reference Number / Transaction UTR</label>
            <input
              type="text"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              placeholder="e.g. UPI/2610/998124 or Receipt #"
              className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white font-mono placeholder-mist-500"
            />
          </div>

          <div>
            <label className="block text-mist-300 font-medium mb-1">Notes / Ledger Attribution</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Operator notes..."
              className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] text-mist-400">
            <span className="font-semibold text-mist-300">Frontend Simulation:</span> This operation reduces the invoice balance, creates a successful transaction in the ledger, and records an immutable audit log entry.
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-lime-500 hover:bg-lime-600 text-ink-950 font-bold transition-colors shadow-lg shadow-lime-500/20"
            >
              Record ₹{amount.toLocaleString('en-IN')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
