'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-react';
import type { ShiftHandover, WorkItem, SupervisorInspection, IncidentRecord, DispatcherDepartment } from '@/types/demo';

interface SupervisorHandoverTabProps {
  handovers?: ShiftHandover[];
  tasks?: WorkItem[];
  inspections?: SupervisorInspection[];
  incidents?: IncidentRecord[];
  department?: DispatcherDepartment;
  onSubmitHandover?: (handover: Omit<ShiftHandover, 'id' | 'timestamp' | 'status'>) => void;
  onAcknowledgeHandover?: (handoverId: string) => void;
}

export function SupervisorHandoverTab({
  handovers = [],
  tasks = [],
  inspections = [],
  incidents = [],
  department = 'Housekeeping',
  onSubmitHandover,
  onAcknowledgeHandover,
}: SupervisorHandoverTabProps) {
  const defaultIncomingManager =
    department === 'Housekeeping'
      ? 'Pooja Nair (Evening HK Supervisor)'
      : department === 'Maintenance & Engineering'
        ? 'Kiran Rao (Evening Lead Engineer)'
        : department === 'Food & Beverages'
          ? 'Chef Rahul (Evening F&B Supervisor)'
          : 'Ananya (Evening Spa Lead)';

  const [incomingManager, setIncomingManager] = useState(defaultIncomingManager);
  const [shift, setShift] = useState<'Day' | 'Evening' | 'Night' | 'Duty'>('Day');
  const [notes, setNotes] = useState('');
  const [priorityActions, setPriorityActions] = useState<string[]>([
    'Ensure Suite 502 VIP arrival turndown complete by 16:30',
    'Follow up on Floor 3 linen restock order with Laundry coordinator',
  ]);
  const [newActionInput, setNewActionInput] = useState('');
  const [submittedAlert, setSubmittedAlert] = useState(false);

  useEffect(() => {
    setIncomingManager(defaultIncomingManager);
  }, [defaultIncomingManager]);

  const outstandingTasksCount = (tasks ?? []).filter((t) => t.status !== 'Completed').length;
  const pendingInspectionsCount = (inspections ?? []).filter((i) => i.status === 'pending').length;
  const criticalIncidentsCount = (incidents ?? []).filter(
    (inc) => inc.status === 'investigating' && (inc.severity === 'critical' || inc.severity === 'major'),
  ).length;

  const handleAddAction = () => {
    if (newActionInput.trim()) {
      setPriorityActions([...priorityActions, newActionInput.trim()]);
      setNewActionInput('');
    }
  };

  const handleRemoveAction = (index: number) => {
    setPriorityActions(priorityActions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    onSubmitHandover?.({
      outgoingManager: 'Meera Nambiar (EMP-0105)',
      incomingManager,
      shift,
      department: department || 'Housekeeping',
      scope: 'My Department',
      outstandingTasksCount,
      unresolvedComplaintsCount: pendingInspectionsCount,
      criticalIncidentsCount,
      notes: notes.trim(),
      priorityActions,
    });

    setNotes('');
    setSubmittedAlert(true);
    setTimeout(() => setSubmittedAlert(false), 4000);
  };

  return (
    <div className="space-y-6">
      {submittedAlert && (
        <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>Shift Handover log successfully transmitted for {department}.</span>
        </div>
      )}
      {/* Handover Submission Form */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-400/10 text-amber-300 border border-amber-400/20">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold font-display text-white">
              Supervisor Shift Handover Log
            </h2>
            <p className="text-xs text-mist-400">
              Transfer departmental room statuses, incomplete turnovers, and VIP priorities
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-white/[0.06]">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-mist-300">Outgoing Supervisor</label>
              <input
                type="text"
                disabled
                value="Meera Nambiar (EMP-0105)"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-xs text-mist-300 font-medium cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-mist-300">Incoming Supervisor</label>
              <input
                type="text"
                required
                value={incomingManager}
                onChange={(e) => setIncomingManager(e.target.value)}
                placeholder="e.g. Pooja Nair (Evening HK Supervisor)"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-mist-300">Shift Transition</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as 'Day' | 'Evening' | 'Night' | 'Duty')}
                className="w-full rounded-2xl border border-white/10 bg-ink-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none transition"
              >
                <option value="Day">Day Shift → Evening Shift</option>
                <option value="Evening">Evening Shift → Night Shift</option>
                <option value="Night">Night Shift → Day Shift</option>
              </select>
            </div>
          </div>

          {/* Auto-populated Metric Snapshot */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-mist-400">Open {department} Tasks</p>
              <p className="text-lg font-bold font-mono text-white mt-0.5">
                {outstandingTasksCount}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-mist-400">Pending Inspections</p>
              <p className="text-lg font-bold font-mono text-amber-300 mt-0.5">
                {pendingInspectionsCount}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-mist-400">Active Escalations</p>
              <p className="text-lg font-bold font-mono text-rose-300 mt-0.5">
                {criticalIncidentsCount}
              </p>
            </div>
          </div>

          {/* Handover Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-mist-300">
              Shift Operational Briefing & Observations <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Floors 1, 2, and 4 are 100% clean and certified. Suite 502 awaiting final glassware restock following plumbing check..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none transition"
            />
          </div>

          {/* Priority Action Items */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-mist-300">
              Carried-Over Priority Action Directives
            </label>

            <div className="space-y-1.5">
              {priorityActions.map((act, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs"
                >
                  <span className="text-white flex-1">{act}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAction(idx)}
                    className="p-1 rounded-lg text-mist-400 hover:text-rose-300 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newActionInput}
                onChange={(e) => setNewActionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAction();
                  }
                }}
                placeholder="Add priority action item..."
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={handleAddAction}
                className="px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-mist-200 hover:text-white transition flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!notes.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 disabled:opacity-50 transition flex items-center gap-2 shadow-lg shadow-amber-400/20"
            >
              <Send className="h-4 w-4" />
              <span>Submit & Transmit Handover Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
