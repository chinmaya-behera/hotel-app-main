'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Bell, ShieldAlert, X } from 'lucide-react';
import { managerDepartment, managerNotifications, managerSafetyAlerts } from '@/lib/manager-domain';
import { useDemo } from '@/lib/store';
import type { ManagerMedicalCase } from '@/types/demo';

type Notice = {
  id: string;
  title: string;
  message?: string;
  detail: string;
  status: string;
  unread: boolean;
  action?: { label: string; run: () => void };
};

function timeLabel(value: string) {
  const time = Date.parse(value);
  return Number.isNaN(time) ? value : new Date(time).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

function NotificationGroup({ title, notices, expanded }: {
  title: string;
  notices: Notice[];
  expanded: boolean;
}) {
  return (
    <section className="dm-notification-group">
      <h3>{title}</h3>
      {notices.length === 0 && <p className="dm-notification-empty">No {title.toLowerCase()}.</p>}
      {notices.map(notice => (
        <article className="dm-notification-entry" data-unread={notice.unread} key={notice.id}>
          <div className="dm-notification-title">
            <strong>{notice.title}</strong>
            <span className={notice.unread ? 'dm-status urgent' : 'dm-status'}>{notice.status}</span>
          </div>
          {notice.message && <p>{notice.message}</p>}
          <small>{notice.detail}</small>
          {expanded && notice.action && (
            <button className="dm-text-button" onClick={notice.action.run}>{notice.action.label}</button>
          )}
        </article>
      ))}
    </section>
  );
}

export function ManagerNotifications({ reminders, onOpenMedicalCases }: {
  reminders: ManagerMedicalCase[];
  onOpenMedicalCases: () => void;
}) {
  const { state, departmentManagerCommand, acknowledgeSafetyAlert } = useDemo();
  const department = managerDepartment(state.managerDepartment);
  const recipient = `department_manager:${department.id}`;
  const previewId = useId();
  const inboxTitleId = useId();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!previewOpen) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setPreviewOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setPreviewOpen(false);
      trigger.current?.focus();
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [previewOpen]);

  const safety: Notice[] = managerSafetyAlerts(state).map(alert => {
    const active = alert.status === 'broadcast_active';
    const unread = active && !alert.acknowledgedBy?.includes(recipient);
    return {
      id: alert.id,
      title: alert.title,
      message: alert.description,
      detail: [alert.ref, alert.location, timeLabel(alert.broadcastAt || alert.reportedAt)].join(' · '),
      status: active ? (unread ? alert.priority : 'Acknowledged') : 'Resolved',
      unread,
      action: unread ? { label: 'Acknowledge alert', run: () => acknowledgeSafetyAlert(alert.id, recipient) } : undefined,
    };
  });
  const updates: Notice[] = [
    ...reminders.map(reminder => ({
      id: `reminder-${reminder.id}`,
      title: `Medical follow-up due · ${reminder.reference}`,
      detail: timeLabel(reminder.followUpAt || ''),
      status: 'Due',
      unread: true,
      action: { label: 'Open medical cases', run: () => {
        dialog.current?.close();
        onOpenMedicalCases();
      } },
    })),
    ...managerNotifications(state, department.id).map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message || notification.summary,
      detail: timeLabel(notification.timestamp),
      status: notification.read ? 'Read' : 'Unread',
      unread: !notification.read,
      action: notification.read ? undefined : {
        label: 'Mark as read',
        run: () => departmentManagerCommand({ type: 'read', notificationId: notification.id }),
      },
    })),
  ];
  const unreadCount = [...safety, ...updates].filter(notice => notice.unread).length;
  const latestSafety = safety.find(notice => notice.unread) ?? safety[0];

  function openInbox() {
    setPreviewOpen(false);
    setExpanded(true);
    dialog.current?.showModal();
  }

  return (
    <div className="dm-notifications" ref={container}>
      <button
        ref={trigger}
        className="dm-icon-button"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={previewOpen}
        aria-controls={previewId}
        onClick={() => setPreviewOpen(open => !open)}
      >
        <Bell size={19} aria-hidden="true" />
        {unreadCount > 0 && <b aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</b>}
      </button>
      <section className="dm-notification-preview" id={previewId} aria-label="Notification preview" hidden={!previewOpen}>
        {previewOpen && <>
          <div className="dm-notification-header">
            <h2>Notifications</h2>
            <span>{unreadCount} unread</span>
          </div>
          <div className="dm-notification-preview-list">
            <NotificationGroup title="Safety alerts" notices={latestSafety ? [latestSafety] : []} expanded={false} />
            <NotificationGroup title="Department updates" notices={updates.slice(0, 2)} expanded={false} />
          </div>
          <button className="dm-secondary dm-notification-see-all" onClick={openInbox}>See all notifications</button>
        </>}
      </section>
      <dialog className="dm-dialog dm-notification-inbox" ref={dialog} aria-labelledby={inboxTitleId} onClose={() => {
        setExpanded(false);
        trigger.current?.focus();
      }}>
        <div className="dm-dialog-heading">
          <h2 id={inboxTitleId}><ShieldAlert size={19} aria-hidden="true" /> All notifications</h2>
          <button className="dm-icon-button" aria-label="Close notifications" onClick={() => dialog.current?.close()}>
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        {expanded && <>
          <p className="dm-notification-inbox-caption">{department.name} · {unreadCount} unread</p>
          <NotificationGroup title="Safety alerts" notices={safety} expanded />
          <NotificationGroup title="Department updates" notices={updates} expanded />
        </>}
      </dialog>
    </div>
  );
}
