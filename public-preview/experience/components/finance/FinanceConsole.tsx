'use client';

import { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  FileText,
  AlertCircle,
  CreditCard,
  RotateCcw,
  BarChart3,
  History,
  ShieldCheck,
  Bell,
  User,
  Settings,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Plus,
  Banknote,
  Search,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { seedInvoices, seedTransactions, seedRefundRequests } from '@/lib/mockData';
import type { FinanceInvoice, FinanceTransaction, FinanceRefundRequest } from '@/types/demo';

// Tabs
import { FinanceOverviewTab } from './FinanceOverviewTab';
import { FinanceInvoicesTab } from './FinanceInvoicesTab';
import { FinanceOutstandingTab } from './FinanceOutstandingTab';
import { FinanceTransactionsTab } from './FinanceTransactionsTab';
import { FinanceRefundsTab } from './FinanceRefundsTab';
import { FinanceReportsTab } from './FinanceReportsTab';
import { FinanceHistoryTab } from './FinanceHistoryTab';
import { FinanceAuditTab } from './FinanceAuditTab';
import { FinanceNotificationsTab } from './FinanceNotificationsTab';
import { FinanceProfileTab } from './FinanceProfileTab';
import { FinanceSettingsTab } from './FinanceSettingsTab';

// Modals
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { ReviewRefundModal } from './ReviewRefundModal';
import { TransactionDetailModal } from './TransactionDetailModal';

export type FinanceTabId =
  | 'overview'
  | 'invoices'
  | 'outstanding'
  | 'transactions'
  | 'refunds'
  | 'reports'
  | 'history'
  | 'audit'
  | 'notifications'
  | 'profile'
  | 'settings';

export function FinanceConsole() {
  const {
    account,
    state,
    createInvoice,
    recordInvoicePayment,
    reviewRefundRequest,
    updateTransactionStatus,
    reconcileTransaction,
  } = useDemo();
  const [activeTab, setActiveTab] = useState<FinanceTabId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active mock collections with safe fallbacks
  const invoices = state.invoices || seedInvoices;
  const transactions = state.transactions || seedTransactions;
  const refundRequests = state.refundRequests || seedRefundRequests;
  const auditTrail = state.auditTrail || [];

  // Modal visibility states
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<FinanceInvoice | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<FinanceInvoice | null>(null);
  const [selectedRefundForReview, setSelectedRefundForReview] = useState<FinanceRefundRequest | null>(null);
  const [selectedTransactionForDetail, setSelectedTransactionForDetail] = useState<FinanceTransaction | null>(null);

  // Dynamic badge counts
  const badgeCounts = useMemo(() => {
    const outstandingCount = invoices.filter(inv => inv.outstandingBalance > 0).length;
    const pendingRefundsCount = refundRequests.filter(r => r.status === 'Pending Review').length;
    const failedTxnsCount = transactions.filter(t => t.status === 'Failed').length;
    const notifCount = pendingRefundsCount + failedTxnsCount + (outstandingCount > 0 ? 1 : 0);

    return {
      outstandingCount,
      pendingRefundsCount,
      notifCount
    };
  }, [invoices, refundRequests, transactions]);

  // Sidebar navigation structure
  const navGroups = [
    {
      group: 'Overview',
      items: [
        { id: 'overview' as FinanceTabId, label: 'Financial Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      group: 'Billing',
      items: [
        { id: 'invoices' as FinanceTabId, label: 'Guest Invoices', icon: FileText },
        {
          id: 'outstanding' as FinanceTabId,
          label: 'Outstanding Balances',
          icon: AlertCircle,
          badge: badgeCounts.outstandingCount > 0 ? badgeCounts.outstandingCount : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        }
      ]
    },
    {
      group: 'Transactions',
      items: [
        { id: 'transactions' as FinanceTabId, label: 'Payments & Transactions', icon: CreditCard },
        {
          id: 'refunds' as FinanceTabId,
          label: 'Refund Requests',
          icon: RotateCcw,
          badge: badgeCounts.pendingRefundsCount > 0 ? badgeCounts.pendingRefundsCount : undefined,
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        }
      ]
    },
    {
      group: 'Reports',
      items: [
        { id: 'reports' as FinanceTabId, label: 'Daily Financial Reports', icon: BarChart3 },
        { id: 'history' as FinanceTabId, label: 'Transaction History', icon: History }
      ]
    },
    {
      group: 'Activity',
      items: [
        { id: 'audit' as FinanceTabId, label: 'Audit Log', icon: ShieldCheck },
        {
          id: 'notifications' as FinanceTabId,
          label: 'Notifications',
          icon: Bell,
          badge: badgeCounts.notifCount > 0 ? badgeCounts.notifCount : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        }
      ]
    },
    {
      group: 'Account',
      items: [
        { id: 'profile' as FinanceTabId, label: 'My Profile', icon: User },
        { id: 'settings' as FinanceTabId, label: 'Settings', icon: Settings }
      ]
    }
  ];

  // Helper to open payment modal with fallback invoice
  const handleOpenRecordPayment = (targetInvoice?: FinanceInvoice) => {
    if (targetInvoice) {
      setSelectedInvoiceForPayment(targetInvoice);
    } else {
      // Pick first invoice with outstanding balance
      const firstWithBalance = invoices.find(inv => inv.outstandingBalance > 0) || invoices[0];
      setSelectedInvoiceForPayment(firstWithBalance);
    }
  };

  return (
    <div className="w-full pb-16">
      {/* Mobile Bar */}
      <div className="lg:hidden mb-4 flex items-center justify-between p-3 rounded-2xl bg-ink-900 border border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary-500/20 text-primary-400 border border-primary-500/30 flex items-center justify-center font-bold text-xs">
            ₹
          </div>
          <span className="text-xs font-bold text-white capitalize">{activeTab.replace('_', ' ')}</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-1.5 rounded-lg bg-ink-800 text-mist-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5"
        >
          <Menu className="h-4 w-4" />
          <span>Menu</span>
        </button>
      </div>

      {/* Main Console Layout: Collapsible Sidebar + Content View */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Collapsible Sidebar */}
        <aside
          className={`shrink-0 transition-all duration-200 w-full ${
            sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
          }`}
        >
          <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-3 backdrop-blur-xl shadow-xl space-y-3 sticky top-24">
            {/* Sidebar Header & Collapse Toggle */}
            <div className="flex items-center justify-between p-2 border-b border-white/[0.06]">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-primary-500/20 text-primary-400 border border-primary-500/30 flex items-center justify-center font-bold text-xs">
                    ₹
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-mist-400">
                    Finance Operations
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.02] text-mist-400 hover:text-white transition ml-auto"
                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Quick Actions (Compact / Full) */}
            <div className="space-y-1.5 pb-2 border-b border-white/[0.06]">
              <button
                type="button"
                onClick={() => setIsCreateInvoiceOpen(true)}
                title="Generate New Invoice"
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center p-2' : 'gap-2 px-3 py-2'} rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-sm transition`}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                {!sidebarCollapsed && <span>New Invoice</span>}
              </button>
              <button
                type="button"
                onClick={() => handleOpenRecordPayment()}
                title="Record Guest Payment"
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center p-2' : 'gap-2 px-3 py-2'} rounded-xl bg-ink-800 hover:bg-ink-700 text-mist-200 border border-white/10 text-xs font-semibold transition`}
              >
                <Banknote className="h-3.5 w-3.5 shrink-0 text-lime-400" />
                {!sidebarCollapsed && <span>Record Payment</span>}
              </button>
            </div>

            {/* Grouped Navigation */}
            <div className="space-y-3 max-h-[calc(100vh-260px)] overflow-y-auto pr-0.5">
              {navGroups.map((group) => (
                <div key={group.group} className="space-y-1">
                  {!sidebarCollapsed && (
                    <p className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-mist-500">
                      {group.group}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveTab(item.id)}
                          title={item.label}
                          className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'} rounded-xl text-xs font-semibold transition ${
                            isActive
                              ? 'bg-primary-600 text-white shadow-md shadow-primary-950/40'
                              : 'text-mist-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-mist-400'}`} />
                            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                          </div>
                          {!sidebarCollapsed && item.badge !== undefined && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${item.badgeColor || 'bg-primary-500/20 text-primary-300'}`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Scope Pill */}
            {!sidebarCollapsed && (
              <div className="pt-2 border-t border-white/10">
                <div className="p-2.5 rounded-xl bg-ink-950/80 border border-white/5 space-y-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-mist-400 font-semibold uppercase">Clearance Limit</span>
                    <span className="text-emerald-400 font-bold">₹80,000</span>
                  </div>
                  <p className="text-[10px] text-mist-500">Day Shift · {account?.person||'Finance operator'}</p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <div className="relative w-72 max-w-[80vw] bg-ink-900 border-r border-white/10 p-5 flex flex-col h-full overflow-y-auto space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold text-xs">
                    ₹
                  </div>
                  <span className="text-sm font-bold text-white">Financial Operator</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-mist-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {navGroups.map((group) => (
                  <div key={group.group} className="space-y-1">
                    <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-mist-500">
                      {group.group}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                              isActive
                                ? 'bg-primary-600 text-white'
                                : 'text-mist-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </div>
                            {item.badge !== undefined && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20 text-white">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content View */}
        <main className="flex-1 w-full min-w-0">
          {activeTab === 'overview' && (
            <FinanceOverviewTab
              invoices={invoices}
              transactions={transactions}
              refundRequests={refundRequests}
              onOpenCreateInvoice={() => setIsCreateInvoiceOpen(true)}
              onOpenRecordPayment={handleOpenRecordPayment}
              onSelectTransaction={(txn) => setSelectedTransactionForDetail(txn)}
              onNavigateTab={(tab) => setActiveTab(tab as FinanceTabId)}
            />
          )}

          {activeTab === 'invoices' && (
            <FinanceInvoicesTab
              invoices={invoices}
              onOpenCreateInvoice={() => setIsCreateInvoiceOpen(true)}
              onViewInvoice={(inv) => setSelectedInvoiceForDetail(inv)}
              onRecordPayment={(inv) => setSelectedInvoiceForPayment(inv)}
            />
          )}

          {activeTab === 'outstanding' && (
            <FinanceOutstandingTab
              invoices={invoices}
              onViewInvoice={(inv) => setSelectedInvoiceForDetail(inv)}
              onRecordPayment={(inv) => setSelectedInvoiceForPayment(inv)}
            />
          )}

          {activeTab === 'transactions' && (
            <FinanceTransactionsTab
              transactions={transactions}
              onSelectTransaction={(txn) => setSelectedTransactionForDetail(txn)}
              onUpdateStatus={updateTransactionStatus}
              onReconcile={reconcileTransaction}
            />
          )}

          {activeTab === 'refunds' && (
            <FinanceRefundsTab
              refundRequests={refundRequests}
              onSelectRefund={(refund) => setSelectedRefundForReview(refund)}
            />
          )}

          {activeTab === 'reports' && (
            <FinanceReportsTab
              invoices={invoices}
              transactions={transactions}
              refundRequests={refundRequests}
            />
          )}

          {activeTab === 'history' && (
            <FinanceHistoryTab
              transactions={transactions}
              onSelectTransaction={(txn) => setSelectedTransactionForDetail(txn)}
            />
          )}

          {activeTab === 'audit' && (
            <FinanceAuditTab auditTrail={auditTrail} />
          )}

          {activeTab === 'notifications' && (
            <FinanceNotificationsTab
              transactions={transactions}
              refundRequests={refundRequests}
              invoices={invoices}
              onNavigateTab={(tab) => setActiveTab(tab as FinanceTabId)}
              onSelectTransaction={(txn) => setSelectedTransactionForDetail(txn)}
              onSelectRefund={(refund) => setSelectedRefundForReview(refund)}
              onSelectInvoice={(inv) => setSelectedInvoiceForPayment(inv)}
            />
          )}

          {activeTab === 'profile' && (
            <FinanceProfileTab />
          )}

          {activeTab === 'settings' && (
            <FinanceSettingsTab />
          )}
        </main>

      </div>

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onSubmit={createInvoice}
      />

      <InvoiceDetailModal
        invoice={selectedInvoiceForDetail}
        isOpen={!!selectedInvoiceForDetail}
        onClose={() => setSelectedInvoiceForDetail(null)}
      />

      <RecordPaymentModal
        invoice={selectedInvoiceForPayment}
        isOpen={!!selectedInvoiceForPayment}
        onClose={() => setSelectedInvoiceForPayment(null)}
        onSubmit={recordInvoicePayment}
      />

      <ReviewRefundModal
        refund={selectedRefundForReview}
        isOpen={!!selectedRefundForReview}
        onClose={() => setSelectedRefundForReview(null)}
        onSubmit={reviewRefundRequest}
      />

      <TransactionDetailModal
        transaction={selectedTransactionForDetail}
        isOpen={!!selectedTransactionForDetail}
        onClose={() => setSelectedTransactionForDetail(null)}
        onUpdateStatus={updateTransactionStatus}
        onReconcile={reconcileTransaction}
      />

    </div>
  );
}
