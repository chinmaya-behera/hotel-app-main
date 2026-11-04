'use client';

import { useState } from 'react';
import {
  BedDouble,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coffee,
  ConciergeBell,
  Filter,
  Flame,
  Flower2,
  HeartHandshake,
  History,
  Layers,
  ListChecks,
  Plus,
  Search,
  Shirt,
  Sparkles,
  Star,
  Tag,
  Truck,
  UtensilsCrossed,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { housekeepingCatalog, menuItems, spaServices, conciergeServices } from '@/lib/mockData';
import { useDemo } from '@/lib/store';
import { cn, money, statusTone } from '@/lib/utils';
import { DeliveryTracker, GuestConfirm, GuestEmptyState, GuestPill, GuestSectionHeader, StarRating, StatusTimeline } from '@/components/guest/guestUi';
import type { GuestTabProps } from '@/components/guest/types';
import type { RoleId, WorkItem } from '@/types/demo';

const TIME_SLOTS = [
  'As soon as possible (~15 mins)',
  'This morning (10:00 - 12:00)',
  'This afternoon (14:00 - 17:00)',
  'This evening (18:00 - 21:00)',
  'Tomorrow morning (08:00 - 11:00)',
];

const DEPARTMENTS = [
  { id: 'all', label: 'All Departments', icon: Layers },
  { id: 'Housekeeping', label: 'Room Service', icon: Sparkles },
  { id: 'Food & Beverage', label: 'Dining', icon: UtensilsCrossed },
  { id: 'Maintenance & Engineering', label: 'Maintenance', icon: Wrench },
  { id: 'Laundry', label: 'Laundry & Valet', icon: Shirt },
  { id: 'Front Desk', label: 'Front Desk', icon: ConciergeBell },
  { id: 'Concierge', label: 'Concierge', icon: HeartHandshake },
];

const CANCELLABLE_STATUSES = ['Unassigned', 'Acknowledged', 'Received', 'Preparing', 'Pending approval', 'Open', 'Pending'];
const DONE_STATUSES = ['Completed', 'Delivered', 'Cancelled', 'Closed', 'Resolved'];

export function BookServiceSubtab({ room, guestName }: GuestTabProps) {
  const { state, submitGuestRequest, cancelGuestItem, submitGuestFeedback } = useDemo();
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'catalog' | 'history'>('catalog');

  // Request form modal
  const [selectedService, setSelectedService] = useState<{
    id: string;
    name: string;
    department: string;
    category: string;
    price: number;
    description?: string;
  } | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [preferredTime, setPreferredTime] = useState(TIME_SLOTS[0]);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ roleId: RoleId; item: WorkItem } | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Dynamic services from store hotelServices
  const dynamicHotelServices = state.hotelServices ?? [];

  // Combine standard mock catalogs with dynamic hotel services
  const baseCatalog = [
    // Housekeeping
    ...housekeepingCatalog.map((h) => ({
      id: `hk-${h.id}`,
      name: h.name,
      department: 'Housekeeping',
      category: 'housekeeping',
      price: (h as any).price ?? 0,
      description: 'Complimentary room amenities and turndown assistance.',
      icon: Sparkles,
    })),
    // Maintenance
    {
      id: 'maint-ac',
      name: 'Air Conditioning & Climate Calibration',
      department: 'Maintenance & Engineering',
      category: 'maintenance',
      price: 0,
      description: 'Report temperature issues, ventilation airflow, or remote control faults.',
      icon: Wrench,
    },
    {
      id: 'maint-plumb',
      name: 'Plumbing & Water Temperature Assistance',
      department: 'Maintenance & Engineering',
      category: 'maintenance',
      price: 0,
      description: 'Bathroom fixtures, shower pressure, hot water flow, or drainage.',
      icon: Wrench,
    },
    {
      id: 'maint-elec',
      name: 'Electronics, Lighting & AV Support',
      department: 'Maintenance & Engineering',
      category: 'maintenance',
      price: 0,
      description: 'Smart TV connection, audio docking station, power sockets, or international adapters.',
      icon: Wrench,
    },
    // Laundry
    {
      id: 'lnd-steam',
      name: 'Express Steam Pressing (2 Garments)',
      department: 'Laundry',
      category: 'housekeeping',
      price: 450,
      description: 'Gentle wrinkle removal and garment steaming returned within 2 hours.',
      icon: Shirt,
    },
    {
      id: 'lnd-dryclean',
      name: 'Same-Day Eco Dry Cleaning',
      department: 'Laundry',
      category: 'housekeeping',
      price: 1200,
      description: 'Delicate fabric care for suits, silks, and formal gowns.',
      icon: Shirt,
    },
    // Front Desk
    {
      id: 'fd-luggage',
      name: 'Luggage & Bellhop Assistance',
      department: 'Front Desk',
      category: 'concierge',
      price: 0,
      description: 'Porter assistance for arrival bags, room moves, or vehicle loading.',
      icon: ConciergeBell,
    },
    {
      id: 'fd-print',
      name: 'Boarding Pass & Document Printing',
      department: 'Front Desk',
      category: 'concierge',
      price: 0,
      description: 'Secure printing of airline passes, visa documents, or travel itineraries.',
      icon: ConciergeBell,
    },
    // Concierge
    ...conciergeServices.map((c) => ({
      id: `conc-${c.id}`,
      name: c.name,
      department: 'Concierge',
      category: 'concierge',
      price: 0,
      description: 'Dedicated concierge coordination and personalized assistance.',
      icon: HeartHandshake,
    })),
    // Dining / Room Service popular items
    ...menuItems.slice(0, 4).map((m) => ({
      id: `rs-${m.id}`,
      name: `${m.name} (Room Dining)`,
      department: 'Food & Beverage',
      category: 'room_service',
      price: m.price,
      description: m.desc || 'Prepared fresh by executive chef and served in-room.',
      icon: UtensilsCrossed,
    })),
    // Dynamic services added by managers
    ...dynamicHotelServices
      .filter((s) => s.availableForGuest)
      .map((s) => ({
        id: s.id,
        name: s.name,
        department: s.department,
        category: (s.category as string) || 'housekeeping',
        price: s.price,
        description: s.description,
        icon: Sparkles,
      })),
  ];

  // Filter catalog
  const filteredServices = baseCatalog.filter((s) => {
    const matchesDept = selectedDept === 'all' || s.department.toLowerCase() === selectedDept.toLowerCase();
    const matchesQuery =
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesQuery;
  });

  // Extract guest requests from store items
  const seenKeys = new Set<string>();
  const guestEntries: { roleId: RoleId; item: WorkItem }[] = [];
  const rolesToCheck: RoleId[] = [
    'task_fulfiller',
    'department_dispatcher_supervisor',
    'department_dispatcher',
    'front_desk_coordinator',
    'department_supervisor',
    'department_manager',
  ];

  rolesToCheck.forEach((roleId) => {
    state.items?.[roleId]?.forEach((item) => {
      if (item.guest && item.room === room) {
        const key = item.ref ?? `${item.room}-${item.title}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          guestEntries.push({ roleId, item });
        }
      }
    });
  });

  const activeRequests = guestEntries.filter((e) => !DONE_STATUSES.includes(e.item.status));
  const completedRequests = guestEntries.filter((e) => DONE_STATUSES.includes(e.item.status));

  function handleOpenRequestModal(service: (typeof baseCatalog)[0]) {
    setSelectedService(service);
    setCustomInstructions('');
    setPreferredTime(TIME_SLOTS[0]);
  }

  function handleConfirmRequest() {
    if (!selectedService) return;

    const descParts = [
      customInstructions.trim() && `Instructions: ${customInstructions.trim()}`,
      `Preferred Time: ${preferredTime}`,
    ].filter(Boolean);

    const ref = submitGuestRequest({
      room,
      title: selectedService.name,
      meta: `${selectedService.department} · Requested via Guest Portal`,
      category: selectedService.category as any,
      description: descParts.join(' · ') || undefined,
      folioCharge: selectedService.price > 0 ? { label: selectedService.name, amount: selectedService.price } : undefined,
    });

    setConfirmedRef(ref);
    setSelectedService(null);
    setCustomInstructions('');
    setTimeout(() => setConfirmedRef(null), 6000);
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Success banner */}
      {confirmedRef && (
        <div className="guest-card flex items-start gap-2.5 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-white">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
          <div>
            <p className="font-semibold text-emerald-300">Service Request Dispatched</p>
            <p className="text-xs text-mist-200 mt-0.5">
              Reference <span className="font-mono font-bold text-white">{confirmedRef}</span>. Routed directly to the hotel team.
            </p>
          </div>
        </div>
      )}

      {/* Segment switcher: Book vs Track History */}
      <div className="flex items-center justify-between rounded-xl p-1 bg-white/[0.04] border border-white/[0.08]">
        <button
          type="button"
          onClick={() => setActiveView('catalog')}
          className={cn(
            'flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5',
            activeView === 'catalog'
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-ink-950 shadow-md'
              : 'text-mist-300 hover:text-white',
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Request New Service</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('history')}
          className={cn(
            'flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5',
            activeView === 'history'
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-ink-950 shadow-md'
              : 'text-mist-300 hover:text-white',
          )}
        >
          <History className="h-3.5 w-3.5" />
          <span>My Requests ({guestEntries.length})</span>
          {activeRequests.length > 0 && (
            <span className="grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              {activeRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeView === 'catalog' ? (
        <div className="space-y-4">
          {/* Department Filter Chips */}
          <div>
            <GuestSectionHeader title="Select Department" hint="Choose a hotel department to view available services" />
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
              {DEPARTMENTS.map((dept) => {
                const Icon = dept.icon;
                const active = selectedDept === dept.id;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setSelectedDept(dept.id)}
                    className={cn(
                      'guest-chip-btn flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition',
                      active && 'ring-2 ring-amber-400 border-amber-400/50 bg-amber-400/15 text-white',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{dept.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-mist-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services, amenities, meals, repairs..."
              className="guest-field w-full pl-9 pr-3 py-2 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-mist-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Services List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-mist-400">
              <span>{filteredServices.length} services available</span>
              {selectedDept !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedDept('all')}
                  className="text-amber-400 hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>

            {filteredServices.length === 0 ? (
              <GuestEmptyState icon={Search} title="No matching services found" hint="Try adjusting your department filter or search keyword." />
            ) : (
              <ul className="space-y-2">
                {filteredServices.map((service) => {
                  const Icon = service.icon;
                  return (
                    <li key={service.id} className="guest-card p-3.5 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="guest-surface-2 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-amber-400 mt-0.5">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white truncate">{service.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-mist-300">
                              {service.department}
                            </span>
                          </div>
                          {service.description && (
                            <p className="guest-muted text-[11px] mt-0.5 line-clamp-2">{service.description}</p>
                          )}
                          <p className="text-xs font-semibold mt-1.5" style={{ color: 'rgb(var(--a))' }}>
                            {service.price > 0 ? money(service.price) : 'Complimentary'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenRequestModal(service)}
                        className="guest-chip-btn shrink-0 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 hover:text-white"
                      >
                        Request
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : (
        /* History & Active Requests View */
        <div className="space-y-4">
          <GuestSectionHeader title="Active & Recent Requests" hint="Track fulfiller assignment, progress timeline, and service evidence" />

          {guestEntries.length === 0 ? (
            <GuestEmptyState icon={ListChecks} title="No service requests yet" hint="Browse available services and submit your first request." />
          ) : (
            <div className="space-y-4">
              {activeRequests.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">In Progress ({activeRequests.length})</span>
                  </div>
                  <ul className="space-y-2.5">
                    {activeRequests.map(({ roleId, item }) => (
                      <RequestItemRow
                        key={item.id}
                        roleId={roleId}
                        item={item}
                        expanded={expandedItemId === item.id}
                        onToggle={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                        onCancel={() => setCancelTarget({ roleId, item })}
                        onRate={(rating, comment) => submitGuestFeedback(roleId, item.id, rating, comment)}
                      />
                    ))}
                  </ul>
                </div>
              )}

              {completedRequests.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                  <span className="text-xs font-bold text-mist-400 uppercase tracking-wider">Completed / Past ({completedRequests.length})</span>
                  <ul className="space-y-2.5">
                    {completedRequests.map(({ roleId, item }) => (
                      <RequestItemRow
                        key={item.id}
                        roleId={roleId}
                        item={item}
                        expanded={expandedItemId === item.id}
                        onToggle={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                        onCancel={() => setCancelTarget({ roleId, item })}
                        onRate={(rating, comment) => submitGuestFeedback(roleId, item.id, rating, comment)}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Service Request Configuration Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-ink-900 p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">{selectedService.department}</span>
                <h3 className="text-sm font-bold text-white mt-0.5">{selectedService.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="p-1 rounded-lg text-mist-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="guest-surface-2 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-semibold text-mist-400">Tariff</span>
                <p className="font-bold text-sm text-white">
                  {selectedService.price > 0 ? `${money(selectedService.price)} (Posted to Room ${room} Folio)` : 'Complimentary'}
                </p>
              </div>

              <div>
                <label className="block text-mist-300 font-semibold mb-1">Preferred Time Window</label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white focus:border-amber-400 focus:outline-none"
                >
                  {TIME_SLOTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-mist-300 font-semibold mb-1">Special Instructions (Optional)</label>
                <textarea
                  rows={3}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Please knock lightly, leave near luggage rack, deliver extra ice..."
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-ink-950 text-white placeholder-mist-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-3 py-2 rounded-xl border border-white/10 text-mist-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRequest}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-ink-950 font-bold hover:bg-amber-300 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Submit Request</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation confirmation */}
      {cancelTarget && (
        <GuestConfirm
          title={`Cancel request ${cancelTarget.item.ref ?? cancelTarget.item.title}?`}
          body="Your request will be cancelled and the department team will be notified."
          confirmLabel="Cancel Request"
          tone="danger"
          onCancel={() => setCancelTarget(null)}
          onConfirm={() => {
            cancelGuestItem(cancelTarget.roleId, cancelTarget.item.id);
            setCancelTarget(null);
          }}
        />
      )}
    </div>
  );
}

function RequestItemRow({
  roleId,
  item,
  expanded,
  onToggle,
  onCancel,
  onRate,
}: {
  roleId: RoleId;
  item: WorkItem;
  expanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
  onRate: (rating: number, comment?: string) => void;
}) {
  const canCancel = CANCELLABLE_STATUSES.includes(item.status);
  const canRate = ['Completed', 'Delivered'].includes(item.status) && !item.feedback;
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  return (
    <li className="guest-card p-3.5 space-y-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-white truncate">{item.title}</span>
            {item.ref && <span className="font-mono text-[10px] text-amber-300 font-semibold">{item.ref}</span>}
          </div>
          <p className="guest-muted text-[11px] mt-0.5">
            {item.meta || 'Guest Portal'} {item.createdAt && `· ${item.createdAt}`}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <GuestPill tone={statusTone(item.status)}>{item.status}</GuestPill>
          <ChevronDown className={cn('h-4 w-4 text-mist-400 transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {/* Delivery tracker for room service orders */}
      {item.category === 'room_service' && item.status !== 'Cancelled' && (
        <div className="pt-1">
          <DeliveryTracker status={item.status} />
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="pt-3 border-t border-white/[0.08] space-y-3 text-xs animate-in fade-in">
          {item.description && (
            <div>
              <span className="text-[10px] uppercase font-bold text-mist-400 block mb-0.5">Instructions &amp; Details</span>
              <p className="text-mist-200 bg-white/[0.02] p-2 rounded-lg border border-white/5">{item.description}</p>
            </div>
          )}

          {item.assignee && (
            <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded-lg bg-white/[0.02]">
              <span className="text-mist-400">Assigned Fulfiller:</span>
              <span className="font-semibold text-amber-300">{item.assignee}</span>
            </div>
          )}

          {item.photoUrl && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2">
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mb-1">
                ✓ Staff Completion Photo Evidence Verified
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.photoUrl} alt="Completion evidence" className="w-full max-h-40 object-cover rounded-lg border border-white/10" />
            </div>
          )}

          {item.history && item.history.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-mist-400 block mb-1">Live Progress Audit</span>
              <StatusTimeline history={item.history} />
            </div>
          )}

          {canCancel && (
            <div className="pt-1">
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 font-semibold hover:bg-rose-500/20 text-xs"
              >
                Cancel Service Request
              </button>
            </div>
          )}

          {canRate && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
              <span className="text-xs font-semibold text-white block">Rate your service</span>
              <StarRating value={ratingVal} onChange={setRatingVal} size="sm" />
              <input
                type="text"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Optional feedback for the attendant..."
                className="guest-field w-full px-2.5 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => onRate(ratingVal, ratingComment)}
                className="w-full py-1.5 rounded-lg bg-amber-400 text-ink-950 font-bold text-xs"
              >
                Submit Feedback
              </button>
            </div>
          )}

          {item.feedback && (
            <div className="guest-surface-2 rounded-xl p-2.5 text-xs">
              <span className="text-[10px] text-mist-400 uppercase font-semibold block">Your Rating</span>
              <StarRating value={item.feedback.rating} size="sm" />
              {item.feedback.comment && <p className="text-mist-200 mt-1 italic">&ldquo;{item.feedback.comment}&rdquo;</p>}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
