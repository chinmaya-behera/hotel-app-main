'use client';

import { useMemo, useState } from 'react';
import { Camera, CheckCircle2, HelpCircle, Image as ImageIcon, Inbox, Landmark, Paperclip, Plus, Send, ShieldAlert, TriangleAlert, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { FieldLabel, Modal } from '@/components/frontdesk/Modal';
import {
  CLAIM_FILTERS,
  COMPENSATION_METHODS,
  FD_CLAIM_LIMIT,
  allClaimViews,
  claimFilterOf,
  decideClaim,
  type ClaimDecision,
  type ClaimFilter,
  type ClaimView,
  type CompensationMethod,
} from '@/lib/financialClaims';
import type { CompensationRefundAttachment, CompensationRefundCategory } from '@/types/demo';
import { useDemo } from '@/lib/store';
import { cn, money } from '@/lib/utils';

const EMPTY_TEXT: Record<ClaimFilter, string> = {
  new: 'No new claims. New guest requests from the Guest Portal appear here.',
  general_manager: 'Nothing is waiting for the General Manager.',
  finance: 'Nothing is waiting for the Financial Officer.',
  closed: 'No closed claims yet.',
};

/**
 * Front Desk "Dispute Financial": one list of guest refund / compensation claims.
 * Guest Portal form -> here -> decision -> (General Manager if above the limit) -> Financial Officer.
 */
export function DisputesPanel() {
  const { state } = useDemo();
  const [filter, setFilter] = useState<ClaimFilter>('new');
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const claims = useMemo(() => allClaimViews(state), [state]);
  const counts = useMemo(() => {
    const base: Record<ClaimFilter, number> = { new: 0, general_manager: 0, finance: 0, closed: 0 };
    claims.forEach((c) => {
      base[claimFilterOf(c.stage)] += 1;
    });
    return base;
  }, [claims]);

  const visible = claims.filter((c) => claimFilterOf(c.stage) === filter);
  const open = claims.find((c) => c.id === openId) ?? null;

  return (
    <Panel
      title="Financial claims"
      hint={`Guest refund and compensation requests. You can decide up to ${money(FD_CLAIM_LIMIT)}. Above that goes to the General Manager.`}
      icon={Landmark}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Claim status" className="flex flex-wrap gap-2">
          {CLAIM_FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  active ? 'accent-soft border-[rgb(var(--a)/0.5)]' : 'border-white/10 bg-white/[0.04] text-mist-300 hover:text-white',
                )}
              >
                <span>{f.label}</span>
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] tabular-nums">{counts[f.id]}</span>
              </button>
            );
          })}
        </div>

        <Button
          size="sm"
          variant="accent"
          iconLeft={Plus}
          onClick={() => setShowAddModal(true)}
          className="text-xs h-7 py-0 shrink-0"
        >
          + Log In-Person Issue
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-white/10 py-12 text-center">
          <Inbox className="h-6 w-6 text-mist-500" aria-hidden />
          <p className="max-w-sm text-sm text-mist-300">{EMPTY_TEXT[filter]}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((c) => {
            const actionable = c.stage === 'front_desk';
            return (
              <li key={c.id} className="work-row">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">{c.guestName}</span>
                      <Badge tone="neutral">Room {c.room}</Badge>
                      <Badge tone="info">{c.category}</Badge>
                    </div>
                    <p className="truncate text-xs text-mist-300">{c.reason}</p>
                    <p className="text-[11px] text-mist-400">
                      <span className="font-mono">{c.ref}</span> · {c.createdAt}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    <span className="text-sm font-bold tabular-nums text-white">
                      {c.approvedAmount !== undefined ? money(c.approvedAmount) : c.amountRequested !== undefined ? money(c.amountRequested) : 'Amount open'}
                    </span>
                    <Badge tone={c.tone}>{c.stageLabel}</Badge>
                    <Button size="sm" variant={actionable ? 'accent' : 'ghost'} onClick={() => setOpenId(c.id)}>
                      {actionable ? 'Review' : 'View'}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {open && <ClaimModal key={open.id} claim={open} onClose={() => setOpenId(null)} />}

      {showAddModal && (
        <LogDisputeModal
          onClose={() => setShowAddModal(false)}
          onCreated={(newRef) => {
            setShowAddModal(false);
            setFilter('new');
            const found = allClaimViews(state).find((c) => c.ref === newRef);
            if (found) setOpenId(found.id);
          }}
        />
      )}
    </Panel>
  );
}

/* --------------------------------------------------------------------- */
/* Detail + decision                                                     */
/* --------------------------------------------------------------------- */

const DECISIONS: Array<{ id: ClaimDecision; title: string; hint: string }> = [
  { id: 'compensation', title: 'Compensation', hint: 'Credit or voucher. The card is not touched.' },
  { id: 'refund', title: 'Refund', hint: 'Money back to the card, paid by Finance.' },
  { id: 'reject', title: 'Reject', hint: 'Close the claim and tell the guest why.' },
  { id: 'request_info', title: 'Ask for info', hint: 'Keep it open and ask the guest a question.' },
];

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-400">{label}</p>
      <p className="mt-0.5 text-sm text-white">{children}</p>
    </div>
  );
}

