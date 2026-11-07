'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Ban,
  CircleCheck,
  ClipboardPlus,
  Eye,
  Inbox,
  Route,
  Search,
  Send,
  Siren,
  ThumbsDown,
  ThumbsUp,
  Wallet,
  Calendar,
  Sparkles,
  PhoneCall,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  Clock,
  ArrowRight,
  ShieldAlert,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Phone,
  Mail,
  User,
  Building,
  Layers,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { FieldLabel, Modal } from '@/components/frontdesk/Modal';
import { HoldButton, SwipeRow, type SwipeSide } from '@/lib/gestures';
import {
  REQUEST_DONE,
  ROUTE_LABEL,
  captureCase,
  escalateRequest,
  requestStep,
  routeRequest,
  type RequestStep,
  type RouteDept,
} from '@/lib/frontDesk';
import { useDemo } from '@/lib/store';
import { cn, money, statusTone } from '@/lib/utils';
import type { WorkItem, CaseAttachment, AttachmentArt } from '@/types/demo';

export type RequestCategory = 'all' | 'concierge' | 'case' | 'lost_found' | 'escalation' | 'complaint' | 'event';
export type RequestSourceTab =
  | 'guest_requests'
  | 'complaints'
  | 'event_requests'
  | 'fulfiller_escalations'
  | 'route';

type View = 'action' | 'guest' | 'done' | 'all';
type Dialog =
  | { kind: 'quote' | 'cancel' | 'route' | 'close' | 'detail' | 'escalation' | 'complaint' | 'event'; id: string }
  | { kind: 'new' }
  | null;

const REQUEST_SOURCE_TABS: Array<{ id: RequestSourceTab; label: string }> = [
  { id: 'guest_requests', label: 'Guest Requests' },
  { id: 'complaints', label: 'Guest Complaints' },
  { id: 'event_requests', label: 'Event Requests' },
  { id: 'fulfiller_escalations', label: 'From Fulfillers (Escalations)' },
  { id: 'route', label: 'Route & Reassign' },
];

const VIEWS: Array<{ id: View; label: string }> = [
  { id: 'action', label: 'Needs action' },
  { id: 'guest', label: 'Awaiting guest' },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'All' },
];

const CANCEL_REASONS = [
  'Not available at that time',
  'Service is not offered',
  'Guest could not be reached',
  'Duplicate of another request',
];

export const isDone = (i: WorkItem) =>
  REQUEST_DONE.includes(i.status) || i.status === 'Resolved' || i.status === 'Completed';
export const needsAction = (i: WorkItem) => !isDone(i) && i.status !== 'Awaiting guest';

function categoryOf(i: WorkItem): string {
  if (i.isEventRequest || i.ref?.startsWith('EVT')) return 'Event Request';
  if (i.complaintId || i.ref?.startsWith('CMP')) return 'Guest Complaint';
  if (i.escalationId || i.status === 'Escalated') return 'Fulfiller Escalation';
  if (i.category === 'lost_found') return 'Lost & found';
  if (i.category === 'concierge') return 'Concierge';
  return 'Guest Request';
}

/* --------------------------------------------------------------------- */
/* Realistic Mock Illustrated Artwork for Image Lightbox                 */
/* --------------------------------------------------------------------- */

