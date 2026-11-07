'use client';

import { Copy, KeyRound, Mail, RefreshCw, Send } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/frontdesk/Modal';
import { QrCode } from '@/components/shared/QrCode';
import { newPin, passCredentials, passStatus, validUntil } from '@/lib/guestPass';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { StayRecord } from '@/types/demo';

const timeLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function LivePassDialog({ stay, onClose }: { stay: StayRecord; onClose: () => void }) {
  const { fdAction, notify } = useDemo();
  const creds = passCredentials(stay);
  const status = passStatus(stay);
  const url = `${typeof window === 'undefined' ? '' : window.location.origin}/guest/portal?room=${encodeURIComponent(stay.room)}&token=${encodeURIComponent(creds.pin)}`;

  function copyPin() {
    const done = () => notify(`PIN ${creds.pin} copied`);
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(creds.pin).then(done, done);
    else done();
  }

  function regeneratePin() {
    const pin = newPin(creds.pin);
    fdAction((s) => ({
      next: {
        ...s,
        frontDesk: {
          ...s.frontDesk,
          stays: (s.frontDesk?.stays ?? []).map((st) => (st.id === stay.id ? { ...st, accessPin: pin } : st)),
        },
        feed: [{ id: `pin-${Date.now()}`, at: timeLabel(), role: 'Front Desk', text: `New access PIN issued for Room ${stay.room}` }, ...s.feed].slice(0, 30),
      },
      message: `New access PIN generated for Room ${stay.room}`,
    }));
  }

  function sendPass() {
    fdAction((s) => ({
      next: {
        ...s,
        feed: [{ id: `pass-${Date.now()}`, at: timeLabel(), role: 'Front Desk', text: `Live Pass sent to ${stay.guest} · Room ${stay.room}` }, ...s.feed].slice(0, 30),
      },
      message: `Login credentials sent to ${stay.guest} (${creds.email} / ${creds.phone})`,
    }));
  }

  return (
    <Modal
      title={`Live Pass · Room ${stay.room}`}
      description={`Room QR access pass & Guest Portal credentials for ${stay.guest}.`}
      onClose={onClose}
      footer={
        <Button variant="accent" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Pass Card: Supports both crisp light mode and deep luxury dark mode */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-300/60 bg-gradient-to-br from-[#ffffff] via-[#f0f6ff] to-[#e4eefb] p-5 text-slate-800 shadow-xl transition-colors dark:border-sky-500/30 dark:bg-gradient-to-br dark:from-[#0c192c] dark:via-[#09121f] dark:to-[#04080e] dark:text-white dark:shadow-2xl">
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-sky-400/15 blur-2xl dark:bg-sky-500/10" />

          {/* Card Header Row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-sky-700 dark:text-sky-400">
              The Grand ADP · Guest Live Pass
            </span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>

          {/* Guest and Room Details */}
          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-mist-400">Guest</p>
              <h3 className="flex flex-wrap items-center gap-1.5 text-lg font-bold text-slate-900 dark:text-white">
                <span className="truncate">{stay.guest}</span>
                {stay.vip && <Badge tone="accent">VIP</Badge>}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500 dark:text-mist-400">Room</p>
              <p className="font-mono text-2xl font-black text-slate-900 dark:text-white">{stay.room}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-mist-300">
            Valid until <span className="font-bold text-slate-900 dark:text-white">{validUntil(stay)}</span>
          </p>

          {/* Guest Portal Credentials Box */}
          <div className="mt-4 space-y-2.5 rounded-xl border border-sky-200/80 bg-white/95 p-3.5 text-xs shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
              <KeyRound className="h-3 w-3" aria-hidden /> Guest Portal credentials
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-mist-400">
                  <Mail className="h-3 w-3" aria-hidden /> Registered email / phone
                </p>
                <p className="mt-0.5 truncate font-semibold text-slate-900 dark:text-white">{creds.email}</p>
                <p className="truncate font-semibold text-slate-900 dark:text-white">{creds.phone}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-500 dark:text-mist-400">Access passcode (PIN)</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="font-mono text-xl font-black tracking-[0.3em] text-slate-900 dark:text-white">
                    {creds.pin}
                  </span>
                  <button
                    type="button"
                    onClick={copyPin}
                    aria-label="Copy PIN"
                    title="Copy PIN"
                    className="grid h-7 w-7 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-xs transition hover:border-sky-500 hover:bg-sky-50 hover:text-slate-900 dark:border-white/15 dark:bg-transparent dark:text-mist-300 dark:hover:border-sky-400/50 dark:hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              iconLeft={RefreshCw}
              onClick={regeneratePin}
              className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-transparent dark:bg-transparent dark:text-mist-200 dark:hover:bg-white/10 dark:hover:text-white"
            >
              Regenerate PIN
            </Button>
          </div>

          {/* QR Code Section */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className={cn('rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm dark:border-white/15 dark:bg-white', !status.active && 'opacity-40')}>
              <QrCode value={url} size={168} label={`QR code for Room ${stay.room}, stay ${stay.id}`} />
            </div>
            <p className="text-center text-[11px] font-medium text-slate-500 dark:text-mist-400">
              Room {stay.room} · Stay {stay.id}
              {!status.active && ' · expired'}
            </p>
          </div>
        </div>

        {/* Action Button: Send Pass (Email / SMS) */}
        <div>
          <Button
            variant="ghost"
            iconLeft={Send}
            disabled={!status.active}
            title={status.active ? undefined : 'Pass has expired'}
            onClick={sendPass}
            className="w-full justify-center"
          >
            Send Pass (Email / SMS)
          </Button>
        </div>
      </div>
    </Modal>
  );
}
