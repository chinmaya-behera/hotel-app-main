'use client';

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Siren,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Radio,
  Send,
  Lock,
  Clock,
  MapPin,
  Users,
  Check,
  X,
  RotateCcw,
  AlertOctagon,
  Megaphone,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/frontdesk/Modal';
import { useDemo } from '@/lib/store';
import {
  useEmergencyBroadcast,
  type AlertSeverity,
  ALERT_PRESETS,
} from '@/lib/emergencyBroadcast';
import { cn } from '@/lib/utils';
import type { SafetyAlertRecord } from '@/types/demo';

interface GeneralManagerBroadcastTabProps {
  permissionMode?: 'viewer' | 'approver';
}

export function GeneralManagerBroadcastTab({
  permissionMode = 'approver',
}: GeneralManagerBroadcastTabProps) {
  const { state, fdAction } = useDemo();
  const { alert: emergencyAlert, isBroadcastActive, broadcast, clear } = useEmergencyBroadcast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [alertDetailModalOpen, setAlertDetailModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<AlertSeverity>('Critical');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState(
    'Engineering and Security patrols have been dispatched on site.\nAll primary guest elevators and exits remain fully monitored.\nNo immediate evacuation required. Duty Managers are on standby 24/7.\nContact Front Desk via portal chat or room telephone line 0 for queries.'
  );
  const [audience, setAudience] = useState<'hotel_wide' | 'guests' | 'staff'>('hotel_wide');
  const [selectedFloors, setSelectedFloors] = useState<string[]>(['all']);

  const isViewer = permissionMode === 'viewer';

  const handleApplyPreset = (preset: typeof ALERT_PRESETS[0]) => {
    setTitle(preset.title);
    setSeverity(preset.severity);
    setLocation(preset.location);
    setDescription(preset.description);
  };

  const handleOpenPublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setShowConfirmModal(true);
  };

  const handleExecuteBroadcast = () => {
    // 1. Dispatch through shared emergency broadcast engine
    broadcast({
      title: title.trim(),
      description: description.trim(),
      severity,
      location: location.trim() || 'Property-Wide',
    });

    // 2. Also register in staff safetyAlerts store for cross-role logging & audits
    const newAlert: SafetyAlertRecord = {
      id: `alert-gm-${Date.now()}`,
      ref: `SFT-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      incidentType: 'life_safety',
      priority: severity === 'Critical' ? 'critical' : severity === 'Urgent' ? 'urgent' : 'warning',
      location: location.trim() || 'Hotel-Wide Property',
      description: description.trim(),
      reportedBy: 'Priya Nair (General Manager)',
      reportedAt: 'Just now',
      status: 'broadcast_active',
      broadcastScope: audience === 'hotel_wide' ? 'hotel_wide' : audience === 'staff' ? 'all_staff' : 'hotel_wide',
      affectedFloors: selectedFloors,
      validatedBy: 'Priya Nair (GM)',
      broadcastAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      auditHistory: [
        {
          at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actor: 'Priya Nair',
          role: 'General Manager',
          action: 'Emergency broadcast transmitted property-wide',
          notes: description.trim(),
        },
      ],
    };

    if (fdAction) {
      fdAction((s) => {
        s.safetyAlerts = [newAlert, ...(s.safetyAlerts || [])];
        s.feed = [
          {
            id: `feed-alert-${Date.now()}`,
            at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            role: 'General Manager',
            text: `Emergency Broadcast Transmitted: ${title.trim()} (${severity})`,
          },
          ...s.feed,
        ];
        return { next: s, message: `Emergency broadcast transmitted property-wide` };
      });
    }

    setShowConfirmModal(false);
    setShowCreateModal(false);
    setTitle('');
    setLocation('');
    setDescription('');
  };

  const handleExecuteClear = () => {
    clear();
    setShowClearConfirmModal(false);
  };

  // Historic broadcasts list
  const pastAlerts = (state.safetyAlerts ?? []).filter(
    (a) => !isBroadcastActive || a.title !== emergencyAlert?.title
  );

  return (
    <div className="space-y-6">
      {/* SECTION HEADER & PRIMARY ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl border border-white/10 bg-white/70 dark:bg-ink-900/80 shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
            <Siren className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Life Safety &amp; Emergency Broadcast
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                SOP 11.4 Protocol
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-mist-400 mt-0.5">
              Transmit, oversee, and withdraw real-time emergency advisories for guest rooms and staff consoles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isViewer ? (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 dark:text-mist-400">
              <Lock className="h-3.5 w-3.5 text-sky-400" />
              <span>Viewer Mode (Read-Only)</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Megaphone className="h-4 w-4" />
              <span>New Emergency Broadcast</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. CURRENT BROADCAST STATUS (Matching Guest Portal Emergency Advisory UI) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-mist-400 uppercase tracking-wider">
            Active Broadcast State
          </span>
          {isBroadcastActive && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 animate-pulse">
              <Radio className="h-3.5 w-3.5" />
              <span>Live on Hotel Network</span>
            </span>
          )}
        </div>

        {isBroadcastActive && emergencyAlert ? (
          <div className="space-y-4">
            {/* 1. EXACT GUEST PORTAL EMERGENCY BROADCAST BANNER */}
            <div className="p-3 sm:p-4 rounded-2xl border border-rose-500/50 bg-rose-500/15 flex items-center justify-between gap-2.5 sm:gap-4 shadow-md transition-all animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                <span className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl bg-rose-500/25 text-rose-400 shrink-0">
                  <AlertTriangle className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-extrabold uppercase bg-rose-500 text-white tracking-wider shrink-0">
                      {emergencyAlert.severity || 'Urgent'}
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-white truncate">{emergencyAlert.title}</p>
                  </div>
                  <p className="text-[11px] sm:text-xs text-rose-200/90 truncate mt-0.5">{emergencyAlert.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setAlertDetailModalOpen(true)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-400 transition-colors shadow-sm cursor-pointer"
                >
                  View
                </button>
                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirmModal(true)}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-rose-600 text-mist-200 hover:text-white border border-white/15 text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            </div>

            {/* 2. EXACT GUEST PORTAL EMERGENCY ADVISORY CARD PRESENTATION */}
            <div className="rounded-3xl border border-rose-500/40 bg-ink-900/95 p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/20 text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">Front Desk Emergency Advisory</h3>
                    <p className="text-[11px] text-rose-300">Live Active Broadcast Displayed on Guest Portal &amp; In-Room Devices</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAlertDetailModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-mist-200 hover:text-white text-xs font-bold border border-white/10 transition cursor-pointer"
                  >
                    Guest Screen Preview
                  </button>
                  {!isViewer && (
                    <button
                      type="button"
                      onClick={() => setShowClearConfirmModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      Withdraw / Clear Broadcast
                    </button>
                  )}
                </div>
              </div>

              {/* Exact Guest Portal Red Alert Box */}
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-500 text-white">
                    {emergencyAlert.severity}
                  </span>
                  {emergencyAlert.location && (
                    <span className="text-[11px] font-semibold text-rose-300">
                      &bull; {emergencyAlert.location}
                    </span>
                  )}
                  <span className="text-[10px] text-mist-400 ml-auto font-mono">
                    {emergencyAlert.timestamp}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">{emergencyAlert.title}</h3>
                <p className="text-xs text-rose-100/90 leading-relaxed">{emergencyAlert.description}</p>
              </div>

              {/* Exact Guest Portal Safety Instructions & Guidance Box */}
              <div className="space-y-2 text-mist-300 leading-relaxed bg-white/5 p-3.5 rounded-xl border border-white/5">
                <p className="font-semibold text-white text-xs">Safety Instructions &amp; Guidance:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li>Engineering and Security patrols have been dispatched on site.</li>
                  <li>All primary guest elevators and exits remain fully monitored.</li>
                  <li>No immediate evacuation required. Duty Managers are on standby 24/7.</li>
                  <li>Contact Front Desk via portal chat or room telephone line 0 for queries.</li>
                </ul>
              </div>

              {/* Distribution Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-rose-500/20 text-xs">
                <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-[10px] text-mist-400 block">Target Audience</span>
                  <span className="font-bold text-white">Hotel-Wide (All Guests &amp; Staff)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-[10px] text-mist-400 block">Delivery Channels</span>
                  <span className="font-bold text-white">In-Room Displays · Mobile App · Radio</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-[10px] text-mist-400 block">Guest Portals Active</span>
                  <span className="font-bold text-emerald-400 font-mono">27 Suites Verified</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-[10px] text-mist-400 block">Authority Sign-Off</span>
                  <span className="font-bold text-amber-300">Priya Nair (General Manager)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ALL SYSTEMS NORMAL CARD (Matching Guest Portal Normal State) */
          <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/70 dark:bg-ink-900/60 p-8 text-center shadow-md space-y-3">
            <div className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              All Hotel Systems Normal
            </h3>
            <p className="text-xs text-slate-500 dark:text-mist-400 max-w-md mx-auto">
              No active emergency advisories or safety alerts are currently broadcast across Grand Azure.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-mist-500 pt-1">
              Front Desk, Engineering, and 24/7 Security Patrols are operating under standard status.
            </p>
          </div>
        )}
      </div>

      {/* 2. BROADCAST HISTORY & AUDIT LOG */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-500 dark:text-mist-400 uppercase tracking-wider">
          Broadcast History &amp; Incident Records
        </span>

        <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-ink-900/90 overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
            {pastAlerts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-mist-500">
                No past broadcast history recorded for this period.
              </div>
            ) : (
              pastAlerts.map((alert) => (
                <div key={alert.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[10px] text-slate-400">
                        {alert.ref}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {alert.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-mist-300">
                        {alert.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-mist-400 line-clamp-1">
                      {alert.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 dark:text-mist-400 shrink-0 text-[11px]">
                    <span>{alert.location}</span>
                    <span>•</span>
                    <span className="font-mono">{alert.reportedAt}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold text-[10px]">
                      Concluded
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL: CREATE NEW EMERGENCY BROADCAST */}
      {showCreateModal && (
        <Modal
          title="Create &amp; Publish Life Safety Broadcast"
          description="Prepare an affirmative emergency notification to be transmitted property-wide."
          onClose={() => setShowCreateModal(false)}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={handleOpenPublish}
                disabled={!title.trim() || !description.trim()}
              >
                Review &amp; Transmit Broadcast
              </Button>
            </div>
          }
        >
          <form onSubmit={handleOpenPublish} className="space-y-4 text-xs">
            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-mist-400 block mb-1.5">
                Quick SOP Advisory Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ALERT_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-mist-200 text-[11px] font-medium transition cursor-pointer border border-slate-200 dark:border-white/5"
                  >
                    {p.title.split(' ')[0]} {p.title.split(' ')[1]}...
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-mist-300 block mb-1">
                  Severity Level *
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
                  className="field w-full"
                >
                  <option value="Critical">Critical (Red Emergency)</option>
                  <option value="Urgent">Urgent (Orange Alert)</option>
                  <option value="Warning">Warning (Yellow Advisory)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-mist-300 block mb-1">
                  Location / Zone
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Basement Utility B3, Pool Terrace"
                  className="field w-full"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-mist-300 block mb-1">
                Advisory Headline / Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. High-Velocity Coastal Wind Advisory"
                className="field w-full"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-mist-300 block mb-1">
                Emergency Message Description *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Clear, factual summary of the incident and precautionary status..."
                className="field w-full resize-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-mist-300 block mb-1">
                Target Audience &amp; Distribution Scope
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAudience('hotel_wide')}
                  className={cn(
                    'p-2 rounded-xl border text-center transition font-semibold text-xs',
                    audience === 'hotel_wide'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-mist-400'
                  )}
                >
                  Hotel-Wide (All)
                </button>
                <button
                  type="button"
                  onClick={() => setAudience('guests')}
                  className={cn(
                    'p-2 rounded-xl border text-center transition font-semibold text-xs',
                    audience === 'guests'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-mist-400'
                  )}
                >
                  Guests Only
                </button>
                <button
                  type="button"
                  onClick={() => setAudience('staff')}
                  className={cn(
                    'p-2 rounded-xl border text-center transition font-semibold text-xs',
                    audience === 'staff'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-mist-400'
                  )}
                >
                  Staff Only
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* CONFIRMATION MODAL: AFFIRMATIVE BROADCAST */}
      {showConfirmModal && (
        <Modal
          title="Confirm Emergency Broadcast Transmission"
          description="Affirmative sign-off is required before hotel-wide delivery."
          onClose={() => setShowConfirmModal(false)}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
                Go Back
              </Button>
              <button
                type="button"
                onClick={handleExecuteBroadcast}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                ✓ Affirm &amp; Transmit Broadcast
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-500 text-white">
                  {severity}
                </span>
                <span className="font-bold text-white text-sm">{title}</span>
              </div>
              <p className="text-rose-200/90">{description}</p>
              <div className="text-[11px] text-mist-400 pt-1">
                Audience: <strong>{audience === 'hotel_wide' ? 'All In-House Guests & Staff' : audience}</strong>
              </div>
            </div>
            <p className="text-slate-500 dark:text-mist-400">
              By confirming, this alert will immediately trigger the emergency banner across in-room guest portals, mobile apps, and front desk consoles.
            </p>
          </div>
        </Modal>
      )}

      {/* CONFIRMATION MODAL: CLEAR BROADCAST */}
      {showClearConfirmModal && (
        <Modal
          title="Terminate &amp; Withdraw Emergency Broadcast"
          description="Are you sure the incident is fully resolved and safe to clear?"
          onClose={() => setShowClearConfirmModal(false)}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" onClick={() => setShowClearConfirmModal(false)}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleExecuteClear}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Confirm Normal State
              </button>
            </div>
          }
        >
          <p className="text-xs text-slate-600 dark:text-mist-300 leading-relaxed">
            Withdrawing this broadcast will clear the active emergency notice from all guest portals and front desk displays, returning the property status to &ldquo;All Hotel Systems Normal&rdquo;.
          </p>
        </Modal>
      )}
      {/* GUEST PORTAL EMERGENCY ADVISORY PREVIEW MODAL */}
      {alertDetailModalOpen && emergencyAlert && (
        <Modal
          title="Front Desk Emergency Advisory"
          description="Exact Live In-Room & Guest Portal Advisory Presentation"
          onClose={() => setAlertDetailModalOpen(false)}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" onClick={() => setAlertDetailModalOpen(false)}>
                Close Preview
              </Button>
              {!isViewer && (
                <button
                  type="button"
                  onClick={() => {
                    setAlertDetailModalOpen(false);
                    setShowClearConfirmModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Withdraw / Clear Broadcast
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-500 text-white">
                  {emergencyAlert.severity}
                </span>
                {emergencyAlert.location && (
                  <span className="text-[11px] font-semibold text-rose-300">
                    &bull; {emergencyAlert.location}
                  </span>
                )}
                <span className="text-[10px] text-mist-400 ml-auto font-mono">
                  {emergencyAlert.timestamp}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{emergencyAlert.title}</h3>
              <p className="text-xs text-rose-100/90 leading-relaxed">{emergencyAlert.description}</p>
            </div>

            <div className="space-y-2 text-mist-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
              <p className="font-semibold text-white text-xs">Safety Instructions &amp; Guidance:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Engineering and Security patrols have been dispatched on site.</li>
                <li>All primary guest elevators and exits remain fully monitored.</li>
                <li>No immediate evacuation required. Duty Managers are on standby 24/7.</li>
                <li>Contact Front Desk via portal chat or room telephone line 0 for queries.</li>
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
