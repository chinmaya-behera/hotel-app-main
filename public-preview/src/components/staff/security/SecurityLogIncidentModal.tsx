'use client';

import { useState } from 'react';
import { X, ShieldPlus, AlertCircle } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/45 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[var(--warm-paper)] border border-[var(--dm-line)] rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto text-[var(--dm-ink)]">
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
