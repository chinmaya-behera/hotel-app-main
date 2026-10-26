'use client';

import { X, Printer, Download, CheckCircle2, Clock, AlertCircle, Building2, CreditCard, ShieldCheck } from 'lucide-react';
import type { FinanceInvoice } from '@/types/demo';

interface InvoiceDetailModalProps {
  invoice: FinanceInvoice | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordPayment?: (invoice: FinanceInvoice) => void;
}

export function InvoiceDetailModal({ invoice, isOpen, onClose, onRecordPayment }: InvoiceDetailModalProps) {
  if (!isOpen || !invoice) return null;

  const isPaid = invoice.status === 'Paid';
  const isOverdue = invoice.status === 'Overdue';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = `THE GRAND AZURE HOTEL & RESORT
INVOICE: ${invoice.id}
Guest: ${invoice.guestName}
Room: ${invoice.roomNumber} | Booking Ref: ${invoice.bookingId}
Dates: ${invoice.checkInDate} to ${invoice.checkOutDate}
Date Issued: ${invoice.createdAt} | Due: ${invoice.dueDate}

LINE ITEMS:
${(invoice.items ?? [])
  .map((item) => `- ${item.description} (${item.category}): ₹${item.amount.toLocaleString('en-IN')}`)
  .join('\n')}

Room Charges: ₹${invoice.roomCharges.toLocaleString('en-IN')}
Service Charges: ₹${invoice.serviceCharges.toLocaleString('en-IN')}
Taxes (18% GST): ₹${invoice.taxAmount.toLocaleString('en-IN')}
Discounts: -₹${invoice.discountAmount.toLocaleString('en-IN')}
------------------------------------------------------
TOTAL AMOUNT: ₹${invoice.totalAmount.toLocaleString('en-IN')}
PAID AMOUNT: ₹${invoice.paidAmount.toLocaleString('en-IN')}
OUTSTANDING BALANCE: ₹${invoice.outstandingBalance.toLocaleString('en-IN')}
STATUS: ${invoice.status.toUpperCase()}
Payment Method: ${invoice.paymentMethod || 'N/A'}
Notes: ${invoice.notes || 'None'}
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.id}_Summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-ink-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-ink-950/80">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-mist-400">INVOICE PREVIEW</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isPaid
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isOverdue
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              title="Download text summary"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-mist-300 hover:text-white transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={handlePrint}
              title="Print invoice"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-mist-300 hover:text-white transition-colors"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-mist-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Canvas (Luxury Hotel Invoice Styling) */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-white">
          {/* Hotel Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-lime-500/20 text-lime-400 flex items-center justify-center font-bold">
                  GA
                </div>
                <h1 className="text-base font-bold text-white tracking-wide">THE GRAND AZURE HOTEL & RESORT</h1>
              </div>
              <p className="text-[11px] text-mist-400 mt-1">108 Azure Promenade, Marine Vista, Mumbai 400001</p>
              <p className="text-[10px] text-mist-500 font-mono">GSTIN: 27AAACG0188Q1Z4 | CIN: U55101MH2026PLC99182</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-lime-400 tracking-wider">TAX INVOICE</span>
              <p className="text-base font-mono font-bold text-white mt-0.5">{invoice.id}</p>
              <p className="text-[11px] text-mist-400">Date: {invoice.createdAt}</p>
              <p className="text-[11px] text-mist-400">Due: {invoice.dueDate}</p>
            </div>
          </div>

          {/* Guest & Stay Details Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-ink-950/70 border border-white/5">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-mist-400 uppercase tracking-wider block">Billed To</span>
              <p className="text-sm font-bold text-white">{invoice.guestName}</p>
              <p className="text-[11px] text-mist-300 font-mono">Booking Ref: {invoice.bookingId}</p>
              <p className="text-[11px] text-mist-400">Room: {invoice.roomNumber}</p>
            </div>
            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] font-semibold text-mist-400 uppercase tracking-wider block">Stay Duration</span>
              <p className="text-[11px] text-mist-200">
                Check-in: <span className="font-semibold text-white">{invoice.checkInDate}</span>
              </p>
              <p className="text-[11px] text-mist-200">
                Check-out: <span className="font-semibold text-white">{invoice.checkOutDate}</span>
              </p>
              <p className="text-[11px] text-mist-400">Method: {invoice.paymentMethod || 'Front Desk Settle'}</p>
            </div>
          </div>

          {/* Itemized Charges Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-mist-300 uppercase tracking-wider">Itemized Folio Breakdown</h3>
            <div className="rounded-xl border border-white/10 overflow-hidden bg-ink-950/40">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-white/5 text-mist-400 border-b border-white/10">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">Category</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-mist-200">
                  {(invoice.items && invoice.items.length > 0 ? invoice.items : [
                    { id: '1', description: 'Room Accommodation Charges', category: 'Room', amount: invoice.roomCharges },
                    { id: '2', description: 'F&B and Incidentals', category: 'Service', amount: invoice.serviceCharges },
                    { id: '3', description: 'Goods & Services Tax (18% GST)', category: 'Tax', amount: invoice.taxAmount },
                  ]).map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 text-white font-medium">{item.description}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-mist-400">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-white">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Calculation Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 max-w-sm space-y-1 text-[11px] text-mist-400">
              <p className="font-semibold text-mist-300 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-lime-400" /> Statutory Compliance
              </p>
              <p>All hospitality tariffs include applicable CGST (9%) and SGST (9%). Invoices are digitally certified for audit.</p>
              {invoice.notes && (
                <p className="pt-1 text-mist-300 italic border-t border-white/5">Note: {invoice.notes}</p>
              )}
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-mist-300">
                <span>Room Charges:</span>
                <span className="font-mono">₹{invoice.roomCharges.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-mist-300">
                <span>Service Charges:</span>
                <span className="font-mono">₹{invoice.serviceCharges.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-mist-300">
                <span>Taxes (18% GST):</span>
                <span className="font-mono">₹{invoice.taxAmount.toLocaleString('en-IN')}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discounts / Credits:</span>
                  <span className="font-mono">-₹{invoice.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-white/10">
                <span>Total Amount:</span>
                <span className="font-mono text-lime-400">₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-mist-300">
                <span>Paid to Date:</span>
                <span className="font-mono text-emerald-400">₹{invoice.paidAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-white/5">
                <span className={invoice.outstandingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  Outstanding Balance:
                </span>
                <span className="font-mono text-white">
                  ₹{invoice.outstandingBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-ink-950/80">
          <span className="text-[10px] text-mist-500 font-mono">
            Generated via Financial Operator Console (EMP-0107)
          </span>

          <div className="flex items-center gap-2">
            {invoice.outstandingBalance > 0 && onRecordPayment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRecordPayment(invoice);
                }}
                className="py-1.5 px-3 rounded-xl bg-lime-500 hover:bg-lime-600 text-ink-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-lime-500/20"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Record Payment</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
