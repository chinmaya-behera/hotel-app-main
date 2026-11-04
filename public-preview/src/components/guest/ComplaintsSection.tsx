'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock,
  HeartHandshake,
  History,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  Plus,
  ShieldAlert,
  Sparkles,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn, money, statusTone } from '@/lib/utils';
import { GuestEmptyState, GuestPill, GuestSectionHeader, StatusTimeline } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import type { ComplaintStatus, GuestComplaintRecord } from '@/types/demo';

const COMPLAINT_CATEGORIES = [
  'Room Issues',
  'Housekeeping',
  'Food and Dining',
  'Staff Behaviour',
  'Maintenance',
  'Billing',
  'Other',
] as const;

export function ComplaintsSection({ room, guestName }: GuestTabProps) {
  const { state, submitGuestComplaint } = useDemo();
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  // Form inputs
  const [category, setCategory] = useState<(typeof COMPLAINT_CATEGORIES)[number]>('Room Issues');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Complaints for this room
  const complaints = (state.guestComplaints ?? []).filter((c) => c.room === room);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const complaintId = submitGuestComplaint({
      room,
      guestName,
      title: title.trim(),
      category,
      description: description.trim(),
      photoUrl: photoPreview || undefined,
    });

    setTitle('');
    setDescription('');
    setPhotoPreview(null);
    setIsSubmitOpen(false);
    setSelectedComplaintId(complaintId);
    setSuccessToast(`Complaint registered under reference ${complaintId}`);
    setTimeout(() => setSuccessToast(null), 6000);
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 max-w-7xl mx-auto w-full">
      {/* Success Notification */}
      {successToast && (
        <div className="guest-card flex items-start gap-2.5 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-white">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
          <div>
            <p className="font-semibold text-emerald-300">Complaint Registered</p>
            <p className="text-xs text-mist-200 mt-0.5">{successToast}. Dispatched to Duty Operations &amp; Front Desk.</p>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="guest-card p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/15 text-amber-300">
              <HeartHandshake className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">Guest Service Recovery &amp; Complaints</h2>
              <p className="text-[11px] text-mist-400">Directly escalated to Duty Manager Marcus Vance and department heads</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setTitle('');
              setDescription('');
              setPhotoPreview(null);
              setIsSubmitOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>File Complaint</span>
          </button>
        </div>
      </div>

      {/* Complaints Tracking List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <GuestSectionHeader title="Your Registered Cases" hint="Track investigation status, assigned engineering/management, and resolution credits" />
          <span className="text-[11px] text-mist-400">{complaints.length} tickets</span>
        </div>

        {complaints.length === 0 ? (
          <GuestEmptyState icon={HeartHandshake} title="No complaints logged" hint="Everything seems in order. If you encounter any inconvenience, submit a complaint above for rapid service recovery." />
        ) : (
          <ul className="space-y-3">
            {complaints.map((c) => {
              const isOpen = selectedComplaintId === c.complaintId;
              const isResolved = c.status === 'Resolved';
              const isRejected = c.status === 'Rejected';

              return (
                <li key={c.id} className="guest-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-300">{c.complaintId}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-mist-300 font-semibold">
                          {c.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1 truncate">{c.title}</h3>
                      <p className="text-mist-400 text-[11px] mt-0.5">Submitted {c.submittedAt} · Room {c.room}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <GuestPill
                        tone={
                          isResolved
                            ? 'success'
                            : isRejected
                              ? 'danger'
                              : c.status === 'In Progress'
                                ? 'info'
                                : 'warning'
                        }
                      >
                        {c.status}
                      </GuestPill>
                      <button
                        type="button"
                        onClick={() => setSelectedComplaintId(isOpen ? null : c.complaintId)}
                        className="p-1 rounded-lg hover:bg-white/5 text-mist-400"
                        aria-label="Toggle details"
                      >
                        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-mist-200 line-clamp-2">{c.description}</p>

                  {/* Photo Evidence if attached */}
                  {c.photoUrl && (
                    <div className="pt-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.photoUrl}
                        alt="Complaint evidence"
                        className="max-h-36 w-full object-cover rounded-xl border border-white/10"
                      />
                    </div>
                  )}

                  {/* Staff Response / Resolution Remarks */}
                  {c.responseRemarks && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Management Resolution Remarks
                      </span>
                      <p className="text-white text-xs">{c.responseRemarks}</p>
                      {c.compensationOffered && c.compensationOffered > 0 && (
                        <p className="text-amber-300 font-bold text-xs pt-1">
                          Goodwill Folio Credit Applied: {money(c.compensationOffered)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Expandable Timeline & Staff Notes */}
                  {isOpen && (
                    <div className="pt-3 border-t border-white/[0.08] space-y-3 text-xs animate-in fade-in">
                      {c.assignedTo && (
                        <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-white/[0.02]">
                          <span className="text-mist-400">Assigned Team:</span>
                          <span className="font-semibold text-white">{c.assignedTo}</span>
                        </div>
                      )}

                      {c.history && c.history.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-mist-400 block mb-1">
                            Investigation Timeline
                          </span>
                          <StatusTimeline history={c.history} />
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Complaint Submission Modal */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-ink-900 p-5 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-500/20 text-rose-400">
                  <ShieldAlert className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold">Register a Complaint</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitOpen(false)}
                className="p-1 rounded-lg text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-mist-300 font-semibold mb-1">Complaint Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white focus:border-amber-400 focus:outline-none"
                >
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-mist-300 font-semibold mb-1">Title / Issue Summary *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Excessive noise from adjacent corridor, Minibar overcharge"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-mist-300 font-semibold mb-1">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe what happened, the time, and any staff involved..."
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Photo Upload Attachment */}
              <div>
                <label className="block text-mist-300 font-semibold mb-1">Attach Photo / Evidence (Optional)</label>
                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Evidence preview" className="max-h-32 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-ink-950/80 text-white hover:bg-rose-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border border-dashed border-white/15 rounded-xl cursor-pointer hover:border-amber-400/50 bg-white/[0.02]">
                    <Camera className="h-5 w-5 text-mist-400 mb-1" />
                    <span className="text-[11px] text-mist-300 font-medium">Upload photo evidence</span>
                    <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  </label>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-mist-400">
                Connected to Verified Stay: Room {room} · {guestName}. A unique Complaint ID will be generated.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(false)}
                  className="px-3 py-2 rounded-xl border border-white/10 text-mist-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !description.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 disabled:opacity-40 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Submit Complaint</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

