'use client';

import { useState } from 'react';
import {
  User,
  ShieldCheck,
  Clock,
  Printer,
  CreditCard,
  ScanLine,
  Radio,
  Plus,
  Send,
  CheckCircle2,
  Sliders,
  Volume2,
  Moon,
  Sparkles,
  KeyRound,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { Modal } from '@/components/frontdesk/Modal';
import { shiftHandoverNotesSeed, type ShiftHandoverNote } from '@/lib/mockData';

export function StaffProfilePanel() {
  const [handoverNotes, setHandoverNotes] = useState<ShiftHandoverNote[]>(shiftHandoverNotesSeed);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteCategory, setNewNoteCategory] = useState<ShiftHandoverNote['category']>('VIP / Arrival');
  const [newNotePriority, setNewNotePriority] = useState<ShiftHandoverNote['priority']>('normal');
  const [newNoteText, setNewNoteText] = useState('');

  // Operator Preferences toggles
  const [audioChimes, setAudioChimes] = useState(true);
  const [autoExpandVip, setAutoExpandVip] = useState(true);
  const [quickKeyEncode, setQuickKeyEncode] = useState(true);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const noteItem: ShiftHandoverNote = {
      id: `shn-${Date.now()}`,
      author: 'Sunita Patel',
      role: 'Lead Front Desk Coordinator',
      shift: 'Day',
      time: 'Just now',
      category: newNoteCategory,
      note: newNoteText.trim(),
      priority: newNotePriority,
    };

    setHandoverNotes([noteItem, ...handoverNotes]);
    setShowAddNoteModal(false);
    setNewNoteText('');
  };

  return (
    <div className="space-y-4">
      {/* 1. Operator Profile Card */}
      <div className="p-5 rounded-2xl border border-white/10 bg-gradient-to-r from-ink-900 via-white/[0.03] to-ink-900 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400/30 to-amber-600/40 border border-amber-400/50 flex items-center justify-center text-amber-200 font-extrabold text-xl shadow-lg shrink-0">
            SP
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Sunita Patel</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online · Station FD-02</span>
              </span>
            </div>
            <p className="text-xs text-mist-300 font-medium">
              Lead Front Desk Coordinator · Front Office · Day Shift (07:00 – 15:30)
            </p>
            <p className="text-[11px] text-mist-400">
              Employee ID: <strong className="text-white">EMP-4089</strong> · Assigned Zone: Lobby &amp; Floors 1–5
            </p>
          </div>
        </div>

        {/* Shift Performance Metrics */}
        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-5">
          <div className="text-center px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-mist-400 font-medium">Check-ins</p>
            <p className="text-lg font-bold text-white tabular-nums">14</p>
          </div>
          <div className="text-center px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-mist-400 font-medium">IDs Verified</p>
            <p className="text-lg font-bold text-emerald-300 tabular-nums">8</p>
          </div>
          <div className="text-center px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-mist-400 font-medium">Reconciled</p>
            <p className="text-lg font-bold text-cyan-300 tabular-nums">4</p>
          </div>
        </div>
      </div>

      {/* 2. Desk Terminal Hardware & Integration Status */}
      <Panel
        title="Desk Terminal & Hardware Status"
        hint="Live status of peripherals attached to Station FD-02 (Lobby North)"
        icon={ScanLine}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <KeyRound className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Keycard Encoder</p>
              <p className="text-[10px] text-emerald-300 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> RFID Synced · Assa Abloy
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ScanLine className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Passport / ID Scanner</p>
              <p className="text-[10px] text-emerald-300 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Ready (High-DPI)
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Printer className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Folio Receipt Printer</p>
              <p className="text-[10px] text-emerald-300 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Paper 85% · Ready
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Radio className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Intercom &amp; Radio</p>
              <p className="text-[10px] text-cyan-300 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Channel 3 (Front Office)
              </p>
            </div>
          </div>
        </div>
      </Panel>

      {/* 3. Shift Handover Notes Log */}
      <Panel
        title="Shift Handover Notes Log"
        hint="Operational handover briefing between Day, Evening, and Night Auditor shifts."
        icon={FileText}
        action={
          <Button
            size="sm"
            variant="accent"
            iconLeft={Plus}
            onClick={() => setShowAddNoteModal(true)}
          >
            + Add Handover Note
          </Button>
        }
      >
        <div className="space-y-3">
          {handoverNotes.map((note) => (
            <div
              key={note.id}
              className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-1.5 text-xs hover:border-white/20 transition-all shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{note.author}</span>
                  <Badge tone="neutral">{note.shift} Shift</Badge>
                  <Badge tone="info">{note.category}</Badge>
                  {note.priority === 'high' && (
                    <Badge tone="warning">HIGH PRIORITY</Badge>
                  )}
                </div>
                <span className="text-[11px] text-mist-400">{note.time}</span>
              </div>

              <p className="text-mist-200 leading-relaxed">{note.note}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* 4. Quick Operator Preferences */}
      <Panel
        title="Quick Operator Preferences & Alerts"
        hint="Customize console audio chimes, VIP card auto-expansion, and terminal shortcuts."
        icon={Sliders}
      >
        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition">
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-amber-300" />
              <div>
                <p className="font-semibold text-white">Audio Chimes on Urgent Requests</p>
                <p className="text-[11px] text-mist-400">Play subtle audio chime when guest complaints or VIP alerts land in queue</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={audioChimes}
              onChange={(e) => setAudioChimes(e.target.checked)}
              className="rounded border-white/20 bg-ink-900 text-cyan-400 h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <div>
                <p className="font-semibold text-white">Auto-Expand VIP Profiles on Arrival</p>
                <p className="text-[11px] text-mist-400">Instantly reveal dietary milestones and GM greeting cards for VIP stays</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoExpandVip}
              onChange={(e) => setAutoExpandVip(e.target.checked)}
              className="rounded border-white/20 bg-ink-900 text-cyan-400 h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition">
            <div className="flex items-center gap-3">
              <KeyRound className="h-4 w-4 text-emerald-300" />
              <div>
                <p className="font-semibold text-white">One-Click Keycard Encoder Write</p>
                <p className="text-[11px] text-mist-400">Trigger RFID write immediately upon Check-In confirmation</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={quickKeyEncode}
              onChange={(e) => setQuickKeyEncode(e.target.checked)}
              className="rounded border-white/20 bg-ink-900 text-cyan-400 h-4 w-4"
            />
          </label>
        </div>
      </Panel>

      {/* Add Handover Note Modal */}
      {showAddNoteModal && (
        <Modal
          title="Add Shift Handover Note"
          description="Log operational note for the incoming shift operator (Amit Verma · Evening Shift)."
          onClose={() => setShowAddNoteModal(false)}
        >
          <form onSubmit={handleCreateNote} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Category</label>
                <select
                  value={newNoteCategory}
                  onChange={(e) => setNewNoteCategory(e.target.value as ShiftHandoverNote['category'])}
                  className="field w-full text-xs"
                >
                  <option value="VIP / Arrival">VIP / Arrival</option>
                  <option value="Cash / Folio">Cash / Folio</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-mist-300 mb-1 block">Priority</label>
                <select
                  value={newNotePriority}
                  onChange={(e) => setNewNotePriority(e.target.value as ShiftHandoverNote['priority'])}
                  className="field w-full text-xs"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical Briefing</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-mist-300 mb-1 block">Briefing Note</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. VIP Dr. Soren Lindqvist arriving at 15:00 in Room 201; welcome letter placed on desk."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="field w-full text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button variant="subtle" type="button" onClick={() => setShowAddNoteModal(false)}>
                Cancel
              </Button>
              <Button variant="accent" type="submit" iconLeft={Send}>
                Log Handover Note
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

