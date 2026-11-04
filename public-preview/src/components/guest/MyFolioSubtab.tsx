'use client';

import { useState, useMemo } from 'react';
import {
  Receipt,
  FileText,
  Printer,
  Download,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  LogOut,
  HelpCircle,
  Building,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Percent,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { guests } from '@/lib/mockData';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';
import { GuestSectionHeader, GuestSheet } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import type { FolioLine } from '@/types/demo';

export function MyFolioSubtab({ room, guestName }: GuestTabProps) {
  const { state, disputeFolioCharge, expressCheckout } = useDemo();

  const [disputeLine, setDisputeLine] = useState<FolioLine | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [signature, setSignature] = useState('');
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const lines = state.folios?.[room] ?? [];
  const guest = guests.find((g) => g.room === room);
  const stay = (state.frontDesk?.stays ?? []).find((s) => s.room === room);

  // Financial Breakdown calculations
  const breakdown = useMemo(() => {
    let roomCharges = 0;
    let serviceCharges = 0;
    let creditsAndDiscounts = 0;
    let paymentsReceived = 0;

    lines.forEach((l) => {
      const label = l.label.toLowerCase();
      if (l.amount < 0) {
        if (label.includes('payment') || label.includes('advance') || label.includes('card')) {
          paymentsReceived += Math.abs(l.amount);
        } else {
          creditsAndDiscounts += Math.abs(l.amount);
        }
      } else {
        if (label.includes('room') || label.includes('night') || label.includes('suite') || label.includes('deluxe')) {
          roomCharges += l.amount;
        } else {
          serviceCharges += l.amount;
        }
      }
    });

    // If only basic charges seeded, add a room rate baseline for realistic hotel invoice representation
    if (roomCharges === 0 && lines.length > 0) {
      roomCharges = 420; // 2 nights standard package
    }

    const subtotal = roomCharges + serviceCharges - creditsAndDiscounts;
    const taxesAndFees = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST / luxury hospitality tax
    const totalBill = Math.round((subtotal + taxesAndFees) * 100) / 100;
    const outstandingBalance = Math.max(0, Math.round((totalBill - paymentsReceived) * 100) / 100);

    return {
      roomCharges,
      serviceCharges,
      taxesAndFees,
      creditsAndDiscounts,
      paymentsReceived,
      totalBill,
      outstandingBalance,
    };
  }, [lines]);

  function getDepartmentForLine(label: string): string {
    const l = label.toLowerCase();
    if (l.includes('room') || l.includes('night') || l.includes('stay')) return 'Front Desk / Rooms';
    if (l.includes('dining') || l.includes('kitchen') || l.includes('breakfast') || l.includes('burger') || l.includes('bar'))
      return 'Food & Beverage';
    if (l.includes('spa') || l.includes('massage') || l.includes('therapy')) return 'Lapis Spa & Wellness';
    if (l.includes('laundry') || l.includes('press') || l.includes('cleaning')) return 'Housekeeping & Laundry';
    if (l.includes('recovery') || l.includes('compensation') || l.includes('credit')) return 'Guest Relations';
    if (l.includes('transfer') || l.includes('taxi') || l.includes('tour')) return 'Concierge Desk';
    return 'Hotel Operations';
  }

  function submitDispute() {
    if (!disputeLine || !disputeReason.trim()) return;
    disputeFolioCharge(room, disputeLine.id, disputeReason.trim());
    setDisputeLine(null);
    setDisputeReason('');
    setToastMessage(`Dispute filed for ${disputeLine.label}. Finance team alerted.`);
    setTimeout(() => setToastMessage(null), 5000);
  }

  function confirmCheckout() {
    expressCheckout(room, guestName);
    setCheckoutOpen(false);
    setToastMessage('Express checkout completed successfully. We hope you enjoyed your stay!');
    setTimeout(() => setToastMessage(null), 7000);
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="guest-card flex items-start gap-2.5 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-white">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <p className="text-xs text-emerald-300 font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Top Folio Header Card */}
      <div className="guest-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-400">Folio · Room {room}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 text-[10px] font-bold">
                Active In-House
              </span>
            </div>
            <h2 className="text-base font-bold text-white">{guestName} · {stay?.roomType || 'Deluxe King'}</h2>
            <p className="text-xs text-mist-400">
              Billing Reference: <strong className="text-mist-200 font-mono">FOL-402-2026</strong> · Card on file ({stay?.cardMask || '•••• 4242'})
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setInvoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all border border-white/10"
            >
              <Printer className="h-3.5 w-3.5 text-amber-400" />
              <span>Print Tax Invoice</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCheckoutOpen(true);
                setSignature('');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition-colors shadow-md"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Express Checkout</span>
            </button>
          </div>
        </div>

        {/* Big Balance Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/10 text-xs">
          <div className="p-3 rounded-xl bg-white/5 space-y-0.5">
            <span className="text-[10px] text-mist-400 uppercase font-semibold">Total Stay Charges</span>
            <p className="text-sm font-bold text-white">{money(breakdown.totalBill)}</p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 space-y-0.5">
            <span className="text-[10px] text-mist-400 uppercase font-semibold">Payments Received</span>
            <p className="text-sm font-bold text-emerald-400">{money(breakdown.paymentsReceived)}</p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 space-y-0.5">
            <span className="text-[10px] text-mist-400 uppercase font-semibold">Discounts &amp; Credits</span>
            <p className="text-sm font-bold text-sky-300">{money(breakdown.creditsAndDiscounts)}</p>
          </div>

          <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 space-y-0.5">
            <span className="text-[10px] text-amber-300 uppercase font-semibold">Outstanding Balance</span>
            <p className="text-base font-black text-amber-300">{money(breakdown.outstandingBalance)}</p>
          </div>
        </div>
      </div>

      {/* FINANCIAL BREAKDOWN */}
      <div className="guest-card p-4 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider text-amber-400">
          <Receipt className="h-4 w-4" />
          <span>Financial Itemisation &amp; Taxes Breakdown</span>
        </h3>

        <div className="space-y-2 text-xs divide-y divide-white/5">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-mist-300">Room &amp; Suite Charges (2 Nights)</span>
            <span className="font-semibold text-white">{money(breakdown.roomCharges)}</span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-mist-300">Dining, Spa &amp; Departmental Services</span>
            <span className="font-semibold text-white">{money(breakdown.serviceCharges)}</span>
          </div>

          {breakdown.creditsAndDiscounts > 0 && (
            <div className="flex items-center justify-between py-1.5 text-emerald-300">
              <span className="flex items-center gap-1.5">
                <TrendingDown className="h-3.5 w-3.5" />
                <span>Service Recovery Credits &amp; VIP Discounts</span>
              </span>
              <span className="font-semibold">-{money(breakdown.creditsAndDiscounts)}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-1.5 text-mist-300">
            <span className="flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5 text-mist-400" />
              <span>Goods &amp; Services Tax (18% GST / Hospitality Cess)</span>
            </span>
            <span className="font-semibold text-white">{money(breakdown.taxesAndFees)}</span>
          </div>

          <div className="flex items-center justify-between py-2 pt-2.5 font-bold text-sm">
            <span className="text-white">Net Total Stay Bill</span>
            <span className="text-white">{money(breakdown.totalBill)}</span>
          </div>

          <div className="flex items-center justify-between py-2 text-emerald-400 text-xs font-semibold">
            <span>Advance Pre-Authorization &amp; Deposits Settled</span>
            <span>-{money(breakdown.paymentsReceived)}</span>
          </div>

          <div className="flex items-center justify-between py-2.5 text-base font-extrabold text-amber-300 pt-3">
            <span>Balance Due at Checkout</span>
            <span>{money(breakdown.outstandingBalance)}</span>
          </div>
        </div>
      </div>

      {/* ITEMISED TRANSACTION HISTORY */}
      <div className="space-y-3">
        <GuestSectionHeader
          title="Itemised Transaction History"
          hint={`${lines.length} ledger entries posted by hotel departments to your room folio`}
        />

        {lines.length === 0 ? (
          <div className="guest-card p-6 text-center text-xs text-mist-400">
            No incidental charges posted to this room yet.
          </div>
        ) : (
          <div className="guest-card divide-y divide-white/5 overflow-hidden">
            {lines.map((line) => {
              const dept = getDepartmentForLine(line.label);
              const isCredit = line.amount < 0;

              return (
                <div
                  key={line.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white truncate">{line.label}</p>
                      {line.disputed && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                          Disputed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-mist-400">
                      <span>{line.date}</span>
                      <span>·</span>
                      <span className="text-mist-300 font-medium">{dept}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-bold font-mono ${
                        isCredit ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {isCredit ? `-${money(Math.abs(line.amount))}` : money(line.amount)}
                    </span>

                    {!line.disputed && line.amount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setDisputeLine(line);
                          setDisputeReason('');
                        }}
                        className="px-2 py-1 rounded-lg border border-white/10 hover:border-amber-400/40 text-mist-300 hover:text-white text-[10px] font-semibold transition-all"
                      >
                        Dispute
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DISPUTE MODAL */}
      {disputeLine && (
        <GuestSheet
          title={`Dispute Charge · ${disputeLine.label}`}
          onClose={() => setDisputeLine(null)}
          footer={
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setDisputeLine(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!disputeReason.trim()}
                onClick={submitDispute}
                className="flex-2 py-3 px-4 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md disabled:opacity-40"
              >
                Submit Dispute to Finance
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-mist-400 uppercase font-semibold">Transaction</p>
                <p className="text-white font-bold">{disputeLine.label}</p>
                <p className="text-mist-400 text-[10px]">{disputeLine.date} · {getDepartmentForLine(disputeLine.label)}</p>
              </div>
              <span className="font-mono text-sm font-bold text-amber-300">{money(disputeLine.amount)}</span>
            </div>

            <div className="space-y-1">
              <label htmlFor="dispute-res" className="text-mist-300 font-semibold block">
                Reason for Disputing This Charge <span className="text-amber-400">*</span>
              </label>
              <textarea
                id="dispute-res"
                rows={3}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="e.g. Did not order this item, incorrect quantity billed, or service quality concern..."
                className="guest-field w-full px-3 py-2 text-xs text-white"
              />
            </div>

            <p className="text-[11px] text-mist-400 leading-relaxed">
              This charge will be placed under formal review by Duty Manager Marcus Vance and the Financial Operator. While under review, the amount is held and will not be charged to your card on file.
            </p>
          </div>
        </GuestSheet>
      )}

      {/* EXPRESS CHECKOUT MODAL */}
      {checkoutOpen && (
        <GuestSheet
          title="Express Checkout Confirmation"
          onClose={() => setCheckoutOpen(false)}
          footer={
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white"
              >
                Return to Stay
              </button>
              <button
                type="button"
                disabled={signature.trim().length < 2}
                onClick={confirmCheckout}
                className="flex-2 py-3 px-4 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Confirm &amp; Pay {money(breakdown.outstandingBalance)}</span>
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-200 space-y-1">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" />
                <span>Automated Card Settlement</span>
              </p>
              <p className="text-[11px] text-mist-300 leading-relaxed">
                Your remaining folio balance of <strong className="text-white">{money(breakdown.outstandingBalance)}</strong> will be settled against your authorized card on file (<span className="font-mono text-white">{stay?.cardMask || '•••• 4242'}</span>). An official PDF tax invoice will be sent to your registered email.
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="chk-sig" className="text-mist-300 font-semibold block">
                Digital Signature / Full Legal Name <span className="text-amber-400">*</span>
              </label>
              <input
                id="chk-sig"
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full legal name to authorize checkout"
                className="guest-field w-full px-3 py-2.5 text-xs text-white"
              />
            </div>

            <p className="text-[11px] text-mist-400 leading-relaxed">
              Confirming express checkout releases Room {room} back to Housekeeping inventory and completes your checkout record in the Property Management System.
            </p>
          </div>
        </GuestSheet>
      )}

      {/* PRINT / DOWNLOAD TAX INVOICE MODAL */}
      {invoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white text-zinc-900 shadow-2xl overflow-hidden my-8 p-6 sm:p-8 space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Document</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setInvoiceModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Formal Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <p className="text-xl font-black tracking-tight text-amber-700">THE GRAND ADP</p>
                <p className="text-xs text-zinc-600">Luxury Suites &amp; Residences</p>
                <p className="text-[11px] text-zinc-500 mt-1">100 Luxury Promenade, Marina Bay District</p>
                <p className="text-[11px] text-zinc-500">GSTIN: <strong>29AABCU9603R1ZM</strong> · CIN: U55101KA2018PTC112345</p>
              </div>

              <div className="sm:text-right space-y-0.5">
                <span className="inline-block px-2 py-0.5 rounded bg-zinc-100 font-mono text-[10px] font-bold text-zinc-700 uppercase">
                  Tax Invoice
                </span>
                <p className="font-mono text-xs font-bold text-zinc-900 mt-1">INV-2026-402-01</p>
                <p className="text-[11px] text-zinc-500">Date: {new Date().toLocaleDateString('en-GB')}</p>
                <p className="text-[11px] text-zinc-500">SAC Code: <strong>996311</strong> (Hotel Accommodation)</p>
              </div>
            </div>

            {/* Bill To & Stay Summary */}
            <div className="grid grid-cols-2 gap-4 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">Billed To (Guest)</p>
                <p className="font-bold text-zinc-900 mt-0.5">{guestName}</p>
                <p className="text-zinc-600">Room {room} · {stay?.roomType || 'Deluxe King Suite'}</p>
                <p className="text-zinc-600">VIP Club Emerald #GC-9823410</p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">Stay Duration</p>
                <p className="font-bold text-zinc-900 mt-0.5">{stay?.arrival || 'Wed, 21 Oct'} &rarr; {stay?.departure || 'Fri, 23 Oct'}</p>
                <p className="text-zinc-600">Total Nights: 2 · Occupancy: 2 Adults</p>
                <p className="text-zinc-600">Billing Method: Visa (•••• 4242)</p>
              </div>
            </div>

            {/* Itemised Ledger Table */}
            <div className="border border-zinc-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-zinc-100 text-zinc-700 font-semibold text-[11px] border-b border-zinc-200">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Department</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr className="bg-zinc-50/50">
                    <td className="py-2 px-3 font-mono text-[11px] text-zinc-500">{stay?.arrival || '21 Oct'}</td>
                    <td className="py-2 px-3 text-zinc-600 font-medium">Front Desk</td>
                    <td className="py-2 px-3 text-zinc-900 font-medium">Deluxe King Suite Accommodation (2 Nights)</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">{money(breakdown.roomCharges)}</td>
                  </tr>
                  {lines.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2 px-3 font-mono text-[11px] text-zinc-500">{l.date}</td>
                      <td className="py-2 px-3 text-zinc-600">{getDepartmentForLine(l.label)}</td>
                      <td className="py-2 px-3 text-zinc-900">{l.label}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">
                        {l.amount < 0 ? `-${money(Math.abs(l.amount))}` : money(l.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tax Computation & Totals */}
            <div className="flex justify-end text-xs">
              <div className="w-64 space-y-1.5 border-t border-zinc-200 pt-2">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">
                    {money(breakdown.roomCharges + breakdown.serviceCharges - breakdown.creditsAndDiscounts)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>CGST (9.0%)</span>
                  <span className="font-mono font-medium">{money(breakdown.taxesAndFees / 2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>SGST (9.0%)</span>
                  <span className="font-mono font-medium">{money(breakdown.taxesAndFees / 2)}</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-900 pt-1 border-t border-zinc-200">
                  <span>Total Invoice Amount</span>
                  <span className="font-mono">{money(breakdown.totalBill)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Payments &amp; Pre-Auth</span>
                  <span className="font-mono">-{money(breakdown.paymentsReceived)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-amber-700 text-sm pt-1 border-t border-zinc-200">
                  <span>Balance Payable</span>
                  <span className="font-mono">{money(breakdown.outstandingBalance)}</span>
                </div>
              </div>
            </div>

            {/* Formal Footer / Signature */}
            <div className="pt-4 border-t border-zinc-200 flex items-center justify-between text-[11px] text-zinc-500">
              <div>
                <p>Authorized Signatory: <strong>Marcus Vance (Duty Manager)</strong></p>
                <p>Computer generated invoice · No physical signature required</p>
              </div>
              <div className="text-right">
                <p className="font-serif italic text-zinc-400">Thank you for staying at The Grand ADP</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

