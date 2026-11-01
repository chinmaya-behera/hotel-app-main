'use client';

import { useState } from 'react';
import { AlertTriangle, Camera, CheckCircle2, ShieldAlert, Wrench, X } from 'lucide-react';
import { maintenanceCategories } from '@/lib/mockData';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import { GuestSectionHeader } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';

const PRIORITIES: { id: 'normal' | 'urgent' | 'safety'; label: string; hint: string }[] = [
  { id: 'normal', label: 'Minor', hint: "Not urgent — fix whenever convenient" },
  { id: 'urgent', label: 'Urgent', hint: 'Affecting your stay, please prioritise' },
  { id: 'safety', label: 'Safety', hint: 'Safety or security concern — alerts Duty Manager' },
];

export function MaintenanceTab({ room }: GuestTabProps) {
  const { submitGuestRequest } = useDemo();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'safety'>('normal');
  const [photo, setPhoto] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const category = maintenanceCategories.find((c) => c.id === categoryId);
  const canSubmit = Boolean(category) && description.trim().length >= 5;

  function submit() {
    if (!category) return;
    const ref = submitGuestRequest({
      room,
      title: `${category.name} issue`,
      meta: 'Maintenance · Reported via Guest Portal',
      category: 'maintenance',
      description,
      priority,
      photoAttached: photo,
      tone: priority === 'safety' ? 'danger' : priority === 'urgent' ? 'warning' : 'info',
    });
    setConfirmed(ref);
    setCategoryId(null);
    setDescription('');
    setPriority('normal');
    setPhoto(false);
    window.setTimeout(() => setConfirmed(null), 5000);
  }

  return (
    <div className="space-y-6 pb-4">
      {confirmed && (
        <div className="guest-card flex items-start gap-2 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
          <p>
            Ticket logged · Reference <span className="font-semibold">{confirmed}</span>. Engineering has been notified.
          </p>
        </div>
      )}

      <div>
        <GuestSectionHeader title="What needs attention?" />
        <div className="grid grid-cols-2 gap-2.5">
          {maintenanceCategories.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={categoryId === c.id}
                onClick={() => setCategoryId(c.id)}
                className="guest-chip-btn flex flex-col items-start gap-2 rounded-xl p-3 text-left"
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="text-xs font-semibold">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <GuestSectionHeader title="Describe the issue" />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="e.g. The AC is blowing warm air and the remote isn't responding"
          className="guest-field w-full px-3 py-2.5 text-sm"
        />
        <p className="guest-muted mt-1 text-[11px]">{description.trim().length}/5 characters minimum</p>
      </div>

      <div>
        <GuestSectionHeader title="Priority" />
        <div className="space-y-2">
          {PRIORITIES.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={priority === p.id}
              onClick={() => setPriority(p.id)}
              className={cn(
                'guest-card flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left',
                priority === p.id && 'ring-2',
              )}
              style={priority === p.id ? { borderColor: 'rgb(var(--a))' } : undefined}
            >
              <span>
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  {p.id === 'safety' && <ShieldAlert className="h-3.5 w-3.5 text-rose-500" aria-hidden />}
                  {p.id === 'urgent' && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-hidden />}
                  {p.label}
                </span>
                <span className="guest-muted mt-0.5 block text-xs">{p.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <GuestSectionHeader title="Attach a photo" hint="Simulated — no real camera access in this prototype" />
        {photo ? (
          <div className="guest-card flex items-center justify-between gap-3 px-3.5 py-3">
            <span className="flex items-center gap-2.5 text-sm font-medium">
              <span className="guest-surface-2 grid h-10 w-10 place-items-center rounded-lg">
                <Camera className="guest-muted h-4 w-4" aria-hidden />
              </span>
              Photo attached (simulated)
            </span>
            <button type="button" onClick={() => setPhoto(false)} aria-label="Remove photo" className="guest-chip-btn grid h-8 w-8 place-items-center rounded-full">
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPhoto(true)}
            className="guest-border flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-4 text-xs font-semibold"
          >
            <Camera className="h-4 w-4" aria-hidden />
            Attach photo (simulated)
          </button>
        )}
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={submit}
        className="btn-accent flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Wrench className="h-4 w-4" aria-hidden />
        Submit maintenance ticket
      </button>
    </div>
  );
}
