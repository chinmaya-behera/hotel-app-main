'use client';

import { useState, useRef } from 'react';
import { X, ShieldPlus, AlertCircle, Camera, Check, Trash2, UploadCloud } from 'lucide-react';

interface SecurityLogIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incident: {
    title: string;
    category: string;
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    location: string;
    floor?: number;
    room?: string;
    description: string;
    incidentPhotoUrl?: string;
    photoUrl?: string;
  }) => void;
}

export function SecurityLogIncidentModal({ isOpen, onClose, onSubmit }: SecurityLogIncidentModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Suspicious Activity');
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'major' | 'critical'>('moderate');
  const [location, setLocation] = useState('Service Corridor B');
  const [floor, setFloor] = useState<number>(1);
  const [room, setRoom] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (dialogCardRef.current) {
      dialogCardRef.current.scrollTop += e.deltaY;
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Incident title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    onSubmit({
      title: title.trim(),
      category,
      severity,
      location: location.trim(),
      floor: Number(floor) || 1,
      room: room.trim() || undefined,
      description: description.trim(),
      incidentPhotoUrl: photoUrl || undefined,
      photoUrl: photoUrl || undefined,
    });
    onClose();
  };

  return (
    <div
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/45 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={dialogCardRef}
        data-lenis-prevent
        onWheel={handleWheel}
        onClick={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain' }}
        className="dm-dialog-card w-full max-w-lg bg-white border border-[var(--dm-line)] rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto text-[var(--dm-ink)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--dm-line)]">
          <div className="flex items-center gap-3">
            <span className="dm-attention-icon">
              <ShieldPlus size={18} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-[var(--dm-ink)]">Log Field Security Incident</h3>
              <p className="text-xs text-[var(--dm-muted)]">Patrol observation · Inspector Roy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="dm-icon-button"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-[var(--dm-ink)] font-medium mb-1.5">
              Incident Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Propped fire door observed in corridor"
              className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3.5 py-2.5 text-xs text-[var(--dm-ink)] placeholder-[var(--dm-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[var(--dm-ink)] font-medium mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3 py-2.5 text-xs text-[var(--dm-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
              >
                <option value="Suspicious Activity">Suspicious Activity</option>
                <option value="Access Violation">Access Violation</option>
                <option value="Guest Disturbance">Guest Disturbance</option>
                <option value="Property Damage">Property Damage</option>
                <option value="Fire / Smoke Hazard">Fire / Smoke Hazard</option>
                <option value="Medical Assistance">Medical Assistance</option>
              </select>
            </div>
            <div>
              <label className="block text-[var(--dm-ink)] font-medium mb-1.5">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3 py-2.5 text-xs text-[var(--dm-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
              >
                <option value="critical">Critical (Immediate response)</option>
                <option value="major">Major (High priority)</option>
                <option value="moderate">Moderate (Standard)</option>
                <option value="minor">Minor (Field observation)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[var(--dm-ink)] font-medium mb-1.5">Location Area</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Service Corridor B"
                className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3 py-2.5 text-xs text-[var(--dm-ink)] placeholder-[var(--dm-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
              />
            </div>
            <div>
              <label className="block text-[var(--dm-ink)] font-medium mb-1.5">Floor Level</label>
              <input
                type="number"
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                min={-2}
                max={15}
                className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3 py-2.5 text-xs text-[var(--dm-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[var(--dm-ink)] font-medium mb-1.5">Room / Zone (Optional)</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Suite 509 or West Wing Deck"
              className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3.5 py-2.5 text-xs text-[var(--dm-ink)] placeholder-[var(--dm-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
            />
          </div>

          <div>
            <label className="block text-[var(--dm-ink)] font-medium mb-1.5">
              Field Observations &amp; Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detailed description of physical observations, persons involved, and immediate hazard status..."
              className="w-full rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] px-3.5 py-2.5 text-xs text-[var(--dm-ink)] placeholder-[var(--dm-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dm-accent)]"
            />
          </div>

          {/* Incident Scene Photo / Visual Evidence */}
          <div>
            <label className="block text-[var(--dm-ink)] font-medium mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera size={14} className="text-rose-600" />
                <span>Incident Scene Photo / Visual Evidence</span>
              </span>
              <span className="text-[10px] text-[var(--dm-muted)] font-normal">Optional</span>
            </label>

            {photoUrl ? (
              <div className="relative rounded-xl border border-[var(--dm-line)] bg-[var(--dm-surface)] p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-[var(--dm-line)] shrink-0 bg-stone-900 shadow-sm">
                    <img
                      src={photoUrl}
                      alt="Incident scene preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--dm-ink)] flex items-center gap-1.5">
                      <Check size={13} className="text-emerald-600" />
                      <span>Photo Attached</span>
                    </p>
                    <p className="text-[11px] text-[var(--dm-muted)] truncate mt-0.5">
                      {photoName || 'Incident scene photo ready to file'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium cursor-pointer"
                    title="Change photo"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl(null);
                      setPhotoName('');
                    }}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                    title="Remove photo"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-xl border-2 border-dashed border-[var(--dm-line)] hover:border-[var(--dm-ink)] transition-colors flex items-center justify-between cursor-pointer bg-[var(--dm-surface)] group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Camera size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--dm-ink)]">
                      Upload or capture scene photo
                    </p>
                    <p className="text-[10px] text-[var(--dm-muted)]">
                      JPG, PNG, or camera snapshot of the incident area
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[var(--dm-ink)] group-hover:underline shrink-0">
                  Select Photo &rarr;
                </span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          <div className="pt-3 border-t border-[var(--dm-line)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="dm-secondary px-5 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="dm-primary px-5 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
            >
              Log incident
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
