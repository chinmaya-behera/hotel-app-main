'use client';

import { useState } from 'react';
import {
  ShieldAlert,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Activity,
  Compass,
  AlertTriangle,
  Users,
  MapPin,
  ChevronRight,
  PlusCircle,
  FileCheck2,
  Sparkles,
  Volume2,
} from 'lucide-react';
import type { WorkItem } from '@/types/demo';
import { SecurityLogIncidentModal } from './SecurityLogIncidentModal';
import { SecurityIncidentDetailModal } from './SecurityIncidentDetailModal';

interface SecurityHomeTabProps {
  items: WorkItem[];
  feed: Array<{ id: string; at: string; role: string; text: string }>;
  onSelectIncident: (item: WorkItem) => void;
  onNavigateTab: (tab: 'incidents' | 'alerts' | 'history' | 'profile') => void;
  onAcknowledge: (id: string) => void;
  onArrive: (id: string) => void;
  onResolve: (id: string, report: any) => void;
  onRequestBackup: (id: string, reason: string) => void;
  onEscalate: (id: string, reason: string, notes?: string) => void;
  onAddNote: (id: string, text: string) => void;
  onCreateIncident: (incident: any) => void;
}

export function SecurityHomeTab({
  items,
  feed,
  onSelectIncident,
  onNavigateTab,
  onAcknowledge,
  onArrive,
  onResolve,
  onRequestBackup,
  onEscalate,
  onAddNote,
  onCreateIncident,
}: SecurityHomeTabProps) {
  const [showLogModal, setShowLogModal] = useState(false);
  const [detailItem, setDetailItem] = useState<WorkItem | null>(null);

  // Derived counts
  const criticalCount = items.filter(
    (i) => (i.priority === 'critical' || i.tone === 'danger') && i.status !== 'Resolved',
  ).length;
  const activeCount = items.filter((i) => i.status !== 'Resolved').length;
  const assignedToMeCount = items.filter(
    (i) => i.status === 'Acknowledged' || i.status === 'On scene' || i.status === 'Backup requested',
  ).length;
  const resolvedCount = items.filter((i) => i.status === 'Resolved').length;

  // Urgent active alert (first critical or new urgent item)
  const urgentAlert = items.find(
    (i) => (i.priority === 'critical' || i.status === 'New') && i.status !== 'Resolved',
  );

  // Recent 3 incidents
  const recentIncidents = items.slice(0, 3);

  // Security relevant activity feed
  const securityFeed = feed
    .filter(
      (f) =>
        f.role.toLowerCase().includes('security') ||
        f.role.toLowerCase().includes('duty') ||
        f.text.toLowerCase().includes('security') ||
        f.text.toLowerCase().includes('incident'),
    )
    .slice(0, 4);

  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-150">
      {/* Urgent Critical Incident Alert Banner (1-tap Acknowledge) */}
      {urgentAlert && (
        <div className="rounded-2xl bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-ink-900 border border-rose-500/40 p-3.5 shadow-xl shadow-rose-950/40 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 w-20 h-20 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/40 animate-pulse">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-rose-500 text-[10px] font-black uppercase tracking-wider">
                    {urgentAlert.priority === 'critical' ? 'CRITICAL SOS' : 'ACTION REQUIRED'}
                  </span>
                  <span className="text-[11px] text-rose-300 font-mono">{urgentAlert.ref || urgentAlert.id}</span>
                </div>
                <h3 className="text-xs font-bold text-white mt-1 truncate">{urgentAlert.title}</h3>
                <p className="text-[11px] text-rose-200/90 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                  <span className="truncate">{urgentAlert.location || 'Location on file'}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            {urgentAlert.status === 'New' ? (
              <button
                type="button"
                onClick={() => onAcknowledge(urgentAlert.id)}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/30 flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all"
              >
                <span>Acknowledge Alert</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSelectIncident(urgentAlert)}
                className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View Details</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onSelectIncident(urgentAlert)}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors shrink-0"
            >
              Inspect
            </button>
          </div>
        </div>
      )}

      {/* 4 Summary Metric KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Critical */}
        <button
          type="button"
          onClick={() => onNavigateTab('alerts')}
          className="text-left p-3 rounded-2xl bg-gradient-to-br from-rose-950/40 to-ink-900 border border-rose-500/20 hover:border-rose-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-rose-300">Critical Incidents</span>
            <div className="h-6 w-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flame className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-white">{criticalCount}</p>
          <span className="text-[10px] text-rose-400 font-medium">Immediate response</span>
        </button>

        {/* Active Incidents */}
        <button
          type="button"
          onClick={() => onNavigateTab('incidents')}
          className="text-left p-3 rounded-2xl bg-gradient-to-br from-amber-950/40 to-ink-900 border border-amber-500/20 hover:border-amber-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-amber-300">Active Queue</span>
            <div className="h-6 w-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-white">{activeCount}</p>
          <span className="text-[10px] text-amber-400 font-medium">Open cases</span>
        </button>

        {/* Assigned to Me */}
        <button
          type="button"
          onClick={() => onNavigateTab('incidents')}
          className="text-left p-3 rounded-2xl bg-gradient-to-br from-sky-950/40 to-ink-900 border border-sky-500/20 hover:border-sky-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-sky-300">My Response</span>
            <div className="h-6 w-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-white">{assignedToMeCount}</p>
          <span className="text-[10px] text-sky-400 font-medium">In progress</span>
        </button>

        {/* Resolved Today */}
        <button
          type="button"
          onClick={() => onNavigateTab('history')}
          className="text-left p-3 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-ink-900 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-emerald-300">Resolved Today</span>
            <div className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-white">{resolvedCount}</p>
          <span className="text-[10px] text-emerald-400 font-medium">Secured & filed</span>
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          className="flex-1 py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-ink-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-[0.99] transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Log Field Incident</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab('incidents')}
          className="py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>All Incidents</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Current Shift & Patrol Coverage Section (dashboards.ts audit) */}
      <div className="p-3.5 rounded-2xl bg-ink-900/90 border border-white/10 text-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Night Patrol Status</span>
          </div>
          <span className="text-[10px] text-mist-400 font-mono">22:00 – 07:00</span>
        </div>

        {/* Patrol Coverage Progress Bars */}
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-mist-300">Lobby & Entrance Portico</span>
              <span className="text-emerald-400 font-bold">100% (Covered)</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full w-full" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-mist-300">Pool Deck & Spa Perimeter</span>
              <span className="text-amber-400 font-bold">60% (Active Sweep)</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full w-[60%]" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-mist-300">Basement & Surface Parking</span>
              <span className="text-emerald-400 font-bold">90% (Covered)</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full w-[90%]" />
            </div>
          </div>
        </div>

        {/* Handover Notes from Evening Shift */}
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-mist-400 font-medium">Handover Note · Officer T. Chen (Evening)</span>
            <span className="text-mist-500">21:55</span>
          </div>
          <p className="text-[11px] text-mist-200">
            "Gate 3 magnetic latch recalibrated by Engineering. Suite 402 guest reported mild hallway foot traffic; quiet hours advisory active."
          </p>
        </div>
      </div>

      {/* Recently Active Incidents */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Incident Queue</h3>
          <button
            type="button"
            onClick={() => onNavigateTab('incidents')}
            className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
          >
            See all ({items.length})
          </button>
        </div>

        <div className="space-y-2">
          {recentIncidents.map((incident) => (
            <div
              key={incident.id}
              onClick={() => onSelectIncident(incident)}
              className="p-3 rounded-2xl bg-ink-900 border border-white/10 hover:border-white/20 transition-all cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        incident.priority === 'critical'
                          ? 'bg-rose-500'
                          : incident.priority === 'urgent'
                          ? 'bg-amber-400'
                          : 'bg-sky-400'
                      }`}
                    />
                    <h4 className="text-xs font-bold text-white truncate">{incident.title}</h4>
                  </div>
                  <p className="text-[11px] text-mist-400 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="h-3 w-3 text-mist-500 shrink-0" />
                    <span>{incident.location || 'Location on file'}</span>
                  </p>
                </div>

                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    incident.status === 'Resolved'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : incident.status === 'On scene'
                      ? 'bg-amber-500/20 text-amber-300'
                      : incident.status === 'Acknowledged'
                      ? 'bg-sky-500/20 text-sky-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {incident.chip || incident.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Security Activity Stream */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-mist-400" /> Recent Security Trail
        </h3>
        <div className="space-y-1.5">
          {securityFeed.map((entry) => (
            <div
              key={entry.id}
              className="p-2.5 rounded-xl bg-ink-950/70 border border-white/5 text-[11px] flex items-start gap-2.5"
            >
              <span className="text-[10px] font-mono text-mist-500 shrink-0 mt-0.5">{entry.at}</span>
              <div className="min-w-0">
                <span className="text-sky-300 font-semibold">{entry.role}: </span>
                <span className="text-mist-300">{entry.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log Modal */}
      <SecurityLogIncidentModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSubmit={onCreateIncident}
      />
    </div>
  );
}
