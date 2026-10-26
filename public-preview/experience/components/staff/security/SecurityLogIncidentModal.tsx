'use client';

import { useState } from 'react';
import { X, ShieldPlus, AlertCircle, MapPin } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-ink-900 border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <ShieldPlus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Log Field Security Incident</h3>
              <p className="text-[11px] text-mist-400">Patrol observation · Lucas Martin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-mist-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-mist-300 font-medium mb-1">
              Incident Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Propped fire door observed"
              className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-mist-300 font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
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
              <label className="block text-mist-300 font-medium mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                <option value="critical">Critical (Immediate)</option>
                <option value="major">Major (High Priority)</option>
                <option value="moderate">Moderate (Standard)</option>
                <option value="minor">Minor (Observation)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-mist-300 font-medium mb-1">Location Area</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Service Corridor B"
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-mist-300 font-medium mb-1">Floor Level</label>
              <input
                type="number"
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                min={-2}
                max={15}
                className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-mist-300 font-medium mb-1">Room (Optional)</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. 509"
              className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-mist-300 font-medium mb-1">
              Field Observations & Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detailed description of what you observed on patrol..."
              className="w-full rounded-xl bg-ink-950 border border-white/10 px-3 py-2 text-white placeholder-mist-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-ink-950 text-xs font-bold transition-colors shadow-lg shadow-sky-500/20"
            >
              Log Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
