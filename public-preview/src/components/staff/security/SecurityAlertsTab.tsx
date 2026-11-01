'use client';

import { useState } from 'react';
import {
  Bell,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  ArrowRight,
  Filter,
  CheckCheck,
  Plus,
  Radio,
  FileCheck2,
  AlertTriangle,
  History,
  X,
  Send,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useDemo } from '@/lib/store';
import type { SafetyAlertRecord, SafetyAlertStatus } from '@/types/demo';

export function SecurityAlertsTab() {
  const {
    state,
    submitSecuritySafetyAlert,
    resolveSafetyAlert,
    acknowledgeSafetyAlert,
    markNotificationRead,
    clearAllNotifications,
  } = useDemo();

  const [filterType, setFilterType] = useState<'all' | 'broadcast_active' | 'pending' | 'resolved'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAuditAlert, setSelectedAuditAlert] = useState<SafetyAlertRecord | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<SafetyAlertRecord['priority']>('urgent');
  const [location, setLocation] = useState('Floor 3 Corridor West');
  const [incidentType, setIncidentType] = useState<SafetyAlertRecord['incidentType']>('fire_sensor');
  const [description, setDescription] = useState('');
  const [broadcastScope, setBroadcastScope] = useState<SafetyAlertRecord['broadcastScope']>('hotel_wide');

  const alerts = state.safetyAlerts ?? [];

  const filteredAlerts = alerts.filter((item) => {
    if (filterType === 'broadcast_active') return item.status === 'broadcast_active';
    if (filterType === 'pending')
      return item.status === 'draft_pending_validation' || item.status === 'validated_pending_approval' || item.status === 'approved_ready_broadcast';
    if (filterType === 'resolved') return item.status === 'resolved' || item.status === 'rejected';
    return true;
  });

  const activeBroadcastCount = alerts.filter((a) => a.status === 'broadcast_active').length;
  const pendingCount = alerts.filter(
    (a) => a.status === 'draft_pending_validation' || a.status === 'validated_pending_approval',
  ).length;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    submitSecuritySafetyAlert({
      title: title.trim(),
      priority,
      location: location.trim(),
      incidentType,
      description: description.trim(),
      broadcastScope,
    });

    setTitle('');
    setDescription('');
    setShowCreateModal(false);
  };

  const statusBadge = (status: SafetyAlertStatus) => {
    switch (status) {
      case 'broadcast_active':
        return <Badge tone="danger">🚨 BROADCAST ACTIVE</Badge>;
      case 'approved_ready_broadcast':
        return <Badge tone="success">GM Approved · Ready for Broadcast</Badge>;
      case 'validated_pending_approval':
        return <Badge tone="warning">Front Desk Validated · Awaiting GM</Badge>;
      case 'draft_pending_validation':
        return <Badge tone="neutral">Draft · Pending Front Desk Triage</Badge>;
      case 'resolved':
        return <Badge tone="neutral">Stood Down / Resolved</Badge>;
      case 'rejected':
        return <Badge tone="danger">Broadcast Declined by GM</Badge>;
    }
  };

  return (
    <div className="space-y-3.5 pb-6 animate-in fade-in duration-150">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Radio className="h-4 w-4 text-rose-400 animate-pulse" />
            <span>Safety Alerts & Broadcast Center</span>
          </h2>
          <p className="text-[11px] text-mist-400">
            {activeBroadcastCount > 0 ? (
              <span className="text-rose-400 font-semibold">{activeBroadcastCount} hotel-wide active broadcast in progress</span>
            ) : (
              <span>All perimeters normal · No emergency broadcasts active</span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold px-2.5 py-1.5 rounded-xl shadow-md shadow-rose-600/30 flex items-center gap-1 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Draft Alert</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-semibold transition-all text-center ${
            filterType === 'all'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'bg-ink-900 border border-white/10 text-mist-300'
          }`}
        >
          All ({alerts.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterType('broadcast_active')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-semibold transition-all text-center ${
            filterType === 'broadcast_active'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'bg-ink-900 border border-white/10 text-mist-300'
          }`}
        >
          Active ({activeBroadcastCount})
        </button>

        <button
          type="button"
          onClick={() => setFilterType('pending')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-semibold transition-all text-center ${
            filterType === 'pending'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'bg-ink-900 border border-white/10 text-mist-300'
          }`}
        >
          Pending ({pendingCount})
        </button>

        <button
          type="button"
          onClick={() => setFilterType('resolved')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-semibold transition-all text-center ${
            filterType === 'resolved'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'bg-ink-900 border border-white/10 text-mist-300'
          }`}
        >
          Resolved
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-mist-400">
            No safety alerts match this filter.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isBroadcast = alert.status === 'broadcast_active';
            const isAcked = (alert.acknowledgedBy ?? []).includes('security_responder');

            return (
              <div
                key={alert.id}
                className={`rounded-2xl p-4 border transition-all text-white space-y-2.5 ${
                  isBroadcast
                    ? 'border-rose-500/50 bg-gradient-to-br from-rose-950/40 via-ink-900 to-rose-950/20 shadow-lg shadow-rose-500/15'
                    : 'border-white/10 bg-ink-900/90'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {statusBadge(alert.status)}
                      <span className="text-[11px] font-mono text-mist-400">{alert.ref}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{alert.title}</h3>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      alert.priority === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : alert.priority === 'urgent'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {alert.priority.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-mist-200">{alert.description}</p>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-mist-400 pt-1 border-t border-white/10">
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 text-sky-400 shrink-0" />
                    <span className="truncate">{alert.location}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end truncate">
                    <Clock className="h-3 w-3 text-amber-400 shrink-0" />
                    <span>{alert.reportedAt}</span>
                  </div>
                </div>

                {/* Workflow Progression Stepper */}
                <div className="rounded-xl bg-black/30 p-2.5 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-mist-300">
                    <span className="font-semibold text-white">Workflow Pipeline:</span>
                    <button
                      type="button"
                      onClick={() => setSelectedAuditAlert(alert)}
                      className="text-sky-400 hover:text-sky-300 text-[10px] font-medium"
                    >
                      Audit Trail ({alert.auditHistory?.length ?? 0}) →
                    </button>
                  </div>
                  <p className="text-mist-400 text-[10px]">
                    1. Security Drafted → 2. Front Desk Triage: {alert.validatedBy ? '✅ Validated' : '⏳ Pending'} → 3. GM Approval: {alert.approvedBy ? '✅ Approved' : '⏳ Pending'} → 4. Broadcast: {isBroadcast ? '🚨 Active' : 'Waiting'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  {isBroadcast && !isAcked && (
                    <button
                      type="button"
                      onClick={() => acknowledgeSafetyAlert(alert.id, 'security_responder')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-ink-950 flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Acknowledge Alert</span>
                    </button>
                  )}
                  {isBroadcast && isAcked && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Acknowledged by Security</span>
                    </span>
                  )}

                  {isBroadcast && (
                    <button
                      type="button"
                      onClick={() => resolveSafetyAlert(alert.id, 'Stand down ordered by Senior Officer Roy')}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-mist-200"
                    >
                      Stand Down / Resolve
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Draft New Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border border-rose-500/30 bg-ink-900 p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Draft Safety Broadcast Alert</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-mist-300 block mb-1">Alert Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4th Floor Water Leak or Fire Sensor Alarm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="field w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-mist-300 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as SafetyAlertRecord['priority'])}
                    className="field w-full text-xs"
                  >
                    <option value="critical">Critical (Life Safety)</option>
                    <option value="urgent">Urgent</option>
                    <option value="warning">Warning / Advisory</option>
                  </select>
                </div>

                <div>
                  <label className="text-mist-300 block mb-1">Category</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value as SafetyAlertRecord['incidentType'])}
                    className="field w-full text-xs"
                  >
                    <option value="fire_sensor">Fire / Sensor Alarm</option>
                    <option value="life_safety">Life Safety / Medical</option>
                    <option value="hvac_leak">HVAC / Water Leak</option>
                    <option value="security_breach">Security Breach</option>
                    <option value="weather">Severe Weather</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-mist-300 block mb-1">Location / Affected Zone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Floor 4 West Wing Corridor"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="field w-full text-xs"
                />
              </div>

              <div>
                <label className="text-mist-300 block mb-1">Broadcast Details & Operational Guidance</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe incident, perimeter status, and instructions for staff..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="field w-full text-xs"
                />
              </div>

              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2 text-[10px] text-amber-200">
                Notice: Safety alerts require Front Desk validation and Manager sign-off before hotel-wide broadcast.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-mist-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-white flex items-center gap-1 shadow-md shadow-rose-600/30"
                >
                  <Send className="h-3 w-3" />
                  <span>Submit for Validation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Trail Modal */}
      {selectedAuditAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-ink-900 p-5 shadow-2xl text-white space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <History className="h-4 w-4 text-sky-400" />
                <span>Audit Trail: {selectedAuditAlert.ref}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAuditAlert(null)}
                className="text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="divide-y divide-white/5 space-y-2 max-h-72 overflow-y-auto pr-1">
              {selectedAuditAlert.auditHistory?.map((step, idx) => (
                <div key={idx} className="pt-2 text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{step.actor}</span>
                    <span className="text-[10px] text-mist-400">{step.at}</span>
                  </div>
                  <p className="text-mist-300 text-[11px]">{step.action}</p>
                  {step.notes && <p className="text-amber-200 text-[10px] italic">"{step.notes}"</p>}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAuditAlert(null)}
                className="px-3 py-1.5 rounded-xl border border-white/10 text-xs text-mist-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
