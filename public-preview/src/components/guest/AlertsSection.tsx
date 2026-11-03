'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ChevronRight,
  CloudRain,
  Flame,
  Info,
  MapPin,
  Megaphone,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Wifi,
  Wind,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import { GuestEmptyState, GuestPill, GuestSectionHeader } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import type { AlertCategory, AlertSeverity, HotelAlert } from '@/types/demo';

const CATEGORIES: { id: 'all' | AlertCategory; label: string; icon: LucideIcon }[] = [
  { id: 'all', label: 'All Alerts', icon: Radio },
  { id: 'Emergency Alerts', label: 'Emergency', icon: Siren },
  { id: 'Safety Alerts', label: 'Safety', icon: ShieldAlert },
  { id: 'Weather Alerts', label: 'Weather', icon: Wind },
  { id: 'Hotel Announcements', label: 'Announcements', icon: Megaphone },
  { id: 'Important Operational Alerts', label: 'Operational', icon: Info },
];

export function AlertsSection({ room, guestName }: GuestTabProps) {
  const { state } = useDemo();
  const [selectedCategory, setSelectedCategory] = useState<'all' | AlertCategory>('all');
  const [selectedAlert, setSelectedAlert] = useState<HotelAlert | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);

  // Room floor number (e.g. 402 -> floor 4)
  const roomFloor = room ? room[0] : '4';

  // Extract alerts from state.hotelAlerts
  const baseAlerts = state.hotelAlerts ?? [];

  // Also convert any active broadcasted safety alerts from staff broadcast engine (state.safetyAlerts)
  const broadcastedSafetyAlerts: HotelAlert[] = (state.safetyAlerts ?? [])
    .filter((s) => s.status === 'broadcast_active')
    .map((s) => ({
      id: `sft-${s.id}`,
      ref: s.ref,
      title: s.title,
      description: s.description,
      category: (s.incidentType === 'weather' ? 'Weather Alerts' : s.incidentType === 'life_safety' ? 'Emergency Alerts' : 'Safety Alerts') as AlertCategory,
      severity: (s.priority === 'critical' ? 'Critical' : s.priority === 'urgent' ? 'High' : 'Medium') as AlertSeverity,
      timestamp: s.broadcastAt || s.reportedAt,
      location: s.location,
      affectedFloors: s.affectedFloors,
      guidance: 'Security and guest response teams on site. Please follow directions of staff officers.',
      active: true,
      requiresAcknowledgement: s.priority === 'critical',
    }));

  // Combine and deduplicate
  const allAlerts = [...broadcastedSafetyAlerts, ...baseAlerts].filter((a, idx, arr) => arr.findIndex((x) => x.id === a.id) === idx);

  // Filter alerts relevant to this guest: active AND (property-wide or floor matches)
  const relevantAlerts = allAlerts.filter((a) => {
    if (!a.active) return false;
    if (a.affectedFloors && a.affectedFloors.length > 0) {
      return a.affectedFloors.includes(roomFloor) || a.affectedFloors.includes('all');
    }
    return true;
  });

  const criticalAlerts = relevantAlerts.filter((a) => a.severity === 'Critical');
  const highAlerts = relevantAlerts.filter((a) => a.severity === 'High');
  const otherAlerts = relevantAlerts.filter((a) => a.severity === 'Medium' || a.severity === 'Low');

  // Filtered by active tab
  const displayedAlerts = relevantAlerts.filter((a) => {
    if (selectedCategory === 'all') return true;
    return a.category === selectedCategory;
  });

  function handleAcknowledge(alertId: string) {
    setAcknowledgedIds((prev) => [...prev, alertId]);
    setSelectedAlert(null);
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Critical Emergency Banner (if any) */}
      {criticalAlerts.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-rose-500 bg-gradient-to-br from-rose-950 via-ink-950 to-ink-900 p-4 text-white shadow-2xl animate-pulse">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <Siren className="h-6 w-6 text-rose-500 animate-spin" style={{ animationDuration: '3s' }} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold uppercase tracking-wider">
                  Critical Emergency Alert
                </span>
                <span className="text-[11px] text-rose-300 font-mono">{criticalAlerts[0].timestamp}</span>
              </div>
              <h2 className="text-sm font-bold text-white mt-1">{criticalAlerts[0].title}</h2>
              <p className="text-xs text-rose-100/90 mt-1 line-clamp-2">{criticalAlerts[0].description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-rose-300 flex items-center gap-1 font-medium">
                  <MapPin className="h-3 w-3" /> {criticalAlerts[0].location || 'Hotel Property'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedAlert(criticalAlerts[0])}
                  className="px-3 py-1 rounded-lg bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition"
                >
                  View Details &amp; Guidance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="guest-card p-4 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/15 text-amber-300">
              <Radio className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Active Hotel &amp; Safety Alerts</span>
                {relevantAlerts.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-ink-950 font-bold">
                    {relevantAlerts.length}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-mist-400">Live operational, weather, safety, and property updates for Room {room}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div>
        <GuestSectionHeader title="Alert Categories" />
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            const count = cat.id === 'all'
              ? relevantAlerts.length
              : relevantAlerts.filter((a) => a.category === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'guest-chip-btn flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition',
                  active && 'ring-2 ring-amber-400 border-amber-400/50 bg-amber-400/15 text-white',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
                {count > 0 && (
                  <span className={cn('text-[10px] px-1 rounded-full', active ? 'bg-amber-400 text-ink-950 font-bold' : 'bg-white/10 text-mist-300')}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <GuestSectionHeader title="Live Notices &amp; Broadcasts" hint="Filtered dynamically by your suite level and resort property" />
          <span className="text-[11px] text-mist-400">Showing {displayedAlerts.length}</span>
        </div>

        {displayedAlerts.length === 0 ? (
          <GuestEmptyState icon={ShieldCheck} title="No active alerts in this category" hint="All systems, facilities, and weather conditions are normal for your stay." />
        ) : (
          <ul className="space-y-3">
            {displayedAlerts.map((alert) => {
              const isCrit = alert.severity === 'Critical';
              const isHigh = alert.severity === 'High';
              const isAcked = acknowledgedIds.includes(alert.id);

              return (
                <li
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={cn(
                    'guest-card p-4 space-y-2 cursor-pointer hover:border-amber-400/40 transition',
                    isCrit && 'border-rose-500/40 bg-rose-500/5',
                    isHigh && 'border-amber-500/30 bg-amber-500/5',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-white">{alert.title}</span>
                        <span className="font-mono text-[10px] text-mist-400">{alert.ref}</span>
                      </div>
                      <p className="text-xs text-mist-300 mt-1 line-clamp-2">{alert.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={cn(
                          'text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border',
                          isCrit && 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse',
                          isHigh && 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                          alert.severity === 'Medium' && 'bg-sky-500/20 text-sky-300 border-sky-500/40',
                          alert.severity === 'Low' && 'bg-white/5 text-mist-300 border-white/10',
                        )}
                      >
                        {alert.severity}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] text-mist-400">
                    <span className="flex items-center gap-1.5">
                      {alert.location && (
                        <span className="flex items-center gap-1 text-mist-300">
                          <MapPin className="h-3 w-3 text-amber-400" />
                          <span className="truncate max-w-[180px]">{alert.location}</span>
                        </span>
                      )}
                    </span>

                    <span className="font-mono text-[10px] text-amber-300 shrink-0">
                      {alert.timestamp}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-ink-900 p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-xl',
                    selectedAlert.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-400/20 text-amber-300',
                  )}
                >
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">{selectedAlert.category}</span>
                  <h3 className="text-sm font-bold text-white">{selectedAlert.ref}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="p-1 rounded-lg text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-sm text-white">{selectedAlert.title}</h4>
                <p className="text-mist-200 mt-1 leading-relaxed">{selectedAlert.description}</p>
              </div>

              {selectedAlert.location && (
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-mist-400 block">Location &amp; Affected Area</span>
                  <p className="text-white flex items-center gap-1.5 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-amber-400" />
                    <span>{selectedAlert.location}</span>
                  </p>
                  {selectedAlert.affectedFloors && (
                    <span className="text-[11px] text-amber-300 block">
                      Affected Levels: Floor(s) {selectedAlert.affectedFloors.join(', ')}
                    </span>
                  )}
                </div>
              )}

              {selectedAlert.guidance && (
                <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-200/90 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-300 block">Guest Guidance &amp; Safety Protocol</span>
                  <p className="text-xs">{selectedAlert.guidance}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-mist-400 pt-2 border-t border-white/[0.08]">
                <span>Broadcasted: {selectedAlert.timestamp}</span>
                <span className="font-semibold text-white">Severity: {selectedAlert.severity}</span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleAcknowledge(selectedAlert.id)}
                  className="w-full py-2.5 rounded-xl bg-amber-400 text-ink-950 font-bold hover:bg-amber-300 flex items-center justify-center gap-1.5 text-xs"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Acknowledge Notice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

