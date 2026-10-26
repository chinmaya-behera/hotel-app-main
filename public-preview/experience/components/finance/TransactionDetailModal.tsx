'use client';

import { useState } from 'react';
import {
  X,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  FileText,
  User,
  Building2,
  Tag,
  Calendar,
  Check,
  RefreshCw,
  Info
} from 'lucide-react';
import type { FinanceTransaction, TransactionStatus } from '@/types/demo';

interface TransactionDetailModalProps {
  transaction: FinanceTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (txnId: string, status: TransactionStatus, notes?: string) => void;
  onReconcile?: (txnId: string) => void;
}

export function TransactionDetailModal({
  transaction,
  isOpen,
  onClose,
  onUpdateStatus,
  onReconcile,
}: TransactionDetailModalProps) {
  const [updating, setUpdating] = useState(false);
  const [customNote, setCustomNote] = useState('');

  if (!isOpen || !transaction) return null;

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'Successful':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Successful
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-3 w-3" /> Failed
          </span>
        );
      case 'Refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <RotateCcw className="h-3 w-3" /> Refunded
          </span>
        );
    }
  };

  const handleStatusChange = (newStatus: TransactionStatus) => {
    if (!onUpdateStatus) return;
    setUpdating(true);
    setTimeout(() => {
      onUpdateStatus(
        transaction.id,
        newStatus,
        customNote.trim() ? customNote.trim() : `Manual operator simulation: status transitioned to ${newStatus}`
      );
      setUpdating(false);
      onClose();
    }, 250);
  };

  const handleToggleReconcile = () => {
    if (!onReconcile) return;
    onReconcile(transaction.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-ink-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-ink-950">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary-500/10 text-primary-400 border border-primary-500/20 flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono">{transaction.id}</h3>
                {getStatusBadge(transaction.status)}
              </div>
              <p className="text-[11px] text-mist-400 mt-0.5">Reference: {transaction.referenceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-mist-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">

          {/* Main Amount Card */}
          <div className="p-4 rounded-xl bg-ink-950/80 border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-mist-400">Total Transaction Amount</p>
              <p className="text-2xl font-black text-white mt-1">₹{transaction.amount.toLocaleString('en-IN')}</p>
              <p className="text-xs text-mist-400 mt-0.5">via {transaction.paymentMethod} ({transaction.gateway})</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                transaction.isReconciled
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {transaction.isReconciled ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {transaction.isReconciled ? 'Reconciled' : 'Unreconciled'}
              </span>
              <p className="text-[10px] text-mist-500 mt-1">{transaction.date} · {transaction.time}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-ink-800/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-mist-400 flex items-center gap-1.5">
                <User className="h-3 w-3 text-mist-400" /> Guest Name
              </span>
              <p className="font-semibold text-white text-xs">{transaction.guestName}</p>
            </div>

            <div className="p-3 rounded-lg bg-ink-800/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-mist-400 flex items-center gap-1.5">
                <Building2 className="h-3 w-3 text-mist-400" /> Room & Booking
              </span>
              <p className="font-semibold text-white text-xs">
                Room {transaction.roomNumber} <span className="text-mist-400">({transaction.bookingRef})</span>
              </p>
            </div>

            <div className="p-3 rounded-lg bg-ink-800/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-mist-400 flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-mist-400" /> Linked Invoice
              </span>
              <p className="font-semibold text-primary-400 font-mono text-xs">
                {transaction.invoiceId || 'Direct Payment / Unlinked'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-ink-800/40 border border-white/5 space-y-1">
              <span className="text-[10px] text-mist-400 flex items-center gap-1.5">
                <Tag className="h-3 w-3 text-mist-400" /> Payment Gateway
              </span>
              <p className="font-semibold text-white text-xs">{transaction.gateway}</p>
            </div>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div className="p-3 rounded-lg bg-ink-800/40 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-mist-400 mb-1">Audit Notes / Reason</p>
              <p className="text-xs text-mist-300 italic">{transaction.notes}</p>
            </div>
          )}

          {/* Reconciliation Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-ink-950 border border-white/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-xs font-semibold text-white">Bank Reconciliation Status</p>
                <p className="text-[10px] text-mist-400">
                  {transaction.isReconciled ? 'Verified against bank settlement batch' : 'Pending bank statement match'}
                </p>
              </div>
            </div>
            {onReconcile && (
              <button
                type="button"
                onClick={handleToggleReconcile}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                  transaction.isReconciled
                    ? 'border-white/10 bg-white/5 hover:bg-white/10 text-mist-300'
                    : 'border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                }`}
              >
                {transaction.isReconciled ? 'Mark Unreconciled' : 'Reconcile Now'}
              </button>
            )}
          </div>

          {/* Operator Status Simulation Controls */}
          {onUpdateStatus && (
            <div className="p-4 rounded-xl bg-ink-950 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Simulate Status Transition</p>
                <span className="text-[10px] text-mist-400">Mock Action Only</span>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Optional status change audit note..."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-ink-900 border border-white/10 text-xs text-white placeholder-mist-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {transaction.status !== 'Successful' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleStatusChange('Successful')}
                    className="flex-1 min-w-[120px] py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark Successful
                  </button>
                )}

                {transaction.status === 'Pending' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleStatusChange('Failed')}
                    className="flex-1 min-w-[120px] py-2 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    Mark Failed
                  </button>
                )}

                {transaction.status === 'Failed' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleStatusChange('Pending')}
                    className="flex-1 min-w-[120px] py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry / Pending
                  </button>
                )}

                {transaction.status === 'Successful' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleStatusChange('Refunded')}
                    className="flex-1 min-w-[120px] py-2 px-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Simulate Refund
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] leading-relaxed">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
            <span>
              All transactions displayed are simulated hotel ledger records. Real-world financial clearing, bank transfers, and payment gateway webhooks are not executed in this frontend workspace.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-white/10 bg-ink-950">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
