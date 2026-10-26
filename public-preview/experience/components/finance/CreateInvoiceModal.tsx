'use client';

import { useState, useMemo } from 'react';
import { X, FilePlus2, AlertCircle, Calculator } from 'lucide-react';
import type { FinanceInvoice, InvoiceStatus } from '@/types/demo';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: Omit<FinanceInvoice, 'id' | 'createdAt' | 'outstandingBalance'>) => void;
}

export function CreateInvoiceModal({ isOpen, onClose, onSubmit }: CreateInvoiceModalProps) {
  const [guestName, setGuestName] = useState('');
  const [roomNumber, setRoomNumber] = useState('402');
  const [bookingId, setBookingId] = useState(`BK-${Math.floor(8000 + Math.random() * 1900)}`);
  const [checkInDate, setCheckInDate] = useState('23 Oct 2026');
  const [checkOutDate, setCheckOutDate] = useState('25 Oct 2026');
  const [dueDate, setDueDate] = useState('25 Oct 2026');
  const [roomCharges, setRoomCharges] = useState<number>(32000);
  const [serviceCharges, setServiceCharges] = useState<number>(4500);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-calculated Tax & Total
  const subtotal = Math.max(0, roomCharges + serviceCharges - discountAmount);
  const taxAmount = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + taxAmount;
  const balance = Math.max(0, totalAmount - paidAmount);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('Guest Name is required.');
      return;
    }
    if (!roomNumber.trim()) {
      setError('Room Number is required.');
      return;
    }
    if (roomCharges <= 0) {
      setError('Room charges must be greater than zero.');
      return;
    }
    if (paidAmount > totalAmount) {
      setError('Paid amount cannot exceed total invoice amount.');
      return;
    }

    const initialStatus: InvoiceStatus =
      balance <= 0 ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Unpaid';

    onSubmit({
      guestName: guestName.trim(),
      roomNumber: roomNumber.trim(),
      bookingId: bookingId.trim(),
      checkInDate,
      checkOutDate,
      dueDate,
      roomCharges,
      serviceCharges,
      taxAmount,
      discountAmount,
      totalAmount,
      paidAmount,
      status: initialStatus,
      paymentMethod: paidAmount > 0 ? paymentMethod : undefined,
      notes: notes.trim() || undefined,
      items: [
        { id: 'item-1', description: `Room Stay Charges (Room ${roomNumber})`, category: 'Room', amount: roomCharges },
        ...(serviceCharges > 0
          ? [{ id: 'item-2', description: 'F&B and Guest Amenities', category: 'Service' as const, amount: serviceCharges }]
          : []),
        { id: 'item-tax', description: 'Goods & Services Tax (18% GST)', category: 'Tax', amount: taxAmount },
      ],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg bg-ink-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-ink-950">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-lime-500/20 text-lime-400 flex items-center justify-center">
              <FilePlus2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Generate Guest Invoice</h3>
              <p className="text-[10px] text-mist-400">Create new tax invoice and billing record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-mist-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Guest Name & Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-mist-300 font-medium mb-1">
                Guest Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Ananya Roy"
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500 focus:outline-none focus:border-lime-500"
              />
            </div>
            <div>
              <label className="block text-mist-300 font-medium mb-1">
                Room Number <span className="text-rose-400">*</span>
              </label>
              <select
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-lime-500"
              >
                <option value="127">Room 127 · Garden Villa</option>
                <option value="210">Room 210 · Premium Double</option>
                <option value="305">Room 305 · Grand Suite</option>
                <option value="308">Room 308 · Club Executive</option>
                <option value="402">Room 402 · Deluxe King</option>
                <option value="412">Room 412 · Corporate Twin</option>
                <option value="502">Room 502 · Luxury Penthouse</option>
                <option value="518">Room 518 · Presidential Suite</option>
              </select>
            </div>
          </div>

          {/* Booking ID & Dates */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-mist-400 text-[10px] uppercase font-semibold mb-1">Booking Ref</label>
              <input
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-2.5 py-1.5 text-white font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-mist-400 text-[10px] uppercase font-semibold mb-1">Check-In</label>
              <input
                type="text"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-2.5 py-1.5 text-white text-[11px]"
              />
            </div>
            <div>
              <label className="block text-mist-400 text-[10px] uppercase font-semibold mb-1">Due Date</label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-2.5 py-1.5 text-white text-[11px]"
              />
            </div>
          </div>

          {/* Tariffs Breakdown */}
          <div className="p-3 rounded-xl bg-ink-950 border border-white/10 space-y-3">
            <span className="text-[11px] font-bold text-mist-300 uppercase tracking-wider block">
              Tariff & Charges (₹ INR)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-mist-400 text-[11px] mb-1">Room Charges</label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={roomCharges}
                  onChange={(e) => setRoomCharges(Number(e.target.value))}
                  className="w-full rounded-xl bg-ink-900 border border-white/10 px-3 py-1.5 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-mist-400 text-[11px] mb-1">Service & F&B</label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={serviceCharges}
                  onChange={(e) => setServiceCharges(Number(e.target.value))}
                  className="w-full rounded-xl bg-ink-900 border border-white/10 px-3 py-1.5 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-mist-400 text-[11px] mb-1">Discounts</label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full rounded-xl bg-ink-900 border border-white/10 px-3 py-1.5 text-white font-mono text-xs"
                />
              </div>
            </div>

            {/* Tax & Total Summary Preview */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-mist-400">GST (18% auto-computed): <span className="font-mono text-white">₹{taxAmount.toLocaleString('en-IN')}</span></span>
              <span className="text-white font-bold">Total: <span className="font-mono text-lime-400 font-black">₹{totalAmount.toLocaleString('en-IN')}</span></span>
            </div>
          </div>

          {/* Initial Payment Received */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-mist-300 font-medium mb-1">Initial Advance Payment (₹)</label>
              <input
                type="number"
                min={0}
                max={totalAmount}
                step={500}
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white font-mono"
              />
              <span className="text-[10px] text-mist-500 mt-0.5 block">
                Outstanding: ₹{balance.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <label className="block text-mist-300 font-medium mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={paidAmount === 0}
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-lime-500 disabled:opacity-50"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Cash">Cash</option>
                <option value="Direct Bill">Direct Bill (Corporate)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-mist-300 font-medium mb-1">Invoice Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. VIP guest corporate billing instructions"
              className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500"
            />
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
              Create Invoice (₹{totalAmount.toLocaleString('en-IN')})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
