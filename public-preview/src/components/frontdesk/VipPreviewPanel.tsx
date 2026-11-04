'use client';

import { useState } from 'react';
import {
  Crown,
  Sparkles,
  BedDouble,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Send,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/frontdesk/Modal';
import { useDemo } from '@/lib/store';
import { cn, money } from '@/lib/utils';
import { folioSeed } from '@/lib/mockData';
import type { StayRecord } from '@/types/demo';

export function VipPreviewPanel({ onSwitchTab }: { onSwitchTab?: (tab: string) => void }) {
  const { state } = useDemo();
  const [activeFolioStay, setActiveFolioStay] = useState<StayRecord | null>(null);
  const [activeMessageStay, setActiveMessageStay] = useState<StayRecord | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const stays = state.frontDesk?.stays ?? [];
  const vipStays = stays.filter((s) => s.vip);

  // Helper for initials
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

  // Helper for stay status pill
  const getStayStatusBadge = (st: StayRecord) => {
    if (st.status === 'in_house') {
      if (st.departsToday) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
            <Clock className="h-3 w-3" /> Late Checkout 16:00
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
          <CheckCircle2 className="h-3 w-3" /> In-House
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-400/15 text-sky-300 border border-sky-400/30">
        <Clock className="h-3 w-3" /> Arriving 14:00
      </span>
    );
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setMessageText('');
      setActiveMessageStay(null);
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* 3 VIP Profiles - High-Signal, Minimalist Scannable Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
        {vipStays.map((st) => {
          const initials = getInitials(st.guest);
          const folioItems = folioSeed[st.room] ?? [];
          const totalFolio = folioItems.reduce((acc, f) => acc + f.amount, 0);

          return (
            <div
              key={st.id}
              className="rounded-2xl border border-white/10 bg-ink-900/80 p-5 space-y-4 hover:border-amber-400/35 transition-all duration-200 shadow-xl flex flex-col justify-between"
            >
              {/* Card Header Row */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-full shrink-0 bg-gradient-to-br from-amber-400/25 to-amber-600/30 border border-amber-400/40 flex items-center justify-center font-bold text-amber-200 text-sm shadow-md">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-white truncate tracking-tight">{st.guest}</h3>
                      <p className="text-xs text-mist-300 font-medium truncate">
                        Room {st.room} · {st.roomType}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm">
                    {st.vipTier ?? '👑 Chairman\'s Club'}
                  </span>
                  {getStayStatusBadge(st)}
                </div>
              </div>

              {/* Key Info Chips (Minimal Text) */}
              <div className="space-y-2 rounded-xl bg-white/[0.03] border border-white/5 p-3 text-xs">
                {/* Milestone / Occasion */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-mist-400 shrink-0">Milestone:</span>
                  <span className="font-semibold text-amber-200 text-xs truncate">
                    {st.milestone ?? '💼 Executive VIP Stay'}
                  </span>
                </div>

                {/* Dietary / Allergies */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-mist-400 shrink-0">Dietary:</span>
                  <span className="font-semibold text-rose-300 text-xs truncate">
                    {st.dietarySummary ?? '🥜 Severe Nut Allergy'}
                  </span>
                </div>

                {/* Room & Arrival Preferences */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-mist-400 shrink-0">Preferences:</span>
                  <span className="font-semibold text-mist-200 text-xs truncate">
                    {st.preferencesSummary ?? '🛏️ Hypoallergenic Pillows'}
                  </span>
                </div>
              </div>

              {/* GM / Duty Manager Status & Action Footer */}
              <div className="pt-2 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{st.gmStatus ?? '✓ GM Welcome Card Placed'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveMessageStay(st)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-semibold text-mist-200 hover:text-white transition shadow-sm active:scale-[0.98]"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
                    <span>Message Guest</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFolioStay(st)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-xs font-semibold text-amber-200 hover:text-amber-100 transition shadow-sm active:scale-[0.98]"
                  >
                    <FileText className="h-3.5 w-3.5 text-amber-400" />
                    <span>View Folio</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Folio Modal */}
      {activeFolioStay && (
        <Modal
          title={`Guest Folio · ${activeFolioStay.guest}`}
          description={`Room ${activeFolioStay.room} · ${activeFolioStay.roomType} · VIP`}
          onClose={() => setActiveFolioStay(null)}
          footer={
            <Button variant="subtle" onClick={() => setActiveFolioStay(null)}>
              Close Folio
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <div>
                <span className="text-xs text-mist-400 block">Stay Duration</span>
                <span className="text-sm font-semibold text-white">
                  {activeFolioStay.arrival} → {activeFolioStay.departure}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-mist-400 block">Settlement Status</span>
                <span className="text-sm font-bold text-emerald-400">
                  {activeFolioStay.paid > 0 ? `${money(activeFolioStay.paid)} Settled` : 'Pre-Authorized Token'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-mist-300">Folio Line Items</h4>
              <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                {(folioSeed[activeFolioStay.room] ?? [
                  { id: 'item-1', label: `${activeFolioStay.roomType} (4 nights)`, amount: 1800, date: 'Today' },
                  { id: 'item-2', label: 'Resort Fee & VIP Lounge Access', amount: 90, date: 'Today' },
                ]).map((item) => (
                  <div key={item.id} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="text-[11px] text-mist-400">{item.date}</p>
                    </div>
                    <span className="font-semibold text-white">{money(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Message Guest Modal */}
      {activeMessageStay && (
        <Modal
          title={`Direct Message · Room ${activeMessageStay.room}`}
          description={`Recipient: ${activeMessageStay.guest} (${activeMessageStay.vipTier ?? 'VIP'})`}
          onClose={() => {
            setActiveMessageStay(null);
            setMessageSent(false);
          }}
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="subtle"
                onClick={() => {
                  setActiveMessageStay(null);
                  setMessageSent(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={handleSendMessage}
                disabled={!messageText.trim() || messageSent}
              >
                {messageSent ? 'Sent ✓' : 'Send Message'}
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-mist-300">
              Sends an instant Front Desk VIP message to the guest's mobile portal and active in-room tablet.
            </p>
            <div className="relative">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Type a personalized concierge message for ${activeMessageStay.guest}...`}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-white placeholder-mist-400 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/50 resize-none"
              />
            </div>
            {messageSent && (
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Message successfully dispatched to Room {activeMessageStay.room}.
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
