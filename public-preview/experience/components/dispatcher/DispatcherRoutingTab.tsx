'use client';

import { useState } from 'react';
import {
  Sparkles,
  Play,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Clock,
  Layers,
  MapPin,
  UserCheck,
  Send,
  Zap,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { seedRoutingRules } from '@/lib/mockData';
import type { RoutingRule } from '@/types/demo';

export function DispatcherRoutingTab() {
  const { state, toggleRoutingRule, simulateTestTask } = useDemo();

  const rules: RoutingRule[] = state.routingRules ?? seedRoutingRules;

  // Simulator State
  const [simCategory, setSimCategory] = useState<string>('maintenance');
  const [simRoom, setSimRoom] = useState<string>('305');
  const [simPriority, setSimPriority] = useState<'normal' | 'urgent' | 'critical' | 'vip' | 'safety'>('urgent');
  const [simDescription, setSimDescription] = useState<string>('HVAC thermostat sensor malfunctioning, ambient temp 28°C');
  const [simResult, setSimResult] = useState<null | {
    matchedRule: RoutingRule;
    department: string;
    eligibleStaff: Array<{ name: string; id: string; activeCount: number; floorMatch: boolean }>;
    chosenStaff: { name: string; id: string; activeCount: number } | null;
    ackSla: number;
    resSla: number;
  }>(null);

  const presets = [
    {
      label: 'AC Fault · Room 305',
      category: 'maintenance',
      room: '305',
      priority: 'urgent' as const,
      desc: 'HVAC unit blowing warm air, temperature 27°C in master bedroom.',
    },
    {
      label: 'Extra Towels · Room 402',
      category: 'housekeeping',
      room: '402',
      priority: 'normal' as const,
      desc: 'Guest requested 2 extra bath sheets and hand towels.',
    },
    {
      label: 'In-Room Breakfast · Room 518',
      category: 'room_service',
      room: '518',
      priority: 'vip' as const,
      desc: 'Presidential Suite Continental breakfast tray delivery.',
    },
    {
      label: 'Balcony Sensor · Balcony 502',
      category: 'maintenance',
      room: '502',
      priority: 'safety' as const,
      desc: 'IoT rail telemetry alert: battery low at 8%.',
    },
  ];

  const handleSimulate = () => {
    // 1. Find matching rule
    const rule = rules.find((r) => r.category === simCategory && r.active) || rules[0];

    // 2. Find eligible staff
    const dept = rule.department.toLowerCase();
    const staffAccounts = state.staffAccounts ?? [];
    const floor = parseInt(simRoom[0], 10) || 1;

    const eligible = staffAccounts
      .filter((s) => s.roleId === 'task_fulfiller' && s.status === 'active' && (!s.availability || s.availability === 'on_duty'))
      .filter((s) => s.department.toLowerCase().includes(dept) || dept.includes(s.department.toLowerCase()))
      .map((s) => {
        const count = (state.items.task_fulfiller ?? []).filter(
          (t) => t.assigneeId === s.employeeId && t.status !== 'Completed' && t.status !== 'Cancelled',
        ).length;
        const floorMatch = Boolean(s.floorZone && s.floorZone.includes(String(floor)));
        return {
          name: s.name,
          id: s.employeeId,
          activeCount: count,
          floorMatch,
        };
      });

    // 3. Score and choose staff
    const chosen = eligible.length > 0 ? [...eligible].sort((a, b) => a.activeCount - b.activeCount)[0] : null;

    setSimResult({
      matchedRule: rule,
      department: rule.department,
      eligibleStaff: eligible,
      chosenStaff: chosen,
      ackSla: rule.ackSlaMinutes,
      resSla: rule.resolutionSlaMinutes,
    });
  };

  const handleInjectTask = () => {
    if (!simResult) return;
    simulateTestTask(simResult.department, simPriority);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-xl font-bold font-display text-white">
              Auto-Routing Engine & Rule Sandbox
            </h1>
          </div>
          <p className="text-xs text-mist-300 mt-1">
            Configure Category-to-Department routing logic and simulate deterministic dispatch matching in real time.
          </p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div>
            <h2 className="text-base font-bold font-display text-white">Active Dispatch Routing Policies</h2>
            <p className="text-xs text-mist-400">Rules applied to inbound guest portal and IoT events</p>
          </div>
          <span className="text-xs font-mono text-amber-300 font-semibold">
            {rules.filter((r) => r.active).length} of {rules.length} Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.06] text-[10px] uppercase font-bold tracking-wider text-mist-400">
              <tr>
                <th className="py-3 px-3">Rule ID & Category</th>
                <th className="py-3 px-3">Target Department</th>
                <th className="py-3 px-3">Target Persona</th>
                <th className="py-3 px-3">Default Priority</th>
                <th className="py-3 px-3">Dual SLAs (Ack / Res)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 pr-3 text-right">Toggle Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3.5 px-3 space-y-0.5">
                    <span className="font-mono font-bold text-white block">{rule.id}</span>
                    <span className="text-[11px] text-amber-300 capitalize">{rule.category}</span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-white">
                    {rule.department}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-mist-300">
                    {rule.targetRole}
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        rule.defaultPriority === 'critical' || rule.defaultPriority === 'safety'
                          ? 'bg-rose-500/20 text-rose-300'
                          : rule.defaultPriority === 'urgent'
                          ? 'bg-amber-400/20 text-amber-300'
                          : rule.defaultPriority === 'vip'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-white/10 text-mist-200'
                      }`}
                    >
                      {rule.defaultPriority}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-mist-200">
                    Ack: {rule.ackSlaMinutes}m · Res: {rule.resolutionSlaMinutes}m
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rule.active
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/10 text-mist-400'
                      }`}
                    >
                      {rule.active ? 'Active Policy' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3.5 pr-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleRoutingRule(rule.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                        rule.active
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                          : 'border-white/10 text-mist-400 hover:text-white'
                      }`}
                    >
                      {rule.active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Simulation Sandbox */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <h2 className="text-base font-bold font-display text-white">Interactive Routing Simulation Sandbox</h2>
            </div>
            <p className="text-xs text-mist-400">
              Test how the deterministic engine resolves inbound scenarios and preview personnel selection.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-mist-400 block">
            Load Quick Scenario Template:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setSimCategory(p.category);
                  setSimRoom(p.room);
                  setSimPriority(p.priority);
                  setSimDescription(p.desc);
                }}
                className="p-2.5 rounded-2xl border border-white/10 bg-white/[0.02] text-left hover:border-amber-400/40 hover:bg-white/[0.05] transition space-y-0.5"
              >
                <p className="font-bold text-xs text-white truncate">{p.label}</p>
                <p className="text-[10px] text-mist-400 truncate">{p.category} · Room {p.room}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-mist-300">Category</label>
            <select
              value={simCategory}
              onChange={(e) => setSimCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-ink-950/80 p-2 text-xs text-white focus:border-amber-400 focus:outline-none"
            >
              <option value="maintenance">Maintenance & Engineering</option>
              <option value="housekeeping">Housekeeping & Linen</option>
              <option value="room_service">Food & Beverage (Room Service)</option>
              <option value="concierge">Concierge (Front Desk)</option>
              <option value="spa">Spa & Wellness</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-mist-300">Room Number</label>
            <input
              type="text"
              value={simRoom}
              onChange={(e) => setSimRoom(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-ink-950/80 p-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-mist-300">Priority</label>
            <select
              value={simPriority}
              onChange={(e) =>
                setSimPriority(e.target.value as 'normal' | 'urgent' | 'critical' | 'vip' | 'safety')
              }
              className="w-full rounded-xl border border-white/10 bg-ink-950/80 p-2 text-xs text-white focus:border-amber-400 focus:outline-none capitalize"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="critical">Critical</option>
              <option value="vip">VIP</option>
              <option value="safety">Safety Hazard</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-mist-300">Description / Diagnostic Note</label>
          <input
            type="text"
            value={simDescription}
            onChange={(e) => setSimDescription(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-ink-950/80 p-2 text-xs text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        {/* Trigger Button */}
        <div>
          <button
            type="button"
            onClick={handleSimulate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Play className="h-4 w-4" />
            <span>Simulate Deterministic Match</span>
          </button>
        </div>

        {/* Simulation Output Display */}
        {simResult && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.04] p-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-amber-400/20 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Simulation Resolved Successfully
              </span>
              <button
                type="button"
                onClick={handleInjectTask}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Inject Real Task Into Live Queue</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-white/10 bg-ink-950/60 p-3 space-y-1">
                <span className="text-[10px] text-mist-400 uppercase font-bold">1. Rule Matched</span>
                <p className="font-bold text-white">{simResult.matchedRule.id}</p>
                <p className="text-[11px] text-amber-300">{simResult.department}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-ink-950/60 p-3 space-y-1">
                <span className="text-[10px] text-mist-400 uppercase font-bold">2. SLA Targets</span>
                <p className="font-bold text-white font-mono">Ack: {simResult.ackSla}m</p>
                <p className="text-[11px] text-mist-300 font-mono">Resolution: {simResult.resSla}m</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-ink-950/60 p-3 space-y-1 sm:col-span-2">
                <span className="text-[10px] text-mist-400 uppercase font-bold">3. Auto-Assigned Personnel</span>
                {simResult.chosenStaff ? (
                  <div>
                    <p className="font-bold text-emerald-400 text-sm">
                      {simResult.chosenStaff.name} ({simResult.chosenStaff.id})
                    </p>
                    <p className="text-[11px] text-mist-300">
                      Lowest queue count ({simResult.chosenStaff.activeCount} active tasks)
                    </p>
                  </div>
                ) : (
                  <p className="text-rose-400 font-semibold">No on-duty personnel available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
