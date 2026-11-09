'use client';

import { useState } from 'react';
import { ArrowRight, Download } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cancelledOrder, completedOrder } from '@/lib/department-insights';
import { managerDepartment, type ManagerDepartmentId } from '@/lib/manager-domain';
import { hotelDate, isPastTaskDeadline, slaSummary, taskSla, timestamp } from '@/lib/manager-performance';
import { managerOrders, medicalReminders } from '@/lib/manager-workflows';
import type { DemoState, WorkItem } from '@/types/demo';

export type AnalyticsDestination = 'department' | 'inspections' | 'overdue-tasks' | 'live-orders';

const HOUR = 3600000;
const DAY = 24 * HOUR;
const hotelTime = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
const shortDate = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' });

function formatDuration(value: number) {
  if (value < 1) return `${Math.round(value * 60)} sec`;
  if (value < 60) return `${Math.round(value)} min`;
  return `${(value / 60).toFixed(1)} hr`;
}

function departmentSnapshot(state: DemoState, department: ManagerDepartmentId, now: number) {
  switch (department) {
    case 'housekeeping': {
      const expected = new Set(state.frontDesk.stays.filter(stay => stay.status === 'expected').map(stay => stay.room));
      const rooms = state.frontDesk.rooms;
      return {
        title: 'Room readiness',
        metrics: [
          { label: 'Arrival rooms not ready', count: rooms.filter(room => expected.has(room.no) && room.readiness !== 'ready').length, detail: 'Assigned rooms for expected arrivals. Open Room readiness and choose Expected arrivals.' },
          { label: 'Rooms awaiting inspection', count: rooms.filter(room => room.readiness === 'inspection_pending').length, detail: 'Check the inspection queue and assign a supervisor if needed.' },
        ],
        actions: [{ view: 'department', label: 'Open room readiness' }, { view: 'inspections', label: 'Open inspections' }],
      } as const;
    }
    case 'engineering': {
      const today = hotelDate(now), weekEnd = hotelDate(now + 6 * DAY);
      const assets = (state.managerOperations?.assets ?? []).filter(asset => /^\d{4}-\d{2}-\d{2}$/.test(asset.nextDue));
      return {
        title: 'Preventive maintenance',
        metrics: [
          { label: 'Asset services overdue', count: assets.filter(asset => asset.nextDue < today).length, detail: 'The scheduled service date has passed.' },
          { label: 'Asset services due within 7 days', count: assets.filter(asset => asset.nextDue >= today && asset.nextDue <= weekEnd).length, detail: 'Due today or in the next six days. Open the plan to create a work order or record service after completion.' },
        ],
        actions: [{ view: 'department', label: 'Open maintenance plan' }],
      } as const;
    }
    case 'food-beverages': {
      const orders = managerOrders(state).filter(order => !cancelledOrder(order) && !completedOrder(order));
      const dueSoon = orders.filter(order => {
        const due = timestamp(order.requestedServiceAt || order.scheduledAt);
        return due !== undefined && due >= now && due <= now + HOUR;
      });
      return {
        title: 'Dining service',
        metrics: [
          { label: 'Active dining orders', count: orders.length, detail: 'Recorded orders still open in the dining queue.' },
          { label: 'Scheduled in the next hour', count: dueSoon.length, detail: 'Open orders with a promised slot in the next 60 minutes.' },
        ],
        actions: [{ view: 'live-orders', label: 'Open active dining orders' }],
      } as const;
    }
    case 'wellness':
      return {
        title: 'Guest care',
        metrics: [
          { label: 'Active medical cases', count: (state.managerOperations?.medicalCases ?? []).filter(record => record.status !== 'closed').length, detail: 'Cases your department is still handling.' },
          { label: 'Follow-ups due', count: medicalReminders(state, now).length, detail: 'Open the case, record what happened and acknowledge the reminder after following up.' },
        ],
        actions: [{ view: 'department', label: 'Open guest medical cases' }],
      } as const;
  }
}

