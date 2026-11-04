'use client';

import { useState } from 'react';
import { X, Sparkles, Plus, Clock, UserCheck, AlertTriangle, Layers, MapPin, CheckCircle2 } from 'lucide-react';
import { useDemo } from '@/lib/store';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEPARTMENTS = [
  { id: 'Housekeeping', name: 'Housekeeping', categories: ['Room Cleaning', 'Linen & Towels', 'Toiletries & Amenities', 'Deep Clean / Turnover', 'Turndown Service'] },
  { id: 'Maintenance & Engineering', name: 'Maintenance & Engineering', categories: ['HVAC / Air Conditioning', 'Plumbing & Drainage', 'Electrical & Lighting', 'Carpentry & Furniture', 'TV & Keycard Lock'] },
  { id: 'Food & Beverage', name: 'Food & Beverage / Room Service', categories: ['In-Room Dining Delivery', 'Tray Clearance', 'Minibar Replenishment', 'Special Welcome Amenities'] },
  { id: 'Front Desk Concierge', name: 'Front Desk Concierge', categories: ['Luggage Assistance', 'Valet & Courier', 'Guest Escort', 'Lost & Found Handling'] },
];

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { state, createDispatcherTask } = useDemo();

  const [department, setDepartment] = useState('Housekeeping');
  const [category, setCategory] = useState('Room Cleaning');
  const [room, setRoom] = useState('');
  const [floor, setFloor] = useState<number>(4);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'standard' | 'urgent' | 'vip'>('standard');
  const [slaDue, setSlaDue] = useState('30 mins');
  const [assignmentMode, setAssignmentMode] = useState<'unassigned' | 'assigned'>('unassigned');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentDept = DEPARTMENTS.find((d) => d.id === department) || DEPARTMENTS[0];
  const staffAccounts = (state.staffAccounts ?? []).filter(
    (s) => s.roleId === 'task_fulfiller' || s.department.toLowerCase().includes(department.toLowerCase().slice(0, 5)),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    let assigneeName: string | undefined = undefined;
    let assigneeId: string | undefined = undefined;

    if (assignmentMode === 'assigned') {
      if (!selectedStaffId) {
        setError('Please select an employee to assign this task to, or choose "Leave Unassigned".');
        return;
      }
      const staff = staffAccounts.find((s) => s.id === selectedStaffId || s.employeeId === selectedStaffId);
      if (staff) {
        assigneeName = staff.name;
        assigneeId = staff.employeeId || staff.id;
      }
    }

    createDispatcherTask({
      title: title.trim(),
      department,
      category,
      room: room.trim() || undefined,
      floor: room ? parseInt(room[0], 10) || floor : floor,
      priority,
      slaDue,
      description: description.trim() || `Manual dispatch for ${department}`,
      assigneeId,
      assigneeName,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-ink-900 p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Create Department Task</h2>
              <p className="text-xs text-mist-400">Dispatch new manual task to field fulfillers or leave in open pool</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-mist-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Department & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-mist-300">Department / Service Area</label>
              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  const newDept = DEPARTMENTS.find((d) => d.id === e.target.value);
                  if (newDept) setCategory(newDept.categories[0]);
                }}
                className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-mist-300">Task Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                {currentDept.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location: Room Number & Floor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-mist-300">Room Number (Optional if General Area)</label>
              <input
                type="text"
                placeholder="e.g. 402, 305, 501"
                value={room}
                onChange={(e) => {
                  setRoom(e.target.value);
                  if (e.target.value && !isNaN(parseInt(e.target.value[0], 10))) {
                    setFloor(parseInt(e.target.value[0], 10));
                  }
                }}
                className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-white placeholder-mist-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-mist-300">Floor Level</label>
              <select
                value={floor}
                onChange={(e) => setFloor(parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((fl) => (
                  <option key={fl} value={fl}>
                    Floor {fl} {fl <= 5 ? '(Fulfiller Eligible Zone)' : '(Executive / Penthouse)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Task Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-mist-300">Task Title *</label>
            <input
              type="text"
              placeholder="e.g. Extra Towels & Bathrobe, AC Thermostat Inspection, Room Refresh"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-white placeholder-mist-600 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          {/* Task Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-mist-300">Instructions & Specific Notes</label>
            <textarea
              rows={3}
              placeholder="Provide exact instructions, guest request details, or defect notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-white placeholder-mist-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Priority & SLA Due */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-mist-300">Priority Tier</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'low', label: 'Low', color: 'bg-white/10 text-mist-300' },
                  { id: 'standard', label: 'Standard', color: 'bg-sky-500/20 text-sky-300' },
                  { id: 'urgent', label: 'Urgent', color: 'bg-orange-500/20 text-orange-300' },
                  { id: 'vip', label: 'VIP', color: 'bg-amber-400/20 text-amber-300' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id as any)}
                    className={`py-1.5 rounded-xl text-[11px] font-semibold border transition ${
                      priority === p.id
                        ? 'border-amber-400 bg-amber-400/20 text-white font-bold'
                        : 'border-white/5 bg-white/[0.02] text-mist-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-mist-300">Target SLA Turnaround</label>
              <select
                value={slaDue}
                onChange={(e) => setSlaDue(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="15 mins">15 mins (Express / Urgent)</option>
                <option value="25 mins">25 mins (Standard Housekeeping)</option>
                <option value="30 mins">30 mins (Standard Engineering)</option>
                <option value="45 mins">45 mins (Deep Clean / Non-urgent)</option>
                <option value="60 mins">60 mins (Scheduled Turnover)</option>
              </select>
            </div>
          </div>

          {/* Assignment Option */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="font-semibold text-mist-300 block">Initial Assignment Choice</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                  assignmentMode === 'unassigned'
                    ? 'border-amber-400 bg-amber-400/10 text-white'
                    : 'border-white/10 bg-white/[0.02] text-mist-400 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="assignMode"
                  checked={assignmentMode === 'unassigned'}
                  onChange={() => setAssignmentMode('unassigned')}
                  className="mt-0.5 accent-amber-400"
                />
                <div>
                  <span className="font-bold text-white block">Leave Unassigned</span>
                  <span className="text-[11px] text-mist-300">
                    Appears in open pool for eligible fulfillers (Floors 1–5) to claim immediately.
                  </span>
                </div>
              </label>

              <label
                className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-2.5 ${
                  assignmentMode === 'assigned'
                    ? 'border-emerald-400 bg-emerald-500/10 text-white'
                    : 'border-white/10 bg-white/[0.02] text-mist-400 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="assignMode"
                  checked={assignmentMode === 'assigned'}
                  onChange={() => setAssignmentMode('assigned')}
                  className="mt-0.5 accent-emerald-400"
                />
                <div>
                  <span className="font-bold text-white block">Assign Immediately</span>
                  <span className="text-[11px] text-mist-300">
                    Directly dispatch to selected employee roster member.
                  </span>
                </div>
              </label>
            </div>

            {assignmentMode === 'assigned' && (
              <div className="mt-3 space-y-1.5 p-3 rounded-2xl border border-white/10 bg-white/[0.02]">
                <label className="font-semibold text-mist-300">Select Staff Assignee</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => {
                    setSelectedStaffId(e.target.value);
                    setError(null);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Choose employee from roster --</option>
                  {staffAccounts.map((staff) => (
                    <option key={staff.id} value={staff.employeeId || staff.id}>
                      {staff.name} ({staff.employeeId}) · {staff.department} · {staff.floorZone || 'All Floors'}
                    </option>
                  ))}
                  <option value="EMP-0103">Vikram Singh (EMP-0103) · Housekeeping · Floors 1–5</option>
                  <option value="EMP-0104">Priya Sharma (EMP-0104) · Housekeeping · Floors 1–3</option>
                  <option value="EMP-0105">Arjun Nair (EMP-0105) · Maintenance · All Floors</option>
                </select>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-mist-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-400/20 active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Create & Dispatch Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
