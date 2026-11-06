'use client';

import { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  Send,
  Plus,
  CheckCircle2,
  Bell,
  Volume2,
  Users,
  Lock,
  Smartphone,
  Eye,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { Modal } from '@/components/frontdesk/Modal';
import { frontDeskIncidentsSeed, type FDIncident } from '@/lib/mockData';

export function IncidentsPanel() {
  const [incidents, setIncidents] = useState<FDIncident[]>(frontDeskIncidentsSeed);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [showLogModal, setShowLogModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('ATTENTION GUESTS: Elevator maintenance testing underway on Floors 2–3. Stairwells & North Elevators operating normally.');
  const [broadcastSentTime, setBroadcastSentTime] = useState<string | null>(null);

  // Form states for new incident
  const [newTitle, setNewTitle] = useState('');
  const [newSource, setNewSource] = useState<FDIncident['source']>('Guest Report');
  const [newRoom, setNewRoom] = useState('305');
  const [newLocation, setNewLocation] = useState('Floor 3 Corridor');
  const [newSeverity, setNewSeverity] = useState<FDIncident['severity']>('medium');
  const [newDescription, setNewDescription] = useState('');
  const [dispatchNow, setDispatchNow] = useState(true);

  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity !== 'all' && inc.severity !== filterSeverity) return false;
    return true;
  });

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const item: FDIncident = {
      id: `inc-${Date.now()}`,
      ref: `INC-${Math.floor(200 + Math.random() * 800)}`,
      title: newTitle.trim(),
      source: newSource,
      room: newRoom.trim() || undefined,
      location: newLocation.trim(),
      severity: newSeverity,
      status: dispatchNow ? 'dispatched_security' : 'active',
      description: newDescription.trim(),
      reportedAt: 'Just now',
      securityOfficer: dispatchNow ? 'Security Dispatch (Patrol Unit 1)' : undefined,
      broadcastSent: false,
    };

    setIncidents([item, ...incidents]);
    setShowLogModal(false);
    setNewTitle('');
    setNewDescription('');
  };

  const handleDispatchSecurity = (id: string) => {
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              status: 'dispatched_security' as const,
              securityOfficer: 'Officer Ramesh K. (Patrol Unit 2)',
            }
          : i,
      ),
    );
  };

  const handleResolve = (id: string) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'resolved' as const } : i)),
    );
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastSentTime('Broadcast sent at 10:25 AM to 84 active in-house devices');
    setShowBroadcastModal(false);
  };

  const getSeverityBadge = (sev: FDIncident['severity']) => {
    switch (sev) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            <AlertTriangle className="h-3 w-3" /> High / Emergency
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="h-3 w-3" /> Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
            <ShieldAlert className="h-3 w-3" /> Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Alert if emergency broadcast active */}
      {broadcastSentTime && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 flex items-center justify-between text-xs text-rose-200 shadow-md">
          <div className="flex items-center gap-2.5">
            <Radio className="h-4 w-4 text-rose-400 animate-pulse" />
            <div>
              <strong className="text-white">Active Guest Safety Broadcast:</strong> &ldquo;{broadcastMessage}&rdquo;
              <p className="text-[11px] text-rose-300/80 mt-0.5">{broadcastSentTime}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setBroadcastSentTime(null)}
            className="text-rose-300 hover:text-white"
          >
            Clear Banner
          </Button>
        </div>
      )}

      {/* Pipeline Header Row: Guest -> Front Desk -> Security Op. */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
              <span>Incident Response Pipeline:</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                Guest → F.D (Front Desk) → Security Op.
              </span>
            </h3>
            <p className="text-[11px] text-mist-400 mt-0.5">
              Escalate safety notices, guest security alerts, and dispatch security patrol units instantly.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            size="sm"
            variant="subtle"
            iconLeft={Radio}
            onClick={() => setShowBroadcastModal(true)}
            className="border-rose-500/40 text-rose-300 hover:bg-rose-500/15"
          >
            Emergency Broadcast
          </Button>
          <Button
            size="sm"
            variant="accent"
            iconLeft={Plus}
            onClick={() => setShowLogModal(true)}
          >
            + Log Incident
          </Button>
        </div>
      </div>

      {/* Incidents Board */}
      <Panel
        title="Active Security Incidents & Dispatches"
        hint="All reports logged from guests or front desk patrol routed directly to Security Operator console."
        icon={ShieldAlert}
      >
        {/* Severity Filter Pills */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-mist-400">Severity:</span>
          <div className="inline-flex p-0.5 rounded-lg bg-black/30 border border-white/10 text-xs">
            {(['all', 'high', 'medium', 'low'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded-md font-medium capitalize transition ${
                  filterSeverity === sev ? 'accent-soft' : 'text-mist-400 hover:text-white'
                }`}
              >
                {sev === 'all' ? `All (${incidents.length})` : sev}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs hover:border-white/20 transition-all shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-cyan-300 font-bold text-xs">{inc.ref}</span>
                  <span className="font-bold text-white text-sm">{inc.title}</span>
                  {getSeverityBadge(inc.severity)}
                  <Badge
                    tone={
                      inc.status === 'resolved'
                        ? 'success'
                        : inc.status === 'dispatched_security'
                          ? 'info'
                          : 'warning'
                    }
                  >
                    {inc.status === 'dispatched_security'
                      ? 'Dispatched to Security'
                      : inc.status.toUpperCase()}
                  </Badge>
                </div>

                <p className="text-mist-200">{inc.description}</p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-mist-400">
                  <span>Source: <strong className="text-white">{inc.source}</strong> {inc.room ? `· Room ${inc.room}` : ''}</span>
                  <span>·</span>
                  <span>Location: <strong className="text-white">{inc.location}</strong></span>
                  <span>·</span>
                  <span>Reported: {inc.reportedAt}</span>
                  {inc.securityOfficer && (
                    <>
                      <span>·</span>
                      <span className="text-cyan-300 font-semibold flex items-center gap-1">
                        <Radio className="h-3 w-3" /> Security Op: {inc.securityOfficer}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons: Dispatch to Security Op | Mark Resolved */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
                {inc.status === 'active' && (
                  <Button
                    size="sm"
                    variant="accent"
                    iconLeft={Send}
                    onClick={() => handleDispatchSecurity(inc.id)}
                  >
                    Dispatch to Security Op.
                  </Button>
                )}
                {inc.status === 'dispatched_security' && (
                  <Button
                    size="sm"
                    variant="subtle"
                    iconLeft={Check}
                    onClick={() => handleResolve(inc.id)}
                  >
                    Mark Resolved
                  </Button>
                )}
                {inc.status === 'resolved' && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Case Closed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Log Incident Modal */}
      {showLogModal && (
        <Modal
          title="Log Security Incident & Safety Alert"
          description="Record guest safety report or patrol finding and route through Front Desk to Security Operator."
          onClose={() => setShowLogModal(false)}
        >
          <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">Incident Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Unattended luggage on Level 2 Mezzanine"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="field w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Source</label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value as FDIncident['source'])}
                  className="field w-full text-xs"
                >
                  <option value="Guest Report">Guest Report</option>
                  <option value="Front Desk Patrol">Front Desk Patrol</option>
                  <option value="Housekeeping Alert">Housekeeping Alert</option>
                  <option value="Security Dispatch">Security Dispatch</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Room (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 305"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="field w-full text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. East Corridor Floor 3"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="field w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Severity Level</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as FDIncident['severity'])}
                  className="field w-full text-xs"
                >
                  <option value="low">Low (General Concern)</option>
                  <option value="medium">Medium (Maintenance / Safety Attention)</option>
                  <option value="high">High / Emergency (Immediate Response)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">Description &amp; Immediate Action</label>
              <textarea
                required
                rows={3}
                placeholder="Detail observations, witness names, or initial containment taken."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="field w-full text-xs"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-mist-200 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={dispatchNow}
                onChange={(e) => setDispatchNow(e.target.checked)}
                className="rounded border-white/20 bg-ink-900 text-cyan-400"
              />
              <span>Immediately dispatch Security Operator on-duty patrol team</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button variant="subtle" type="button" onClick={() => setShowLogModal(false)}>
                Cancel
              </Button>
              <Button variant="accent" type="submit" iconLeft={Send}>
                Log &amp; Dispatch
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Emergency Broadcast Alert Modal */}
      {showBroadcastModal && (
        <Modal
          title="Emergency Broadcast to Guest Devices"
          description="Push an emergency pop-up message to all active guest mobile web passes & in-room portal displays."
          onClose={() => setShowBroadcastModal(false)}
        >
          <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Guest Advisory Protocol:
              </p>
              <p className="mt-1 text-[11px] text-rose-200/90 leading-relaxed">
                Emergency broadcasts trigger high-priority alerts with push vibrations on active guest devices.
                Use strictly for vital property safety notices.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">Broadcast Message Content</label>
              <textarea
                rows={3}
                required
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="field w-full text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button variant="subtle" type="button" onClick={() => setShowBroadcastModal(false)}>
                Cancel
              </Button>
              <Button variant="accent" type="submit" iconLeft={Radio} className="bg-rose-500 hover:bg-rose-600 text-white">
                Send Broadcast to All Devices
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

