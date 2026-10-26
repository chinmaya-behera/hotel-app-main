'use client';

import { useState } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Users,
  Compass,
  FileCheck2,
  CheckCircle2,
  ArrowUpRight,
  MessageSquare,
  Send,
  Eye,
  Camera,
  Layers,
  ChevronRight,
  FileText,
} from 'lucide-react';
import type { WorkItem, Tone } from '@/types/demo';
import { SecurityFloorPlanModal } from './SecurityFloorPlanModal';
import { SecurityReportModal } from './SecurityReportModal';
import { SecurityEscalateModal } from './SecurityEscalateModal';
import { SecurityBackupModal } from './SecurityBackupModal';

interface SecurityIncidentDetailModalProps {
  item: WorkItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
  onArrive: (id: string) => void;
  onResolve: (id: string, report: any) => void;
  onRequestBackup: (id: string, reason: string) => void;
  onEscalate: (id: string, reason: string, notes?: string) => void;
  onAddNote: (id: string, text: string) => void;
}

export function SecurityIncidentDetailModal({
  item,
  isOpen,
  onClose,
  onAcknowledge,
  onArrive,
  onResolve,
  onRequestBackup,
  onEscalate,
  onAddNote,
}: SecurityIncidentDetailModalProps) {
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [confirmArrive, setConfirmArrive] = useState(false);

  if (!isOpen || !item) return null;

  const isResolved = item.status === 'Resolved';
  const isEscalated = item.status === 'Escalated';
  const isBackup = item.status === 'Backup requested';
  const isOnScene = item.status === 'On scene';
  const isAck = item.status === 'Acknowledged';
  const isNew = item.status === 'New';

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    onAddNote(item.id, noteInput.trim());
    setNoteInput('');
  };

  // Determine Protocol instruction based on incident details
  const getProtocolInstructions = () => {
    const text = `${item.title} ${item.description || ''}`.toLowerCase();
    if (text.includes('panic') || text.includes('pool')) {
      return {
        code: 'PROTOCOL E-1',
        title: 'Emergency Life Safety & Poolside Panic',
        steps: [
          'Immediate physical response: target arrival time < 3 minutes.',
          'Verify victim status with poolside lifeguard on duty.',
          'Establish 15-meter safety perimeter and check automated defibrillator (AED) cabinet.',
          'If injury confirmed, request ambulance dispatch via Duty Manager.',
        ],
      };
    }
    if (text.includes('smoke') || text.includes('fire') || text.includes('detector')) {
      return {
        code: 'PROTOCOL E-2',
        title: 'Fire & BMS Sensor Alarm Investigation',
        steps: [
          'Verify guest occupancy via Front Desk room key log before knocking.',
          'Knock, announce "Hotel Security", and visually scan ceiling vents.',
          'Do not apply water to electrical wiring or BMS conduits.',
          'Confirm absence of smoke/thermal signature; cross-clear with Engineering.',
        ],
      };
    }
    if (text.includes('baggage') || text.includes('unattended')) {
      return {
        code: 'PROTOCOL E-3',
        title: 'Unattended Baggage Standoff',
        steps: [
          'Do NOT touch, kick, or move the baggage.',
          'Establish a 10-meter perimeter cordon using retractable stanchions.',
          'Interview Concierge and review CCTV timestamps with Security Dispatch.',
          'If unattended > 30 minutes with no owner match, notify Duty Manager.',
        ],
      };
    }
    if (text.includes('noise') || text.includes('disturbance') || text.includes('party')) {
      return {
        code: 'PROTOCOL S-1',
        title: 'Guest Disturbance & Noise De-escalation',
        steps: [
          'Approach hallway quietly to observe volume and number of non-registered occupants.',
          'Knock respectfully, announce "Hotel Security" with polite demeanor.',
          'Explain hotel quiet hours policy (22:00–07:00) and request volume reduction.',
          'If uncooperative or aggressive, request secondary officer backup immediately.',
        ],
      };
    }
    return {
      code: 'PROTOCOL S-2',
      title: 'Perimeter & Access Control Verification',
      steps: [
        'Inspect physical door frame, strike plate, and magnetic locks.',
        'Review RFID reader status light (green/red blink cadence).',
        'Check service corridor for unauthorized personnel or propped fire doors.',
        'Record badge scan audit log reference in field notes.',
      ],
    };
  };

  const protocol = getProtocolInstructions();

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full sm:max-w-lg bg-ink-900 border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  item.priority === 'critical'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : item.priority === 'urgent'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                }`}
              >
                {item.priority || 'Normal'} Priority
              </span>
              <span className="text-xs text-mist-400 font-mono">{item.ref || item.id}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-mist-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Main Title & Status Pill */}
          <div className="mt-3.5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-bold text-white leading-snug">{item.title}</h2>
              <span
                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  isResolved
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : isEscalated
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : isBackup
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : isOnScene
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : isAck
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'bg-rose-500 text-white animate-pulse'
                }`}
              >
                {item.chip || item.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-mist-400">{item.meta}</p>
          </div>

          {/* Location & Tactical Map Button */}
          <div className="mt-3.5 p-3 rounded-xl bg-ink-950 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-white font-medium truncate">{item.location || 'Hotel Property'}</p>
                <p className="text-[10px] text-mist-400">
                  {item.floor !== undefined ? `Level ${item.floor}` : 'Main Property'}
                  {item.room ? ` · Room ${item.room}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFloorPlan(true)}
              className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Floor Plan</span>
            </button>
          </div>

          {/* Description */}
          {item.description && (
            <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <h4 className="text-[11px] font-semibold text-mist-400 uppercase tracking-wider mb-1">
                Incident Description
              </h4>
              <p className="text-xs text-mist-200 leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Documented Protocol SOP Banner */}
          <div className="mt-3 p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-xs">
            <div className="flex items-center gap-2 text-sky-300 font-semibold mb-1.5">
              <ShieldAlert className="h-4 w-4" />
              <span>{protocol.code}: {protocol.title}</span>
            </div>
            <ul className="space-y-1 text-[11px] text-sky-200/80 list-disc list-inside">
              {protocol.steps.map((st, idx) => (
                <li key={idx}>{st}</li>
              ))}
            </ul>
          </div>

          {/* Filed Security Incident Report (When Resolved) */}
          {item.securityReport && (
            <div className="mt-3 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <FileCheck2 className="h-4 w-4" /> Formal Incident Report Filed
                </span>
                <span className="text-[10px] text-emerald-400/80 font-mono">
                  {item.securityReport.filedAt || 'Recorded'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-mist-400 uppercase tracking-wider block">Officer</span>
                <span className="text-white font-medium">{item.securityReport.officer || 'Lucas Martin (EMP-0108)'}</span>
              </div>
              <div>
                <span className="text-[10px] text-mist-400 uppercase tracking-wider block">Summary</span>
                <span className="text-white font-medium">{item.securityReport.summary}</span>
              </div>
              <div>
                <span className="text-[10px] text-mist-400 uppercase tracking-wider block">Scene Observations</span>
                <span className="text-mist-200">{item.securityReport.observations}</span>
              </div>
              <div>
                <span className="text-[10px] text-mist-400 uppercase tracking-wider block">Actions Taken</span>
                <span className="text-mist-200">{item.securityReport.actionsTaken}</span>
              </div>
              <div>
                <span className="text-[10px] text-mist-400 uppercase tracking-wider block">Final Outcome</span>
                <span className="text-emerald-300 font-semibold">{item.securityReport.outcome}</span>
              </div>
              {item.securityReport.witnessDetails && (
                <div>
                  <span className="text-[10px] text-mist-400 uppercase tracking-wider block">Witnesses</span>
                  <span className="text-mist-200">{item.securityReport.witnessDetails}</span>
                </div>
              )}
              {item.securityReport.photoUrl && (
                <div>
                  <span className="text-[10px] text-mist-400 uppercase tracking-wider block mb-1">Attached Photo Evidence</span>
                  <img
                    src={item.securityReport.photoUrl}
                    alt="Evidence"
                    className="h-24 w-24 object-cover rounded-xl border border-emerald-500/30"
                  />
                </div>
              )}
            </div>
          )}

          {/* Timeline & Notes */}
          <div className="mt-3.5 space-y-2">
            <h4 className="text-[11px] font-semibold text-mist-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Incident Audit Timeline
            </h4>
            <div className="space-y-2 pl-2 border-l border-white/10 text-xs">
              {(item.history ?? []).map((h, i) => (
                <div key={i} className="relative pl-3">
                  <span className="absolute -left-[13px] top-1.5 h-1.5 w-1.5 rounded-full bg-sky-400" />
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{h.status}</span>
                    <span className="text-[10px] text-mist-500">{h.at}</span>
                  </div>
                  {h.note && <p className="text-[11px] text-mist-300 mt-0.5">{h.note}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Security Officer Notes Section */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <h4 className="text-[11px] font-semibold text-mist-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <MessageSquare className="h-3.5 w-3.5" /> Officer Field Notes
            </h4>

            {item.securityNotes && item.securityNotes.length > 0 ? (
              <div className="space-y-2 mb-3">
                {item.securityNotes.map((note, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-ink-950 border border-white/5 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-mist-400 mb-1">
                      <span className="font-semibold text-sky-400">{note.author}</span>
                      <span>{note.at}</span>
                    </div>
                    <p className="text-mist-200">{note.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-mist-500 italic mb-2">No field notes logged yet.</p>
            )}

            {!isResolved && (
              <form onSubmit={handleAddNoteSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Log quick observation..."
                  className="flex-1 rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-xs text-white placeholder-mist-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={!noteInput.trim()}
                  className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-ink-950 font-bold text-xs transition-colors flex items-center gap-1"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Log</span>
                </button>
              </form>
            )}
          </div>

          {/* Contextual Action Buttons Area */}
          <div className="mt-5 pt-3 border-t border-white/10 space-y-2">
            {isNew && (
              <button
                onClick={() => {
                  onAcknowledge(item.id);
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Acknowledge Alert & Mark En Route</span>
              </button>
            )}

            {isAck && (
              <div className="space-y-2">
                {!confirmArrive ? (
                  <button
                    onClick={() => setConfirmArrive(true)}
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-ink-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Arrived on Scene</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-center space-y-2">
                    <p className="text-xs text-amber-200 font-semibold">
                      Confirm physical arrival at {item.location}?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmArrive(false)}
                        className="flex-1 py-1.5 rounded-lg bg-white/10 text-white text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onArrive(item.id);
                          setConfirmArrive(false);
                          onClose();
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-amber-400 text-ink-950 font-bold text-xs"
                      >
                        Confirm Arrival
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(isOnScene || isBackup) && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-ink-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <FileCheck2 className="h-4 w-4" />
                  <span>Log Report & Resolve Incident</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowBackupModal(true)}
                    className="py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Request Backup</span>
                  </button>

                  <button
                    onClick={() => setShowEscalateModal(true)}
                    className="py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    <span>Escalate to Duty Mgr</span>
                  </button>
                </div>
              </div>
            )}

            {isResolved && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-xs text-emerald-300 font-semibold flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Incident Permanently Secured & Archived
                </p>
                <p className="text-[10px] text-mist-400 mt-0.5">
                  Archived security records are read-only per hotel security compliance.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested Modals */}
      <SecurityFloorPlanModal
        isOpen={showFloorPlan}
        onClose={() => setShowFloorPlan(false)}
        location={item.location || 'Incident zone'}
        floor={item.floor}
        room={item.room}
        title={item.title}
      />

      <SecurityReportModal
        item={item}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={(report) => {
          onResolve(item.id, report);
          setShowReportModal(false);
          onClose();
        }}
      />

      <SecurityEscalateModal
        item={item}
        isOpen={showEscalateModal}
        onClose={() => setShowEscalateModal(false)}
        onSubmit={(reason, notes) => {
          onEscalate(item.id, reason, notes);
          setShowEscalateModal(false);
          onClose();
        }}
      />

      <SecurityBackupModal
        item={item}
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        onSubmit={(reason) => {
          onRequestBackup(item.id, reason);
          setShowBackupModal(false);
          onClose();
        }}
      />
    </>
  );
}