function AttachmentArtRenderer({
  art,
  large,
  className,
}: {
  art?: AttachmentArt;
  large?: boolean;
  className?: string;
}) {
  switch (art) {
    case 'bathroom':
      return (
        <svg viewBox="0 0 400 300" className={cn('w-full h-full', className)} xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#0f172a" />
          <defs>
            <linearGradient id="marble" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect x="20" y="20" width="360" height="260" rx="12" fill="url(#marble)" stroke="#334155" strokeWidth="2" />
          {/* Mirror */}
          <rect x="60" y="50" width="140" height="120" rx="8" fill="#38bdf8" fillOpacity="0.15" stroke="#38bdf8" strokeWidth="2" />
          <path d="M75 160 L185 60" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.4" />
          {/* Vanity Sink */}
          <rect x="50" y="180" width="160" height="50" rx="6" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
          <ellipse cx="130" cy="195" rx="50" ry="12" fill="#0284c7" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="2" />
          {/* Water Puddle */}
          <ellipse cx="280" cy="220" rx="55" ry="18" fill="#0284c7" fillOpacity="0.45" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="260" cy="215" r="4" fill="#38bdf8" />
          <circle cx="305" cy="225" r="3" fill="#38bdf8" />
          <text x="280" y="255" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">
            Damp Bathroom Floor
          </text>
        </svg>
      );
    case 'leak':
      return (
        <svg viewBox="0 0 400 300" className={cn('w-full h-full', className)} xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#0b1329" />
          <rect x="20" y="20" width="360" height="260" rx="12" fill="#131c38" stroke="#334155" strokeWidth="2" />
          {/* Metallic Pipe */}
          <path d="M80 60 L80 180 Q80 200 100 200 L240 200 Q260 200 260 220 L260 280" fill="none" stroke="#94a3b8" strokeWidth="18" strokeLinecap="round" />
          {/* Pipe Joint / Valve */}
          <rect x="150" y="188" width="24" height="24" rx="3" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
          {/* Water Drip Seepage */}
          <circle cx="162" cy="220" r="5" fill="#38bdf8" className="animate-pulse" />
          <circle cx="162" cy="235" r="4" fill="#38bdf8" />
          <ellipse cx="162" cy="255" rx="40" ry="14" fill="#0284c7" fillOpacity="0.5" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="162" y="280" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
            Active Pipe Trap Leakage
          </text>
        </svg>
      );
    case 'ac':
      return (
        <svg viewBox="0 0 400 300" className={cn('w-full h-full', className)} xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#0c1427" />
          <rect x="40" y="40" width="320" height="220" rx="16" fill="#18223c" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.4" />
          {/* Thermostat Screen */}
          <rect x="80" y="70" width="240" height="130" rx="10" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
          <text x="200" y="125" textAnchor="middle" fill="#f87171" fontSize="36" fontWeight="bold" fontFamily="monospace">
            26.5°C
          </text>
          <text x="200" y="155" textAnchor="middle" fill="#fbbf24" fontSize="13" fontFamily="sans-serif">
            TARGET: 20.0°C · FCU FAULT
          </text>
          <text x="200" y="180" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
            Compressor Vibration Alert
          </text>
        </svg>
      );
    case 'cake':
      return (
        <svg viewBox="0 0 400 300" className={cn('w-full h-full', className)} xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#181226" />
          <rect x="20" y="20" width="360" height="260" rx="12" fill="#241b38" stroke="#a855f7" strokeWidth="1.5" strokeOpacity="0.4" />
          {/* 3-Tier Luxury Cake */}
          <rect x="100" y="190" width="200" height="50" rx="6" fill="#78350f" stroke="#d97706" strokeWidth="2" />
          <rect x="130" y="140" width="140" height="50" rx="6" fill="#92400e" stroke="#fbbf24" strokeWidth="2" />
          <rect x="160" y="90" width="80" height="50" rx="6" fill="#b45309" stroke="#fef08a" strokeWidth="2" />
          {/* Candles */}
          <rect x="195" y="70" width="10" height="20" rx="2" fill="#fef08a" />
          <ellipse cx="200" cy="65" rx="4" ry="7" fill="#f59e0b" />
          <text x="200" y="270" textAnchor="middle" fill="#fef08a" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
            3-Tier Truffle Celebration Cake
          </text>
        </svg>
      );
    case 'venue':
      return (
        <svg viewBox="0 0 400 300" className={cn('w-full h-full', className)} xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#0f172a" />
          <rect x="20" y="20" width="360" height="260" rx="12" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          {/* Terrace Layout Plan */}
          <rect x="50" y="50" width="300" height="180" rx="8" fill="#0284c7" fillOpacity="0.1" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 4" />
          {/* Tables */}
          <circle cx="110" cy="100" r="22" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="200" cy="100" r="22" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="290" cy="100" r="22" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="150" cy="170" r="22" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="250" cy="170" r="22" fill="#334155" stroke="#38bdf8" strokeWidth="2" />
          {/* Stage */}
          <rect x="130" y="55" width="140" height="20" rx="4" fill="#f59e0b" fillOpacity="0.4" stroke="#fbbf24" strokeWidth="1.5" />
          <text x="200" y="69" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold">ACOUSTIC TRIO STAGE</text>
          <text x="200" y="255" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">
            Terrace Lounge 35-Pax Seating Plan
          </text>
        </svg>
      );
    case 'towels':
    default:
      return (
        <svg viewBox="0 0 400 300" className={cn('w-full h-full', className)} xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#091428" />
          <rect x="20" y="20" width="360" height="260" rx="12" fill="#14213d" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.4" />
          {/* Stack of luxury towels */}
          <rect x="100" y="170" width="200" height="40" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="110" y="130" width="180" height="40" rx="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="125" y="90" width="150" height="40" rx="10" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
          {/* Embroidery Gold Band */}
          <line x1="130" y1="190" x2="270" y2="190" stroke="#f59e0b" strokeWidth="3" />
          <line x1="140" y1="150" x2="260" y2="150" stroke="#f59e0b" strokeWidth="3" />
          <line x1="155" y1="110" x2="245" y2="110" stroke="#f59e0b" strokeWidth="3" />
          <text x="200" y="250" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
            Egyptian Cotton Plush Linens
          </text>
        </svg>
      );
  }
}

/* --------------------------------------------------------------------- */
/* Main Requests Panel Component                                         */
/* --------------------------------------------------------------------- */

