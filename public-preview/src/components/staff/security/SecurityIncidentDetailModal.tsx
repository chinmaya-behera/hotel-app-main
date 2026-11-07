'use client';

import { useState, useRef } from 'react';
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
  Camera,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  ZoomIn,
  Check,
  ChevronRight,
  Shield,
  Activity,
  FileText,
  Video,
  Eye,
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

  // Direct Inline Resolution & Photo Upload State
  const [isSolvingInline, setIsSolvingInline] = useState(false);
  const [solveSummary, setSolveSummary] = useState('');
  const [solveActions, setSolveActions] = useState('');
  const [solveOutcome, setSolveOutcome] = useState('Secured & Stabilized');
  const [solvePhotoUrl, setSolvePhotoUrl] = useState<string | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const [enlargedPhotoTitle, setEnlargedPhotoTitle] = useState<string>('View of Incident');

  // Post-resolution additional photo upload state
  const [postPhotoUrl, setPostPhotoUrl] = useState<string | null>(null);
  const [isUploadingPostPhoto, setIsUploadingPostPhoto] = useState(false);

  // Incoming incident photo / CCTV frame evidence state
  const [incomingPhoto, setIncomingPhoto] = useState<string | null>(null);
  const incomingFileInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const postFileInputRef = useRef<HTMLInputElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);

  const handleIncomingPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setIncomingPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Allow mouse-wheel scrolling even if cursor is over pinned header or footer
  const handleModalWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (scrollBodyRef.current) {
      const isOverBody = scrollBodyRef.current.contains(e.target as Node);
      if (!isOverBody) {
        scrollBodyRef.current.scrollTop += e.deltaY;
      }
    }
  };

  if (!isOpen || !item) return null;

  const isResolved = item.status === 'Resolved';
  const isEscalated = item.status === 'Escalated';
  const isBackup = item.status === 'Backup requested';
  const isOnScene = item.status === 'On scene';
  const isAck = item.status === 'Acknowledged';
  const isNew = item.status === 'New' || (!isAck && !isOnScene && !isResolved && !isEscalated && !isBackup);

  // Status step index calculation for visual pipeline
  const getStepIndex = () => {
    if (isResolved) return 3;
    if (isOnScene || isBackup) return 2;
    if (isAck) return 1;
    return 0; // New / Triggered
  };

  const currentStep = getStepIndex();

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    onAddNote(item.id, noteInput.trim());
    setNoteInput('');
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSolvePhotoUrl(reader.result as string);
        setSolveError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostResolutionPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const photoData = reader.result as string;
        setPostPhotoUrl(photoData);
        // Persist photo to store immediately
        onResolve(item.id, {
          summary: item.securityReport?.summary || 'Incident solved and scene secured.',
          observations: item.securityReport?.observations || 'Scene inspection verified safe.',
          actionsTaken: item.securityReport?.actionsTaken || 'Security protocol completed.',
          outcome: item.securityReport?.outcome || 'Secured & Stabilized',
          photoUrl: photoData,
        });
        setIsUploadingPostPhoto(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDirectSolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!solveSummary.trim()) {
      setSolveError('Please enter a brief summary of how the problem was solved.');
      return;
    }

    onResolve(item.id, {
      summary: solveSummary.trim(),
      observations: item.description || 'Scene assessed on site.',
      actionsTaken: solveActions.trim() || 'Physical perimeter checked, guest verified safe, and alarm reset.',
      outcome: solveOutcome,
      photoUrl: solvePhotoUrl || undefined,
    });

    setIsSolvingInline(false);
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
  const displayPhoto = postPhotoUrl || item.securityReport?.photoUrl || (isResolved ? item.photoUrl : null);

  const FALLBACK_INCIDENT_MEDIA: Record<string, { photo: string; cam: string; time: string; source: string }> = {
    'sec-1': {
      photo: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80',
      cam: 'CCTV CAM-04 (West Pool Deck)',
      time: 'Today 09:44:12',
      source: 'Automated CCTV Sensor Trip',
    },
    'sec-2': {
      photo: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      cam: 'CAM-512 (Floor 5 East Corridor)',
      time: 'Today 09:18:04',
      source: 'BMS Smoke Alarm Sensor Telemetry',
    },
    'sec-3': {
      photo: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=1200&q=80',
      cam: 'CAM-B02 (Basement Switchgear Vault)',
      time: 'Today 02:13:45',
      source: 'RFID Access Rejection Automated Capture',
    },
    'sec-4': {
      photo: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=1200&q=80',
      cam: 'CAM-01 (East Lobby Entrance Portico)',
      time: 'Today 08:30:20',
      source: 'Concierge Incident Dispatch Photo',
    },
    'sec-5': {
      photo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      cam: 'CAM-304 (Floor 3 Hallway North)',
      time: 'Yesterday 23:40:15',
      source: 'Floor 3 Security Patrol Camera',
    },
  };

  const fallbackData = FALLBACK_INCIDENT_MEDIA[item.id] || FALLBACK_INCIDENT_MEDIA[item.ref || ''];
  const currentIncomingPhoto =
    incomingPhoto || item.incidentPhotoUrl || fallbackData?.photo || (!isResolved ? item.photoUrl : null);
  const activeCameraId = item.cctvCameraId || fallbackData?.cam;
  const activeTimestamp = item.cctvTimestamp || fallbackData?.time || 'Incident Alarm Trigger';
  const activePhotoSource = item.incidentPhotoSource || fallbackData?.source || 'Front Desk / Security CCTV Telemetry';

  const PIPELINE_STEPS = [
    { label: 'Triggered', sub: 'New Alert', step: 0 },
    { label: 'Responding', sub: 'Officer En Route', step: 1 },
    { label: 'On Scene', sub: 'Investigating', step: 2 },
    { label: 'Solved', sub: 'Secured & Filed', step: 3 },
  ];

  return (
    <>
      <div
        data-lenis-prevent
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      >
        <div
          data-lenis-prevent
          onWheel={handleModalWheel}
          className="dm-dialog-card w-full max-w-3xl h-[92vh] max-h-[860px] bg-white border border-[var(--dm-line)] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[var(--dm-ink)]"
        >
          {/* ================= MODAL HEADER (PINNED) ================= */}
          <div className="shrink-0 p-5 sm:p-6 border-b border-[var(--dm-line)] bg-white">
            {/* Row 1: Badges, Incident Ref, Status Chip, Close */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={
                    item.priority === 'critical' || item.priority === 'urgent'
                      ? 'dm-status urgent font-semibold uppercase tracking-wider text-[10px]'
                      : 'dm-status font-semibold uppercase tracking-wider text-[10px]'
                  }
                >
                  {item.priority || 'Normal'} Priority
                </span>
                <span className="text-xs text-[var(--dm-muted)] font-mono font-semibold bg-[var(--dm-surface)] px-2 py-0.5 rounded border border-[var(--dm-line)]">
                  {item.ref || item.id}
                </span>
                {item.floor !== undefined && (
                  <span className="text-xs text-[var(--dm-muted)] flex items-center gap-1 font-medium">
                    <MapPin size={12} /> Level {item.floor}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={
                    isResolved
                      ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm'
                      : isEscalated || isBackup
                      ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-sm animate-pulse'
                      : isOnScene
                      ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm'
                      : isAck
                      ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300 shadow-sm'
                      : 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300'
                  }
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {item.chip || item.status}
                </span>

                <button
                  onClick={onClose}
                  className="dm-icon-button"
                  aria-label="Close dialog"
                  title="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Row 2: Title & Location */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--dm-ink)] tracking-tight leading-tight">
                  {item.title}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--dm-muted)] flex items-center gap-2 flex-wrap">
                  <span>Triggered {item.createdAt || 'Recent'}</span>
                  <span>•</span>
                  <span className="font-semibold text-[var(--dm-ink)]">{protocol.code}</span>
                  <span>•</span>
                  <span>{item.location || 'Hotel Property'}</span>
                </p>
              </div>

              {/* Status Select dropdown with high-contrast text */}
              <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                <span className="text-[11px] text-[var(--dm-muted)] font-medium">Status:</span>
                <select
                  value={item.status}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next === 'Acknowledged') onAcknowledge(item.id);
                    else if (next === 'On scene') onArrive(item.id);
                    else if (next === 'Backup requested') onRequestBackup(item.id, 'Additional officer requested');
                    else if (next === 'Escalated') onEscalate(item.id, 'Escalated to operations');
                    else if (next === 'Resolved') setIsSolvingInline(true);
                  }}
                  aria-label="Change incident status"
                  className="text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-[var(--dm-line)] bg-white text-stone-900 shadow-sm focus:outline-none cursor-pointer"
                  style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                >
                  <option value="New" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>1. Triggered (New)</option>
                  <option value="Acknowledged" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>2. Responding (En Route)</option>
                  <option value="On scene" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>3. On Scene (Investigating)</option>
                  <option value="Backup requested" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>3b. Backup Requested</option>
                  <option value="Escalated" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>3c. Escalated to DM</option>
                  <option value="Resolved" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>4. Solved (Secured)</option>
                </select>
              </div>
            </div>

            {/* Status Stepper */}
            <div className="mt-4 pt-3.5 border-t border-[var(--dm-line)]">
              <div className="flex items-center justify-between relative px-2 sm:px-6">
                {/* Connecting Line */}
                <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-0.5 bg-[var(--dm-line)] -z-0" />
                <div
                  className="absolute left-6 top-4 -translate-y-1/2 h-0.5 bg-emerald-600 transition-all duration-300 -z-0"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />

                {PIPELINE_STEPS.map((s, idx) => {
                  const isDone = currentStep > s.step;
                  const isCurrent = currentStep === s.step;
                  return (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => {
                        if (s.step === 1) onAcknowledge(item.id);
                        else if (s.step === 2) onArrive(item.id);
                        else if (s.step === 3) setIsSolvingInline(true);
                      }}
                      className="flex flex-col items-center relative z-10 cursor-pointer group focus:outline-none"
                    >
                      <div
                        className={
                          isDone
                            ? 'w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md transition-transform group-hover:scale-110'
                            : isCurrent
                            ? 'w-8 h-8 rounded-full bg-[var(--dm-ink)] text-white flex items-center justify-center font-bold text-xs shadow-md ring-4 ring-[var(--warm-highlight)] transition-transform group-hover:scale-110'
                            : 'w-8 h-8 rounded-full bg-[var(--dm-surface)] border border-[var(--dm-line)] text-[var(--dm-muted)] flex items-center justify-center font-semibold text-xs transition-transform group-hover:scale-110'
                        }
                      >
                        {isDone ? <Check size={14} strokeWidth={2.5} /> : idx + 1}
                      </div>
                      <span
                        className={`text-[11px] font-semibold mt-1 ${
                          isCurrent ? 'text-[var(--dm-ink)] font-bold' : 'text-[var(--dm-muted)]'
                        }`}
                      >
                        {s.label}
                      </span>
                      <span className="text-[9px] text-[var(--dm-muted)] hidden sm:block">{s.sub}</span>
                    </button>
                  );
                })}
              </div>

              {/* Status Action Quick Bar */}
              <div className="mt-3 flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[var(--warm-soft)] border border-[var(--dm-line)]">
                <div className="flex items-center gap-2 text-xs">
                  <Activity size={15} className="text-[var(--dm-muted)] shrink-0" />
                  <span className="text-[var(--dm-muted)]">Current Phase:</span>
                  <strong className="text-[var(--dm-ink)] font-semibold">
                    {isResolved
                      ? 'Case Solved & Archived'
                      : isBackup
                      ? 'Backup Requested — Officer Support Dispatched'
                      : isEscalated
                      ? 'Escalated to Duty Manager'
                      : isOnScene
                      ? 'Officer On Scene Assessment'
                      : isAck
                      ? 'Responding / En Route'
                      : 'New Incident Triggered'}
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  {isNew && (
                    <button
                      onClick={() => onAcknowledge(item.id)}
                      className="dm-primary text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1.5"
                    >
                      <ShieldAlert size={13} />
                      <span>Acknowledge &amp; En Route</span>
                    </button>
                  )}

                  {isAck && (
                    <button
                      onClick={() => onArrive(item.id)}
                      className="dm-primary text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={13} />
                      <span>Mark Arrived On Scene</span>
                    </button>
                  )}

                  {(isOnScene || isBackup) && !isSolvingInline && (
                    <button
                      onClick={() => setIsSolvingInline(true)}
                      className="dm-primary text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 border-emerald-700 text-white"
                    >
                      <Camera size={13} strokeWidth={2} />
                      <span>Solve Incident &amp; Attach Photo</span>
                    </button>
                  )}

                  {!isResolved && !isOnScene && !isBackup && !isSolvingInline && (
                    <button
                      onClick={() => setIsSolvingInline(true)}
                      className="dm-secondary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5"
                    >
                      <Check size={13} />
                      <span>Direct Solve</span>
                    </button>
                  )}

                  {isResolved && (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck size={15} /> All Cleared
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ================= MODAL SCROLLABLE BODY (LENIS-PREVENTED & SMOOTH WHEEL) ================= */}
          <div
            ref={scrollBodyRef}
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
            className="flex-1 min-h-0 overflow-y-auto security-modal-scroll p-5 sm:p-6 space-y-4"
          >
            {/* ================= 1. LOCATION & ORIENTATION ================= */}
            <div className="p-4 rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="dm-attention-icon shrink-0">
                  <MapPin size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-[var(--dm-ink)] font-semibold truncate">
                    {item.location || 'Hotel Property'}
                  </p>
                  <p className="text-xs text-[var(--dm-muted)]">
                    {item.floor !== undefined ? `Level ${item.floor}` : 'Main Campus'}
                    {item.room ? ` • Room ${item.room}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (currentIncomingPhoto) {
                      setEnlargedPhoto(currentIncomingPhoto);
                      setEnlargedPhotoTitle(`View of Incident • ${item.title}`);
                    }
                  }}
                  className="dm-primary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-sm transition-all"
                  title="Open incoming photo of what incident happened"
                >
                  <Eye size={14} />
                  <span>View of Incident</span>
                </button>
                <button
                  onClick={() => setShowFloorPlan(true)}
                  className="dm-small-button flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Compass size={14} />
                  <span>Floor Plan</span>
                </button>
              </div>
            </div>

            {/* ================= 2. INCIDENT DESCRIPTION & VALIDATION ================= */}
            <div className="p-4 rounded-xl bg-white border border-[var(--dm-line)] shadow-sm space-y-2">
              <h4 className="text-[11px] font-bold text-[var(--dm-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} />
                <span>Incident Description &amp; Origin</span>
              </h4>
              <p className="text-xs sm:text-sm text-[var(--dm-ink)] leading-relaxed">
                {item.description || item.meta || 'Incident reported by sensor telemetry. Security investigation underway.'}
              </p>

              <div className="pt-3 border-t border-[var(--dm-line)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[var(--dm-muted)] block text-[11px]">Reported Origin:</span>
                  <strong className="text-[var(--dm-ink)]">Security Patrol &amp; Life-Safety Sensor</strong>
                </div>
                <div>
                  <span className="text-[var(--dm-muted)] block text-[11px]">Front Desk Validation:</span>
                  <span className="dm-status good text-[10px] mt-0.5">
                    ✓ Validated by Front Desk (EMP-0104 Maya Lin)
                  </span>
                </div>
              </div>
            </div>

            {/* ================= 3. PHOTO UPLOAD & RESOLUTION SECTION (KEY FEATURE) ================= */}
            {/* A. When in progress (Not solving inline yet): Dedicated Resolution & Photo Proof Card */}
            {!isSolvingInline && !isResolved && (
              <div className="p-4 sm:p-5 rounded-xl bg-white border border-[var(--dm-line)] shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <Camera size={18} />
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--dm-ink)] flex items-center gap-2">
                        <span>Incident Resolution &amp; Photo Proof</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 font-medium">
                          Required on completion
                        </span>
                      </h4>
                      <p className="text-[11px] text-[var(--dm-muted)] mt-0.5">
                        Capture camera image or upload visual proof after solving the incident on scene.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSolvingInline(true)}
                    className="dm-primary text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 border-emerald-700 text-white font-bold shadow-sm cursor-pointer shrink-0"
                  >
                    <CheckCircle2 size={15} />
                    <span>Solve &amp; Attach Photo</span>
                  </button>
                </div>

                <div
                  onClick={() => setIsSolvingInline(true)}
                  className="p-3.5 rounded-xl bg-[var(--dm-surface)] border border-dashed border-[var(--dm-line)] hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors flex items-center justify-between text-xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 text-[var(--dm-muted)] group-hover:text-emerald-800">
                    <UploadCloud size={18} className="text-stone-400 group-hover:text-emerald-600" />
                    <span>Upload photo of solved problem (e.g. reset alarm panel, secured perimeter, cleared area)</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 shrink-0 group-hover:underline">
                    Attach Image &rarr;
                  </span>
                </div>
              </div>
            )}

            {/* B. If currently resolving directly inside modal */}
            {isSolvingInline && !isResolved && (
              <form
                onSubmit={handleDirectSolveSubmit}
                className="p-5 rounded-xl bg-emerald-50/70 border-2 border-emerald-300 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-700" />
                    <h3 className="text-sm font-bold text-emerald-950">
                      Solve Incident &amp; Attach Photo Proof
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSolvingInline(false)}
                    className="text-xs text-emerald-800 hover:underline"
                  >
                    Cancel
                  </button>
                </div>

                {solveError && (
                  <div className="p-2.5 rounded-lg bg-rose-100 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{solveError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">
                    Problem Solution Summary <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={solveSummary}
                    onChange={(e) => setSolveSummary(e.target.value)}
                    placeholder="e.g. Alarm sensor reset and confirmed safe with lifeguard"
                    className="w-full rounded-xl bg-white border border-emerald-300 px-3 py-2 text-xs text-[var(--dm-ink)] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Outcome Status</label>
                    <select
                      value={solveOutcome}
                      onChange={(e) => setSolveOutcome(e.target.value)}
                      className="w-full rounded-xl bg-white border border-emerald-300 px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    >
                      <option value="Secured & Stabilized" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>Secured &amp; Stabilized</option>
                      <option value="False Alarm - Sensor Reset" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>False Alarm - Sensor Reset</option>
                      <option value="Guest Reassured & Closed" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>Guest Reassured &amp; Closed</option>
                      <option value="Maintenance Work Order Dispatched" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>Maintenance Work Order Dispatched</option>
                      <option value="Police / External Handover" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>Police / External Handover</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">Actions Taken</label>
                    <input
                      type="text"
                      value={solveActions}
                      onChange={(e) => setSolveActions(e.target.value)}
                      placeholder="e.g. Inspected area, verified perimeter safe"
                      className="w-full rounded-xl bg-white border border-emerald-300 px-3 py-2 text-xs text-[var(--dm-ink)] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* PHOTO UPLOAD BOX */}
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                    <Camera size={14} />
                    <span>Upload Image After Problem Solved (Photo Evidence)</span>
                  </label>

                  {solvePhotoUrl ? (
                    <div className="relative rounded-xl border-2 border-emerald-300 overflow-hidden bg-white p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={solvePhotoUrl}
                          alt="Solved evidence"
                          className="h-16 w-16 object-cover rounded-lg border border-emerald-300 shadow-sm"
                        />
                        <div>
                          <p className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                            <Check size={14} className="text-emerald-600" />
                            Problem Solved Photo Attached
                          </p>
                          <p className="text-[10px] text-stone-500">
                            Scene cleared &amp; verified by Inspector Roy
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEnlargedPhoto(solvePhotoUrl)}
                          className="p-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200"
                          title="Preview"
                        >
                          <ZoomIn size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSolvePhotoUrl(null)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-emerald-300 bg-white hover:bg-emerald-50/50 cursor-pointer transition-all">
                      <UploadCloud size={24} className="text-emerald-700 mb-1" />
                      <span className="text-xs font-bold text-emerald-950">
                        Click or drag to upload problem-solved photo
                      </span>
                      <span className="text-[10px] text-stone-500 mt-0.5">
                        Capture camera image or select JPG / PNG / WebP
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsSolvingInline(false)}
                    className="dm-secondary text-xs px-4 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="dm-primary text-xs px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 border-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <CheckCircle2 size={14} />
                    <span>Save Solution &amp; Mark Resolved</span>
                  </button>
                </div>
              </form>
            )}

            {/* C. If ALREADY RESOLVED: Display the Problem Solved Evidence Card & Photo */}
            {isResolved && (
              <div className="p-4 sm:p-5 rounded-xl bg-emerald-50/90 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-700" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">
                        Incident Problem Solved &amp; Verified
                      </h4>
                      <p className="text-[10px] text-emerald-800">
                        Secured at {item.securityReport?.filedAt || 'Today'} • Inspector Roy (EMP-0108)
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
                    {item.securityReport?.outcome || 'Secured & Stabilized'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Solution Summary
                    </span>
                    <p className="text-emerald-950 font-medium">
                      {item.securityReport?.summary || 'Incident resolved and area secured.'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Actions Taken
                    </span>
                    <p className="text-emerald-950">
                      {item.securityReport?.actionsTaken || 'Physical perimeter sweep and sensor reset completed.'}
                    </p>
                  </div>
                </div>

                {/* Problem Solved Photo Display */}
                <div className="pt-2 border-t border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-2 flex items-center gap-1">
                    <Camera size={13} />
                    <span>Problem Solved Image Proof</span>
                  </span>

                  {displayPhoto ? (
                    <div className="rounded-xl border border-emerald-300 bg-white p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative group cursor-pointer" onClick={() => setEnlargedPhoto(displayPhoto)}>
                          <img
                            src={displayPhoto}
                            alt="Resolution evidence"
                            className="h-20 w-24 object-cover rounded-lg border border-emerald-200 group-hover:opacity-90 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ZoomIn size={16} className="text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            Problem Solved Evidence Verified
                          </p>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            Image captured after solving incident
                          </p>
                          <button
                            type="button"
                            onClick={() => setEnlargedPhoto(displayPhoto)}
                            className="text-[11px] text-emerald-700 font-semibold hover:underline mt-1 flex items-center gap-1"
                          >
                            <ZoomIn size={12} /> Click to enlarge
                          </button>
                        </div>
                      </div>

                      {/* Option to replace/update photo */}
                      <button
                        type="button"
                        onClick={() => postFileInputRef.current?.click()}
                        className="dm-small-button text-xs px-3 py-1.5 shrink-0 self-end sm:self-center"
                      >
                        <Camera size={13} />
                        <span>Replace Photo</span>
                      </button>
                      <input
                        ref={postFileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePostResolutionPhotoSelect}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    /* If resolved but no photo was attached yet, allow uploading it now! */
                    <div className="p-3.5 rounded-xl border border-dashed border-emerald-300 bg-white/70 text-center">
                      <p className="text-xs text-emerald-950 font-medium mb-2">
                        No image proof attached yet for this resolved incident.
                      </p>
                      <button
                        type="button"
                        onClick={() => postFileInputRef.current?.click()}
                        className="dm-primary text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1.5 bg-emerald-700 border-emerald-700 text-white font-semibold"
                      >
                        <UploadCloud size={14} />
                        <span>Upload Photo After Problem Solved</span>
                      </button>
                      <input
                        ref={postFileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePostResolutionPhotoSelect}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= 4. RELEVANT STAFF & DISPATCH CARD ================= */}
            <div className="p-4 rounded-xl bg-white border border-[var(--dm-line)] shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-[var(--dm-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} />
                  <span>Relevant Staff &amp; Support Dispatch</span>
                </h4>
                {isBackup && (
                  <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 animate-pulse">
                    Backup Requested
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-[var(--dm-surface)] border border-[var(--dm-line)]">
                  <span className="text-[10px] text-[var(--dm-muted)] block">Lead Officer</span>
                  <strong className="text-[var(--dm-ink)]">Sr. Officer Roy (EMP-0108)</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--dm-surface)] border border-[var(--dm-line)]">
                  <span className="text-[10px] text-[var(--dm-muted)] block">Front Desk Coordinator</span>
                  <strong className="text-[var(--dm-ink)]">Maya Lin (EMP-0104)</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--dm-surface)] border border-[var(--dm-line)]">
                  <span className="text-[10px] text-[var(--dm-muted)] block">Duty Manager</span>
                  <strong className="text-[var(--dm-ink)]">Marcus Vance (Operations)</strong>
                </div>
              </div>

              {!isResolved && (
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBackupModal(true)}
                    className="dm-small-button flex-1 justify-center"
                  >
                    <Users size={14} />
                    <span>Request Backup</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEscalateModal(true)}
                    className="dm-small-button flex-1 justify-center"
                  >
                    <ArrowUpRight size={14} />
                    <span>Escalate to DM</span>
                  </button>
                </div>
              )}
            </div>

            {/* ================= 5. PROTOCOL SOP BANNER ================= */}
            <div className="p-4 rounded-xl bg-[var(--warm-soft)] border border-[var(--dm-line)] space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-[var(--dm-ink)]">
                <ShieldAlert size={15} />
                <span>{protocol.code}: {protocol.title}</span>
              </div>
              <ul className="space-y-1 text-[11px] text-[var(--dm-muted)] list-disc list-inside">
                {protocol.steps.map((st, idx) => (
                  <li key={idx}>{st}</li>
                ))}
              </ul>
            </div>

            {/* ================= 6. TIMELINE AUDIT & OFFICER FIELD NOTES ================= */}
            <div className="p-4 rounded-xl bg-white border border-[var(--dm-line)] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-[var(--dm-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>Incident Audit Timeline</span>
                </h4>
                <span className="text-[10px] text-[var(--dm-muted)]">Chronological audit log</span>
              </div>

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

              {/* Officer Field Notes */}
              <div className="pt-3 border-t border-[var(--dm-line)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[var(--dm-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare size={13} />
                    <span>Officer Field Notes</span>
                  </span>
                  <span className="text-[10px] text-[var(--dm-muted)]">Permanent record</span>
                </div>

                {item.securityNotes && item.securityNotes.length > 0 ? (
                  <div className="space-y-1.5 mb-2.5">
                    {item.securityNotes.map((note, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[var(--dm-surface)] border border-[var(--dm-line)] text-xs">
                        <div className="flex items-center justify-between text-[10px] text-[var(--dm-muted)] mb-0.5">
                          <strong className="text-[var(--dm-ink)]">{note.author}</strong>
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
                      placeholder="Add field observation..."
                      className="flex-1 rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3 py-2 text-xs text-[var(--dm-ink)] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
                    />
                    <button
                      type="submit"
                      disabled={!noteInput.trim()}
                      className="dm-primary px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer disabled:opacity-40 flex items-center gap-1"
                    >
                      <Send size={12} />
                      <span>Log</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* ================= MODAL FOOTER ACTIONS (PINNED) ================= */}
          <div className="shrink-0 p-4 sm:p-5 border-t border-[var(--dm-line)] bg-[var(--warm-soft)] flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="dm-secondary text-xs px-4 py-2.5 rounded-xl cursor-pointer"
            >
              Close
            </button>

            <div className="flex items-center gap-2">
              {isNew && (
                <button
                  onClick={() => {
                    onAcknowledge(item.id);
                  }}
                  className="dm-primary text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ShieldAlert size={15} />
                  <span>Acknowledge Incident</span>
                </button>
              )}

              {isAck && (
                <button
                  onClick={() => {
                    onArrive(item.id);
                  }}
                  className="dm-primary text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle2 size={15} />
                  <span>Confirm Arrived On Scene</span>
                </button>
              )}

              {(isOnScene || isBackup || isEscalated || (!isNew && !isAck && !isResolved)) && !isSolvingInline && (
                <button
                  onClick={() => setIsSolvingInline(true)}
                  className="dm-primary text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md bg-emerald-700 hover:bg-emerald-800 border-emerald-700 text-white"
                >
                  <CheckCircle2 size={15} />
                  <span>Solve Incident &amp; Upload Photo</span>
                </button>
              )}

              {isResolved && (
                <button
                  onClick={() => postFileInputRef.current?.click()}
                  className="dm-primary text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer bg-emerald-700 hover:bg-emerald-800 border-emerald-700 text-white"
                >
                  <Camera size={14} />
                  <span>{displayPhoto ? 'Update Photo' : 'Upload Solved Photo'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= ENLARGED PHOTO LIGHTBOX MODAL ================= */}
      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setEnlargedPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[92vh] bg-stone-900 border border-stone-700 rounded-2xl overflow-hidden shadow-2xl p-3 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800 text-white text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block shrink-0" />
                <span className="font-bold text-rose-300 flex items-center gap-1.5 truncate">
                  <Video size={15} className="shrink-0" /> {enlargedPhotoTitle}
                </span>
                {activeCameraId && (
                  <span className="px-2 py-0.5 rounded bg-black/50 text-[10px] font-mono text-stone-300 border border-stone-700 hidden sm:inline shrink-0">
                    {activeCameraId}
                  </span>
                )}
              </div>
              <button
                onClick={() => setEnlargedPhoto(null)}
                className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium cursor-pointer shrink-0"
              >
                Close ✕
              </button>
            </div>
            <div className="relative flex-1 min-h-0 flex items-center justify-center bg-black/40 rounded-xl overflow-hidden">
              <img
                src={enlargedPhoto}
                alt={enlargedPhotoTitle}
                className="w-full h-auto max-h-[75vh] object-contain rounded-xl"
              />
            </div>
            <div className="pt-2 mt-2 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
              <span>{activePhotoSource || 'Security Visual Evidence'}</span>
              <span className="text-stone-500 text-[10px]">{activeTimestamp} • {item.location}</span>
            </div>
          </div>
        </div>
      )}

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
        }}
      />
    </>
  );
}
