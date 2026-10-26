'use client';

import { useState, useMemo } from 'react';
import {
  Bell,
  AlertCircle,
  RotateCcw,
  Clock,
  ShieldAlert,
  CheckCircle2,
  CreditCard,
  ChevronRight,
  Trash2,
  Check
} from 'lucide-react';
import type { FinanceTransaction, FinanceRefundRequest, FinanceInvoice } from '@/types/demo';

interface FinanceNotificationsTabProps {
  transactions: FinanceTransaction[];
  refundRequests: FinanceRefundRequest[];
  invoices: FinanceInvoice[];
  onNavigateTab: (tabId: string) => void;
  onSelectTransaction: (txn: FinanceTransaction) => void;
  onSelectRefund: (refund: FinanceRefundRequest) => void;
  onSelectInvoice: (invoice: FinanceInvoice) => void;
}

interface NotificationItem {
  id: string;
  type: 'failed_txn' | 'refund_request' | 'overdue_balance' | 'unreconciled';
  title: string;
  description: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'info';
  read: boolean;
  actionText: string;
  onAction: () => void;
}

export function FinanceNotificationsTab({
  transactions,
  refundRequests,
  invoices,
  onNavigateTab,
  onSelectTransaction,
  onSelectRefund,
  onSelectInvoice
}: FinanceNotificationsTabProps) {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Synthesize dynamic notifications from current store state
  const notifications: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];

    // 1. Failed transactions
    const failedTxns = transactions.filter(t => t.status === 'Failed');
    failedTxns.forEach(t => {
      list.push({
        id: `notif-failed-${t.id}`,
        type: 'failed_txn',
        title: `Payment Settlement Failed: ₹${t.amount.toLocaleString('en-IN')}`,
        description: `Transaction ${t.id} via ${t.paymentMethod} (${t.gateway}) for Room ${t.roomNumber} (${t.guestName}) failed. Audit reason: ${t.notes || 'Gateway timeout'}.`,
        timestamp: `${t.date} ${t.time}`,
        severity: 'high',
        read: readIds.has(`notif-failed-${t.id}`),
        actionText: 'Inspect & Retry',
        onAction: () => onSelectTransaction(t)
      });
    });

    // 2. Pending refund requests
    const pendingRefunds = refundRequests.filter(r => r.status === 'Pending Review');
    pendingRefunds.forEach(r => {
      list.push({
        id: `notif-refund-${r.id}`,
        type: 'refund_request',
        title: `Refund Dispute Awaiting Review: ₹${r.amount.toLocaleString('en-IN')}`,
        description: `${r.guestName} (Room ${r.roomNumber}) requested refund for ${r.invoiceId}. Reason: "${r.reason}". Requires Financial Operator clearance.`,
        timestamp: r.requestedAt,
        severity: 'high',
        read: readIds.has(`notif-refund-${r.id}`),
        actionText: 'Review Dispute',
        onAction: () => onSelectRefund(r)
      });
    });

    // 3. Overdue balances
    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue' && inv.outstandingBalance > 0);
    overdueInvoices.forEach(inv => {
      list.push({
        id: `notif-overdue-${inv.id}`,
        type: 'overdue_balance',
        title: `Overdue Folio Balance: ₹${inv.outstandingBalance.toLocaleString('en-IN')}`,
        description: `Guest ${inv.guestName} (Room ${inv.roomNumber}) has an outstanding balance of ₹${inv.outstandingBalance.toLocaleString('en-IN')} due on ${inv.dueDate}.`,
        timestamp: inv.dueDate,
        severity: 'medium',
        read: readIds.has(`notif-overdue-${inv.id}`),
        actionText: 'Record Settlement',
        onAction: () => onSelectInvoice(inv)
      });
    });

    // 4. Unreconciled transactions
    const unreconciledTxns = transactions.filter(t => !t.isReconciled);
    if (unreconciledTxns.length > 0) {
      const sumUnreconciled = unreconciledTxns.reduce((acc, t) => acc + t.amount, 0);
      list.push({
        id: 'notif-unreconciled-batch',
        type: 'unreconciled',
        title: `${unreconciledTxns.length} Unreconciled Batch Entries`,
        description: `Total pending volume of ₹${sumUnreconciled.toLocaleString('en-IN')} across ${unreconciledTxns.length} transactions requires bank reconciliation verification.`,
        timestamp: '2026-10-23 09:00',
        severity: 'info',
        read: readIds.has('notif-unreconciled-batch'),
        actionText: 'Go to Reconciliation',
        onAction: () => onNavigateTab('transactions')
      });
    }

    return list;
  }, [transactions, refundRequests, invoices, readIds, onSelectTransaction, onSelectRefund, onSelectInvoice, onNavigateTab]);

  const toggleRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markAllRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filterType === 'UNREAD' && n.read) return false;
      if (filterType === 'FAILED' && n.type !== 'failed_txn') return false;
      if (filterType === 'REFUNDS' && n.type !== 'refund_request') return false;
      if (filterType === 'OVERDUE' && n.type !== 'overdue_balance') return false;
      if (filterType === 'UNRECONCILED' && n.type !== 'unreconciled') return false;
      return true;
    });
  }, [notifications, filterType]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary-400" />
            Financial Alerts & Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                {unreadCount} unread
              </span>
            )}
          </h2>
          <p className="text-xs text-mist-400">
            Real-time notifications for payment failures, refund escalations, overdue balances, and batch mismatches.
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink-900 hover:bg-ink-800 text-mist-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <Check className="h-3.5 w-3.5" />
          Mark All as Read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: `All Alerts (${notifications.length})` },
          { id: 'UNREAD', label: `Unread (${unreadCount})` },
          { id: 'FAILED', label: 'Failed Payments' },
          { id: 'REFUNDS', label: 'Refund Requests' },
          { id: 'OVERDUE', label: 'Overdue Balances' },
          { id: 'UNRECONCILED', label: 'Unreconciled Batches' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === tab.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-ink-900 hover:bg-ink-800 text-mist-400 hover:text-white border border-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center bg-ink-900 border border-white/10 rounded-2xl">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white">No notifications in this category</h4>
            <p className="text-xs text-mist-400 mt-1">
              Your financial operating queues are all caught up.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const getIcon = () => {
              switch (notif.type) {
                case 'failed_txn':
                  return <AlertCircle className="h-4 w-4 text-rose-400" />;
                case 'refund_request':
                  return <RotateCcw className="h-4 w-4 text-purple-400" />;
                case 'overdue_balance':
                  return <ShieldAlert className="h-4 w-4 text-amber-400" />;
                case 'unreconciled':
                  return <CreditCard className="h-4 w-4 text-sky-400" />;
              }
            };

            const getBorderColor = () => {
              if (!notif.read) {
                if (notif.severity === 'high') return 'border-l-4 border-l-rose-500 border-white/10';
                if (notif.severity === 'medium') return 'border-l-4 border-l-amber-500 border-white/10';
                return 'border-l-4 border-l-sky-500 border-white/10';
              }
              return 'border-white/5 opacity-80';
            };

            return (
              <div
                key={notif.id}
                className={`p-4 rounded-xl bg-ink-900 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${getBorderColor()}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-ink-950 border border-white/10 mt-0.5">
                    {getIcon()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-primary-400" />
                      )}
                    </div>
                    <p className="text-xs text-mist-300 mt-0.5">{notif.description}</p>
                    <span className="text-[10px] text-mist-500 mt-1 inline-block">{notif.timestamp}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => toggleRead(notif.id)}
                    className="p-1.5 rounded-lg bg-ink-950 hover:bg-white/10 text-mist-400 hover:text-white transition-colors"
                    title={notif.read ? 'Mark as Unread' : 'Mark as Read'}
                  >
                    <Check className={`h-3.5 w-3.5 ${notif.read ? 'text-primary-400' : ''}`} />
                  </button>
                  <button
                    onClick={notif.onAction}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-colors"
                  >
                    {notif.actionText}
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