function ClaimModal({ claim, onClose }: { claim: ClaimView; onClose: () => void }) {
  const { fdAction } = useDemo();
  const editable = claim.stage === 'front_desk';

  const [decision, setDecision] = useState<ClaimDecision>(() =>
    `${claim.preferredResolution ?? ''} ${claim.category}`.toLowerCase().includes('refund') ? 'refund' : 'compensation',
  );
  const [amount, setAmount] = useState(claim.amountRequested !== undefined ? String(claim.amountRequested) : '');
  const [method, setMethod] = useState<CompensationMethod>('Folio Credit');
  const [message, setMessage] = useState('');
  const [tried, setTried] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  const imageAttachments = useMemo(() => {
    return (claim.attachments ?? []).filter((a) => {
      if (a.type?.startsWith('image/')) return true;
      if (a.url?.startsWith('data:image')) return true;
      if (a.url && /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(a.url)) return true;
      if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(a.name || '')) return true;
      return false;
    });
  }, [claim.attachments]);

  const docAttachments = useMemo(() => {
    return (claim.attachments ?? []).filter((a) => !imageAttachments.includes(a));
  }, [claim.attachments, imageAttachments]);

  const needsAmount = decision === 'compensation' || decision === 'refund';
  const amountNum = Number(amount);
  const amountOk = !needsAmount || (amount.trim() !== '' && Number.isFinite(amountNum) && amountNum > 0);
  const messageOk = message.trim().length >= 5;
  const overLimit = needsAmount && amountOk && amountNum > FD_CLAIM_LIMIT;
  const higherThanAsked = needsAmount && amountOk && claim.amountRequested !== undefined && amountNum > claim.amountRequested;

  const messageLabel =
    decision === 'reject' ? 'Reason shown to the guest *' : decision === 'request_info' ? 'Question for the guest *' : 'Message shown to the guest *';

  const primary =
    decision === 'reject'
      ? 'Reject claim'
      : decision === 'request_info'
        ? 'Ask the guest'
        : overLimit
          ? 'Send to General Manager'
          : decision === 'refund'
            ? 'Send refund to Finance'
            : 'Apply compensation';

  const consequence =
    decision === 'reject'
      ? 'The claim is closed and the guest sees your reason.'
      : decision === 'request_info'
        ? 'The guest is asked for more details. The claim stays open.'
        : overLimit
          ? `${money(amountNum)} is above your ${money(FD_CLAIM_LIMIT)} limit. It goes to the General Manager for approval, then to the Financial Officer.`
          : decision === 'refund'
            ? `A refund of ${money(amountNum)} goes to the Financial Officer. Front Desk cannot pay it out.`
            : `${method} of ${money(amountNum)} is applied now and the guest is told.`;

  function review() {
    setTried(true);
    setError(null);
    if (!amountOk || !messageOk) return;
    setConfirming(true);
  }

  function confirm() {
    const err = fdAction((s) =>
      decideClaim(s, {
        claimId: claim.id,
        decision,
        amount: needsAmount ? amountNum : undefined,
        method: decision === 'compensation' ? method : undefined,
        guestMessage: message,
      }),
    );
    if (err) {
      setError(err);
      setConfirming(false);
      return;
    }
    onClose();
  }

  const where =
    claim.stage === 'general_manager'
      ? 'Waiting for the General Manager. If approved, the claim moves to the Financial Officer.'
      : claim.stage === 'finance'
        ? 'With the Financial Officer. Front Desk cannot pay out or approve this.'
        : claim.status === 'Rejected'
          ? 'This claim was rejected.'
          : 'This claim is closed.';

  return (
    <>
      <Modal
        title={`Claim ${claim.ref}`}
        description={`${claim.guestName} · Room ${claim.room}`}
        onClose={onClose}
        footer={
          editable ? (
            <>
              <Button variant="subtle" onClick={onClose}>
                Cancel
              </Button>
              <Button variant={decision === 'reject' ? 'danger' : 'accent'} iconLeft={decision === 'reject' ? XCircle : Send} onClick={review}>
                {primary}
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          )
        }
      >
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-3">
          <Detail label="Category">{claim.category}</Detail>
          <Detail label="Amount requested">{claim.amountRequested !== undefined ? money(claim.amountRequested) : 'Not stated'}</Detail>
          <Detail label="Status">
            <Badge tone={claim.tone}>{claim.stageLabel}</Badge>
          </Detail>
          <Detail label="Related charge">{claim.relatedServiceOrTransaction ?? 'General stay'}</Detail>
          <Detail label="Charge date">{claim.incidentDate ?? 'Today'}</Detail>
          <Detail label="Guest prefers">{claim.preferredResolution ?? 'Not stated'}</Detail>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-400">Guest statement</p>
          <p className="mt-1 text-sm leading-relaxed text-white">{claim.explanation}</p>
          {claim.additionalInstructions && <p className="mt-2 text-xs text-mist-300">Extra info: {claim.additionalInstructions}</p>}
          {claim.additionalInfoProvided && (
            <p className="mt-2 rounded-lg bg-sky-400/10 p-2 text-xs text-sky-300">Guest reply: {claim.additionalInfoProvided}</p>
          )}
          {/* Guest Photo Evidence: only shown if guest provided image(s) */}
          {imageAttachments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-400 flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-cyan-400" />
                <span>Guest Photo Evidence ({imageAttachments.length})</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {imageAttachments.map((img, i) => (
                  <button
                    key={`${img.name}-${i}`}
                    type="button"
                    onClick={() => setPreviewImage({ url: img.url || '', name: img.name })}
                    className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/40 text-left transition hover:border-cyan-400/50 hover:shadow-lg focus:outline-hidden"
                  >
                    {img.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img.url}
                        alt={img.name}
                        className="h-28 w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-28 w-full flex flex-col items-center justify-center bg-white/5 text-mist-400 gap-1">
                        <ImageIcon className="h-6 w-6 text-mist-400" />
                        <span className="text-[10px]">Photo Evidence</span>
                      </div>
                    )}
                    <div className="p-1.5 bg-ink-950/90 border-t border-white/10 flex items-center justify-between text-[10px]">
                      <span className="truncate text-mist-200 font-medium">{img.name}</span>
                      {img.size && <span className="text-mist-400 shrink-0 ml-1">{img.size}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Non-image document attachments */}
          {docAttachments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-400">Attached Documents</p>
              <div className="flex flex-wrap gap-2">
                {docAttachments.map((a, i) => (
                  <span key={`${a.name}-${i}`} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-mist-200">
                    <Paperclip className="h-3.5 w-3.5 text-mist-400" aria-hidden />
                    <span className="max-w-[12rem] truncate">{a.name}</span>
                    {a.size && <span className="text-mist-400">({a.size})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {editable ? (
          <div className="space-y-4">
            {claim.status === 'Additional Information Required' && (
              <p className="flex items-start gap-2 rounded-xl border border-sky-400/25 bg-sky-400/10 px-3 py-2 text-xs text-sky-300">
                <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> Waiting for the guest&apos;s reply. You can still decide now.
              </p>
            )}

            <div>
              <p className="mb-1.5 text-xs font-medium text-mist-300">Your decision</p>
              <div role="radiogroup" aria-label="Decision" className="grid grid-cols-2 gap-2">
                {DECISIONS.map((d) => {
                  const active = decision === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setDecision(d.id);
                        setError(null);
                      }}
                      className={cn(
                        'rounded-xl border p-2.5 text-left transition',
                        active ? 'accent-soft border-[rgb(var(--a)/0.6)]' : 'border-white/10 bg-white/[0.03] text-mist-300 hover:bg-white/[0.06]',
                      )}
                    >
                      <span className="block text-xs font-bold">{d.title}</span>
                      <span className={cn('mt-0.5 block text-[11px] leading-snug', active ? 'text-mist-200' : 'text-mist-400')}>{d.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {needsAmount && (
              <div className="space-y-3">
                <div className={cn('grid gap-3', decision === 'compensation' && 'sm:grid-cols-2')}>
                  <div>
                    <FieldLabel htmlFor="claim-amount">{decision === 'refund' ? 'Refund amount (₹) *' : 'Compensation amount (₹) *'}</FieldLabel>
                    <input
                      id="claim-amount"
                      type="number"
                      min={1}
                      step="any"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      aria-invalid={tried && !amountOk}
                      className="field w-full"
                    />
                    {tried && !amountOk && <p className="mt-1 text-xs text-rose-400">Enter an amount greater than 0.</p>}
                  </div>
                  {decision === 'compensation' && (
                    <div>
                      <FieldLabel htmlFor="claim-method">Method *</FieldLabel>
                      <select id="claim-method" value={method} onChange={(e) => setMethod(e.target.value as CompensationMethod)} className="field w-full">
                        {COMPENSATION_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {amountOk && (
                  <p
                    className={cn(
                      'flex items-start gap-2 rounded-xl border px-3 py-2 text-xs',
                      overLimit ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
                    )}
                  >
                    {overLimit ? <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />}
                    {overLimit
                      ? `Above your ${money(FD_CLAIM_LIMIT)} limit. This will go to the General Manager.`
                      : `Within your ${money(FD_CLAIM_LIMIT)} limit. You can decide this yourself.`}
                  </p>
                )}
                {higherThanAsked && (
                  <p className="flex items-start gap-2 text-xs text-amber-200">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    This is more than the {money(claim.amountRequested ?? 0)} the guest asked for.
                  </p>
                )}
              </div>
            )}

            <div>
              <FieldLabel htmlFor="claim-message">{messageLabel}</FieldLabel>
              <textarea
                id="claim-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                aria-invalid={tried && !messageOk}
                placeholder={
                  decision === 'reject'
                    ? 'e.g. The minibar log shows the bottle was consumed at 10:40 PM.'
                    : decision === 'request_info'
                      ? 'e.g. Please share the card ending digits and the time of the charge.'
                      : 'e.g. We are sorry for the inconvenience. We have approved this for you.'
                }
                className="field w-full"
              />
              {tried && !messageOk && <p className="mt-1 text-xs text-rose-400">Write at least 5 characters. The guest sees this.</p>}
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
            <p className="text-white">{where}</p>
            {claim.decision && (
              <p className="text-xs text-mist-300">
                Decision: <strong className="text-white">{claim.decision === 'refund' ? 'Refund' : `Compensation${claim.compensationMethod ? ` (${claim.compensationMethod})` : ''}`}</strong>
                {claim.decidedAmount !== undefined && <> · {money(claim.decidedAmount)}</>}
              </p>
            )}
            {claim.staffResponse && <p className="text-xs text-mist-300">Guest was told: {claim.staffResponse}</p>}
            {claim.resolutionDetails && <p className="text-xs text-emerald-300">{claim.resolutionDetails}</p>}
          </div>
        )}

        {claim.history && claim.history.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-mist-400">Timeline</p>
            <ol className="space-y-1.5 border-l border-white/10 pl-3">
              {claim.history.map((h, i) => (
                <li key={`${h.at}-${i}`} className="text-xs text-mist-300">
                  <span className="font-mono text-mist-400">{h.at}</span> · <strong className="text-white">{h.status}</strong>
                  {h.note ? ` · ${h.note}` : ''}
                </li>
              ))}
            </ol>
          </div>
        )}
      </Modal>

      {confirming && (
        <Modal
          title="Confirm your decision"
          description={`${claim.ref} · ${claim.guestName} · Room ${claim.room}`}
          onClose={() => setConfirming(false)}
          footer={
            <>
              <Button variant="subtle" onClick={() => setConfirming(false)}>
                Go back
              </Button>
              <Button variant={decision === 'reject' ? 'danger' : 'accent'} onClick={confirm}>
                Confirm
              </Button>
            </>
          }
        >
          <p className="text-sm text-white">{consequence}</p>
          <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-mist-300">
            <span className="font-semibold text-white">Guest will see:</span> {message.trim()}
          </p>
        </Modal>
      )}

      {previewImage && (
        <Modal
          title={`Evidence Photo · ${previewImage.name}`}
          description={`${claim.guestName} · Room ${claim.room}`}
          onClose={() => setPreviewImage(null)}
          footer={
            <Button variant="ghost" onClick={() => setPreviewImage(null)}>
              Close
            </Button>
          }
        >
          <div className="flex flex-col items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/60 p-2">
            {previewImage.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
              />
            ) : (
              <p className="py-12 text-sm text-mist-400">Image preview not available</p>
            )}
            <p className="mt-2 text-xs text-mist-300 font-mono">{previewImage.name}</p>
          </div>
        </Modal>
      )}
    </>
  );
}

/* --------------------------------------------------------------------- */
/* In-person issue intake                                                */
/* --------------------------------------------------------------------- */

const DISPUTE_CATEGORIES: CompensationRefundCategory[] = [
  'Compensation for Service Issues',
  'Incorrect Charges',
  'Billing Dispute',
  'Duplicate Payment',
  'Refund Request',
  'Partial Refund',
  'Deposit Refund',
  'Other Financial Concern',
];

const PREFERRED_RESOLUTIONS = [
  'Folio Credit / Charge Removal',
  'Refund to Original Card',
  'Food & Beverage Voucher',
  'Spa Voucher',
  'Rate Adjustment',
  'Direct Explanation & Apology',
] as const;

interface LogDisputeModalProps {
  onClose: () => void;
  onCreated: (newRef: string) => void;
}

function LogDisputeModal({ onClose, onCreated }: LogDisputeModalProps) {
  const { state, submitCompensationRefundRequest, notify } = useDemo();
  const inHouseStays = useMemo(
    () => (state.frontDesk?.stays ?? []).filter((s) => s.status === 'in_house'),
    [state.frontDesk?.stays],
  );

  const [staySelect, setStaySelect] = useState<string>(inHouseStays[0]?.id || 'custom');
  const [room, setRoom] = useState<string>(inHouseStays[0]?.room || '305');
  const [guestName, setGuestName] = useState<string>(inHouseStays[0]?.guest || 'Marcus Chen');
  const [bookingRef, setBookingRef] = useState<string>(inHouseStays[0]?.bookingRef || 'BK-305-9921');
  const [category, setCategory] = useState<CompensationRefundCategory>('Compensation for Service Issues');
  const [relatedCharge, setRelatedCharge] = useState('Room Stay / Nightly Rate');
  const [amount, setAmount] = useState('1500');
  const [reason, setReason] = useState('');
  const [explanation, setExplanation] = useState('');
  const [preferredResolution, setPreferredResolution] = useState<string>('Folio Credit / Charge Removal');
  const [attachments, setAttachments] = useState<CompensationRefundAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleStayChange = (id: string) => {
    setStaySelect(id);
    if (id === 'custom') {
      setRoom('');
      setGuestName('');
      setBookingRef('');
    } else {
      const match = inHouseStays.find((s) => s.id === id);
      if (match) {
        setRoom(match.room);
        setGuestName(match.guest);
        setBookingRef(match.bookingRef || `BK-${match.room}-01`);
      }
    }
  };

  const amountNum = Number(amount);
  const hasAmount = amount.trim() !== '' && Number.isFinite(amountNum) && amountNum > 0;
  const isOverLimit = hasAmount && amountNum > FD_CLAIM_LIMIT;

  const handleAddSampleAttachment = (type: 'receipt' | 'minibar' | 'room') => {
    if (type === 'receipt') {
      setAttachments((prev) => [
        ...prev,
        {
          name: `receipt_pos_${Date.now().toString().slice(-4)}.jpg`,
          size: '310 KB',
          type: 'image/jpeg',
          url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
        },
      ]);
    } else if (type === 'minibar') {
      setAttachments((prev) => [
        ...prev,
        {
          name: `minibar_bottle_seal_${Date.now().toString().slice(-4)}.jpg`,
          size: '412 KB',
          type: 'image/jpeg',
          url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=80',
        },
      ]);
    } else {
      setAttachments((prev) => [
        ...prev,
        {
          name: `room_facility_issue_${Date.now().toString().slice(-4)}.jpg`,
          size: '425 KB',
          type: 'image/jpeg',
          url: 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=800&auto=format&fit=crop&q=80',
        },
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room.trim()) {
      setError('Please provide a room number.');
      return;
    }
    if (!guestName.trim()) {
      setError('Please provide the guest name.');
      return;
    }
    if (reason.trim().length < 3) {
      setError('Please enter a brief issue title / reason (at least 3 characters).');
      return;
    }
    if (explanation.trim().length < 5) {
      setError('Please enter a detailed statement of the guest complaint (at least 5 characters).');
      return;
    }
    if (amount.trim() !== '' && (!Number.isFinite(amountNum) || amountNum <= 0)) {
      setError('Amount requested must be a positive number.');
      return;
    }

    try {
      const newRef = submitCompensationRefundRequest({
        room: room.trim(),
        guestName: guestName.trim(),
        bookingRef: bookingRef.trim() || undefined,
        category,
        relatedServiceOrTransaction: relatedCharge.trim() || undefined,
        amountRequested: hasAmount ? amountNum : undefined,
        reason: reason.trim(),
        explanation: explanation.trim(),
        preferredResolution,
        attachments: attachments.length > 0 ? attachments : undefined,
        source: 'Front Desk · Sunita Patel (In-Person Walk-in)',
      });

      notify(`In-person financial issue ${newRef} logged for Room ${room}.`);
      onCreated(newRef);
    } catch {
      setError('Failed to log dispute. Please try again.');
    }
  };

  return (
    <Modal
      title="Log In-Person Financial Issue"
      description="Record a guest refund or compensation claim reported directly at the Front Desk."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-rose-300">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Guest & Room selection */}
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <FieldLabel label="Guest & Room Source">
            <select
              value={staySelect}
              onChange={(e) => handleStayChange(e.target.value)}
              className="field w-full text-xs font-medium"
            >
              {inHouseStays.map((s) => (
                <option key={s.id} value={s.id} className="bg-ink-900 text-white">
                  Room {s.room} · {s.guest} {s.bookingRef ? `(${s.bookingRef})` : ''}
                </option>
              ))}
              <option value="custom" className="bg-ink-900 text-white">
                + Other Walk-in / Custom Room
              </option>
            </select>
          </FieldLabel>

          <div className="grid grid-cols-2 gap-2">
            <FieldLabel label="Room Number">
              <input
                type="text"
                required
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. 305"
                className="field w-full text-xs"
              />
            </FieldLabel>
            <FieldLabel label="Guest Full Name">
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Marcus Chen"
                className="field w-full text-xs"
              />
            </FieldLabel>
          </div>
        </div>

        {/* Dispute Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldLabel label="Claim Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CompensationRefundCategory)}
              className="field w-full text-xs"
            >
              {DISPUTE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-ink-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </FieldLabel>

          <FieldLabel label="Related Folio Charge / Service">
            <input
              type="text"
              value={relatedCharge}
              onChange={(e) => setRelatedCharge(e.target.value)}
              placeholder="e.g. Minibar, Room Rate, In-Room Dining"
              className="field w-full text-xs"
            />
          </FieldLabel>
        </div>

        {/* Amount Requested & Live Policy Limit */}
        <div className="space-y-1.5">
          <FieldLabel label="Amount Requested (₹, optional)">
            <div className="relative">
              <input
                type="number"
                min="0"
                step="50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Leave blank if open"
                className="field w-full pr-16 text-xs tabular-nums"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-mist-400">
                INR (₹)
              </span>
            </div>
          </FieldLabel>
          <div
            className={cn(
              'rounded-lg px-2.5 py-1.5 text-[11px] font-medium border flex items-center justify-between',
              isOverLimit
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                : hasAmount
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-white/10 bg-white/[0.02] text-mist-400',
            )}
          >
            <span>
              {isOverLimit
                ? `Above your limit (${money(FD_CLAIM_LIMIT)}): Review will escalate to General Manager`
                : hasAmount
                  ? `Within your limit (${money(FD_CLAIM_LIMIT)}): Can be approved directly by Front Desk`
                  : `Front Desk approval limit: ${money(FD_CLAIM_LIMIT)}`}
            </span>
            {hasAmount && <span className="font-bold tabular-nums">{money(amountNum)}</span>}
          </div>
        </div>

        {/* Reason & Detailed Explanation */}
        <FieldLabel label="Brief Issue Title / Reason">
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Minibar charged for untouched champagne bottle"
            className="field w-full text-xs"
          />
        </FieldLabel>

        <FieldLabel label="Guest Statement / Intake Notes">
          <textarea
            rows={3}
            required
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Guest arrived at Front Desk reporting that..."
            className="field w-full text-xs leading-relaxed"
          />
        </FieldLabel>

        {/* Preferred Resolution */}
        <FieldLabel label="Preferred Resolution">
          <select
            value={preferredResolution}
            onChange={(e) => setPreferredResolution(e.target.value)}
            className="field w-full text-xs"
          >
            {PREFERRED_RESOLUTIONS.map((res) => (
              <option key={res} value={res} className="bg-ink-900 text-white">
                {res}
              </option>
            ))}
          </select>
        </FieldLabel>

        {/* Simulated Attachments / Evidence */}
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-mist-400 flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5 text-cyan-400" />
              <span>Evidence Attachments ({attachments.length})</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAddSampleAttachment('receipt')}
                className="text-[10px] rounded border border-white/10 bg-white/5 hover:bg-white/10 px-2 py-0.5 text-mist-300 hover:text-white transition"
              >
                + Receipt
              </button>
              <button
                type="button"
                onClick={() => handleAddSampleAttachment('minibar')}
                className="text-[10px] rounded border border-white/10 bg-white/5 hover:bg-white/10 px-2 py-0.5 text-mist-300 hover:text-white transition"
              >
                + Minibar
              </button>
              <button
                type="button"
                onClick={() => handleAddSampleAttachment('room')}
                className="text-[10px] rounded border border-white/10 bg-white/5 hover:bg-white/10 px-2 py-0.5 text-mist-300 hover:text-white transition"
              >
                + Room Photo
              </button>
            </div>
          </div>

          {attachments.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {attachments.map((att, i) => (
                <div
                  key={`${att.name}-${i}`}
                  className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-mist-200"
                >
                  <Paperclip className="h-3 w-3 text-cyan-400" />
                  <span className="truncate max-w-[140px] text-[11px]">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-mist-400 hover:text-rose-400"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-mist-500 italic">No attachments added. Click above to attach sample evidence if shown by guest.</p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" size="sm" type="submit">
            Log Financial Issue
          </Button>
        </div>
      </form>
    </Modal>
  );
}
