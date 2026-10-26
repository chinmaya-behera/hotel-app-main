'use client';

import { useState, type CSSProperties } from 'react';
import { CircleCheck, HeartHandshake, Megaphone, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { FieldLabel, Modal } from '@/components/frontdesk/Modal';
import { FRONT_DESK_COMP_LIMIT, applyApprovedComp, logComplaint } from '@/lib/frontDesk';
import { useDemo } from '@/lib/store';
import { money, statusTone } from '@/lib/utils';
import type { ComplaintCase } from '@/types/demo';

export function ComplaintsPanel() {
  const { state, fdAction } = useDemo();
  const [open, setOpen] = useState(false);
  const list = state.frontDesk.complaints;

  return (
    <Panel
      title="Complaints and service recovery"
      hint={`You can credit up to ${money(FRONT_DESK_COMP_LIMIT)}. Anything above goes to the Duty Manager.`}
      icon={HeartHandshake}
      action={
        <Button size="sm" variant="accent" iconLeft={Megaphone} onClick={() => setOpen(true)}>
          Log complaint
        </Button>
      }
    >
      {list.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-white/10 py-12 text-center">
          <HeartHandshake className="h-6 w-6 text-mist-500" aria-hidden />
          <p className="text-sm text-mist-300">No complaints logged. Good news.</p>
        </div>
      ) : (
        <ul className="fd-stagger space-y-3">
          {list.map((c, i) => {
            const alert = state.items.department_manager.find((x) => x.id === c.managerItemId);
            const approved = alert?.status === 'Resolved';
            const waiting = c.comp > 0 && !c.compApplied;
            return (
              <li key={c.id} style={{ '--i': i } as CSSProperties} className="work-row" data-priority={c.severity === 'normal' ? 'normal' : c.severity}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white">
                      Room {c.room} · {c.guest}
                    </h3>
                    <p className="mt-0.5 text-xs text-mist-300">{c.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge icon={false}>{c.ref}</Badge>
                      {c.severity !== 'normal' && <Badge tone={c.severity === 'critical' ? 'danger' : 'accent'}>{c.severity === 'critical' ? 'Critical' : 'VIP or repeat'}</Badge>}
                      {c.repeatOf && <Badge tone="warning">{`Repeat of ${c.repeatOf}`}</Badge>}
                      {alert && <Badge tone={statusTone(alert.status)}>{`Duty Manager: ${alert.status}`}</Badge>}
                      {c.comp > 0 && <Badge tone={c.compApplied ? 'success' : 'warning'}>{c.compApplied ? `${money(c.comp)} credit applied` : `${money(c.comp)} proposed`}</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-1 md:items-end">
                    {waiting && (
                      <Button size="sm" variant="accent" iconLeft={CircleCheck} disabled={!approved} onClick={() => fdAction('applyApprovedComp', [c.id])}>
                        Apply approved credit
                      </Button>
                    )}
                    {waiting && !approved && <p className="max-w-[16rem] text-[11px] text-mist-400">Waiting for the Duty Manager. Front Desk cannot approve above {money(FRONT_DESK_COMP_LIMIT)}.</p>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {open && <ComplaintDialog onClose={() => setOpen(false)} />}
    </Panel>
  );
}

function ComplaintDialog({ onClose }: { onClose: () => void }) {
  const { state, fdAction } = useDemo();
  const inHouse = state.frontDesk.stays.filter((st) => st.status === 'in_house');
  const [room, setRoom] = useState(inHouse[0]?.room ?? '');
  const [summary, setSummary] = useState('');
  const [severity, setSeverity] = useState<ComplaintCase['severity']>('normal');
  const [comp, setComp] = useState('0');
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = Number(comp);
  const amountOk = Number.isFinite(amount) && amount >= 0;
  const summaryOk = summary.trim().length >= 5;
  const above = amountOk && amount > FRONT_DESK_COMP_LIMIT;

  function submit() {
    setTried(true);
    if (!summaryOk || !amountOk) return;
    const err = fdAction('logComplaint', [{ room, summary, severity, comp: amount }]);
    if (err) setError(err);
    else onClose();
  }

  return (
    <Modal
      title="Log a complaint"
      description="The Duty Manager is alerted straight away. Repeat complaints and VIP guests are flagged automatically."
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" iconLeft={Megaphone} onClick={submit} disabled={inHouse.length === 0}>
            Log and alert
          </Button>
        </>
      }
    >
      {inHouse.length === 0 ? (
        <p className="text-sm text-mist-300">There are no in-house guests to log a complaint for.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="cmp-room">Guest</FieldLabel>
              <select id="cmp-room" value={room} onChange={(e) => setRoom(e.target.value)} className="field w-full">
                {inHouse.map((st) => (
                  <option key={st.id} value={st.room}>
                    {st.room} · {st.guest}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="cmp-sev">Severity</FieldLabel>
              <select id="cmp-sev" value={severity} onChange={(e) => setSeverity(e.target.value as ComplaintCase['severity'])} className="field w-full">
                <option value="normal">Normal</option>
                <option value="vip">VIP / high</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="cmp-sum">What happened?</FieldLabel>
            <textarea id="cmp-sum" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} className="field w-full" aria-invalid={tried && !summaryOk} />
            {tried && !summaryOk && <p className="mt-1 text-xs text-rose-400">Describe the complaint (5+ characters).</p>}
          </div>
          <div>
            <FieldLabel htmlFor="cmp-comp">Proposed credit (USD)</FieldLabel>
            <input id="cmp-comp" type="number" min={0} step="1" inputMode="decimal" value={comp} onChange={(e) => setComp(e.target.value)} className="field w-full" aria-invalid={tried && !amountOk} />
            {tried && !amountOk && <p className="mt-1 text-xs text-rose-400">Enter 0 or more.</p>}
            {above ? (
              <p className="mt-2 flex items-start gap-2 text-xs text-amber-200">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                Above your {money(FRONT_DESK_COMP_LIMIT)} limit. It is logged as a proposal and waits for the Duty Manager.
              </p>
            ) : (
              amount > 0 && <p className="mt-2 text-xs text-mist-400">Within your limit, so the credit is posted to the folio now.</p>
            )}
          </div>
          {error && (
            <p role="alert" className="text-xs text-rose-400">
              {error}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