export function DepartmentAnalytics({ tasks, now, onOpen }: { tasks: WorkItem[]; now: number; onOpen: (destination: AnalyticsDestination) => void }) {
  const { state } = useDemo();
  const department = managerDepartment(state.managerDepartment);
  const [period, setPeriod] = useState('7');
  const [priority, setPriority] = useState('all');
  const all = tasks.map(task => taskSla(state, task, now));
  const rows = all.filter(({ task }) => {
    const value = task.priority || 'normal';
    return priority === 'all' || (priority === 'urgent' ? ['urgent', 'critical', 'safety'].includes(value) : priority === value);
  });
  const days = Number(period);
  const since = now - days * DAY;
  const inPeriod = (time?: number): time is number => time !== undefined && time >= since && time <= now;
  const opened = rows.filter(row => inPeriod(row.created));
  const finished = rows.filter(row => inPeriod(row.resolved));
  const onTime = slaSummary(finished.map(row => row.resolution));
  const durations = finished.flatMap(({ created, resolved }) =>
    created !== undefined && resolved !== undefined && resolved >= created ? [(resolved - created) / 60000] : [],
  ).sort((a, b) => a - b);
  const turnaround = durations.length
    ? (durations[Math.floor((durations.length - 1) / 2)] + durations[Math.floor(durations.length / 2)]) / 2
    : undefined;
  const overdue = all.filter(isPastTaskDeadline);
  const snapshot = departmentSnapshot(state, department.id, now);
  const bucketSize = days === 1 ? 4 * HOUR : DAY;
  const bucketCount = days === 1 ? 6 : days;
  const trend = Array.from({ length: bucketCount }, (_, index) => {
    const start = since + index * bucketSize, end = start + bucketSize;
    const inBucket = (time?: number) => time !== undefined && time >= start && (time < end || index === bucketCount - 1 && time === end);
    return {
      label: days === 1 ? hotelTime.format(end) : shortDate.format(end),
      opened: opened.filter(row => inBucket(row.created)).length,
      finished: finished.filter(row => inBucket(row.resolved)).length,
    };
  });
  const chartMax = Math.max(1, ...trend.flatMap(bucket => [bucket.opened, bucket.finished]));

  const exportReport = () => {
    const cell = (value: unknown) => '"' + String(value ?? '').replace(/^[=+@-]/, "'").replaceAll('"', '""') + '"';
    const exportRows = [
      ['Department', 'Reference', 'Request', 'Priority', 'Opened (ISO)', 'Completed (ISO)', 'Deadline (ISO)', 'Deadline result'],
      ...rows.filter(row => inPeriod(row.created) || inPeriod(row.resolved)).map(row => [
        department.name, row.resolution.reference, row.task.title, row.task.priority || 'normal',
        row.created === undefined ? '' : new Date(row.created).toISOString(),
        row.resolved === undefined ? '' : new Date(row.resolved).toISOString(),
        row.resolution.deadline === undefined ? '' : new Date(row.resolution.deadline).toISOString(),
        inPeriod(row.resolved) && ['met', 'breached'].includes(row.resolution.outcome) ? (row.resolution.outcome === 'met' ? 'On time' : 'Late') : '',
      ]),
    ];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + exportRows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${department.id}-task-performance-${period}d.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <>
    <section className="dm-panel">
      <div className="dm-panel-heading">
        <div><h2>Service performance</h2><p>See how much work came in, how much was finished, and what needs attention now.</p></div>
        <button className="dm-secondary" onClick={exportReport} disabled={!opened.length && !finished.length}><Download size={15}/> Export task report</button>
      </div>
      <div className="dm-toolbar">
        <select aria-label="Analytics period" value={period} onChange={event => setPeriod(event.target.value)}>
          <option value="1">Past 24 hours</option><option value="7">Past 7 days</option><option value="30">Past 30 days</option>
        </select>
        <select aria-label="Analytics priority" value={priority} onChange={event => setPriority(event.target.value)}>
          <option value="all">All task priorities</option><option value="urgent">Urgent / critical / safety</option>
          <option value="vip">VIP</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option>
        </select>
        <small className="dm-subtle">Updated {hotelTime.format(now)} IST</small>
      </div>
    </section>
    <div className="dm-metric-strip dm-analytics-kpis">
      <div><small>Requests opened</small><strong>{opened.length}</strong><small>Created in the selected period</small></div>
      <div><small>Requests completed</small><strong>{finished.length}</strong><small>Finished in the selected period, including older requests</small></div>
      <div><small>Completed on time</small><strong>{onTime.compliance === undefined ? '—' : `${Math.round(onTime.compliance)}%`}</strong><small>{onTime.measured ? `${onTime.met} of ${onTime.measured} completed requests with a measurable deadline` : 'No completed requests with a measurable deadline'}</small></div>
      <div><small>Median turnaround</small><strong>{turnaround === undefined ? '—' : formatDuration(turnaround)}</strong><small>{durations.length ? `Time from opening to completion across ${durations.length} timed requests` : 'No completions with both timestamps recorded'}</small></div>
    </div>
    <div className="dm-analytics-grid">
      <section className="dm-panel">
        <div className="dm-panel-heading"><div><h2>Requests opened vs. completed</h2><p>Compare incoming work with work finished in the same time window.</p></div></div>
        {opened.length || finished.length ? <>
          <div className="dm-trend-legend"><span><i/> Opened</span><span><i/> Completed</span></div>
          <div className="dm-trend-chart" role="img" aria-label={`Request trend, ${opened.length} opened and ${finished.length} completed`}>
            {trend.map((bucket, index) => <div className="dm-trend-bucket" key={index} title={`${bucket.label} · ${bucket.opened} opened, ${bucket.finished} completed`}>
              <div><span style={{ height: `${bucket.opened / chartMax * 100}%` }}/><span style={{ height: `${bucket.finished / chartMax * 100}%` }}/></div>
              <small>{trend.length <= 7 || index % 5 === 0 ? bucket.label : ''}</small>
            </div>)}
          </div>
          <details className="dm-chart-data">
            <summary>View chart data</summary>
            <table className="dm-table"><thead><tr><th>{days === 1 ? '4-hour window ending (IST)' : '24-hour window ending (IST)'}</th><th>Opened</th><th>Completed</th></tr></thead>
              <tbody>{trend.map((bucket, index) => <tr key={index}><td>{bucket.label}</td><td>{bucket.opened}</td><td>{bucket.finished}</td></tr>)}</tbody>
            </table>
          </details>
        </> : <p className="dm-empty">No dated request activity matches these filters.</p>}
      </section>
      <section className="dm-panel">
        <div className="dm-panel-heading"><div><h2>{snapshot.title}</h2><p>Current department snapshot across all dates and priorities.</p></div></div>
        <div className="dm-performance-list">
          {snapshot.metrics.map(metric => <div key={metric.label}><div><b>{metric.label}</b><p>{metric.detail}</p></div><strong>{metric.count}</strong></div>)}
          <div><div><b>Open requests past deadline</b><p>Open work already past its resolution or delivery deadline.</p></div><strong>{overdue.length}</strong></div>
          <div className="dm-analytics-actions">
            {snapshot.actions.map(action => <button key={action.view} className="dm-text-button" onClick={() => onOpen(action.view)}>{action.label} <ArrowRight size={15}/></button>)}
            <button className="dm-text-button" onClick={() => onOpen('overdue-tasks')}>Open overdue requests <ArrowRight size={15}/></button>
          </div>
        </div>
      </section>
    </div>
    <details className="dm-chart-data">
      <summary>How the numbers and report work</summary>
      <p>The period and priority filters apply to the performance cards, chart and CSV report. The report includes requests opened or completed in that window.</p>
      <p>On-time completion compares recorded completion with the request’s deadline, including the promised slot for scheduled deliveries. Median turnaround is the middle opening-to-completion duration, or the average of the two middle durations. Both exclude records without the timestamps needed for the calculation.</p>
    </details>
  </>;
}
