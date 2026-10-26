'use client';

import { useState } from 'react';
import {
  Clock,
  Flame,
  AlertTriangle,
  ShieldAlert,
  Send,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { EscalateTaskModal } from '@/components/dispatcher/EscalateTaskModal';
import type { WorkItem } from '@/types/demo';

export function DispatcherSlaTab() {
  const { state } = useDemo();
  const [escalateModalTask, setEscalateModalTask] = useState<WorkItem | null>(null);

  const allTasks = state.items.department_dispatcher ?? [];
  const managerTasks = state.items.department_manager ?? [];

  // Overdue tasks
  const overdueTasks = allTasks.filter(
    (t) =>
      t.ackStatus === 'overdue' ||
      t.chip?.toLowerCase().includes('overdue') ||
      t.slaDue?.toLowerCase().includes('overdue'),
  );

  // Escalated tasks
  const escalatedTasks = allTasks.filter((t) => t.status === 'Escalated' || t.escalatedTo);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h1 className="text-xl font-bold font-display text-white">
              Dual SLA Timers & Escalations Center
            </h1>
          </div>
          <p className="text-xs text-mist-300 mt-1">
            Track Acknowledgment vs Resolution timers, monitor SLA threshold breaches, and coordinate Duty Manager escalations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="rounded-full px-3 py-1 bg-white/[0.04] border border-white/10 text-mist-200">
            SLA Compliance: <strong className="text-emerald-400">94.2%</strong>
          </span>
        </div>
      </div>

      {/* Dual SLA Policy Visual Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ack SLA Policy Card */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Acknowledgment SLA Policy (MTTA)
              </h2>
            </div>
            <span className="text-xs font-mono text-amber-300 font-bold">&lt; 5 mins</span>
          </div>
          <p className="text-xs text-mist-400">
            Maximum time between guest request creation and attendant acceptance/acknowledgment in field app.
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-center">
              <span className="text-[10px] text-mist-500 block uppercase">Critical</span>
              <strong className="text-rose-400">2 mins</strong>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-center">
              <span className="text-[10px] text-mist-500 block uppercase">Urgent</span>
              <strong className="text-amber-300">3 mins</strong>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-center">
              <span className="text-[10px] text-mist-500 block uppercase">Normal</span>
              <strong className="text-mist-200">5 mins</strong>
            </div>
          </div>
        </div>

        {/* Resolution SLA Policy Card */}
        <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Resolution SLA Policy (MTTR)
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">&lt; 30 mins</span>
          </div>
          <p className="text-xs text-mist-400">
            Target turnaround time from dispatch to photo-verified completion and guest notification.
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-center">
              <span className="text-[10px] text-mist-500 block uppercase">Room Service</span>
              <strong className="text-purple-300">20 mins</strong>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-center">
              <span className="text-[10px] text-mist-500 block uppercase">Housekeeping</span>
              <strong className="text-emerald-400">25 mins</strong>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-center">
              <span className="text-[10px] text-mist-500 block uppercase">Maintenance</span>
              <strong className="text-amber-300">30 mins</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Items Requiring Escalation */}
      <div className="rounded-3xl border border-rose-500/30 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-rose-400" />
            <h2 className="text-base font-bold font-display text-white">
              Overdue Tickets & SLA Breaches ({overdueTasks.length})
            </h2>
          </div>
          <span className="text-xs text-rose-300 font-medium">Auto-escalation candidate</span>
        </div>

        {overdueTasks.length === 0 ? (
          <div className="py-8 text-center text-mist-400 space-y-2">
            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400" />
            <p className="font-semibold text-white text-sm">All operational SLAs are currently in compliance</p>
            <p className="text-xs text-mist-400">Zero active breaches across all department queues.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-300">{task.ref}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                      {task.priority || 'Urgent'}
                    </span>
                    <span className="text-xs font-semibold text-white">Room {task.room}</span>
                  </div>
                  <h3 className="font-bold text-sm text-white">{task.title}</h3>
                  <p className="text-xs text-mist-400">{task.meta}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs font-mono">
                    <span className="text-rose-400 font-bold block">{task.chip || 'Overdue'}</span>
                    <span className="text-mist-500 text-[10px]">Target: {task.slaDue || '09:30'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEscalateModalTask(task)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-400 transition shadow-md shadow-rose-500/20"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Escalate to Duty Mgr</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Escalation History Log */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-300" />
            <h2 className="text-base font-bold font-display text-white">Duty Manager Escalation Log</h2>
          </div>
          <span className="text-xs font-mono text-mist-400">{managerTasks.length} active manager cases</span>
        </div>

        <div className="space-y-3">
          {managerTasks.slice(0, 5).map((caseItem) => (
            <div
              key={caseItem.id}
              className="p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-xs hover:border-white/10 transition"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{caseItem.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300">
                    {caseItem.chip || 'Escalated'}
                  </span>
                </div>
                <p className="text-mist-400 text-[11px]">{caseItem.meta}</p>
                {caseItem.description && (
                  <p className="text-mist-300 text-[11px] italic pt-0.5">{caseItem.description}</p>
                )}
              </div>

              <div className="text-right font-mono text-[11px] text-mist-400">
                <span>Isabella Scott (Duty Mgr)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Render Escalation Modal */}
      {escalateModalTask && (
        <EscalateTaskModal
          task={escalateModalTask}
          onClose={() => setEscalateModalTask(null)}
        />
      )}
    </div>
  );
}
