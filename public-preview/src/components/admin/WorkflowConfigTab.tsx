'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  FileCheck,
  Gauge,
  Percent,
  Play,
  RotateCcw,
  Save,
  Shield,
  Sliders,
  Sparkles,
  Zap,
  PartyPopper,
  Image as ImageIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';
import type { WorkflowConfig, WorkItem } from '@/types/demo';
import { DEFAULT_EVENTS_CARD_IMAGE, EVENT_CATEGORIES } from '@/components/guest/eventsData';

export function WorkflowConfigTab() {
  const { state, updateWorkflowConfig, updateEventsConfig, simulateTestTask, notify } = useDemo();
  const cfg = state.workflowConfig;

  // Local form state
  const [ackSlaMinutes, setAckSlaMinutes] = useState(cfg?.ackSlaMinutes ?? 5);
  const [resolutionSlaMinutes, setResolutionSlaMinutes] = useState(cfg?.resolutionSlaMinutes ?? 20);
  const [dualSlaEnabled, setDualSlaEnabled] = useState(cfg?.dualSlaEnabled ?? true);
  const [autoEscalateOnOverdue, setAutoEscalateOnOverdue] = useState(cfg?.autoEscalateOnOverdue ?? true);

  const [fdCompLimit, setFdCompLimit] = useState(cfg?.fdCompLimit ?? 4000);
  const [dutyManagerCompLimit, setDutyManagerCompLimit] = useState(cfg?.dutyManagerCompLimit ?? 16000);
  const [execApprovalThreshold, setExecApprovalThreshold] = useState(cfg?.execApprovalThreshold ?? 16000);

  const [freeCancellationDays, setFreeCancellationDays] = useState(cfg?.freeCancellationDays ?? 2);
  const [earlyCheckInFee, setEarlyCheckInFee] = useState(cfg?.earlyCheckInFee ?? 3200);
  const [resortFeePerNight, setResortFeePerNight] = useState(cfg?.resortFeePerNight ?? 1500);

  // Events & Celebrations config state
  const evCfg = state.eventsConfig;
  const [eventsEnabled, setEventsEnabled] = useState(evCfg?.enabled ?? true);
  const [eventsCardImage, setEventsCardImage] = useState(evCfg?.cardImage ?? DEFAULT_EVENTS_CARD_IMAGE);
  const [eventsSubtitle, setEventsSubtitle] = useState(evCfg?.subtitle ?? 'Plan your special moments with us.');
  const [eventCategories, setEventCategories] = useState(
    evCfg?.categories ??
      EVENT_CATEGORIES.map((c) => ({
        id: c.id,
        name: c.name,
        startingPrice: c.startingPrice,
        available: true,
      }))
  );

  const handleSaveEventsConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateEventsConfig({
      enabled: eventsEnabled,
      cardImage: eventsCardImage.trim() || DEFAULT_EVENTS_CARD_IMAGE,
      subtitle: eventsSubtitle.trim() || 'Plan your special moments with us.',
      categories: eventCategories,
    });
    notify(
      eventsEnabled
        ? 'Events & Celebrations configuration saved and active.'
        : 'Events & Celebrations disabled (hidden from guest view).'
    );
  };

  // Test request modal/state
  const [testDept, setTestDept] = useState('Housekeeping');
  const [testPriority, setTestPriority] = useState<WorkItem['priority']>('vip');
  const [isInjecting, setIsInjecting] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkflowConfig({
      ackSlaMinutes,
      resolutionSlaMinutes,
      dualSlaEnabled,
      autoEscalateOnOverdue,
      fdCompLimit,
      dutyManagerCompLimit,
      execApprovalThreshold,
      freeCancellationDays,
      earlyCheckInFee,
      resortFeePerNight,
    });
  };

  const handleRunSampleRequest = () => {
    setIsInjecting(true);
    simulateTestTask(testDept, testPriority);
    setTimeout(() => setIsInjecting(false), 500);
  };

  const handleResetDefaults = () => {
    setAckSlaMinutes(5);
    setResolutionSlaMinutes(20);
    setDualSlaEnabled(true);
    setAutoEscalateOnOverdue(true);
    setFdCompLimit(4000);
    setDutyManagerCompLimit(16000);
    setExecApprovalThreshold(16000);
    setFreeCancellationDays(2);
    setEarlyCheckInFee(3200);
    setResortFeePerNight(1500);
    notify('Reset fields to prototype defaults');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-white/10 bg-ink-900/80 p-6 backdrop-blur-xl shadow-xl">
        <div>
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="h-6 w-6 text-purple-400" />
            Workflow & SLA Configuration
          </h2>
          <p className="text-xs text-mist-300 mt-1 max-w-2xl">
            Tune dual SLA countdown timers, auto-escalation trigger deadlines, and financial recovery compensation ceilings (Admin and IT workflow.png & Fix 4).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="ghost"
            iconLeft={RotateCcw}
            onClick={handleResetDefaults}
          >
            Reset Defaults
          </Button>
          <Button
            size="sm"
            variant="accent"
            iconLeft={Save}
            onClick={handleSaveConfig}
          >
            Save Configuration
          </Button>
        </div>
      </div>

      <form onSubmit={handleSaveConfig} className="space-y-8">
        {/* Section 1: Dual SLA Timers (Fix 4) */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-6 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Gauge className="h-5 w-5 text-amber-300" />
                Dual SLA Clock Engine (Fix 4)
              </h3>
              <p className="text-xs text-mist-300 mt-0.5">
                Response SLA tracks time-to-acknowledge; Resolution SLA tracks time-to-completion. Reassigning tasks does not reset timer.
              </p>
            </div>
            <span className="rounded-full bg-purple-400/10 border border-purple-400/20 px-3 py-1 text-xs font-semibold text-purple-300">
              Live Escalation Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Response SLA */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-white text-sm">Response SLA (Acknowledgement)</label>
                <span className="font-mono text-base font-extrabold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-lg border border-amber-300/20">
                  {ackSlaMinutes} min
                </span>
              </div>
              <p className="text-xs text-mist-300">
                Time allowed for frontline attendant to accept incoming dispatch before supervisor is alerted.
              </p>
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={ackSlaMinutes}
                onChange={(e) => setAckSlaMinutes(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-mist-500 font-mono">
                <span>1 min (Critical)</span>
                <span>5 min (Default)</span>
                <span>15 min (Relaxed)</span>
              </div>
            </div>

            {/* Resolution SLA */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-white text-sm">Resolution SLA (Completion)</label>
                <span className="font-mono text-base font-extrabold text-purple-300 bg-purple-400/10 px-2.5 py-0.5 rounded-lg border border-purple-400/20">
                  {resolutionSlaMinutes} min
                </span>
              </div>
              <p className="text-xs text-mist-300">
                Total turnaround time for service delivery before ticket breaches and auto-escalates to Duty Manager.
              </p>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={resolutionSlaMinutes}
                onChange={(e) => setResolutionSlaMinutes(Number(e.target.value))}
                className="w-full accent-purple-400"
              />
              <div className="flex justify-between text-[10px] text-mist-500 font-mono">
                <span>5 min (Urgent)</span>
                <span>20 min (Default)</span>
                <span>60 min (Extended)</span>
              </div>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 cursor-pointer hover:bg-white/[0.04] transition">
              <input
                type="checkbox"
                checked={dualSlaEnabled}
                onChange={(e) => setDualSlaEnabled(e.target.checked)}
                className="mt-0.5 accent-amber-400 rounded h-4 w-4"
              />
              <div className="text-xs">
                <strong className="text-white block font-semibold">Enable Dual SLA Timers</strong>
                <span className="text-mist-400">Track response and completion clocks separately on all tickets.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 cursor-pointer hover:bg-white/[0.04] transition">
              <input
                type="checkbox"
                checked={autoEscalateOnOverdue}
                onChange={(e) => setAutoEscalateOnOverdue(e.target.checked)}
                className="mt-0.5 accent-amber-400 rounded h-4 w-4"
              />
              <div className="text-xs">
                <strong className="text-white block font-semibold">Auto-Escalate on Overdue</strong>
                <span className="text-mist-400">Promote breached tasks directly into Duty Manager queue.</span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 2: Financial Recovery Ceilings & Policies */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-6 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Coins className="h-5 w-5 text-emerald-400" />
                Financial Delegation & Policy Ceilings (INR ₹)
              </h3>
              <p className="text-xs text-mist-300 mt-0.5">
                Maximum compensation thresholds by role (REQ-08). Exceeding limits requires next-tier approval.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Front Desk Limit */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
              <span className="text-xs font-semibold text-mist-300 block">Front Desk Coordinator</span>
              <span className="text-[11px] text-mist-400 block">Complaints & service goodwill limit</span>
              <div className="pt-2">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={fdCompLimit}
                  onChange={(e) => setFdCompLimit(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-white font-bold text-sm"
                />
                <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
                  Current: {money(fdCompLimit)}
                </span>
              </div>
            </div>

            {/* Duty Manager Limit */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
              <span className="text-xs font-semibold text-mist-300 block">Duty / Department Manager</span>
              <span className="text-[11px] text-mist-400 block">VIP compensation & folio disputes</span>
              <div className="pt-2">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={dutyManagerCompLimit}
                  onChange={(e) => setDutyManagerCompLimit(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-white font-bold text-sm"
                />
                <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
                  Current: {money(dutyManagerCompLimit)}
                </span>
              </div>
            </div>

            {/* Executive Threshold */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
              <span className="text-xs font-semibold text-mist-300 block">Executive / GM Escalation</span>
              <span className="text-[11px] text-mist-400 block">Capex, high disputes & waivers</span>
              <div className="pt-2">
                <input
                  type="number"
                  min="0"
                  step="2000"
                  value={execApprovalThreshold}
                  onChange={(e) => setExecApprovalThreshold(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-white font-bold text-sm"
                />
                <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
                  Current: Above {money(execApprovalThreshold)}
                </span>
              </div>
            </div>
          </div>

          {/* Operational Pricing Rules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/[0.05]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <span className="text-xs font-semibold text-mist-300 block">Free Cancellation Window</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="14"
                  value={freeCancellationDays}
                  onChange={(e) => setFreeCancellationDays(Number(e.target.value))}
                  className="w-24 rounded-xl border border-white/10 bg-ink-950/80 px-3 py-1.5 text-white font-bold text-sm"
                />
                <span className="text-xs text-mist-400">days before arrival</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <span className="text-xs font-semibold text-mist-300 block">Early Check-In Fee</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="200"
                  value={earlyCheckInFee}
                  onChange={(e) => setEarlyCheckInFee(Number(e.target.value))}
                  className="w-32 rounded-xl border border-white/10 bg-ink-950/80 px-3 py-1.5 text-white font-bold text-sm"
                />
                <span className="text-xs text-emerald-400 font-semibold">{money(earlyCheckInFee)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <span className="text-xs font-semibold text-mist-300 block">Resort Fee Per Night</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={resortFeePerNight}
                  onChange={(e) => setResortFeePerNight(Number(e.target.value))}
                  className="w-32 rounded-xl border border-white/10 bg-ink-950/80 px-3 py-1.5 text-white font-bold text-sm"
                />
                <span className="text-xs text-emerald-400 font-semibold">{money(resortFeePerNight)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Test Workflow Engine (from Admin and IT workflow.png) */}
        <div className="rounded-3xl border border-amber-300/25 bg-gradient-to-br from-amber-400/[0.04] to-transparent p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-300" />
            <h3 className="font-display text-lg font-bold text-white">
              Test Workflow Engine Using Sample Request (Admin and IT workflow.png)
            </h3>
          </div>
          <p className="text-xs text-mist-300 max-w-2xl">
            Following any SLA or routing update, generate an immediate synthetic request to test end-to-end task dispatching, priority flags, and dual timer countdowns in the Department Dispatcher queue.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-mist-300">Department:</span>
              <select
                value={testDept}
                onChange={(e) => setTestDept(e.target.value)}
                className="rounded-xl border border-white/10 bg-ink-950/80 px-3 py-1.5 text-xs text-white"
              >
                <option value="Housekeeping">Housekeeping</option>
                <option value="Maintenance">Maintenance & Engineering</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Spa & Recreation">Spa & Recreation</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-mist-300">Priority:</span>
              <select
                value={testPriority}
                onChange={(e) => setTestPriority(e.target.value as WorkItem['priority'])}
                className="rounded-xl border border-white/10 bg-ink-950/80 px-3 py-1.5 text-xs text-white"
              >
                <option value="normal">Normal</option>
                <option value="vip">VIP Guest</option>
                <option value="critical">Critical (Immediate)</option>
                <option value="safety">Safety Alert</option>
              </select>
            </div>

            <Button
              type="button"
              variant="accent"
              size="sm"
              iconLeft={Play}
              disabled={isInjecting}
              onClick={handleRunSampleRequest}
            >
              {isInjecting ? 'Dispatching…' : 'Dispatch Test Request'}
            </Button>
          </div>
        </div>
        {/* Section 4: Events & Celebrations Feature Configuration */}
        <div className="rounded-3xl border border-amber-400/25 bg-ink-900/80 p-6 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-300">
                <PartyPopper className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <span>Events &amp; Celebrations Management</span>
                  <Badge tone={eventsEnabled ? 'success' : 'neutral'}>
                    {eventsEnabled ? 'Enabled in Guest App' : 'Disabled (Hidden)'}
                  </Badge>
                </h3>
                <p className="text-xs text-mist-300 mt-0.5">
                  Control banquet &amp; event planning visibility, customize the guest card image, and configure celebration packages.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={eventsEnabled ? 'outline' : 'accent'}
                size="sm"
                onClick={() => {
                  const nextState = !eventsEnabled;
                  setEventsEnabled(nextState);
                  updateEventsConfig({ enabled: nextState });
                  notify(
                    nextState
                      ? 'Events & Celebrations enabled in Guest App.'
                      : 'Events & Celebrations disabled (hidden from Services card & Home Page button).'
                  );
                }}
              >
                {eventsEnabled ? 'Disable Events Feature' : 'Enable Events Feature'}
              </Button>
            </div>
          </div>

          {/* Master status indicator */}
          <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
            eventsEnabled
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-4 w-4 ${eventsEnabled ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span>
                {eventsEnabled
                  ? 'Active: Guests can access Events & Celebrations from both the Home Page floating button and the Services card.'
                  : 'Disabled: Both the Services directory card and the Home Page floating button are hidden from all guests.'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={eventsEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setEventsEnabled(val);
                  updateEventsConfig({ enabled: val });
                }}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
            </label>
          </div>

          {/* Image & Subtitle configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-mist-300 block mb-1">
                  Card Cover Image URL (Guest Services Directory)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={eventsCardImage}
                    onChange={(e) => setEventsCardImage(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-xs text-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEventsCardImage(DEFAULT_EVENTS_CARD_IMAGE)}
                  >
                    Reset
                  </Button>
                </div>
                <p className="text-[11px] text-mist-400 mt-1">
                  High-resolution photo showing hotel banquet, ballroom, or wedding celebrations.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-mist-300 block mb-1">
                  Card Subtitle / Tagline
                </label>
                <input
                  type="text"
                  value={eventsSubtitle}
                  onChange={(e) => setEventsSubtitle(e.target.value)}
                  placeholder="Plan your special moments with us."
                  className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Live Card Preview */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-mist-400 block mb-2">Live Guest Card Preview:</span>
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10 bg-ink-950">
                <img
                  src={eventsCardImage || DEFAULT_EVENTS_CARD_IMAGE}
                  alt="Events preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_EVENTS_CARD_IMAGE;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-ink-950 text-[10px] font-bold shadow-md flex items-center gap-1">
                  <PartyPopper className="h-3 w-3" />
                  <span>Celebration</span>
                </span>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs font-bold text-white leading-tight">Events &amp; Celebrations 🎉</p>
                  <p className="text-[10px] text-mist-300 truncate">{eventsSubtitle}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Occasion Packages & Categories Configuration */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Occasion Packages &amp; Pricing</h4>
                <p className="text-xs text-mist-400">
                  Configure starting rates and guest availability for all 9 occasion categories.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {eventCategories.map((cat) => (
                <div
                  key={cat.id}
                  className={`p-3 rounded-xl border transition-all ${
                    cat.available
                      ? 'bg-white/[0.03] border-white/10'
                      : 'bg-white/[0.01] border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white truncate max-w-[140px]">
                      {cat.name}
                    </span>
                    <label className="flex items-center gap-1.5 text-[10px] text-mist-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cat.available}
                        onChange={() => {
                          setEventCategories((prev) =>
                            prev.map((c) => (c.id === cat.id ? { ...c, available: !c.available } : c))
                          );
                        }}
                        className="rounded border-white/20 bg-ink-950 text-amber-400 focus:ring-0 h-3.5 w-3.5"
                      />
                      <span>{cat.available ? 'Active' : 'Off'}</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-mist-400">Starting from:</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={cat.startingPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEventCategories((prev) =>
                          prev.map((c) => (c.id === cat.id ? { ...c, startingPrice: Math.max(0, val) } : c))
                        );
                      }}
                      className="w-24 rounded-lg border border-white/10 bg-ink-950/80 px-2 py-1 text-xs text-white font-mono"
                    />
                    <span className="text-[10px] text-emerald-400 font-semibold">{money(cat.startingPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="accent"
              size="sm"
              iconLeft={Save}
              onClick={handleSaveEventsConfig}
            >
              Save Events &amp; Celebrations Configuration
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
