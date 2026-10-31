'use client';

import { useState } from 'react';
import {
  Crown,
  Heart,
  Star,
  Sparkles,
  BedDouble,
  Clock,
  ShieldCheck,
  CheckCircle2,
  UtensilsCrossed,
  MessageSquareWarning,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { useDemo } from '@/lib/store';
import { cn, money } from '@/lib/utils';
import type { StayRecord } from '@/types/demo';

export function VipPreviewPanel({ onSwitchTab }: { onSwitchTab?: (tab: string) => void }) {
  const { state } = useDemo();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const stays = state.frontDesk?.stays ?? [];
  const vipStays = stays.filter((s) => s.vip);

  // VIP guests list from active stays
  const activeSelected = selectedRoom
    ? vipStays.find((s) => s.room === selectedRoom) ?? vipStays[0]
    : vipStays[0];

  const prefs = activeSelected ? state.guestPreferences?.[activeSelected.room] : null;
  const reminders = (state.guestReminders ?? []).filter(
    (r) => activeSelected && (r.room === activeSelected.room || r.guestName === activeSelected.guest),
  );
  const queue = state.items.front_desk_coordinator ?? [];
  const vipRequests = queue.filter((i) => activeSelected && i.room === activeSelected.room);

  return (
    <div className="space-y-6">
      {/* VIP Overview Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-ink-900 to-amber-950/20 p-5 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold font-display text-white">
                VIP Guest Directory & Preferences
              </h2>
              <p className="text-xs text-mist-300">
                Front Desk VIP profile previews, stay milestones, dietary notes and synchronized General Manager alerts
              </p>
            </div>
          </div>
          <Badge tone="accent" className="px-3 py-1 text-xs">
            {vipStays.length} VIP Guest{vipStays.length === 1 ? '' : 's'} In-House / Expected
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,1fr)_minmax(0,2fr)]">
        {/* Left Column: VIP Selector Cards */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-mist-400 uppercase tracking-wider px-1">
            VIP Guest Roster
          </p>
          {vipStays.map((st) => {
            const isSelected = activeSelected?.id === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedRoom(st.room)}
                className={cn(
                  'w-full text-left p-4 rounded-2xl border transition-all text-white',
                  isSelected
                    ? 'border-amber-400/40 bg-amber-400/[0.08] shadow-lg shadow-amber-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Crown className="h-4 w-4 text-amber-400" />
                    <span>{st.guest}</span>
                  </span>
                  <Badge tone={st.status === 'in_house' ? 'success' : 'info'}>
                    {st.status === 'in_house' ? 'In House' : 'Expected'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-mist-400">
                  Room {st.room} · {st.roomType}
                </p>
                <p className="mt-1 text-[11px] text-amber-200/80">
                  {st.status === 'in_house' ? `Departs ${st.departure}` : `Arrives ${st.arrival}`}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Column: Detailed VIP Card & Service History */}
        {activeSelected && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{activeSelected.guest}</span>
                    <Badge tone="accent">Diamond VIP</Badge>
                  </h3>
                  <p className="text-xs text-mist-400 mt-0.5">
                    Room {activeSelected.room} · {activeSelected.roomType} · {activeSelected.nights} night{activeSelected.nights === 1 ? '' : 's'} stay
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-mist-400 block">Folio Balance</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {money(activeSelected.paid)} Paid
                  </span>
                </div>
              </div>

              {/* Personal Preferences */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Documented Guest Preferences & Dietaries</span>
                </h4>
                {prefs ? (
                  <div className="grid gap-2 sm:grid-cols-2 text-xs">
                    <div>
                      <span className="text-mist-400 block text-[11px]">Allergies:</span>
                      <span className="text-rose-200 font-semibold">
                        {(prefs.allergies ?? []).join(', ') || 'None recorded'}
                      </span>
                    </div>
                    <div>
                      <span className="text-mist-400 block text-[11px]">Dietary Notes:</span>
                      <span className="text-white font-medium">
                        {(prefs.dietaryRestrictions ?? []).join(', ') || 'Standard luxury profile'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-mist-400 block text-[11px]">Personal Instructions:</span>
                      <span className="text-mist-200 italic">
                        "{prefs.personalInstructions || 'No custom turndown instructions entered.'}"
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-mist-400">No custom stay preferences entered in portal.</p>
                )}
              </div>

              {/* VIP Operational Reminders */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-mist-300 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-sky-400" />
                    <span>Active VIP Reminders ({reminders.length})</span>
                  </h4>
                  {onSwitchTab && (
                    <button
                      onClick={() => onSwitchTab('reminders')}
                      className="text-xs text-sky-400 hover:text-sky-300"
                    >
                      Manage reminders →
                    </button>
                  )}
                </div>
                {reminders.length === 0 ? (
                  <p className="text-xs text-mist-500 py-2">No active reminders logged for this VIP.</p>
                ) : (
                  <div className="divide-y divide-white/5 rounded-xl border border-white/5 bg-white/[0.01]">
                    {reminders.map((r) => (
                      <div key={r.id} className="p-3 text-xs flex items-center justify-between gap-2">
                        <span className="text-mist-200">{r.text}</span>
                        <Badge tone={r.status === 'completed' ? 'success' : 'warning'}>
                          {r.dueDateTime}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Service Requests */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-mist-300">
                  Open Requests in Front Desk Queue ({vipRequests.length})
                </h4>
                {vipRequests.length === 0 ? (
                  <p className="text-xs text-mist-500 py-1">No outstanding requests for Room {activeSelected.room}.</p>
                ) : (
                  <div className="divide-y divide-white/5 rounded-xl border border-white/5 bg-white/[0.01]">
                    {vipRequests.map((req) => (
                      <div key={req.id} className="p-3 text-xs flex items-center justify-between gap-2">
                        <span className="text-white font-medium">{req.title}</span>
                        <Badge tone="info">{req.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs text-mist-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Synchronized with General Manager Executive VIP Dossier</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
