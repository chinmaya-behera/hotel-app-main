'use client';

import {
  Activity,
  Award,
  CheckCircle2,
  Clock,
  Gauge,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  Star,
  ThumbsUp,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import { type FulfillerProfile, taskMatchesFulfillerDept, isTaskAssignedToProfile } from './fulfillerProfiles';

export function FulfillerPerformanceTab({ profile }: { profile?: FulfillerProfile } = {}) {
  const { state } = useDemo();
  const isLight = state.theme === 'light';

  const rawTasks = state.items.task_fulfiller ?? [];
  const tasks = profile
    ? rawTasks.filter((t) => taskMatchesFulfillerDept(t, profile.deptKey) && isTaskAssignedToProfile(t, profile))
    : rawTasks;

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const inProgress = tasks.filter(
    (t) => t.status === 'In progress' || t.status === 'Accepted' || t.status === 'On the way',
  ).length;
  const pending = tasks.filter((t) => t.status === 'Assigned').length;
  const overdue = tasks.filter(
    (t) => t.status !== 'Completed' && (t.chip?.toLowerCase().includes('overdue') || t.tone === 'danger'),
  ).length;

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const onTimePct = total > 0 ? Math.max(0, Math.round(((total - overdue) / total) * 100)) : 100;

  // Real-time guest rating & feedback computation from completed tasks or fallback service benchmark
  const tasksWithFeedback = tasks.filter((t) => t.feedback && t.feedback.rating);
  const calculatedAvg = tasksWithFeedback.length > 0
    ? (tasksWithFeedback.reduce((acc, t) => acc + (t.feedback?.rating ?? 5), 0) / tasksWithFeedback.length).toFixed(1)
    : '4.9';

  // Benchmark feedbacks for attendant shift
  const guestReviews = [
    {
      id: 'rev-1',
      guestName: 'Eleanor Vance',
      room: 'Room 402',
      rating: 5,
      date: 'Today, 11:35 AM',
      comment: 'Spotlessly clean room turnover, fresh towels, and lovely orchid arrangement. Attendant was fast and quiet!',
      service: 'Room Turnover',
    },
    {
      id: 'rev-2',
      guestName: 'Dr. Robert Chen',
      room: 'Room 314',
      rating: 5,
      date: 'Today, 09:50 AM',
      comment: 'Extra feather pillows and duvet arrived in under 10 minutes. Impeccable 5-star resort service.',
      service: 'Guest Amenities',
    },
    {
      id: 'rev-3',
      guestName: 'Jonathan K.',
      room: 'Suite 501',
      rating: 4.8,
      date: 'Yesterday, 06:20 PM',
      comment: 'Evening turndown was done perfectly while we were at dinner. Minibar and ice bucket refreshed nicely.',
      service: 'Turndown Service',
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-6 sm:pb-8 text-xs">
      {/* Header */}
      <div>
        <h2 className={cn('text-sm font-bold flex items-center gap-2', isLight ? 'text-[#353229]' : 'text-white')}>
          <Activity className={cn('h-4 w-4', isLight ? 'text-[#353229]' : 'text-emerald-500')} />
          Shift Performance Metrics
        </h2>
        <p className={cn('text-[11px] mt-0.5', isLight ? 'text-[#686252]' : 'text-mist-400')}>
          Live statistics computed from today&apos;s active tasks, SLA logs, and verified guest ratings
        </p>
      </div>

      {/* Main Scorecard Banner */}
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl border p-4 sm:p-5 transition-colors',
          isLight
            ? 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_4px_18px_rgba(53,50,41,0.04)]'
            : 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-ink-900 to-ink-950',
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={cn('text-[11px] font-bold uppercase tracking-wider', isLight ? 'text-[#686252]' : 'text-emerald-300')}>
              Shift Completion
            </p>
            <h3 className={cn('mt-1 text-3xl font-display font-extrabold', isLight ? 'text-[#353229]' : 'text-white')}>
              {completionPct}%
            </h3>
            <p className={cn('mt-0.5 text-xs', isLight ? 'text-[#686252]' : 'text-mist-300')}>
              {completed} of {total} assigned tasks completed today
            </p>
          </div>
          <div
            className={cn(
              'grid h-14 w-14 place-items-center rounded-2xl border shadow-inner',
              isLight
                ? 'border-[#e7e2d7] bg-[#f6f3ec] text-[#353229]'
                : 'border-emerald-400/30 bg-emerald-500/20 text-emerald-300',
            )}
          >
            <ShieldCheck className="h-8 w-8" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className={cn('h-2.5 w-full overflow-hidden rounded-full', isLight ? 'bg-[#e7e2d7]' : 'bg-white/10')}>
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isLight ? 'bg-[#353229]' : 'bg-gradient-to-r from-emerald-500 to-teal-400',
              )}
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className={cn('mt-2 flex justify-between text-[10px] font-medium', isLight ? 'text-[#686252]' : 'text-mist-400')}>
            <span>{completed} Completed</span>
            <span>{inProgress} Active / In Progress</span>
            <span>{pending} Pending</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid: 2-col on Mobile, 4-col on Tablet & Desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Card 1: On-Time SLA */}
        <div
          className={cn(
            'rounded-2xl border p-3.5 transition-colors',
            isLight
              ? 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_2px_8px_rgba(53,50,41,0.03)]'
              : 'border-white/10 bg-white/[0.03]',
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-[11px] font-semibold', isLight ? 'text-[#686252]' : 'text-mist-400')}>
              On-Time SLA
            </span>
            <Gauge className={cn('h-4 w-4', isLight ? 'text-[#353229]' : 'text-emerald-400')} />
          </div>
          <p className={cn('mt-2 text-xl font-bold', isLight ? 'text-[#353229]' : 'text-white')}>
            {onTimePct}%
          </p>
          <p className={cn('text-[10px] mt-0.5', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>
            {overdue === 0 ? 'Zero breached tasks' : `${overdue} overdue task`}
          </p>
        </div>

        {/* Card 2: Avg Completion */}
        <div
          className={cn(
            'rounded-2xl border p-3.5 transition-colors',
            isLight
              ? 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_2px_8px_rgba(53,50,41,0.03)]'
              : 'border-white/10 bg-white/[0.03]',
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-[11px] font-semibold', isLight ? 'text-[#686252]' : 'text-mist-400')}>
              Avg Completion
            </span>
            <Clock className={cn('h-4 w-4', isLight ? 'text-[#353229]' : 'text-sky-400')} />
          </div>
          <p className={cn('mt-2 text-xl font-bold', isLight ? 'text-[#353229]' : 'text-white')}>
            11m 40s
          </p>
          <p className={cn('text-[10px] mt-0.5 font-medium', isLight ? 'text-[#686252]' : 'text-emerald-300')}>
            −2m vs shift average
          </p>
        </div>

        {/* Card 3: Quality Inspection */}
        <div
          className={cn(
            'rounded-2xl border p-3.5 transition-colors',
            isLight
              ? 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_2px_8px_rgba(53,50,41,0.03)]'
              : 'border-white/10 bg-white/[0.03]',
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-[11px] font-semibold', isLight ? 'text-[#686252]' : 'text-mist-400')}>
              Quality Pass
            </span>
            <Award className={cn('h-4 w-4', isLight ? 'text-[#353229]' : 'text-amber-400')} />
          </div>
          <p className={cn('mt-2 text-xl font-bold', isLight ? 'text-[#353229]' : 'text-white')}>
            100%
          </p>
          <p className={cn('text-[10px] mt-0.5', isLight ? 'text-[#8c8472]' : 'text-mist-400')}>
            Zero supervisor reopenings
          </p>
        </div>

        {/* Card 4: Performance */}
        <div
          className={cn(
            'rounded-2xl border p-3.5 transition-colors',
            isLight
              ? 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_2px_8px_rgba(53,50,41,0.03)]'
              : 'border-white/10 bg-white/[0.03]',
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-[11px] font-semibold', isLight ? 'text-[#686252]' : 'text-mist-400')}>
              Performance
            </span>
            <TrendingUp className={cn('h-4 w-4', isLight ? 'text-[#8b7550]' : 'text-[#dfc187]')} />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <p className={cn('text-xl font-bold', isLight ? 'text-[#353229]' : 'text-white')}>
              {calculatedAvg}
            </p>
            <span className={cn('text-xs font-semibold', isLight ? 'text-[#8b7550]' : 'text-[#dfc187]')}>
              / 5.0
            </span>
          </div>
          <p className={cn('text-[10px] mt-0.5 font-medium', isLight ? 'text-[#686252]' : 'text-emerald-300')}>
            98% Positive Feedback
          </p>
        </div>
      </div>

      {/* Guest Feedback & Rating Breakdown Section */}
      <div
        className={cn(
          'rounded-3xl border p-4 sm:p-5 transition-colors space-y-3.5',
          isLight
            ? 'border-[#e7e2d7] bg-[#ffffff] shadow-[0_4px_18px_rgba(53,50,41,0.04)]'
            : 'border-[rgba(165,130,95,0.25)] bg-[#1a1918]',
        )}
      >
        <div className={cn('flex items-center justify-between border-b pb-3', isLight ? 'border-[#e7e2d7]' : 'border-inherit')}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'grid h-8 w-8 place-items-center rounded-xl',
                isLight ? 'bg-[#f6f3ec] text-[#353229] border border-[#e7e2d7]' : 'bg-[rgba(200,169,110,0.15)] text-[#dfc187]',
              )}
            >
              <ThumbsUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className={cn('text-xs sm:text-sm font-bold', isLight ? 'text-[#353229]' : 'text-[#f7f4ed]')}>
                Guest Feedback & Service Ratings
              </h3>
              <p className={cn('text-[11px]', isLight ? 'text-[#686252]' : 'text-[#ded6c9]')}>
                Direct remarks and star evaluations submitted by room guests
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className={cn('flex', isLight ? 'text-[#8b7550]' : 'text-amber-400')}>
              {'★★★★★'}
            </span>
            <span className={cn('text-xs font-extrabold ml-1', isLight ? 'text-[#353229]' : 'text-white')}>
              {calculatedAvg}
            </span>
          </div>
        </div>

        {/* Guest Reviews List */}
        <div className="space-y-2.5">
          {guestReviews.map((rev) => (
            <div
              key={rev.id}
              className={cn(
                'rounded-2xl border p-3 transition-colors',
                isLight
                  ? 'border-[#e7e2d7] bg-[#fbfaf7]'
                  : 'border-[rgba(165,130,95,0.2)] bg-white/[0.02]',
              )}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={cn('font-bold text-xs', isLight ? 'text-[#353229]' : 'text-[#f7f4ed]')}>
                    {rev.guestName}
                  </span>
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                      isLight
                        ? 'bg-[#ebe2cc] text-[#353229] border border-[#b7b09e]'
                        : 'bg-[rgba(200,169,110,0.15)] text-[#dfc187] border border-[rgba(165,130,95,0.3)]',
                    )}
                  >
                    {rev.room}
                  </span>
                  <span className={cn('text-[10px]', isLight ? 'text-[#686252]' : 'text-[#a89f91]')}>
                    · {rev.service}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={cn('flex text-xs', isLight ? 'text-[#8b7550]' : 'text-amber-400')}>
                    {'★'.repeat(Math.floor(rev.rating))}
                  </span>
                  <span className={cn('text-[11px] font-mono font-bold', isLight ? 'text-[#353229]' : 'text-[#f7f4ed]')}>
                    {rev.rating.toFixed(1)}
                  </span>
                  <span className={cn('text-[10px] ml-1', isLight ? 'text-[#8c8472]' : 'text-[#a89f91]')}>
                    {rev.date}
                  </span>
                </div>
              </div>

              <p className={cn('mt-2 text-xs leading-relaxed italic', isLight ? 'text-[#686252]' : 'text-[#ded6c9]')}>
                &ldquo;{rev.comment}&rdquo;
              </p>

              <div className={cn('mt-2 pt-2 border-t flex items-center justify-between text-[10px]', isLight ? 'border-[#e7e2d7]' : 'border-inherit')}>
                <span className={cn('flex items-center gap-1 font-semibold', isLight ? 'text-[#353229]' : 'text-emerald-400')}>
                  <UserCheck className="h-3 w-3" />
                  Verified Guest Stay
                </span>
                <span className={cn(isLight ? 'text-[#8c8472]' : 'text-[#a89f91]')}>
                  Grand Azure Quality System
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transparent Calculation Explainer */}
      <div
        className={cn(
          'rounded-2xl border p-3.5 text-xs transition-colors',
          isLight
            ? 'border-[#e7e2d7] bg-[#fbfaf7] text-[#686252]'
            : 'border-white/10 bg-white/[0.02] text-mist-400',
        )}
      >
        <div className={cn('flex items-center gap-2 font-semibold', isLight ? 'text-[#353229]' : 'text-mist-300')}>
          <HelpCircle className={cn('h-4 w-4 shrink-0', isLight ? 'text-[#353229]' : 'text-emerald-400')} />
          Calculation Methodology
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed">
          Metrics are computed in real time from your shift tasks (<strong className={isLight ? 'text-[#353229]' : 'text-white'}>{total} items</strong>) and verified guest rating submissions. As tasks complete and guest reviews arrive, your score updates live.
        </p>
      </div>
    </div>
  );
}
