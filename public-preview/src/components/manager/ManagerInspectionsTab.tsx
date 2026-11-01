'use client';

import { useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertTriangle,
  Search,
  Filter,
  User,
  X,
  Send,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { SupervisorInspection } from '@/types/demo';

export function ManagerInspectionsTab() {
  const { state, initiateInspectionDirective, notify } = useDemo();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'passed' | 'reopened'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [roomNumber, setRoomNumber] = useState('518');
  const [roomType, setRoomType] = useState('Presidential Suite');
  const [floor, setFloor] = useState<number>(5);
  const [departmentTarget, setDepartmentTarget] = useState('Housekeeping & Guest Rooms');
  const [assignedSupervisor, setAssignedSupervisor] = useState('Meera Nambiar (HK Dispatcher / Supervisor)');
  const [type, setType] = useState<SupervisorInspection['type']>('vip_prep');
  const [priority, setPriority] = useState<'normal' | 'vip' | 'urgent'>('vip');
  const [instructions, setInstructions] = useState('');

  const inspections = state.inspections ?? [];

  const filtered = inspections.filter((i) => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (i.roomNumber || '').toLowerCase().includes(q) ||
        (i.roomType || '').toLowerCase().includes(q) ||
        (i.attendantName || '').toLowerCase().includes(q) ||
        (i.instructions || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) return;

    initiateInspectionDirective({
      roomNumber: roomNumber.trim(),
      roomType: `${roomType} (${departmentTarget.split(' ')[0]})`,
      floor: Number(floor) || 1,
      type,
      priority,
      instructions: `${instructions.trim() || 'Verify department standard quality checklist before releasing room.'} [Assigned Supervisor: ${assignedSupervisor}]`,
      initiatedBy: 'Duty Manager Marcus Vance',
      initiatedRole: 'department_manager',
    });

    notify(`Inspection instruction dispatched to ${assignedSupervisor} for Room ${roomNumber}`);
    setInstructions('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-6 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white font-display">
              Room Quality & Inspection Directives
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
              Department Oversight
            </span>
          </div>
          <p className="text-xs text-mist-400 mt-1">
            Issue quality inspection instructions directly to Department Dispatcher / Supervisor queue
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 text-ink-950 text-xs font-bold shadow-lg shadow-amber-400/20 hover:bg-amber-300 transition"
        >
          <Sparkles className="h-4 w-4" />
          <span>Issue Inspection Directive</span>
        </button>
      </div>

      {/* Filter strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inspections by room, attendant, or directive text..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-white/10 bg-ink-900/90 text-xs text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="py-2.5 px-3.5 rounded-2xl border border-white/10 bg-ink-900/90 text-xs text-white focus:border-amber-400 focus:outline-none transition"
        >
          <option value="all">All Inspection Statuses</option>
          <option value="pending">Pending Supervisor Sign-off</option>
          <option value="passed">Certified Clean & Passed</option>
          <option value="reopened">Reopened for Deficiency</option>
        </select>
      </div>

      {/* Inspections Table */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] bg-white/[0.02] text-mist-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Room & Type</th>
                <th className="py-3 px-4">Type & Priority</th>
                <th className="py-3 px-4">Directives & Instructions</th>
                <th className="py-3 px-4">Attendant</th>
                <th className="py-3 px-4">Status & Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((insp) => (
                <tr key={insp.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/10 text-amber-300 font-mono font-bold text-xs border border-amber-400/20">
                        {insp.roomNumber}
                      </span>
                      <div>
                        <p className="font-bold text-white">Room {insp.roomNumber}</p>
                        <p className="text-[11px] text-mist-400">{insp.roomType}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 space-y-1">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-mist-300 capitalize inline-block">
                      {insp.type.replace('_', ' ')}
                    </span>
                    {insp.priority === 'vip' && (
                      <span className="block text-[10px] font-bold text-amber-300 uppercase">
                        VIP Priority
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 max-w-sm">
                    {insp.initiatedBy ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[9px] font-semibold border border-purple-500/30">
                          <Sparkles className="h-2.5 w-2.5" />
                          {insp.initiatedBy}
                        </span>
                        <p className="text-mist-200 text-xs italic">
                          &ldquo;{insp.instructions || 'Standard turnover audit'}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <span className="text-mist-400 text-xs">Standard Turnover Routine</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-medium text-white">{insp.attendantName}</p>
                    <p className="text-[10px] text-mist-400 font-mono">{insp.attendantId}</p>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                        insp.status === 'passed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : insp.status === 'reopened'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {insp.status === 'passed' && <CheckCircle2 className="h-3 w-3" />}
                      {insp.status === 'reopened' && <RotateCcw className="h-3 w-3" />}
                      {insp.status === 'pending' && <Clock className="h-3 w-3" />}
                      <span>{insp.status}</span>
                    </span>
                    {insp.score !== undefined && insp.score > 0 && (
                      <p className="text-[11px] font-mono text-mist-300 mt-1">Score: {insp.score}%</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Initiation Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-400/20 text-purple-300">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h3 className="text-base font-bold font-display">Issue Inspection Directive</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-mist-300 font-semibold mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. 518"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-mist-300 font-semibold mb-1">Floor</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={floor}
                    onChange={(e) => setFloor(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-mist-300 font-semibold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="vip">VIP</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-mist-300 font-semibold mb-1">Target Department *</label>
                  <select
                    value={departmentTarget}
                    onChange={(e) => setDepartmentTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Housekeeping & Guest Rooms">Housekeeping & Guest Rooms</option>
                    <option value="Maintenance & Engineering">Maintenance & Engineering</option>
                    <option value="Food & Beverage Outlets">Food & Beverage Outlets</option>
                    <option value="Suites & Executive Lounge">Suites & Executive Lounge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-mist-300 font-semibold mb-1">Assigned Supervisor *</label>
                  <select
                    value={assignedSupervisor}
                    onChange={(e) => setAssignedSupervisor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Meera Nambiar (HK Dispatcher / Supervisor)">Meera Nambiar (HK Dispatcher / Supervisor)</option>
                    <option value="Arjun Mehta (Engineering Supervisor)">Arjun Mehta (Engineering Supervisor)</option>
                    <option value="Vikram Joshi (F&B Operations Supervisor)">Vikram Joshi (F&B Operations Supervisor)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-mist-300 font-semibold mb-1">Room Type</label>
                  <input
                    type="text"
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    placeholder="e.g. Presidential Suite"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-mist-300 font-semibold mb-1">Inspection Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="vip_prep">VIP Arrival Prep</option>
                    <option value="turnover">Turnover Clean</option>
                    <option value="deep_clean">Deep Clean Cycle</option>
                    <option value="maintenance_check">Post-Maintenance</option>
                    <option value="periodic">Periodic Audit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-mist-300 font-semibold mb-1">
                  Manager Instructions for Supervisor *
                </label>
                <textarea
                  required
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Detail exact points to verify (e.g. Check linens for thread count, confirm welcome orchids & tea set, verify temperature 20°C)..."
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-mist-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-400 shadow-md shadow-purple-500/20"
                >
                  Send Directive to Supervisor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
