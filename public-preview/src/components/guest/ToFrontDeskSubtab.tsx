'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  HeartHandshake,
  Receipt,
  ShieldAlert,
  Send,
  Plus,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
  Camera,
  Upload,
  FileText,
  X,
  Sparkles,
  Paperclip,
  Check,
  RotateCcw,
  Scale,
  Calendar,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Building,
  User,
  ExternalLink,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn, money, statusTone } from '@/lib/utils';
import { GuestPill, GuestSectionHeader } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import type {
  ComplaintCategory,
  CompensationRefundCategory,
  GuestIncidentCategory,
} from '@/types/demo';

/* ------------------------------------------------------------------ */
/* Attachment Interface & Reusable Upload Component (Section 5)        */
/* ------------------------------------------------------------------ */

export interface FormAttachment {
  name: string;
  size: string;
  type: string;
  url: string;
}

function AttachmentUploader({
  attachments,
  onChange,
  maxFiles = 4,
}: {
  attachments: FormAttachment[];
  onChange: (attachments: FormAttachment[]) => void;
  maxFiles?: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const newAttachments: FormAttachment[] = [];
    const remainingSlots = maxFiles - attachments.length;

    if (files.length > remainingSlots) {
      setError(`You can only attach up to ${maxFiles} files.`);
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 10 MB limit.`);
        continue;
      }

      // Format size
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      // Read as Data URL
      const reader = new FileReader();
      reader.onload = () => {
        newAttachments.push({
          name: file.name,
          size: sizeStr,
          type: file.type || 'application/octet-stream',
          url: (reader.result as string) || '',
        });

        if (newAttachments.length === filesToProcess.length) {
          onChange([...attachments, ...newAttachments]);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function handleRemove(index: number) {
    const updated = attachments.filter((_, i) => i !== index);
    onChange(updated);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <label className="font-semibold text-mist-300 flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5 text-cyan-400" />
          <span>Photo &amp; Document Attachments</span>
          <span className="text-[10px] text-mist-400 font-normal">
            ({attachments.length}/{maxFiles})
          </span>
        </label>
        <span className="text-[10px] text-mist-400">Max 10 MB · JPG, PNG, PDF</span>
      </div>

      {error && (
        <p className="text-[11px] text-rose-300 font-medium bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
          {error}
        </p>
      )}

      {/* Upload Trigger Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.doc,.docx"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <button
          type="button"
          disabled={attachments.length >= maxFiles}
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-cyan-400/40 bg-white/5 hover:bg-white/10 text-xs text-mist-200 hover:text-white flex items-center gap-1.5 transition-all disabled:opacity-40"
        >
          <Upload className="h-3.5 w-3.5 text-cyan-400" />
          <span>Upload File</span>
        </button>

        <button
          type="button"
          disabled={attachments.length >= maxFiles}
          onClick={() => cameraInputRef.current?.click()}
          className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-amber-400/40 bg-white/5 hover:bg-white/10 text-xs text-mist-200 hover:text-white flex items-center gap-1.5 transition-all disabled:opacity-40"
        >
          <Camera className="h-3.5 w-3.5 text-amber-400" />
          <span>Take Photo</span>
        </button>
      </div>

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {attachments.map((att, idx) => {
            const isImage = att.type.startsWith('image/');

            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isImage && att.url ? (
                    <img
                      src={att.url}
                      alt={att.name}
                      className="h-10 w-10 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/30 shrink-0">
                      <FileText className="h-5 w-5" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate text-xs">{att.name}</p>
                    <p className="text-[10px] text-mist-400">{att.size}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-1 rounded-lg hover:bg-rose-500/20 text-mist-400 hover:text-rose-300 transition-colors shrink-0"
                  title="Remove attachment"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Unified Front Desk Component (Section 2, 3, 4, 5, 6, 7)             */
/* ------------------------------------------------------------------ */

type FrontDeskCategoryKey = 'requests' | 'complaints' | 'financial' | 'incidents';

export function ToFrontDeskSubtab({ room, guestName, onNavigate, initialSubtab }: GuestTabProps) {
  const {
    state,
    submitGuestFrontDeskRequest,
    submitGuestComplaint,
    submitCompensationRefundRequest,
    submitGuestIncident,
    replyGuestMessage,
    guestProvideAdditionalRefundInfo,
  } = useDemo();

  // Determine initial active category based on deep links
  const [activeCategory, setActiveCategory] = useState<FrontDeskCategoryKey>(() => {
    if (initialSubtab === 'complaints') return 'complaints';
    if (initialSubtab === 'compensation') return 'financial';
    if (initialSubtab === 'incidents') return 'incidents';
    return 'requests';
  });

  useEffect(() => {
    if (initialSubtab === 'complaints') setActiveCategory('complaints');
    else if (initialSubtab === 'compensation') setActiveCategory('financial');
    else if (initialSubtab === 'incidents') setActiveCategory('incidents');
    else if (initialSubtab === 'front_desk' || initialSubtab === 'messages') setActiveCategory('requests');
  }, [initialSubtab]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  }

  // 1. Complaints Form State
  const [complaintCategory, setComplaintCategory] = useState<ComplaintCategory>('Room Issues');
  const [complaintDept, setComplaintDept] = useState('Housekeeping');
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintTime, setComplaintTime] = useState('Today, ~11:00 AM');
  const [complaintResolution, setComplaintResolution] = useState('Service Rectification & Check');
  const [complaintInstructions, setComplaintInstructions] = useState('');
  const [complaintAttachments, setComplaintAttachments] = useState<FormAttachment[]>([]);
  const [isComplaintFormOpen, setIsComplaintFormOpen] = useState(false);

  // 2. Financial Issues Form State
  const [financialCategory, setFinancialCategory] = useState<CompensationRefundCategory>('Billing Dispute');
  const [financialTransaction, setFinancialTransaction] = useState('');
  const [financialAmount, setFinancialAmount] = useState<string>('');
  const [financialDate, setFinancialDate] = useState('Today');
  const [financialExplanation, setFinancialExplanation] = useState('');
  const [financialResolution, setFinancialResolution] = useState('Folio Credit / Charge Correction');
  const [financialAdditional, setFinancialAdditional] = useState('');
  const [financialAttachments, setFinancialAttachments] = useState<FormAttachment[]>([]);
  const [isFinancialFormOpen, setIsFinancialFormOpen] = useState(false);

  // 3. General Requests Form State
  const [requestCategory, setRequestCategory] = useState('Special Assistance');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDesc, setRequestDesc] = useState('');
  const [requestDateTime, setRequestDateTime] = useState('');
  const [requestInstructions, setRequestInstructions] = useState('');
  const [requestAttachments, setRequestAttachments] = useState<FormAttachment[]>([]);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  // 4. Incidents Form State
  const [incidentCategory, setIncidentCategory] = useState<GuestIncidentCategory>('Room/Property Damage');
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentDateTime, setIncidentDateTime] = useState('Today, ~1:00 PM');
  const [incidentLocation, setIncidentLocation] = useState(`In-Room ${room}`);
  const [incidentPeople, setIncidentPeople] = useState(guestName);
  const [incidentImmediate, setIncidentImmediate] = useState(false);
  const [incidentAdditional, setIncidentAdditional] = useState('');
  const [incidentAttachments, setIncidentAttachments] = useState<FormAttachment[]>([]);
  const [isIncidentFormOpen, setIsIncidentFormOpen] = useState(false);

  // Additional refund info state
  const [refundInfoReplies, setRefundInfoReplies] = useState<Record<string, string>>({});

  // Room records for display
  const myComplaints = (state.guestComplaints ?? []).filter((c) => c.room === room);
  const myFinancial = (state.guestCompensationRefundRequests ?? []).filter((cr) => cr.room === room);
  const myMessages = (state.frontDeskMessages ?? []).filter((m) => m.room === room);
  const myIncidents = (state.guestIncidents ?? []).filter((i) => i.room === room);
  const folioLines = state.folios?.[room] ?? [];

  // Handlers for submission
  function handleSubmitComplaint(e: React.FormEvent) {
    e.preventDefault();
    if (!complaintTitle.trim() || !complaintDesc.trim()) return;

    const ref = submitGuestComplaint({
      room,
      guestName,
      title: complaintTitle.trim(),
      category: complaintCategory,
      department: complaintDept,
      description: complaintDesc.trim(),
      preferredResolution: complaintResolution,
      additionalInstructions: complaintInstructions.trim() || undefined,
      attachments: complaintAttachments,
    });

    setComplaintTitle('');
    setComplaintDesc('');
    setComplaintInstructions('');
    setComplaintAttachments([]);
    setIsComplaintFormOpen(false);
    showToast(`Complaint registered under ticket ${ref}. Escalate to Duty Manager.`);
  }

  function handleSubmitFinancial(e: React.FormEvent) {
    e.preventDefault();
    if (!financialExplanation.trim()) return;

    const ref = submitCompensationRefundRequest({
      room,
      guestName,
      bookingRef: 'BK-402-992',
      category: financialCategory,
      relatedServiceOrTransaction: financialTransaction.trim() || 'General Stay Folio',
      amountRequested: financialAmount ? parseFloat(financialAmount) : undefined,
      reason: financialCategory,
      explanation: financialExplanation.trim(),
      incidentDate: financialDate,
      preferredResolution: financialResolution,
      additionalInstructions: financialAdditional.trim() || undefined,
      attachments: financialAttachments,
    });

    setFinancialExplanation('');
    setFinancialAmount('');
    setFinancialAdditional('');
    setFinancialAttachments([]);
    setIsFinancialFormOpen(false);
    showToast(`Financial dispute ${ref} submitted to Front Desk & Accounting.`);
  }

  function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!requestTitle.trim() || !requestDesc.trim()) return;

    const ref = submitGuestFrontDeskRequest({
      room,
      guestName,
      category: requestCategory,
      title: requestTitle.trim(),
      description: requestDesc.trim(),
      preferredDateTime: requestDateTime.trim() || undefined,
      additionalInstructions: requestInstructions.trim() || undefined,
      attachments: requestAttachments,
    });

    setRequestTitle('');
    setRequestDesc('');
    setRequestDateTime('');
    setRequestInstructions('');
    setRequestAttachments([]);
    setIsRequestFormOpen(false);
    showToast(`Request ${ref} submitted to Front Desk coordinator.`);
  }

  function handleSubmitIncident(e: React.FormEvent) {
    e.preventDefault();
    if (!incidentTitle.trim() || !incidentDesc.trim()) return;

    const ref = submitGuestIncident({
      room,
      guestName,
      category: incidentCategory,
      title: incidentTitle.trim(),
      description: incidentDesc.trim(),
      incidentDateTime,
      location: incidentLocation,
      peopleInvolved: incidentPeople.trim() || undefined,
      immediateAssistanceRequired: incidentImmediate,
      attachments: incidentAttachments,
      additionalInfo: incidentAdditional.trim() || undefined,
    });

    setIncidentTitle('');
    setIncidentDesc('');
    setIncidentAdditional('');
    setIncidentAttachments([]);
    setIncidentImmediate(false);
    setIsIncidentFormOpen(false);
    showToast(
      incidentImmediate
        ? `🚨 Urgent incident ${ref} dispatched to Duty Manager & Security!`
        : `Incident ${ref} logged with Front Desk & Security.`
    );
  }

  function handleSendReply(msgId: string) {
    const text = replyInputs[msgId]?.trim();
    if (!text) return;
    replyGuestMessage(msgId, text, 'guest');
    setReplyInputs((prev) => ({ ...prev, [msgId]: '' }));
    showToast('Reply sent to Front Desk.');
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 max-w-7xl mx-auto w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="guest-card flex items-start gap-2.5 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-xs text-white shadow-lg animate-in fade-in duration-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <p className="font-semibold text-emerald-300">{toastMessage}</p>
        </div>
      )}

      {/* Header Context Card */}
      <div className="guest-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-500/20 text-indigo-300">
              <MessageSquare className="h-4 w-4" />
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Front Desk &amp; Guest Support
            </h2>
          </div>
          <p className="text-[11px] text-mist-400 mt-1">
            24/7 dedicated assistance for In-House Guests · Room {room} · {guestName} · Stay BK-402-992
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('activity')}
          className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-amber-400/40 bg-white/5 hover:bg-white/10 text-xs font-semibold text-mist-200 hover:text-white flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <span>Track in My Activity</span>
          <ArrowRight className="h-3 w-3 text-amber-400" />
        </button>
      </div>

      {/* Section 4: Four Dedicated Guest Support Category Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* 1. Complaints */}
        <button
          type="button"
          onClick={() => setActiveCategory('complaints')}
          className={cn(
            'p-3.5 sm:p-4 rounded-2xl text-left border transition-all flex flex-col justify-between group',
            activeCategory === 'complaints'
              ? 'bg-rose-500/15 border-rose-500/40 shadow-md ring-2 ring-rose-500/20'
              : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
          )}
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                'grid h-9 w-9 place-items-center rounded-xl transition-colors',
                activeCategory === 'complaints'
                  ? 'bg-rose-500 text-white'
                  : 'bg-rose-500/15 text-rose-300'
              )}
            >
              <HeartHandshake className="h-4.5 w-4.5" />
            </span>
            {myComplaints.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {myComplaints.length}
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
              Complaints
            </p>
            <p className="text-[10px] text-mist-400 line-clamp-2 mt-0.5">
              Dissatisfaction, cleanliness, staff or service recovery escalation.
            </p>
          </div>
        </button>

        {/* 2. Financial Issues */}
        <button
          type="button"
          onClick={() => setActiveCategory('financial')}
          className={cn(
            'p-3.5 sm:p-4 rounded-2xl text-left border transition-all flex flex-col justify-between group',
            activeCategory === 'financial'
              ? 'bg-emerald-500/15 border-emerald-500/40 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
          )}
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                'grid h-9 w-9 place-items-center rounded-xl transition-colors',
                activeCategory === 'financial'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-500/15 text-emerald-300'
              )}
            >
              <Receipt className="h-4.5 w-4.5" />
            </span>
            {myFinancial.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {myFinancial.length}
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Financial Issues
            </p>
            <p className="text-[10px] text-mist-400 line-clamp-2 mt-0.5">
              Refunds, deposit returns, billing disputes, incorrect charges.
            </p>
          </div>
        </button>

        {/* 3. Requests */}
        <button
          type="button"
          onClick={() => setActiveCategory('requests')}
          className={cn(
            'p-3.5 sm:p-4 rounded-2xl text-left border transition-all flex flex-col justify-between group',
            activeCategory === 'requests'
              ? 'bg-indigo-500/15 border-indigo-500/40 shadow-md ring-2 ring-indigo-500/20'
              : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
          )}
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                'grid h-9 w-9 place-items-center rounded-xl transition-colors',
                activeCategory === 'requests'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-indigo-500/15 text-indigo-300'
              )}
            >
              <MessageSquare className="h-4.5 w-4.5" />
            </span>
            {myMessages.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {myMessages.length}
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
              Requests
            </p>
            <p className="text-[10px] text-mist-400 line-clamp-2 mt-0.5">
              Special assistance, room arrangements, luggage, wake-up calls.
            </p>
          </div>
        </button>

        {/* 4. Incidents */}
        <button
          type="button"
          onClick={() => setActiveCategory('incidents')}
          className={cn(
            'p-3.5 sm:p-4 rounded-2xl text-left border transition-all flex flex-col justify-between group',
            activeCategory === 'incidents'
              ? 'bg-amber-500/15 border-amber-500/40 shadow-md ring-2 ring-amber-500/20'
              : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
          )}
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                'grid h-9 w-9 place-items-center rounded-xl transition-colors',
                activeCategory === 'incidents'
                  ? 'bg-amber-500 text-ink-950 font-bold'
                  : 'bg-amber-500/15 text-amber-300'
              )}
            >
              <ShieldAlert className="h-4.5 w-4.5" />
            </span>
            {myIncidents.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {myIncidents.length}
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
              Incidents
            </p>
            <p className="text-[10px] text-mist-400 line-clamp-2 mt-0.5">
              Property damage, safety concerns, lost personal items, accidents.
            </p>
          </div>
        </button>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* 1. CATEGORY: COMPLAINTS VIEW                                 */}
      {/* ------------------------------------------------------------ */}
      {activeCategory === 'complaints' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-rose-400" />
                <span>Service Complaints &amp; Service Recovery</span>
              </h3>
              <p className="text-[11px] text-mist-400">
                Formal complaint case escalated directly to Duty Manager Marcus Vance
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsComplaintFormOpen(!isComplaintFormOpen)}
              className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-400 shadow-sm flex items-center gap-1.5 transition-all"
            >
              {isComplaintFormOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              <span>{isComplaintFormOpen ? 'Close Form' : 'Register Complaint'}</span>
            </button>
          </div>

          {/* Submission Form */}
          {isComplaintFormOpen && (
            <form
              onSubmit={handleSubmitComplaint}
              className="guest-card p-4 sm:p-5 space-y-4 border border-rose-500/30 bg-rose-500/5"
            >
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                New Complaint Registration
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Issue Category *</label>
                  <select
                    value={complaintCategory}
                    onChange={(e) => setComplaintCategory(e.target.value as ComplaintCategory)}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  >
                    <option value="Room Issues">Room Issues</option>
                    <option value="Housekeeping">Housekeeping &amp; Cleanliness</option>
                    <option value="Food and Dining">Food &amp; Dining Experience</option>
                    <option value="Staff Behaviour">Staff Behaviour</option>
                    <option value="Maintenance">Maintenance &amp; Engineering</option>
                    <option value="Billing">Billing &amp; Service Experience</option>
                    <option value="Other">Other Disturbance</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Related Department</label>
                  <select
                    value={complaintDept}
                    onChange={(e) => setComplaintDept(e.target.value)}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  >
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Food & Beverage">Food &amp; Beverage</option>
                    <option value="Front Desk">Front Desk</option>
                    <option value="Engineering / Maintenance">Engineering / Maintenance</option>
                    <option value="Spa & Wellness">Spa &amp; Wellness</option>
                    <option value="General Management">Duty Management</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Complaint Title *</label>
                  <input
                    type="text"
                    required
                    value={complaintTitle}
                    onChange={(e) => setComplaintTitle(e.target.value)}
                    placeholder="Brief summary of the issue (e.g. AC blowing warm air)"
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Date &amp; Approximate Time</label>
                  <input
                    type="text"
                    value={complaintTime}
                    onChange={(e) => setComplaintTime(e.target.value)}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-mist-300 block mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  placeholder="Please describe exactly what happened and how our team can resolve it..."
                  className="guest-field w-full px-3 py-2 text-xs text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Preferred Resolution</label>
                  <select
                    value={complaintResolution}
                    onChange={(e) => setComplaintResolution(e.target.value)}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  >
                    <option value="Service Rectification & Check">Service Rectification &amp; Check</option>
                    <option value="Duty Manager Callback">Duty Manager Callback</option>
                    <option value="Room Relocation">Room Relocation</option>
                    <option value="Folio Credit / Goodwill Adjustment">Folio Credit / Goodwill Adjustment</option>
                    <option value="Formal Apology & Fix">Formal Apology &amp; Immediate Fix</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Additional Instructions</label>
                  <input
                    type="text"
                    value={complaintInstructions}
                    onChange={(e) => setComplaintInstructions(e.target.value)}
                    placeholder="e.g. Please visit only after 14:00"
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Attachments */}
              <AttachmentUploader
                attachments={complaintAttachments}
                onChange={setComplaintAttachments}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsComplaintFormOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-mist-300 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-400 shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Submit Complaint</span>
                </button>
              </div>
            </form>
          )}

          {/* Existing Complaints for Room 402 */}
          <div className="space-y-2.5">
            {myComplaints.length === 0 ? (
              <div className="guest-card p-6 text-center text-xs text-mist-400">
                No complaint records logged for Room {room}.
              </div>
            ) : (
              myComplaints.map((c) => (
                <div
                  key={c.id}
                  className="guest-card p-3.5 space-y-2 border border-rose-500/20 hover:border-rose-500/40 transition-all text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-amber-300">{c.complaintId}</span>
                      <h4 className="font-bold text-white text-xs mt-0.5">{c.title}</h4>
                      <p className="text-[10px] text-mist-400">
                        {c.category} · {c.submittedAt}
                      </p>
                    </div>
                    <GuestPill tone={statusTone(c.status)}>{c.status}</GuestPill>
                  </div>

                  <p className="text-mist-200 bg-white/5 p-2 rounded-lg">{c.description}</p>

                  {c.responseRemarks && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                      <strong>Resolution Remarks:</strong> {c.responseRemarks}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* 2. CATEGORY: FINANCIAL ISSUES & REFUNDS VIEW                 */}
      {/* ------------------------------------------------------------ */}
      {activeCategory === 'financial' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-400" />
                <span>Financial Concerns, Refunds &amp; Billing Disputes</span>
              </h3>
              <p className="text-[11px] text-mist-400">
                Official dispute resolution reviewed by Front Desk &amp; Hotel Accounting
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsFinancialFormOpen(!isFinancialFormOpen)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-400 shadow-sm flex items-center gap-1.5 transition-all"
            >
              {isFinancialFormOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              <span>{isFinancialFormOpen ? 'Close Form' : 'New Refund / Dispute'}</span>
            </button>
          </div>

          {/* Submission Form */}
          {isFinancialFormOpen && (
            <form
              onSubmit={handleSubmitFinancial}
              className="guest-card p-4 sm:p-5 space-y-4 border border-emerald-500/30 bg-emerald-500/5"
            >
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Submit Financial Dispute / Refund Request
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Dispute Category *</label>
                  <select
                    value={financialCategory}
                    onChange={(e) => setFinancialCategory(e.target.value as CompensationRefundCategory)}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  >
                    <option value="Refund Request">Refund Request</option>
                    <option value="Partial Refund">Partial Refund</option>
                    <option value="Compensation for Service Issues">Compensation for Service Issues</option>
                    <option value="Billing Dispute">Billing Dispute</option>
                    <option value="Incorrect Charges">Incorrect Charges</option>
                    <option value="Duplicate Payment">Duplicate Payment</option>
                    <option value="Deposit Refund">Deposit Refund</option>
                    <option value="Other Financial Concern">Other Financial Concern</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Related Charge / Service</label>
                  <select
                    value={financialTransaction}
                    onChange={(e) => setFinancialTransaction(e.target.value)}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Select Folio Charge or General --</option>
                    {folioLines.map((line) => (
                      <option key={line.id} value={`${line.label} (${money(line.amount)})`}>
                        {line.label} · {money(line.amount)}
                      </option>
                    ))}
                    <option value="Room Stay / Nightly Rate">Room Stay / Nightly Rate</option>
                    <option value="Other Transaction">Other Transaction</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Amount Requested (₹) [Optional]</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={financialAmount}
                    onChange={(e) => setFinancialAmount(e.target.value)}
                    placeholder="e.g. 1850"
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Transaction Date</label>
                  <input
                    type="text"
                    value={financialDate}
                    onChange={(e) => setFinancialDate(e.target.value)}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-mist-300 block mb-1">Detailed Explanation *</label>
                <textarea
                  rows={3}
                  required
                  value={financialExplanation}
                  onChange={(e) => setFinancialExplanation(e.target.value)}
                  placeholder="Explain the billing discrepancy, duplicate charge, or reason for reimbursement..."
                  className="guest-field w-full px-3 py-2 text-xs text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Preferred Resolution</label>
                  <select
                    value={financialResolution}
                    onChange={(e) => setFinancialResolution(e.target.value)}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  >
                    <option value="Refund to Original Card">Refund to Original Card</option>
                    <option value="Folio Credit / Charge Removal">Folio Credit / Charge Removal</option>
                    <option value="Deposit Release">Deposit Release</option>
                    <option value="Hotel Credit Voucher">Hotel Credit Voucher</option>
                    <option value="Manager Discussion">Manager Discussion</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Additional Information</label>
                  <input
                    type="text"
                    value={financialAdditional}
                    onChange={(e) => setFinancialAdditional(e.target.value)}
                    placeholder="e.g. Transaction Ref or Card ending"
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Attachments */}
              <AttachmentUploader
                attachments={financialAttachments}
                onChange={setFinancialAttachments}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsFinancialFormOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-mist-300 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-400 shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Submit Financial Request</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Financial Requests */}
          <div className="space-y-2.5">
            {myFinancial.length === 0 ? (
              <div className="guest-card p-6 text-center text-xs text-mist-400">
                No financial refund or dispute cases logged for Room {room}.
              </div>
            ) : (
              myFinancial.map((r) => {
                const isInfoRequired = r.status === 'Additional Information Required';
                const replyVal = refundInfoReplies[r.id] ?? '';

                return (
                  <div
                    key={r.id}
                    className="guest-card p-3.5 space-y-2.5 border border-emerald-500/20 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-amber-300">{r.ref}</span>
                        <h4 className="font-bold text-white text-xs mt-0.5">{r.category}</h4>
                        <p className="text-[10px] text-mist-400">{r.createdAt} · Room {r.room}</p>
                      </div>
                      <GuestPill tone={statusTone(r.status)}>{r.status}</GuestPill>
                    </div>

                    <p className="text-mist-200 bg-white/5 p-2 rounded-lg">{r.explanation}</p>

                    {r.staffResponse && (
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider">
                          Front Desk Response
                        </span>
                        <p className="text-indigo-100">{r.staffResponse}</p>
                        {r.approvedAmount !== undefined && (
                          <p className="text-emerald-400 font-bold font-mono pt-1">
                            Approved Amount: ₹{r.approvedAmount.toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Additional Information Request & Reply */}
                    {isInfoRequired && (
                      <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-400/30 space-y-2">
                        <p className="text-[11px] text-sky-200 font-semibold">
                          Front Desk requested additional information:
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={replyVal}
                            onChange={(e) =>
                              setRefundInfoReplies((prev) => ({ ...prev, [r.id]: e.target.value }))
                            }
                            placeholder="Provide transaction details or answers..."
                            className="guest-field flex-1 px-3 py-1.5 text-xs text-white"
                          />
                          <button
                            type="button"
                            disabled={!replyVal.trim()}
                            onClick={() => {
                              guestProvideAdditionalRefundInfo(r.id, replyVal.trim());
                              setRefundInfoReplies((prev) => ({ ...prev, [r.id]: '' }));
                              showToast('Information submitted to Front Desk.');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-sky-400 text-ink-950 font-bold text-xs hover:bg-sky-300 disabled:opacity-40"
                          >
                            Submit Info
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* 3. CATEGORY: GENERAL REQUESTS VIEW                           */}
      {/* ------------------------------------------------------------ */}
      {activeCategory === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-400" />
                <span>General Front Desk Requests &amp; Inquiries</span>
              </h3>
              <p className="text-[11px] text-mist-400">
                Special arrangements, wake-up calls, bellhop assistance &amp; 2-way chat
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsRequestFormOpen(!isRequestFormOpen)}
              className="px-3 py-1.5 rounded-xl bg-indigo-500 text-white font-bold text-xs hover:bg-indigo-400 shadow-sm flex items-center gap-1.5 transition-all"
            >
              {isRequestFormOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              <span>{isRequestFormOpen ? 'Close Form' : 'New Desk Request'}</span>
            </button>
          </div>

          {/* Submission Form */}
          {isRequestFormOpen && (
            <form
              onSubmit={handleSubmitRequest}
              className="guest-card p-4 sm:p-5 space-y-4 border border-indigo-500/30 bg-indigo-500/5"
            >
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Submit Request to Front Desk
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Request Category *</label>
                  <select
                    value={requestCategory}
                    onChange={(e) => setRequestCategory(e.target.value)}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  >
                    <option value="Special Assistance">Special Assistance</option>
                    <option value="Additional Arrangements">Additional Arrangements</option>
                    <option value="Room-Related Assistance">Room-Related Assistance</option>
                    <option value="Accessibility Assistance">Accessibility Assistance</option>
                    <option value="Special Occasion Support">Special Occasion Support</option>
                    <option value="Wake-Up Assistance">Wake-Up Call Assistance</option>
                    <option value="Luggage / Bellhop Service">Luggage / Bellhop Service</option>
                    <option value="General Information">General Information</option>
                    <option value="Other Custom Request">Other Custom Request</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Preferred Date &amp; Time</label>
                  <input
                    type="text"
                    value={requestDateTime}
                    onChange={(e) => setRequestDateTime(e.target.value)}
                    placeholder="e.g. Tomorrow at 11:15 AM or Immediately"
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-mist-300 block mb-1">Short Title *</label>
                <input
                  type="text"
                  required
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  placeholder="e.g. Bellhop assistance for 3 suitcases"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-mist-300 block mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  value={requestDesc}
                  onChange={(e) => setRequestDesc(e.target.value)}
                  placeholder="Please describe your requirements freely..."
                  className="guest-field w-full px-3 py-2 text-xs text-white resize-none"
                />
              </div>

              <div>
                <label className="font-semibold text-mist-300 block mb-1">Additional Instructions</label>
                <input
                  type="text"
                  value={requestInstructions}
                  onChange={(e) => setRequestInstructions(e.target.value)}
                  placeholder="e.g. Please ring room phone upon arrival"
                  className="guest-field w-full px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Attachments */}
              <AttachmentUploader
                attachments={requestAttachments}
                onChange={setRequestAttachments}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsRequestFormOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-mist-300 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-bold text-xs hover:bg-indigo-400 shadow-md flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Request</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Messages / Requests */}
          <div className="space-y-2.5">
            {myMessages.length === 0 ? (
              <div className="guest-card p-6 text-center text-xs text-mist-400">
                No active Front Desk requests logged for Room {room}.
              </div>
            ) : (
              myMessages.map((msg) => {
                const curReply = replyInputs[msg.id] ?? '';

                return (
                  <div
                    key={msg.id}
                    className="guest-card p-3.5 space-y-2.5 border border-indigo-500/20 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-xs">{msg.subject}</h4>
                        <p className="text-[10px] text-mist-400">{msg.createdAt}</p>
                      </div>
                      <GuestPill tone={msg.status === 'Closed' ? 'neutral' : 'info'}>
                        {msg.status}
                      </GuestPill>
                    </div>

                    <p className="text-mist-200 bg-white/5 p-2 rounded-lg">{msg.message}</p>

                    {/* Staff replies thread */}
                    {msg.replies && msg.replies.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {msg.replies.map((rep) => (
                          <div
                            key={rep.id}
                            className={cn(
                              'p-2 rounded-lg text-[11px]',
                              rep.sender === 'front_desk'
                                ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-200'
                                : 'bg-white/5 text-mist-200'
                            )}
                          >
                            <p className="text-[9px] font-bold opacity-75">
                              {rep.senderName} · {rep.at}
                            </p>
                            <p>{rep.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Reply Form */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <input
                        type="text"
                        value={curReply}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({ ...prev, [msg.id]: e.target.value }))
                        }
                        placeholder="Reply to Front Desk..."
                        className="guest-field flex-1 px-3 py-1.5 text-xs text-white"
                      />
                      <button
                        type="button"
                        disabled={!curReply.trim()}
                        onClick={() => handleSendReply(msg.id)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-500 text-white font-bold text-xs hover:bg-indigo-400 disabled:opacity-40 flex items-center gap-1"
                      >
                        <span>Send</span>
                        <Send className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* 4. CATEGORY: INCIDENTS VIEW                                  */}
      {/* ------------------------------------------------------------ */}
      {activeCategory === 'incidents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <span>Incident &amp; Safety Reporting</span>
              </h3>
              <p className="text-[11px] text-mist-400">
                Property damage, lost personal belongings, disturbances, security or accidents
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsIncidentFormOpen(!isIncidentFormOpen)}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-ink-950 font-bold text-xs hover:bg-amber-300 shadow-sm flex items-center gap-1.5 transition-all"
            >
              {isIncidentFormOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              <span>{isIncidentFormOpen ? 'Close Form' : 'Report Incident'}</span>
            </button>
          </div>

          {/* Submission Form */}
          {isIncidentFormOpen && (
            <form
              onSubmit={handleSubmitIncident}
              className="guest-card p-4 sm:p-5 space-y-4 border border-amber-500/30 bg-amber-500/5"
            >
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                New Incident Report
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Incident Category *</label>
                  <select
                    value={incidentCategory}
                    onChange={(e) => setIncidentCategory(e.target.value as GuestIncidentCategory)}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  >
                    <option value="Room/Property Damage">Room/Property Damage</option>
                    <option value="Lost Personal Belongings">Lost Personal Belongings</option>
                    <option value="Safety or Security Concern">Safety or Security Concern</option>
                    <option value="Disturbance or Nuisance">Disturbance or Nuisance</option>
                    <option value="Accident or Injury">Accident or Injury</option>
                    <option value="Facility-Related Incident">Facility-Related Incident</option>
                    <option value="Other">Other Incident</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Location within Hotel *</label>
                  <select
                    value={incidentLocation}
                    onChange={(e) => setIncidentLocation(e.target.value)}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  >
                    <option value={`In-Room ${room}`}>In-Room {room}</option>
                    <option value="Corridor / Floor 4">Corridor / Floor 4</option>
                    <option value="Hotel Main Lobby">Hotel Main Lobby</option>
                    <option value="Swimming Pool / Sun Deck">Swimming Pool / Sun Deck</option>
                    <option value="Restaurant / Bar">Restaurant / Bar</option>
                    <option value="Spa / Fitness Gym">Spa / Fitness Gym</option>
                    <option value="Parking Garage / Entrance">Parking Garage / Entrance</option>
                    <option value="Elevator / Stairwell">Elevator / Stairwell</option>
                    <option value="Other Facility">Other Facility</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Incident Title *</label>
                  <input
                    type="text"
                    required
                    value={incidentTitle}
                    onChange={(e) => setIncidentTitle(e.target.value)}
                    placeholder="e.g. Water leak on balcony sliding runner"
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Date &amp; Approximate Time</label>
                  <input
                    type="text"
                    value={incidentDateTime}
                    onChange={(e) => setIncidentDateTime(e.target.value)}
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-mist-300 block mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  placeholder="Provide full description of what happened, any visible damage, or immediate risks..."
                  className="guest-field w-full px-3 py-2 text-xs text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-mist-300 block mb-1">People Involved (Optional)</label>
                  <input
                    type="text"
                    value={incidentPeople}
                    onChange={(e) => setIncidentPeople(e.target.value)}
                    placeholder="Names of guests or staff involved"
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-mist-300 block mb-1">Additional Information</label>
                  <input
                    type="text"
                    value={incidentAdditional}
                    onChange={(e) => setIncidentAdditional(e.target.value)}
                    placeholder="Any further notes for security"
                    className="guest-field w-full px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Immediate Assistance Toggle */}
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white block">Immediate Assistance Required?</span>
                  <span className="text-[11px] text-mist-400">
                    Check YES if urgent security or emergency team response is needed immediately
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incidentImmediate}
                    onChange={(e) => setIncidentImmediate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
                </label>
              </div>

              {/* Attachments */}
              <AttachmentUploader
                attachments={incidentAttachments}
                onChange={setIncidentAttachments}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsIncidentFormOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-mist-300 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={cn(
                    'px-4 py-2 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-all',
                    incidentImmediate
                      ? 'bg-rose-500 hover:bg-rose-400 text-white'
                      : 'bg-amber-400 hover:bg-amber-300 text-ink-950'
                  )}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>{incidentImmediate ? '🚨 Submit URGENT Incident' : 'Submit Incident Report'}</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Incidents for Room 402 */}
          <div className="space-y-2.5">
            {myIncidents.length === 0 ? (
              <div className="guest-card p-6 text-center text-xs text-mist-400">
                No incident reports filed for Room {room}.
              </div>
            ) : (
              myIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="guest-card p-3.5 space-y-2.5 border border-amber-500/20 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-amber-300">{inc.ref}</span>
                        {inc.immediateAssistanceRequired && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500 text-white uppercase">
                            Urgent
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-xs mt-0.5">{inc.title}</h4>
                      <p className="text-[10px] text-mist-400">
                        {inc.category} · {inc.submittedAt} · Location: {inc.location}
                      </p>
                    </div>
                    <GuestPill tone={inc.immediateAssistanceRequired ? 'danger' : 'warning'}>
                      {inc.status}
                    </GuestPill>
                  </div>

                  <p className="text-mist-200 bg-white/5 p-2 rounded-lg">{inc.description}</p>

                  {inc.staffResponse && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                      <strong>Security &amp; Front Desk Action:</strong> {inc.staffResponse}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