export function RequestsPanel({
  initialCategory = 'all',
  initialSourceTab = 'guest_requests',
}: {
  initialCategory?: RequestCategory;
  initialSourceTab?: RequestSourceTab;
}) {
  const { state, fdAction } = useDemo();
  const [sourceTab, setSourceTab] = useState<RequestSourceTab>(initialSourceTab);
  const [view, setView] = useState<View>('action');
  const [query, setQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<WorkItem | null>(null);
  const [lightboxAttachments, setLightboxAttachments] = useState<CaseAttachment[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [contactModalItem, setContactModalItem] = useState<WorkItem | null>(null);
  const [routeModalItem, setRouteModalItem] = useState<WorkItem | null>(null);
  const [newCaseOpen, setNewCaseOpen] = useState(false);

  useEffect(() => {
    if (initialSourceTab) setSourceTab(initialSourceTab);
  }, [initialSourceTab]);

  const all = state.items.front_desk_coordinator ?? [];
  const term = query.trim().toLowerCase();

  // Category matching helper
  const matchesSourceTab = (i: WorkItem) => {
    if (sourceTab === 'guest_requests') {
      return (
        !i.isEventRequest &&
        !i.complaintId &&
        !i.escalationId &&
        !i.ref?.startsWith('CMP') &&
        !i.ref?.startsWith('EVT') &&
        !i.ref?.startsWith('ESC') &&
        i.status !== 'Escalated'
      );
    }
    if (sourceTab === 'complaints') {
      return (
        Boolean(i.complaintId) ||
        i.ref?.startsWith('CMP') ||
        i.ref?.startsWith('CR-') ||
        i.title.toLowerCase().includes('complaint') ||
        i.title.toLowerCase().includes('disturbance') ||
        (i.category as string) === 'case'
      );
    }
    if (sourceTab === 'event_requests') {
      return (
        Boolean(i.isEventRequest) ||
        i.ref?.startsWith('EVT') ||
        i.title.toLowerCase().includes('celebration') ||
        i.title.toLowerCase().includes('dinner') ||
        i.title.toLowerCase().includes('meeting')
      );
    }
    if (sourceTab === 'fulfiller_escalations') {
      return (
        Boolean(i.escalationId) ||
        (i.status === 'Escalated' && !i.isEventRequest) ||
        i.ref?.startsWith('ESC') ||
        i.meta?.toLowerCase().includes('escalat')
      );
    }
    if (sourceTab === 'route') {
      return true;
    }
    return true;
  };

  const filteredBySource = all.filter(matchesSourceTab);

  const counts: Record<View, number> = {
    action: filteredBySource.filter(needsAction).length,
    guest: filteredBySource.filter((i) => i.status === 'Awaiting guest').length,
    done: filteredBySource.filter(isDone).length,
    all: filteredBySource.length,
  };

  const rows = filteredBySource.filter((i) => {
    if (view === 'action' && !needsAction(i)) return false;
    if (view === 'guest' && i.status !== 'Awaiting guest') return false;
    if (view === 'done' && !isDone(i)) return false;
    if (
      term &&
      !`${i.title} ${i.meta} ${i.ref ?? ''} ${i.room ?? ''} ${i.guestName ?? ''} ${i.description ?? ''}`
        .toLowerCase()
        .includes(term)
    )
      return false;
    return true;
  });

  // For the presentation/demo view: exactly ONE realistic example request per subsection when not searching
  const displayRows = term ? rows : rows.slice(0, 1);

  const handleAcknowledgeCase = (item: WorkItem) => {
    fdAction((s) => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const items = (s.items.front_desk_coordinator ?? []).map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: 'Acknowledged',
              history: [
                ...(i.history ?? []),
                { at: now, status: 'Acknowledged', note: 'Acknowledged by Sunita Patel (Station FD-02)' },
              ],
            }
          : i
      );
      return {
        next: { ...s, items: { ...s.items, front_desk_coordinator: items } },
        message: `Case ${item.ref || item.id} acknowledged. Guest notified via mobile portal.`,
      };
    });
    // Update local state if drawer is open
    if (selectedCase && selectedCase.id === item.id) {
      setSelectedCase((prev) => (prev ? { ...prev, status: 'Acknowledged' } : null));
    }
  };

  const handleCloseCase = (item: WorkItem, notes: string) => {
    fdAction((s) => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const items = (s.items.front_desk_coordinator ?? []).map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: 'Resolved',
              resolutionNotes: notes,
              history: [
                ...(i.history ?? []),
                { at: now, status: 'Resolved', note: `Case resolved: ${notes}` },
              ],
            }
          : i
      );
      return {
        next: {
          ...s,
          items: { ...s.items, front_desk_coordinator: items },
          feed: [
            {
              id: `feed-res-${Date.now()}`,
              at: now,
              role: 'Front Desk',
              text: `Case ${item.ref || item.id} resolved by Sunita Patel (${notes})`,
            },
            ...s.feed,
          ],
        },
        message: `Case ${item.ref || item.id} resolved and recorded in audit log.`,
      };
    });
    setSelectedCase(null);
  };

  const handleEscalateToManager = (item: WorkItem, reason: string) => {
    fdAction((s) => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const items = (s.items.front_desk_coordinator ?? []).map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: 'Escalated',
              priority: 'vip' as const,
              chip: 'Escalated to Duty Manager',
              tone: 'danger' as const,
              escalationReason: reason,
              history: [
                ...(i.history ?? []),
                { at: now, status: 'Escalated', note: `Escalated to Duty Manager: ${reason}` },
              ],
            }
          : i
      );

      const managerItem: WorkItem = {
        id: `mgr-esc-${Date.now()}`,
        ref: item.ref || item.id,
        title: `[FD ESCALATION] ${item.title}`,
        meta: `Front Desk Escalation · Room ${item.room} · ${item.guestName || 'Guest'}`,
        status: 'Escalated',
        chip: 'Duty Manager Attention',
        tone: 'danger',
        priority: 'vip',
        room: item.room,
        description: `Front Desk Coordinator Sunita Patel escalated case: ${reason}. Original issue: ${item.description}`,
        createdAt: now,
        history: [{ at: now, status: 'Escalated', note: `Received from Front Desk: ${reason}` }],
      };

      return {
        next: {
          ...s,
          items: {
            ...s.items,
            front_desk_coordinator: items,
            department_manager: [managerItem, ...(s.items.department_manager ?? [])],
          },
        },
        message: `Case ${item.ref || item.id} escalated to Duty Manager queue.`,
      };
    });
    if (selectedCase && selectedCase.id === item.id) {
      setSelectedCase((prev) => (prev ? { ...prev, status: 'Escalated' } : null));
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Row: 5 Sub-tabs on left, [+ New Case] & [Search] horizontally aligned on right */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* 5 Sub-Tabs */}
        <div role="tablist" aria-label="Request categories" className="flex flex-wrap gap-1.5">
          {REQUEST_SOURCE_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={sourceTab === t.id}
              onClick={() => setSourceTab(t.id)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
                sourceTab === t.id ? 'chip-accent' : 'border-white/10 text-mist-300 hover:bg-white/5'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* [+ New Case] button placed directly to the LEFT of the search bar on the same row */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Button
            size="sm"
            variant="accent"
            iconLeft={ClipboardPlus}
            onClick={() => setNewCaseOpen(true)}
            className="shrink-0"
          >
            + New Case
          </Button>
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400" aria-hidden />
            <label htmlFor="req-search" className="sr-only">
              Search requests
            </label>
            <input
              id="req-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Room, guest, ref or query"
              autoComplete="off"
              className="field w-full pl-9"
            />
          </div>
        </div>
      </div>

      {/* Status sub-pills row */}
      <div role="group" aria-label="Filter by status" className="flex rounded-xl border border-white/10 bg-black/20 p-0.5 w-fit max-w-full overflow-x-auto no-scrollbar">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={view === v.id}
            onClick={() => setView(v.id)}
            className={cn('rounded-lg px-2.5 sm:px-3 py-1 text-xs font-semibold shrink-0 transition', view === v.id ? 'accent-soft' : 'text-mist-400 hover:text-white')}
          >
            {v.label} <span className="tabular-nums opacity-70">{counts[v.id]}</span>
          </button>
        ))}
      </div>

      {/* Case List Display */}
      {displayRows.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-white/10 py-12 text-center">
          <Inbox className="h-6 w-6 text-mist-500" aria-hidden />
          <p className="text-sm text-mist-300">
            {term ? `Nothing matches “${query}”.` : view === 'action' ? 'All caught up. No pending items in this view.' : 'Nothing in this view.'}
          </p>
        </div>
      ) : (
        <ul key={`${view}-${sourceTab}`} className="fd-stagger space-y-3">
          {displayRows.map((item, i) => (
            <li key={item.id} style={{ '--i': Math.min(i, 8) } as CSSProperties}>
              <UnifiedRequestCard
                item={item}
                sourceTab={sourceTab}
                onOpenDetails={() => setSelectedCase(item)}
                onAcknowledge={() => handleAcknowledgeCase(item)}
                onContact={() => setContactModalItem(item)}
                onRoute={() => setRouteModalItem(item)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Comprehensive Case Details Modal / Drawer */}
      {selectedCase && (
        <CaseDetailDrawer
          item={selectedCase}
          onClose={() => setSelectedCase(null)}
          onAcknowledge={() => handleAcknowledgeCase(selectedCase)}
          onContact={() => setContactModalItem(selectedCase)}
          onRoute={() => setRouteModalItem(selectedCase)}
          onEscalate={(reason) => handleEscalateToManager(selectedCase, reason)}
          onCloseCase={(notes) => handleCloseCase(selectedCase, notes)}
          onOpenLightbox={(attachments, index) => {
            setLightboxAttachments(attachments);
            setLightboxIndex(index);
          }}
        />
      )}

      {/* Enlarged Image Review Lightbox Modal */}
      {lightboxAttachments && (
        <EnlargedLightboxModal
          attachments={lightboxAttachments}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxAttachments(null)}
          onNavigate={(idx) => setLightboxIndex(idx)}
        />
      )}

      {/* Contact Guest Modal (Simulated Phone / SMS) */}
      {contactModalItem && (
        <ContactGuestModal
          item={contactModalItem}
          onClose={() => setContactModalItem(null)}
        />
      )}

      {/* Route & Reassign Modal */}
      {routeModalItem && (
        <RouteModal
          item={routeModalItem}
          onClose={() => setRouteModalItem(null)}
        />
      )}

      {/* New Case Dialog */}
      {newCaseOpen && <NewCaseDialog onClose={() => setNewCaseOpen(false)} />}
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Unified Request Card (Clean Presentation & 1-Click Details)           */
/* --------------------------------------------------------------------- */

interface UnifiedCardProps {
  item: WorkItem;
  sourceTab: RequestSourceTab;
  onOpenDetails: () => void;
  onAcknowledge: () => void;
  onContact: () => void;
  onRoute: () => void;
}

function UnifiedRequestCard({
  item,
  sourceTab,
  onOpenDetails,
  onAcknowledge,
  onContact,
  onRoute,
}: UnifiedCardProps) {
  const done = isDone(item);
  const isAck = item.status === 'Acknowledged' || done;

  // Enrich default attachments for visual review if not present
  const attachments: CaseAttachment[] = item.attachments ?? (
    item.ref?.startsWith('CMP')
      ? [
          { id: 'att-c1', name: 'bathroom_floor_moisture.jpg', type: 'image', mime: 'image/jpeg', sizeKb: 1420, art: 'bathroom', caption: 'Damp bathroom floor upon entry' },
          { id: 'att-c2', name: 'missing_towels_rack.jpg', type: 'image', mime: 'image/jpeg', sizeKb: 980, art: 'towels', caption: 'Empty towel rack in master suite' },
        ]
      : item.ref?.startsWith('EVT')
      ? [
          { id: 'att-e1', name: 'cake_reference_design.jpg', type: 'image', mime: 'image/jpeg', sizeKb: 1850, art: 'cake', caption: '3-tier chocolate truffle cake design' },
          { id: 'att-e2', name: 'terrace_seating_layout.jpg', type: 'image', mime: 'image/jpeg', sizeKb: 2400, art: 'venue', caption: 'Requested 35-pax terrace arrangement' },
        ]
      : item.ref?.startsWith('ESC')
      ? [
          { id: 'att-esc1', name: 'vanity_pipe_seepage.jpg', type: 'image', mime: 'image/jpeg', sizeKb: 2150, art: 'leak', caption: 'Active water seepage behind vanity trap' },
        ]
      : [
          { id: 'att-req1', name: 'plush_towels_spec.jpg', type: 'image', mime: 'image/jpeg', sizeKb: 890, art: 'towels', caption: 'Requested extra plush Egyptian cotton towels' },
        ]
  );

  return (
    <div
      className="work-row transition hover:border-amber-400/30 group"
      data-priority={item.priority ?? 'normal'}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              onClick={onOpenDetails}
              className="text-sm font-semibold text-white group-hover:text-amber-200 cursor-pointer transition-colors"
            >
              {item.title}
            </h3>
            <span className="font-mono text-[10px] font-bold text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/20">
              {item.ref || item.id}
            </span>
            {item.isEventRequest && <Badge tone="accent">Event Request</Badge>}
            {item.priority === 'vip' && <Badge tone="accent">VIP Guest</Badge>}
            {attachments.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-mist-300 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full">
                <Eye className="h-3 w-3 text-amber-300" />
                <span>{attachments.length} photo{attachments.length > 1 ? 's' : ''}</span>
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-mist-400">
            {item.meta} {item.room ? `· Room ${item.room}` : ''} {item.guestName ? `· ${item.guestName}` : ''}
          </p>

          {item.description && (
            <p className="mt-1 text-xs text-mist-200 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={statusTone(item.status)}>{item.status}</Badge>
            <Badge icon={false}>{categoryOf(item)}</Badge>
            {item.chip && <Badge tone={item.tone ?? 'neutral'}>{item.chip}</Badge>}
            {item.budget !== undefined && item.budget > 0 && (
              <Badge tone="accent">Budget {money(item.budget)}</Badge>
            )}
            {item.routedTo && <Badge tone="info">{`Routed · ${item.routedTo}`}</Badge>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0 pt-2 lg:pt-0">
          {!isAck && (
            <Button
              size="sm"
              variant="subtle"
              iconLeft={CheckCircle2}
              onClick={onAcknowledge}
            >
              Acknowledge
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            iconLeft={PhoneCall}
            onClick={onContact}
          >
            Contact Guest
          </Button>

          {sourceTab === 'route' || !item.routedTo ? (
            <Button
              size="sm"
              variant="subtle"
              iconLeft={Route}
              onClick={onRoute}
            >
              Route to Dept
            </Button>
          ) : null}

          <Button
            size="sm"
            variant="accent"
            iconLeft={Eye}
            onClick={onOpenDetails}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Case Details Drawer / Modal with Gallery & Full Case Management       */
/* --------------------------------------------------------------------- */

interface CaseDetailDrawerProps {
  item: WorkItem;
  onClose: () => void;
  onAcknowledge: () => void;
  onContact: () => void;
  onRoute: () => void;
  onEscalate: (reason: string) => void;
  onCloseCase: (notes: string) => void;
  onOpenLightbox: (attachments: CaseAttachment[], index: number) => void;
}

function CaseDetailDrawer({
  item,
  onClose,
  onAcknowledge,
  onContact,
  onRoute,
  onEscalate,
  onCloseCase,
  onOpenLightbox,
}: CaseDetailDrawerProps) {
  const [resolutionInput, setResolutionInput] = useState(item.resolutionNotes || '');
  const [escalateInput, setEscalateInput] = useState('');
  const [showEscalatePrompt, setShowEscalatePrompt] = useState(false);
  const [showClosePrompt, setShowClosePrompt] = useState(false);

  // Generate attachments if not present
  const attachments: CaseAttachment[] = item.attachments ?? (
    item.ref?.startsWith('CMP')
      ? [
          { id: 'att-c1', name: 'bathroom_floor_moisture.jpg', type: 'image', mime: 'image/jpeg', sizeKb: 1420, art: 'bathroom', caption: 'Damp bathroom floor upon entry' },
          { id: 'att-c2', name: 'missing_towels_rack.jpg', type: 'image', mime: 'image/jpeg', sizeKb: 980, art: 'towels', caption: 'Empty towel rack in master suite' },
        ]
      : item.ref?.startsWith('EVT')
      ? [
          { id: 'att-e1', name: 'cake_reference_design.jpg', type: 'image', mime: 'image/jpeg', sizeKb: 1850, art: 'cake', caption: '3-tier chocolate truffle cake design' },
          { id: 'att-e2', name: 'terrace_seating_layout.jpg', type: 'image', mime: 'image/jpeg', sizeKb: 2400, art: 'venue', caption: 'Requested 35-pax terrace arrangement' },
        ]
      : item.ref?.startsWith('ESC')
      ? [
          { id: 'att-esc1', name: 'vanity_pipe_seepage.jpg', type: 'image', mime: 'image/jpeg', sizeKb: 2150, art: 'leak', caption: 'Active water seepage behind vanity trap' },
        ]
      : [
          { id: 'att-req1', name: 'plush_towels_spec.jpg', type: 'image', mime: 'image/jpeg', sizeKb: 890, art: 'towels', caption: 'Requested extra plush Egyptian cotton towels' },
        ]
  );

  const history = item.history ?? [
    { at: item.createdAt || '08:45', status: 'Submitted', note: 'Submitted by guest via Mobile Guest Portal' },
    { at: '08:46', status: 'Received', note: 'Received at Front Desk Station FD-02' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-2 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Case Details: ${item.ref || item.id}`}
        className="relative z-10 w-[95vw] sm:w-[85vw] md:w-[60vw] lg:w-[48%] max-w-2xl h-[92vh] max-h-[92vh] rounded-3xl border border-white/10 bg-ink-950/95 shadow-2xl shadow-black/90 backdrop-blur-2xl flex flex-col overflow-hidden ring-1 ring-white/10"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0 bg-white/[0.02]">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/20">
                {item.ref || item.id}
              </span>
              <Badge tone={statusTone(item.status)}>{item.status}</Badge>
              {item.priority === 'vip' && <Badge tone="accent">VIP Guest</Badge>}
            </div>
            <h2 className="text-base font-bold text-white mt-1 truncate">{item.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-mist-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close case drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Case Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar text-xs">
          {/* 1. Guest Information Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Guest Stay &amp; Contact Details
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-mist-300">
              <div>
                <span className="text-mist-400 text-[11px] block">Guest Name</span>
                <strong className="text-white text-xs">{item.guestName || 'Elena Rostova'}</strong>
              </div>
              <div>
                <span className="text-mist-400 text-[11px] block">Room Number</span>
                <strong className="text-amber-300 text-xs">Room {item.room || '402'}</strong>
              </div>
              <div>
                <span className="text-mist-400 text-[11px] block">Booking Ref</span>
                <span className="font-mono text-cyan-300 text-xs">{item.bookingRef || 'BK-7740-EL'}</span>
              </div>
              <div>
                <span className="text-mist-400 text-[11px] block">Phone / Intercom</span>
                <span className="text-mist-200 text-xs">{item.guestPhone || '+91 98201 44021'}</span>
              </div>
            </div>
          </div>

          {/* 2. Full Un-truncated Problem Statement / Description */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mist-400">
              Full Guest Description &amp; Requirements
            </span>
            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
              {item.description || item.meta}
            </p>
            {item.escalationReason && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs mt-2">
                <strong className="block text-rose-300 font-semibold mb-0.5">Escalation Note:</strong>
                {item.escalationReason}
              </div>
            )}
            <div className="pt-2 flex flex-wrap gap-4 text-[11px] text-mist-400 border-t border-white/5">
              <span>Submitted: <strong className="text-mist-200">{item.createdAt || '09:15'}</strong></span>
              <span>Preferred Service Time: <strong className="text-amber-200">{item.preferredTime || '20:00 (Evening Turndown)'}</strong></span>
              <span>Expected SLA: <strong className="text-emerald-300">{item.expectedResolution || 'Within 30 mins'}</strong></span>
            </div>
          </div>

          {/* 3. Image or Attachment Review Gallery */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Evidence &amp; Attached Images ({attachments.length})
              </span>
              <span className="text-[10px] text-mist-400">Click any thumbnail to enlarge</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {attachments.map((att, idx) => (
                <div
                  key={att.id}
                  onClick={() => onOpenLightbox(attachments, idx)}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-black/40 p-2.5 hover:border-amber-400/50 hover:bg-white/[0.05] transition-all"
                >
                  <div className="h-24 w-full rounded-lg bg-black/60 border border-white/5 flex items-center justify-center overflow-hidden relative">
                    <AttachmentArtRenderer art={att.art} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-2 py-1 rounded-md bg-black/80 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                        <Maximize2 className="h-3 w-3" /> Enlarge
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 min-w-0">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-amber-200 transition-colors">
                      {att.name}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-mist-400 mt-0.5">
                      <span>{(att.sizeKb / 1024).toFixed(1)} MB</span>
                      <span className="uppercase text-cyan-300 font-mono text-[9px]">{att.mime.split('/')[1] || 'JPG'}</span>
                    </div>
                    {att.caption && (
                      <p className="text-[10px] text-mist-300 truncate mt-0.5 italic">"{att.caption}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Chronological Case Timeline */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mist-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Case History &amp; Activity Timeline
            </span>
            <ol className="relative space-y-3 border-l border-white/15 pl-4 ml-2">
              {history.map((h, idx) => (
                <li key={`${h.at}-${idx}`} className="relative">
                  <span className="absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full border border-cyan-400 bg-ink-950" />
                  <p className="text-xs font-semibold text-white flex items-center gap-2">
                    <span>{h.status}</span>
                    <span className="text-[10px] font-normal text-mist-400 font-mono">· {h.at}</span>
                  </p>
                  {h.note && <p className="text-[11px] text-mist-300 mt-0.5 leading-relaxed">{h.note}</p>}
                </li>
              ))}
            </ol>
          </div>

          {/* Escalate Dialog Input Form */}
          {showEscalatePrompt && (
            <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 space-y-2.5 animate-fade-in">
              <span className="text-xs font-bold text-rose-300 block">
                Escalate Case to Duty Manager Marcus Vance
              </span>
              <textarea
                rows={2}
                value={escalateInput}
                onChange={(e) => setEscalateInput(e.target.value)}
                placeholder="Reason for manager escalation (e.g. guest demands refund beyond coordinator limit, or unresolved structural repair)..."
                className="field w-full text-xs"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="subtle" onClick={() => setShowEscalatePrompt(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="accent"
                  disabled={!escalateInput.trim()}
                  onClick={() => {
                    onEscalate(escalateInput.trim());
                    setShowEscalatePrompt(false);
                  }}
                >
                  Confirm Manager Escalation
                </Button>
              </div>
            </div>
          )}

          {/* Close Case Dialog Input Form */}
          {showClosePrompt && (
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-2.5 animate-fade-in">
              <span className="text-xs font-bold text-emerald-300 block">
                Close &amp; Record Resolution in Service Recovery Ledger
              </span>
              <textarea
                rows={2}
                value={resolutionInput}
                onChange={(e) => setResolutionInput(e.target.value)}
                placeholder="Required resolution details (e.g. Linens replaced, technician cleared bathroom pipe, courtesy voucher granted)..."
                className="field w-full text-xs"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="subtle" onClick={() => setShowClosePrompt(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="accent"
                  disabled={!resolutionInput.trim()}
                  onClick={() => {
                    onCloseCase(resolutionInput.trim());
                    setShowClosePrompt(false);
                  }}
                >
                  Confirm Close Case
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Action Bar Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] shrink-0 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="subtle" onClick={onClose}>
              Back
            </Button>
            <Button size="sm" variant="ghost" iconLeft={PhoneCall} onClick={onContact}>
              Contact Guest
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {item.status === 'Received' && (
              <Button size="sm" variant="subtle" iconLeft={CheckCircle2} onClick={onAcknowledge}>
                Acknowledge Receipt
              </Button>
            )}

            <Button size="sm" variant="subtle" iconLeft={Route} onClick={onRoute}>
              Forward / Route
            </Button>

            <Button
              size="sm"
              variant="subtle"
              iconLeft={Siren}
              onClick={() => setShowEscalatePrompt(true)}
            >
              Escalate
            </Button>

            {!isDone(item) && (
              <Button
                size="sm"
                variant="accent"
                iconLeft={CircleCheck}
                onClick={() => setShowClosePrompt(true)}
              >
                Close Case
              </Button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Contact Guest Modal (Simulated Call / SMS Message)                    */
/* --------------------------------------------------------------------- */

function ContactGuestModal({ item, onClose }: { item: WorkItem; onClose: () => void }) {
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [smsText, setSmsText] = useState(
    `Dear ${item.guestName || 'Guest'}, your request regarding "${item.title}" is being actively attended to by our Front Office team.`
  );
  const [smsSent, setSmsSent] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callActive) {
      timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callActive]);

  const handleSendSms = () => {
    setSmsSent(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <Modal
      title={`Contact Guest · ${item.guestName || 'Guest'}`}
      description={`Room ${item.room || 'General'} · Phone: ${item.guestPhone || '+91 98201 44021'}`}
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="accent"
            iconLeft={Send}
            disabled={smsSent}
            onClick={handleSendSms}
          >
            {smsSent ? 'SMS Dispatched!' : 'Send Guest SMS Update'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* In-Room Phone Intercom Call Card */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-between">
          <div>
            <span className="font-semibold text-white block">In-Room Phone Intercom</span>
            <p className="text-mist-400 mt-0.5">Direct line to Room {item.room} Extension</p>
          </div>
          {callActive ? (
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-mono font-bold">
                Connected ({Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')})
              </span>
              <Button size="sm" variant="subtle" onClick={() => setCallActive(false)}>
                End Call
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="accent" iconLeft={Phone} onClick={() => setCallActive(true)}>
              Dial In-Room Phone
            </Button>
          )}
        </div>

        {/* SMS / Portal Direct Notification Card */}
        <div>
          <FieldLabel htmlFor="sms-text">Guest Mobile Message / Notification Text</FieldLabel>
          <textarea
            id="sms-text"
            rows={3}
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            className="field w-full mt-1.5 resize-none text-xs"
          />
          <p className="text-[11px] text-mist-400 mt-1 italic">
            * Dispatches push message directly to guest mobile app and verified WhatsApp/SMS.
          </p>
        </div>
      </div>
    </Modal>
  );
}

/* --------------------------------------------------------------------- */
/* Route & Reassign Modal                                                */
/* --------------------------------------------------------------------- */

function RouteModal({ item, onClose }: { item: WorkItem; onClose: () => void }) {
  const { fdAction } = useDemo();
  const [dept, setDept] = useState<RouteDept>('housekeeping');
  const [assignee, setAssignee] = useState('Vikram Singh (Attendant)');
  const [instructions, setInstructions] = useState('');
  const [slaTime, setSlaTime] = useState('30m (Standard SOP)');

  const handleSubmitRouting = () => {
    fdAction((s) => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const deptLabel = ROUTE_LABEL[dept];

      const updatedFDItems = (s.items.front_desk_coordinator ?? []).map((i) =>
        i.id === item.id
          ? {
              ...i,
              routedTo: deptLabel,
              assignee,
              status: 'Forwarded',
              history: [
                ...(i.history ?? []),
                {
                  at: now,
                  status: 'Forwarded',
                  note: `Forwarded to ${deptLabel} (${assignee}). Instructions: ${instructions || 'Standard service'}`,
                },
              ],
            }
          : i
      );

      const targetItems = (s.items as Record<string, WorkItem[]>)['task_fulfiller'] ?? [];
      const departmentWorkItem: WorkItem = {
        ...item,
        id: item.id, // Preserves identical request ID!
        ref: item.ref,
        title: `[Routed] ${item.title}`,
        meta: `${deptLabel} · Room ${item.room ?? 'Hotel'} · Assigned to ${assignee}`,
        status: 'Assigned',
        assignee,
        chip: slaTime,
        tone: 'warning',
        history: [
          ...(item.history ?? []),
          { at: now, status: 'Assigned', note: `Dispatched from Front Desk to ${deptLabel}` },
        ],
      };

      return {
        next: {
          ...s,
          items: {
            ...s.items,
            front_desk_coordinator: updatedFDItems,
            task_fulfiller: [departmentWorkItem, ...targetItems.filter((t) => t.id !== item.id)],
          },
          feed: [
            {
              id: `feed-rt-${Date.now()}`,
              at: now,
              role: 'Front Desk',
              text: `Routed request ${item.ref || item.id} to ${deptLabel} (${assignee}) without duplication`,
            },
            ...s.feed,
          ],
        },
        message: `Request ${item.ref || item.id} routed to ${deptLabel}. Original ID preserved.`,
      };
    });
    onClose();
  };

  return (
    <Modal
      title="Forward / Route Request to Department"
      description="Direct service requests and complaints to the responsible department while maintaining the original request ID."
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" iconLeft={Route} onClick={handleSubmitRouting}>
            Confirm Routing
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Destination Department Selector */}
        <div>
          <FieldLabel>Select Responsible Department</FieldLabel>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            {(Object.keys(ROUTE_LABEL) as RouteDept[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDept(d);
                  if (d === 'housekeeping') setAssignee('Vikram Singh (Housekeeping)');
                  else if (d === 'maintenance') setAssignee('Wei Chen (Engineering)');
                  else if (d === 'room_service') setAssignee('Arjun Mehta (F&B Captain)');
                }}
                className={cn(
                  'flex items-center justify-between p-2.5 rounded-xl border text-left font-semibold transition',
                  dept === d
                    ? 'border-cyan-400/50 bg-cyan-500/20 text-white'
                    : 'border-white/10 bg-white/[0.02] text-mist-300 hover:bg-white/5'
                )}
              >
                <span>{ROUTE_LABEL[d]}</span>
                <span className={cn('h-2 w-2 rounded-full', dept === d ? 'bg-cyan-400' : 'bg-transparent')} />
              </button>
            ))}
          </div>
        </div>

        {/* Assignee & Expected SLA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="route-assignee">Assign Team Member</FieldLabel>
            <input
              id="route-assignee"
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="field w-full mt-1.5 text-xs"
            />
          </div>
          <div>
            <FieldLabel htmlFor="route-sla">Expected SLA Window</FieldLabel>
            <select
              id="route-sla"
              value={slaTime}
              onChange={(e) => setSlaTime(e.target.value)}
              className="field w-full mt-1.5 text-xs"
            >
              <option value="15m (Urgent Priority)">15m (Urgent Priority)</option>
              <option value="30m (Standard SOP)">30m (Standard SOP)</option>
              <option value="60m (Extended Turnaround)">60m (Extended Turnaround)</option>
            </select>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <FieldLabel htmlFor="route-instructions">Routing Instructions for Staff</FieldLabel>
          <textarea
            id="route-instructions"
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Special instructions, floor access codes, or guest timing notes..."
            className="field w-full mt-1.5 resize-none text-xs"
          />
        </div>
      </div>
    </Modal>
  );
}

/* --------------------------------------------------------------------- */
/* Enlarged Lightbox Modal with Multi-Image Navigation                   */
/* --------------------------------------------------------------------- */

function EnlargedLightboxModal({
  attachments,
  currentIndex,
  onClose,
  onNavigate,
}: {
  attachments: CaseAttachment[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}) {
  const current = attachments[currentIndex] || attachments[0];
  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Enlarged image: ${current.name}`}
        className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/15 bg-ink-950 p-5 shadow-2xl flex flex-col gap-4 animate-scale-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 truncate">
              <Eye className="h-4 w-4 text-amber-400" />
              <span>{current.name}</span>
            </h3>
            <p className="text-xs text-mist-400">
              {(current.sizeKb / 1024).toFixed(2)} MB · {current.mime} · Image {currentIndex + 1} of {attachments.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-mist-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close enlarged preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Large Image Preview Card */}
        <div className="relative h-72 sm:h-96 w-full rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden">
          <AttachmentArtRenderer art={current.art} large className="h-full w-full object-contain" />
          {attachments.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => onNavigate((currentIndex - 1 + attachments.length) % attachments.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 border border-white/20 text-white hover:bg-black hover:scale-105 transition"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate((currentIndex + 1) % attachments.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 border border-white/20 text-white hover:bg-black hover:scale-105 transition"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Caption & Metadata Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white/[0.02] p-3 rounded-xl border border-white/5">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Guest Photo Caption</span>
            <p className="text-mist-200">{current.caption || 'Photo submitted as evidence with guest service request.'}</p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button size="sm" variant="subtle" onClick={onClose}>
              Back to Case Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* New Case Dialog (Phone, Walk-in, Email)                               */
/* --------------------------------------------------------------------- */

function NewCaseDialog({ onClose }: { onClose: () => void }) {
  const { state, fdAction } = useDemo();
  const inHouse = (state.frontDesk?.stays ?? []).filter((st) => st.status === 'in_house');
  const [guest, setGuest] = useState('');
  const [room, setRoom] = useState('');
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState<'Phone' | 'Walk-in' | 'Email'>('Walk-in');
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guestOk = guest.trim().length >= 2;
  const titleOk = title.trim().length >= 3;

  function pickRoom(no: string) {
    setRoom(no);
    const stay = inHouse.find((st) => st.room === no);
    if (stay && guest.trim().length === 0) setGuest(stay.guest);
  }

  function submit() {
    setTried(true);
    if (!guestOk || !titleOk) return;
    const err = fdAction((s) => captureCase(s, { guest, room: room || undefined, title, channel, note }));
    if (err) setError(err);
    else onClose();
  }

  return (
    <Modal
      title="Capture a guest case"
      description="Phone calls and walk-ins. Front Desk is the accountable owner until it is closed."
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" iconLeft={ClipboardPlus} onClick={submit}>
            Open case
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="case-room">Room (optional)</FieldLabel>
            <select id="case-room" value={room} onChange={(e) => pickRoom(e.target.value)} className="field w-full">
              <option value="">No room</option>
              {inHouse.map((st) => (
                <option key={st.id} value={st.room}>
                  {st.room} · {st.guest}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="case-channel">Channel</FieldLabel>
            <select id="case-channel" value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} className="field w-full">
              <option>Walk-in</option>
              <option>Phone</option>
              <option>Email</option>
            </select>
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="case-guest">Guest name</FieldLabel>
          <input id="case-guest" value={guest} onChange={(e) => setGuest(e.target.value)} className="field w-full" aria-invalid={tried && !guestOk} />
          {tried && !guestOk && <p className="mt-1 text-xs text-rose-400">Enter the guest name.</p>}
        </div>
        <div>
          <FieldLabel htmlFor="case-title">What is the case about?</FieldLabel>
          <input id="case-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Needs an extra key card" className="field w-full" aria-invalid={tried && !titleOk} />
          {tried && !titleOk && <p className="mt-1 text-xs text-rose-400">Describe the case in a few words.</p>}
        </div>
        <div>
          <FieldLabel htmlFor="case-note">Note (optional)</FieldLabel>
          <textarea id="case-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="field w-full" />
        </div>
        {error && (
          <p role="alert" className="text-xs text-rose-400">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
