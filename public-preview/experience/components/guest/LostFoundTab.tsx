'use client';

import { useState } from 'react';
import { CheckCircle2, ImageOff, PackageSearch, ShieldAlert } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { GuestEmptyState, GuestSectionHeader, GuestSheet } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';

export function LostFoundTab({ room }: GuestTabProps) {
  const { state, claimLostItem, submitGuestRequest } = useDemo();
  const [reportOpen, setReportOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const items = state.lostFound;
  const visible = items.filter((i) => !i.sensitive);
  const restrictedCount = items.filter((i) => i.sensitive).length;

  function submitReport() {
    const ref = submitGuestRequest({
      room,
      title: 'Lost item report',
      meta: 'Lost & Found · Reported via Guest Portal',
      category: 'lost_found',
      description,
    });
    setConfirmed(ref);
    setReportOpen(false);
    setDescription('');
    window.setTimeout(() => setConfirmed(null), 6000);
  }

  return (
    <div className="space-y-6 pb-4">
      {confirmed && (
        <div className="guest-card flex items-start gap-2 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
          <p>
            Report sent · Reference <span className="font-semibold">{confirmed}</span>. Front Desk will follow up.
          </p>
        </div>
      )}

      <GuestSectionHeader title="Lost & found" hint="Items recently turned in to Front Desk" />

      {visible.length === 0 ? (
        <GuestEmptyState icon={PackageSearch} title="Nothing matching right now" />
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {visible.map((item) => (
            <li key={item.id} className="guest-card overflow-hidden">
              <div className="guest-surface-2 flex h-24 items-center justify-center overflow-hidden">
                {item.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photo} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <PackageSearch className="guest-muted h-7 w-7" aria-hidden />
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold leading-snug">{item.name}</p>
                <p className="guest-muted mt-0.5 text-[10px]">
                  {item.foundLocation} · {item.foundDate}
                </p>
                <button
                  type="button"
                  disabled={item.claimed}
                  onClick={() => claimLostItem(room, item.id)}
                  className="guest-chip-btn mt-2 w-full rounded-lg py-1.5 text-[11px] font-semibold disabled:opacity-50"
                >
                  {item.claimed ? 'Claim submitted' : 'This is mine'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {restrictedCount > 0 && (
        <div className="guest-card flex items-start gap-2.5 px-4 py-3.5">
          <span className="guest-surface-2 mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg">
            <ShieldAlert className="h-4 w-4 text-amber-500" aria-hidden />
          </span>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <ImageOff className="h-3.5 w-3.5" aria-hidden />
              {restrictedCount} restricted item{restrictedCount > 1 ? 's' : ''}
            </p>
            <p className="guest-muted mt-0.5 text-xs">
              Valuables, documents and jewelry aren't shown here for security. If you've lost something sensitive, please contact Front Desk directly and
              they'll verify ownership in person.
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setReportOpen(true)}
        className="guest-chip-btn w-full rounded-xl py-3 text-sm font-semibold"
      >
        Don't see your item? Report it to Front Desk
      </button>

      {reportOpen && (
        <GuestSheet
          title="Report a lost item"
          onClose={() => setReportOpen(false)}
          footer={
            <button
              type="button"
              disabled={description.trim().length < 5}
              onClick={submitReport}
              className="btn-accent w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
            >
              Send to Front Desk
            </button>
          }
        >
          <label htmlFor="lf-desc" className="guest-muted mb-1 block text-xs font-medium">
            Describe the item and where you may have left it
          </label>
          <textarea
            id="lf-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g. black leather wallet, left at the pool bar yesterday evening"
            className="guest-field w-full px-3 py-2.5 text-sm"
          />
        </GuestSheet>
      )}
    </div>
  );
}
