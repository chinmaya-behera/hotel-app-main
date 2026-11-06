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
} from 'lucide-react';
import type { WorkItem } from '@/types/demo';
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
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-stone-900/45 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="w-full max-w-lg bg-[var(--warm-paper)] border border-[var(--dm-line)] rounded-2xl p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto text-[var(--dm-ink)]">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--dm-line)]">
            <div className="flex items-center gap-2.5">
              <span
                className={
                  item.priority === 'critical' || item.priority === 'urgent'
                    ? 'dm-status urgent font-semibold'
                    : 'dm-status font-semibold'
                }
              >
                {item.priority || 'Normal'} Priority
              </span>
              <span className="text-xs text-[var(--dm-muted)] font-mono">{item.ref || item.id}</span>
            </div>
            <button
              onClick={onClose}
              className="dm-icon-button"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Title & Status Pill */}
          <div className="mt-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-[var(--dm-ink)] leading-snug">{item.title}</h2>
              <span
                className={
                  isResolved
                    ? 'dm-status good'
                    : isEscalated || isBackup || isNew
                    ? 'dm-status urgent'
                    : 'dm-status'
                }
              >
                {item.chip || item.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--dm-muted)]">{item.meta}</p>
          </div>

          {/* Location & Tactical Map Button */}
          <div className="mt-4 p-3.5 rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span className="dm-attention-icon">
                <MapPin size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-[var(--dm-ink)] font-semibold truncate">{item.location || 'Hotel Property'}</p>
                <p className="text-[11px] text-[var(--dm-muted)]">
                  {item.floor !== undefined ? `Level ${item.floor}` : 'Main Property'}
                  {item.room ? ` · Room ${item.room}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFloorPlan(true)}
              className="dm-small-button flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Compass size={14} />
              <span>Floor Plan</span>
            </button>
          </div>

          {/* Description */}
          {item.description && (
            <div className="mt-3.5 p-3.5 rounded-xl bg-[var(--warm-soft)] border border-[var(--dm-line)]">
              <h4 className="text-[11px] font-semibold text-[var(--dm-muted)] uppercase tracking-wider mb-1">
                Incident Description
              </h4>
              <p className="text-xs text-[var(--dm-ink)] leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Workflow Validation & Incident Origin Section */}
          <div className="mt-3.5 p-3.5 rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] space-y-2 text-xs">
            <h4 className="text-[11px] font-semibold text-[var(--dm-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck2 size={14} />
              <span>Report Origin &amp; Validation Status</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[var(--dm-muted)] block">Reported By:</span>
                <span className="font-semibold text-[var(--dm-ink)]">
                  {item.guest ? `Guest in Room ${item.room ?? '402'}` : 'Security Officer Patrol'}
                </span>
              </div>
              <div>
                <span className="text-[var(--dm-muted)] block">Reported At:</span>
                <span className="font-mono text-[var(--dm-ink)]">{item.createdAt || 'Recent'}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-[var(--dm-line)]">
                <span className="text-[var(--dm-muted)] block">Front Desk Validation:</span>
                {item.guest && item.status === 'New' ? (
                  <span className="dm-status urgent mt-1">
                    Pending Front Desk Validation
                  </span>
                ) : (
                  <span className="dm-status good mt-1">
                    Validated by Front Desk (EMP-0104 Maya Lin)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Relevant Staff Involved & Support Dispatch */}
          <div className="mt-3.5 p-3.5 rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] space-y-2 text-xs">
            <h4 className="text-[11px] font-semibold text-[var(--dm-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} />
              <span>Relevant Staff &amp; Support Dispatch</span>
            </h4>
            <div className="space-y-1 text-[11px] text-[var(--dm-muted)]">
              <p>• Lead Officer: <strong className="text-[var(--dm-ink)]">Senior Officer Roy (EMP-0108)</strong></p>
              <p>• Front Desk Coordinator: <strong className="text-[var(--dm-ink)]">Maya Lin (EMP-0104)</strong></p>
              <p>• Duty Manager: <strong className="text-[var(--dm-ink)]">Marcus Vance (Operations Shift Head)</strong></p>
              {isBackup && (
                <p className="text-rose-700 font-semibold mt-1">
                  ⚠️ Backup actively requested from Night Supervisor &amp; Duty Manager
                </p>
              )}
            </div>

            {!isResolved && (
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBackupModal(true)}
                  className="dm-small-button flex-1 justify-center"
                >
                  Request Backup
                </button>
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(true)}
                  className="dm-small-button flex-1 justify-center"
                >
                  Escalate to DM
                </button>
              </div>
            )}
          </div>

          {/* Documented Protocol SOP Banner */}
          <div className="mt-3.5 p-3.5 rounded-xl bg-[var(--warm-soft)] border border-[var(--dm-line)] text-xs">
            <div className="flex items-center gap-2 font-semibold text-[var(--dm-ink)] mb-1.5">
              <ShieldAlert size={16} />
              <span>{protocol.code}: {protocol.title}</span>
            </div>
            <ul className="space-y-1 text-[11px] text-[var(--dm-muted)] list-disc list-inside">
              {protocol.steps.map((st, idx) => (
                <li key={idx}>{st}</li>
              ))}
            </ul>
          </div>

          {/* Filed Security Incident Report (When Resolved) */}
          {item.securityReport && (
            <div className="mt-3.5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2 text-emerald-950">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <FileCheck2 size={16} /> Formal Incident Report Filed
                </span>
                <span className="text-[10px] text-emerald-700 font-mono">
                  {item.securityReport.filedAt || 'Recorded'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 uppercase tracking-wider block font-semibold">Officer</span>
                <span className="font-semibold text-emerald-950">{item.securityReport.officer || 'Inspector Roy (EMP-0108)'}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 uppercase tracking-wider block font-semibold">Summary</span>
                <span>{item.securityReport.summary}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 uppercase tracking-wider block font-semibold">Scene Observations</span>
                <span>{item.securityReport.observations}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 uppercase tracking-wider block font-semibold">Actions Taken</span>
                <span>{item.securityReport.actionsTaken}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 uppercase tracking-wider block font-semibold">Final Outcome</span>
                <span className="font-bold text-emerald-900">{item.securityReport.outcome}</span>
              </div>
              {item.securityReport.witnessDetails && (
                <div>
                  <span className="text-[10px] text-emerald-700 uppercase tracking-wider block font-semibold">Witnesses</span>
                  <span>{item.securityReport.witnessDetails}</span>
                </div>
              )}
              {item.securityReport.photoUrl && (
                <div>
                  <span className="text-[10px] text-emerald-700 uppercase tracking-wider block mb-1 font-semibold">Attached Photo Evidence</span>
                  <img
                    src={item.securityReport.photoUrl}
                    alt="Evidence"
                    className="h-20 w-20 object-cover rounded-xl border border-emerald-300"
                  />
                </div>
              )}
            </div>
          )}

          {/* Timeline & Notes */}
          <div className="mt-4 space-y-2">
            <h4 className="text-[11px] font-semibold text-[var(--dm-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} /> Incident Audit Timeline
            </h4>
            <div className="space-y-2 pl-2 border-l border-[var(--dm-line)] text-xs">
              {(item.history ?? []).map((h, i) => (
                <div key={i} className="relative pl-3">
                  <span className="absolute -left-[13px] top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--dm-ink)]" />
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--dm-ink)]">{h.status}</span>
                    <span className="text-[10px] text-[var(--dm-muted)]">{h.at}</span>
                  </div>
                  {h.note && <p className="text-[11px] text-[var(--dm-muted)] mt-0.5">{h.note}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Security Officer Field Notes Section */}
          <div className="mt-4 pt-3.5 border-t border-[var(--dm-line)]">
            <h4 className="text-[11px] font-semibold text-[var(--dm-muted)] uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <MessageSquare size={14} /> Officer Field Notes
            </h4>

            {item.securityNotes && item.securityNotes.length > 0 ? (
              <div className="space-y-2 mb-3">
                {item.securityNotes.map((note, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] text-xs">
                    <div className="flex items-center justify-between text-[10px] text-[var(--dm-muted)] mb-1">
                      <span className="font-semibold text-[var(--dm-ink)]">{note.author}</span>
                      <span>{note.at}</span>
                    </div>
                    <p className="text-[var(--dm-ink)]">{note.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[var(--dm-muted)] italic mb-2">No field notes logged yet.</p>
            )}

            {!isResolved && (
              <form onSubmit={handleAddNoteSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Log quick observation..."
                  className="flex-1 rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3 py-2 text-xs text-[var(--dm-ink)] placeholder-[var(--dm-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
                />
                <button
                  type="submit"
                  disabled={!noteInput.trim()}
                  className="dm-primary px-4 py-2 rounded-xl text-xs font-medium cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Log</span>
                </button>
              </form>
            )}
          </div>

          {/* Contextual Action Buttons Area */}
          <div className="mt-5 pt-3.5 border-t border-[var(--dm-line)] space-y-2">
            {isNew && (
              <button
                onClick={() => {
                  onAcknowledge(item.id);
                  onClose();
                }}
                className="dm-primary w-full py-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldAlert size={16} />
                <span>Acknowledge Alert &amp; Mark En Route</span>
              </button>
            )}

            {isAck && (
              <div className="space-y-2">
                {!confirmArrive ? (
                  <button
                    onClick={() => setConfirmArrive(true)}
                    className="dm-primary w-full py-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>Arrived on Scene</span>
                  </button>
                ) : (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-2.5">
                    <p className="text-xs text-amber-950 font-semibold">
                      Confirm physical arrival at {item.location || 'scene'}?
                    </p>
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => setConfirmArrive(false)}
                        className="dm-secondary flex-1 py-2 rounded-xl text-xs font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onArrive(item.id);
                          setConfirmArrive(false);
                          onClose();
                        }}
                        className="dm-primary flex-1 py-2 rounded-xl text-xs font-medium cursor-pointer"
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
                  className="dm-primary w-full py-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileCheck2 size={16} />
                  <span>Log Report &amp; Resolve Incident</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setShowBackupModal(true)}
                    className="dm-secondary py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Users size={14} />
                    <span>Request Backup</span>
                  </button>

                  <button
                    onClick={() => setShowEscalateModal(true)}
                    className="dm-secondary py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowUpRight size={14} />
                    <span>Escalate to Duty Mgr</span>
                  </button>
                </div>
              </div>
            )}

            {isResolved && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <p className="text-xs text-emerald-900 font-semibold flex items-center justify-center gap-1.5">
                  <ShieldCheck size={16} /> Incident Permanently Secured &amp; Archived
                </p>
                <p className="text-[10px] text-emerald-700 mt-0.5">
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

      <SecurityBackupModal
        item={item}
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        onSubmit={(reason) => {
          onRequestBackup(item.id, reason);
          setShowBackupModal(false);
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
    </>
  );
}
