'use client';

import { useState, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Bot,
  Info,
  History,
  Inbox,
  User,
  Building2,
  Reply,
  CheckCheck,
  Search,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem, DispatcherDepartment, GuestFrontDeskMessage } from '@/types/demo';

export interface ReceivedMessageItem {
  id: string;
  source: 'guest' | 'front_desk';
  room: string;
  guestName: string;
  senderLabel: string;
  subject: string;
  message: string;
  instructions?: string;
  priority: 'vip' | 'urgent' | 'normal';
  timestamp: string;
  status: 'new' | 'acknowledged' | 'in_progress' | 'replied';
  replies?: Array<{
    id: string;
    sender: 'department' | 'guest' | 'front_desk';
    senderName: string;
    text: string;
    at: string;
  }>;
}

const INITIAL_DEPARTMENT_MESSAGES: Record<DispatcherDepartment, ReceivedMessageItem[]> = {
  Housekeeping: [
    {
      id: 'hk-rcv-1',
      source: 'guest',
      room: '304',
      guestName: 'Ananya Sharma',
      senderLabel: 'Guest · In-Room Tablet',
      subject: 'Extra hypoallergenic pillows & evening turndown schedule',
      message: 'Good afternoon, could we please request two extra hypoallergenic pillows and fresh bath sheets delivered to our room? Also, if possible, we would prefer our evening turndown service around 19:30.',
      instructions: 'Ring bell gently once; infant sleeping in room.',
      priority: 'normal',
      timestamp: '10 mins ago',
      status: 'new',
      replies: [],
    },
    {
      id: 'hk-rcv-2',
      source: 'front_desk',
      room: '501',
      guestName: 'Rajesh Singhania',
      senderLabel: 'Front Desk Lead · Maya Lin',
      subject: 'VIP Arrival Rush Preparation - Presidential Suite 501',
      message: 'VIP Guest Mr. Singhania has landed early at Dabolim airport and will arrive at approximately 12:45 PM. Please perform an expedited full refresh, restock the premium bathrobes, and place the welcome orchid bouquet.',
      instructions: 'VIP Tier 1 - requires supervisor double-check inspection prior to check-in.',
      priority: 'vip',
      timestamp: '25 mins ago',
      status: 'acknowledged',
      replies: [
        {
          id: 'rep-hk-2',
          sender: 'department',
          senderName: 'Meera Nambiar (HK Supervisor)',
          text: 'Acknowledged. Senior attendant Vikram has been dispatched with fresh linen and VIP amenity setup.',
          at: '18 mins ago',
        },
      ],
    },
    {
      id: 'hk-rcv-3',
      source: 'guest',
      room: '214',
      guestName: 'David Miller',
      senderLabel: 'Guest · Mobile App',
      subject: 'Dental kits and laundry pressing bag collection',
      message: 'Hi Housekeeping, we have placed 2 formal shirts in the express laundry bag outside our door for steam pressing. Please also replenish two vanity dental kits.',
      priority: 'normal',
      timestamp: '1 hour ago',
      status: 'new',
      replies: [],
    },
    {
      id: 'hk-rcv-4',
      source: 'front_desk',
      room: '408',
      guestName: 'Kavita Reddy',
      senderLabel: 'Front Desk Agent · Arjun Mehta',
      subject: 'Special allergen sanitization protocol required',
      message: 'Guest checking into Room 408 has severe dust mite allergies. Please ensure HEPA air purifier is active, feather pillows swapped with microfibre, and carpets steam-sanitized.',
      instructions: 'Medical priority allergy protocol on guest profile.',
      priority: 'urgent',
      timestamp: '2 hours ago',
      status: 'replied',
      replies: [
        {
          id: 'rep-hk-4',
          sender: 'department',
          senderName: 'Meera Nambiar (HK Supervisor)',
          text: 'Allergen turnover complete. HEPA unit running on Floor 4, synthetic hypoallergenic bedding installed.',
          at: '1 hour ago',
        },
      ],
    },
  ],
  'Maintenance & Engineering': [
    {
      id: 'eng-rcv-1',
      source: 'guest',
      room: '402',
      guestName: 'Elena Rostova',
      senderLabel: 'Guest · Mobile Portal',
      subject: 'Living area AC thermostat error code E-3',
      message: 'Hello, the climate control digital panel in the living room is flashing code E-3 and airflow has halted. The bedroom AC unit is working fine, but the living room is getting warm. Could an engineer please check?',
      instructions: 'Guest is currently working in room; please knock before entering.',
      priority: 'urgent',
      timestamp: '8 mins ago',
      status: 'new',
      replies: [],
    },
    {
      id: 'eng-rcv-2',
      source: 'front_desk',
      room: '105',
      guestName: 'Carlos Gomez',
      senderLabel: 'Front Desk Lead · Maya Lin',
      subject: 'Urgent: Master bathroom low hot water pressure',
      message: 'Guest in 105 called front desk stating the hot water in the master shower takes over 5 minutes to heat up and water pressure is very weak. Please dispatch an on-duty plumber/engineer to inspect thermostatic mixing valve.',
      priority: 'urgent',
      timestamp: '30 mins ago',
      status: 'in_progress',
      replies: [
        {
          id: 'rep-eng-2',
          sender: 'department',
          senderName: 'Kiran Rao (Lead Engineer)',
          text: 'Attending now. Pressure regulator valve on Floor 1 riser is being calibrated.',
          at: '20 mins ago',
        },
      ],
    },
    {
      id: 'eng-rcv-3',
      source: 'guest',
      room: '203',
      guestName: 'Rohan Gupta',
      senderLabel: 'Guest · Smart TV Screen',
      subject: 'TV Remote battery replacement & media hub assistance',
      message: 'The remote control for the TV seems to have dead batteries. Also need assistance switching the wall media hub to HDMI 2 for work presentation on the smart monitor.',
      priority: 'normal',
      timestamp: '45 mins ago',
      status: 'new',
      replies: [],
    },
    {
      id: 'eng-rcv-4',
      source: 'front_desk',
      room: '318',
      guestName: 'Sophie Dubois',
      senderLabel: 'Front Desk Agent · Arjun Mehta',
      subject: 'RFID Smart Lock telemetry battery warning (<10%)',
      message: 'BMS door lock telemetry flagged low battery warning on Room 318 mortise lock. Door operates normally for now, but lithium battery pack must be swapped before evening turnover.',
      priority: 'normal',
      timestamp: '1 hour ago',
      status: 'acknowledged',
      replies: [],
    },
  ],
  'Food & Beverages': [
    {
      id: 'fnb-rcv-1',
      source: 'guest',
      room: '502',
      guestName: 'Vikram Sethi',
      senderLabel: 'Guest · Mobile Portal',
      subject: 'Pre-order for in-room breakfast at 07:30 AM',
      message: 'Good evening! We have an early scuba excursion tomorrow. Could we pre-order 2 Continental breakfast sets (fresh orange juice, sourdough toast, black coffee, and fruit bowls) delivered to our room promptly at 07:30 AM?',
      instructions: 'Dietary note: One guest is lactose intolerant (almond milk preferred).',
      priority: 'normal',
      timestamp: '15 mins ago',
      status: 'new',
      replies: [],
    },
    {
      id: 'fnb-rcv-2',
      source: 'front_desk',
      room: '405',
      guestName: 'Aakash & Natasha Kapoor',
      senderLabel: 'Front Desk Coordinator · Arjun Mehta',
      subject: 'Honeymoon Amenity delivery - Moët & Chandon with berries',
      message: 'Honeymoon couple in Suite 405 has just completed check-in at the desk. Please dispatch the chilled champagne bucket, flutes, and handcrafted chocolate dipped strawberries immediately.',
      instructions: 'Complimentary GM welcome greeting card attached at concierge desk.',
      priority: 'vip',
      timestamp: '20 mins ago',
      status: 'in_progress',
      replies: [
        {
          id: 'rep-fnb-2',
          sender: 'department',
          senderName: 'Chef Rahul (F&B Lead)',
          text: 'Sommelier has prepared Moët Impérial on crushed ice with strawberry platter. Server en route to Room 405.',
          at: '12 mins ago',
        },
      ],
    },
    {
      id: 'fnb-rcv-3',
      source: 'guest',
      room: '112',
      guestName: 'Sarah Jenkins',
      senderLabel: 'Guest · In-App Order',
      subject: 'Late night ice bucket & extra crystal glassware',
      message: 'Could we please get an ice bucket with stainless tongs and 4 highball crystal glasses delivered to Room 112? Thank you so much!',
      priority: 'normal',
      timestamp: '35 mins ago',
      status: 'new',
      replies: [],
    },
    {
      id: 'fnb-rcv-4',
      source: 'front_desk',
      room: '307',
      guestName: 'Michael Chang',
      senderLabel: 'Front Desk Lead · Maya Lin',
      subject: 'Room dining tray clearance & fresh water carafes',
      message: 'Guest finished dinner tray from room service and requested tray clearance from room hallway along with two chilled Himalayan mineral water carafes.',
      priority: 'normal',
      timestamp: '1 hour ago',
      status: 'replied',
      replies: [
        {
          id: 'rep-fnb-4',
          sender: 'department',
          senderName: 'F&B Dispatcher',
          text: 'Hallway tray cleared and mineral water delivered to guest.',
          at: '45 mins ago',
        },
      ],
    },
  ],
  Wellness: [
    {
      id: 'wel-rcv-1',
      source: 'guest',
      room: '401',
      guestName: 'Meera Roy',
      senderLabel: 'Guest · Mobile Portal',
      subject: 'Couples Ayurvedic Abhyanga Massage reservation inquiry',
      message: 'Namaste, my partner and I would love to book the 90-minute signature Ayurvedic Abhyanga therapy for two this afternoon around 16:30. Are master therapists available?',
      instructions: 'Prefers warm sesame & sandalwood herbal formulation.',
      priority: 'vip',
      timestamp: '12 mins ago',
      status: 'new',
      replies: [],
    },
    {
      id: 'wel-rcv-2',
      source: 'front_desk',
      room: '209',
      guestName: 'Pooja Bhatt',
      senderLabel: 'Front Desk Lead · Maya Lin',
      subject: 'Private Sunrise Beach Yoga booking for tomorrow 07:00 AM',
      message: 'Front Desk booking request: Guest in Room 209 wants to confirm a 1-on-1 private yoga instructor at the beach pavilion for 07:00 AM tomorrow. Please confirm instructor roster.',
      priority: 'normal',
      timestamp: '40 mins ago',
      status: 'acknowledged',
      replies: [
        {
          id: 'rep-wel-2',
          sender: 'department',
          senderName: 'Ananya (Spa Lead)',
          text: 'Master Yogi Devendra confirmed for 07:00 AM at the Beach Pavilion. Mat and props prepared.',
          at: '30 mins ago',
        },
      ],
    },
    {
      id: 'wel-rcv-3',
      source: 'guest',
      room: '305',
      guestName: 'John Miller',
      senderLabel: 'Guest · Smart Tablet',
      subject: 'Sauna & Hydrotherapy steam timings tonight',
      message: 'Could you please let us know what time the wellness hydrotherapy circuit and cedar sauna close tonight, and whether booking an evening slot is required?',
      priority: 'normal',
      timestamp: '50 mins ago',
      status: 'new',
      replies: [],
    },
    {
      id: 'wel-rcv-4',
      source: 'front_desk',
      room: '502',
      guestName: 'Vikram Sethi',
      senderLabel: 'Front Desk Agent · Arjun Mehta',
      subject: 'Aromatherapy bath salt basket delivered to Suite',
      message: 'VIP guest in Suite 502 requested signature eucalyptus-lavender bath salts and organic essential oils to be delivered to their suite bathroom.',
      priority: 'vip',
      timestamp: '1 hour ago',
      status: 'replied',
      replies: [
        {
          id: 'rep-wel-4',
          sender: 'department',
          senderName: 'Spa Reception',
          text: 'Bath salt basket with burner and diffuser delivered to Suite 502.',
          at: '50 mins ago',
        },
      ],
    },
  ],
};

const AUTOMATED_TEMPLATES = [
  {
    id: 'dispatched',
    label: 'Request Dispatched & En Route',
    category: 'Dispatch',
    template: (room: string, title: string, assignee: string) =>
      `Namaste from Grand Azure. Your request for "${title}" has been assigned to attendant ${assignee || 'our team'} and is now on the way to Room ${room}. Expected arrival in ~5–10 minutes.`,
  },
  {
    id: 'in_progress',
    label: 'Service In Progress',
    category: 'Status Update',
    template: (room: string, title: string, assignee: string) =>
      `Dear Guest, attendant ${assignee || 'our team'} has commenced work on "${title}" in Room ${room}. We will notify you once completed.`,
  },
  {
    id: 'inspected',
    label: 'Quality Inspection Passed',
    category: 'Quality Assurance',
    template: (room: string) =>
      `Dear Guest, your room ${room} has been personally inspected and approved to Grand Azure 5-star quality standards by Supervisor Meera Nambiar.`,
  },
  {
    id: 'completed',
    label: 'Service Completed',
    category: 'Completion',
    template: (room: string, title: string) =>
      `Dear Guest, your request for "${title}" has been completed. Please let us know if you require any further assistance. Dial 0 or reach out via your portal.`,
  },
  {
    id: 'turnaround_delay',
    label: 'Friendly Courtesy Notice',
    category: 'Alert',
    template: (room: string, title: string) =>
      `Dear Guest, thank you for your patience while we prepare your request for "${title}". Our team is ensuring every detail meets our luxury standards.`,
  },
];

export interface DispatcherGuestMessagesTabProps {
  activeDept?: DispatcherDepartment;
}

export function DispatcherGuestMessagesTab({ activeDept }: DispatcherGuestMessagesTabProps = {}) {
  const { state, simulateGuestMessage, replyGuestMessage } = useDemo();
  const currentDept: DispatcherDepartment = activeDept || state.activeDispatcherDept || 'Housekeeping';

  // Per-department received messages state
  const [departmentMessages, setDepartmentMessages] = useState<Record<DispatcherDepartment, ReceivedMessageItem[]>>(
    INITIAL_DEPARTMENT_MESSAGES
  );

  // Filters for Received Messages Block
  const [sourceFilter, setSourceFilter] = useState<'all' | 'guest' | 'front_desk'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'acknowledged' | 'replied'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick reply inline state
  const [replyingMessageId, setReplyingMessageId] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState<string>('');
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Composer state
  const allTasks = [
    ...(state.items.department_dispatcher_supervisor ?? []),
    ...(state.items.department_dispatcher ?? []),
  ].filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

  const activeTasks = allTasks.filter((t) => t.status !== 'Completed' && t.room);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(activeTasks[0]?.id || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(AUTOMATED_TEMPLATES[0].id);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [sentSuccessAlert, setSentSuccessAlert] = useState<string | null>(null);

  const currentTask = allTasks.find((t) => t.id === selectedTaskId) || activeTasks[0];
  const currentTemplate = AUTOMATED_TEMPLATES.find((tpl) => tpl.id === selectedTemplateId) || AUTOMATED_TEMPLATES[0];

  const targetRoom = currentTask?.room || '402';
  const targetTitle = currentTask?.title || 'Room Service';
  const targetAssignee = currentTask?.assignee || 'Attendant Vikram';

  const previewText = isCustomMode
    ? customMessage
    : currentTemplate.template(targetRoom, targetTitle, targetAssignee);

  // Trigger feedback banner
  const showActionFeedback = (msg: string) => {
    setActionSuccessToast(msg);
    setTimeout(() => setActionSuccessToast(null), 4000);
  };

  // Get active messages for this department
  const currentDeptMessages = departmentMessages[currentDept] || [];

  // Filtered received messages
  const filteredReceivedMessages = useMemo(() => {
    return currentDeptMessages.filter((msg) => {
      // Source filter
      if (sourceFilter !== 'all' && msg.source !== sourceFilter) return false;
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'new' && msg.status !== 'new') return false;
        if (statusFilter === 'acknowledged' && msg.status !== 'acknowledged' && msg.status !== 'in_progress') return false;
        if (statusFilter === 'replied' && msg.status !== 'replied') return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesRoom = msg.room.toLowerCase().includes(query);
        const matchesGuest = msg.guestName.toLowerCase().includes(query);
        const matchesSubject = msg.subject.toLowerCase().includes(query);
        const matchesText = msg.message.toLowerCase().includes(query);
        const matchesSender = msg.senderLabel.toLowerCase().includes(query);
        return matchesRoom || matchesGuest || matchesSubject || matchesText || matchesSender;
      }
      return true;
    });
  }, [currentDeptMessages, sourceFilter, statusFilter, searchQuery]);

  // Counts
  const totalCount = currentDeptMessages.length;
  const guestCount = currentDeptMessages.filter((m) => m.source === 'guest').length;
  const frontDeskCount = currentDeptMessages.filter((m) => m.source === 'front_desk').length;
  const unreadCount = currentDeptMessages.filter((m) => m.status === 'new').length;

  // Acknowledge a message
  const handleAcknowledge = (msgId: string) => {
    const target = currentDeptMessages.find((m) => m.id === msgId);
    setDepartmentMessages((prev) => ({
      ...prev,
      [currentDept]: prev[currentDept].map((m) =>
        m.id === msgId ? { ...m, status: 'acknowledged' as const } : m
      ),
    }));
    showActionFeedback(`Message from ${target?.source === 'guest' ? `Room ${target.room} (${target.guestName})` : target?.senderLabel} marked as Acknowledged.`);
  };

  // Send reply to a message
  const handleSendReply = (msgId: string) => {
    if (!replyInputText.trim()) return;
    const target = currentDeptMessages.find((m) => m.id === msgId);
    const replyText = replyInputText.trim();

    const newReply = {
      id: `rep-${Date.now()}`,
      sender: 'department' as const,
      senderName: `${currentDept} Supervisor (Meera Nambiar)`,
      text: replyText,
      at: 'Just now',
    };

    setDepartmentMessages((prev) => ({
      ...prev,
      [currentDept]: prev[currentDept].map((m) =>
        m.id === msgId
          ? {
              ...m,
              status: 'replied' as const,
              replies: [...(m.replies ?? []), newReply],
            }
          : m
      ),
    }));

    // If connected to global store front desk messages
    if (replyGuestMessage) {
      try {
        replyGuestMessage(msgId, replyText, 'front_desk');
      } catch {
        // Safe fallback
      }
    }

    setReplyInputText('');
    setReplyingMessageId(null);
    showActionFeedback(`Reply sent directly to ${target?.source === 'guest' ? `Room ${target.room} Guest` : 'Front Desk coordinator'}.`);
  };

  // Load message into composer below for simulated push update
  const handleLoadIntoComposer = (msg: ReceivedMessageItem) => {
    setIsCustomMode(true);
    setCustomMessage(
      `Dear ${msg.guestName} (Room ${msg.room}), your request regarding "${msg.subject}" has been received by ${currentDept}. Attendant Vikram has been assigned and is attending to this promptly.`
    );
    showActionFeedback(`Loaded Room ${msg.room} context into Message Composer below.`);
    const composerElem = document.getElementById('message-composer-section');
    if (composerElem) {
      composerElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  function handleSendSimulation(e: React.FormEvent) {
    e.preventDefault();
    if (!previewText.trim()) return;

    simulateGuestMessage({
      taskId: currentTask?.id,
      room: targetRoom,
      guestName: currentTask?.room ? `Guest of Room ${currentTask.room}` : 'Valued Guest',
      templateType: isCustomMode ? 'Custom Message' : currentTemplate.label,
      messageText: previewText.trim(),
    });

    setSentSuccessAlert(`Automated update dispatched to Room ${targetRoom} (Simulated In-App Push)`);
    setTimeout(() => setSentSuccessAlert(null), 4000);
  }

  const messageLog = state.guestMessages ?? [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-pulse" />
            <h1 className="text-xl font-bold font-display text-white">
              Guest Messages & Front Desk Communications
            </h1>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {currentDept}
            </span>
          </div>
          <p className="text-xs text-mist-300 mt-1">
            Review incoming requests from guests and directives from Front Desk, or dispatch simulated status updates to guest in-room tablets.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="rounded-full px-3 py-1 bg-white/[0.04] border border-white/10 text-mist-300">
            {unreadCount} unread / {totalCount} received
          </span>
          <span className="rounded-full px-3 py-1 bg-white/[0.04] border border-white/10 text-mist-300">
            {messageLog.length} dispatches logged
          </span>
        </div>
      </div>

      {/* Action Toast Feedback */}
      {actionSuccessToast && (
        <div className="p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="font-medium">{actionSuccessToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. RECEIVED MESSAGES BLOCK (GUEST & FRONT DESK)                            */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-5">
        {/* Block Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-display text-white">Received Messages</h2>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Guest & Front Desk
                  </span>
                </div>
                <p className="text-xs text-mist-400">
                  Direct requests from hotel guests and prioritized directives from Front Desk for <strong className="text-mist-200">{currentDept}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-mist-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Guests: <strong className="text-white">{guestCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-mist-300">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <span>Front Desk: <strong className="text-white">{frontDeskCount}</strong></span>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold animate-pulse">
                <span>{unreadCount} New / Unread</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Source Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setSourceFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                sourceFilter === 'all'
                  ? 'bg-purple-500 text-ink-950 font-bold shadow-sm'
                  : 'text-mist-400 hover:text-white'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('guest')}
              className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
                sourceFilter === 'guest'
                  ? 'bg-emerald-500 text-ink-950 font-bold shadow-sm'
                  : 'text-mist-400 hover:text-white'
              }`}
            >
              <User className="h-3 w-3" />
              <span>From Guests ({guestCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('front_desk')}
              className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
                sourceFilter === 'front_desk'
                  ? 'bg-sky-500 text-ink-950 font-bold shadow-sm'
                  : 'text-mist-400 hover:text-white'
              }`}
            >
              <Building2 className="h-3 w-3" />
              <span>Front Desk ({frontDeskCount})</span>
            </button>
          </div>

          {/* Status filter & Search Bar */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-xs text-mist-300 focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Statuses</option>
              <option value="new">New / Unread</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="replied">Replied</option>
            </select>

            <div className="relative min-w-[180px] sm:min-w-[220px]">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-mist-500" />
              <input
                type="text"
                placeholder="Search room, guest, text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-ink-950 pl-8 pr-3 py-2 text-xs text-white placeholder-mist-600 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>
        </div>

        {/* Received Message List */}
        {filteredReceivedMessages.length === 0 ? (
          <div className="py-12 text-center text-mist-500 space-y-2 text-xs border border-dashed border-white/10 rounded-2xl">
            <Inbox className="h-8 w-8 mx-auto text-mist-600" />
            <p className="font-semibold text-mist-400">No received messages found matching current filters.</p>
            <p className="text-[11px] text-mist-600">Try clearing the search query or selecting &quot;All&quot;.</p>
            {(sourceFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSourceFilter('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline font-medium"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReceivedMessages.map((msg) => {
              const isGuest = msg.source === 'guest';
              const isReplying = replyingMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`rounded-2xl border transition p-4 sm:p-5 space-y-3.5 ${
                    msg.status === 'new'
                      ? 'border-purple-400/40 bg-purple-500/[0.04] shadow-md shadow-purple-500/5'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  {/* Message Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Sender Type Badge */}
                      {isGuest ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <User className="h-3 w-3" />
                          <span>Guest</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          <Building2 className="h-3 w-3" />
                          <span>Front Desk Directive</span>
                        </span>
                      )}

                      {/* Room Badge */}
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-white/10 text-white border border-white/15">
                        Room {msg.room}
                      </span>

                      {/* Guest or Sender Name */}
                      <span className="text-xs font-semibold text-white">
                        {msg.guestName}
                      </span>

                      <span className="text-[11px] text-mist-500 hidden md:inline">·</span>
                      <span className="text-[11px] text-mist-400 hidden md:inline">
                        {msg.senderLabel}
                      </span>

                      {/* Priority Tag */}
                      {msg.priority === 'vip' && (
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          VIP
                        </span>
                      )}
                      {msg.priority === 'urgent' && (
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                          Urgent
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {/* Timestamp */}
                      <span className="text-[11px] text-mist-400 font-mono flex items-center gap-1">
                        <Clock className="h-3 w-3 text-mist-500" />
                        {msg.timestamp}
                      </span>

                      {/* Status Badge */}
                      {msg.status === 'new' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          New
                        </span>
                      )}
                      {msg.status === 'acknowledged' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Acknowledged
                        </span>
                      )}
                      {msg.status === 'in_progress' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          In Progress
                        </span>
                      )}
                      {msg.status === 'replied' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Replied
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <h3 className="text-sm font-bold text-white leading-snug">
                    {msg.subject}
                  </h3>

                  {/* Message Body */}
                  <div className="p-3.5 rounded-xl bg-ink-950/70 border border-white/5 text-xs text-mist-200 leading-relaxed">
                    &ldquo;{msg.message}&rdquo;
                  </div>

                  {/* Special Instructions Callout (if present) */}
                  {msg.instructions && (
                    <div className="p-2.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300 font-semibold">Special Instructions:</strong>{' '}
                        <span>{msg.instructions}</span>
                      </div>
                    </div>
                  )}

                  {/* Existing Replies Thread (if any) */}
                  {msg.replies && msg.replies.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <span className="text-[10px] font-mono font-bold uppercase text-mist-500 tracking-wider">
                        Response Thread ({msg.replies.length})
                      </span>
                      {msg.replies.map((rep) => (
                        <div
                          key={rep.id}
                          className="p-3 rounded-xl bg-purple-500/[0.05] border border-purple-500/15 text-xs space-y-1 ml-3"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-purple-300">{rep.senderName}</span>
                            <span className="text-mist-500 font-mono text-[10px]">{rep.at}</span>
                          </div>
                          <p className="text-mist-200 text-xs leading-relaxed">{rep.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      {/* Quick Reply Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isReplying) {
                            setReplyingMessageId(null);
                          } else {
                            setReplyingMessageId(msg.id);
                            setReplyInputText(
                              isGuest
                                ? `Dear ${msg.guestName}, thank you for contacting ${currentDept}. We have assigned our team to attend to your request for "${msg.subject}".`
                                : `Acknowledged from ${currentDept}. Attendant assigned and proceeding.`
                            );
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                          isReplying
                            ? 'bg-purple-500 text-ink-950 font-bold'
                            : 'bg-white/[0.04] text-mist-300 hover:text-white hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        <Reply className="h-3.5 w-3.5" />
                        <span>{isReplying ? 'Close Reply Box' : 'Quick Reply'}</span>
                      </button>

                      {/* Acknowledge Button */}
                      {msg.status === 'new' && (
                        <button
                          type="button"
                          onClick={() => handleAcknowledge(msg.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] text-mist-300 hover:text-emerald-300 hover:bg-emerald-500/10 border border-white/10 transition flex items-center gap-1.5"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Acknowledge</span>
                        </button>
                      )}
                    </div>

                    {/* Pre-fill composer below */}
                    <button
                      type="button"
                      onClick={() => handleLoadIntoComposer(msg)}
                      className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition"
                    >
                      <span>Dispatch Update in Composer</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Inline Reply Editor (Expanded) */}
                  {isReplying && (
                    <div className="p-3.5 rounded-2xl bg-ink-950/90 border border-purple-400/30 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-purple-300">
                          Replying to {isGuest ? `Guest ${msg.guestName} (Room ${msg.room})` : msg.senderLabel}
                        </span>
                        <span className="text-[11px] text-mist-500 font-mono">
                          Sender: {currentDept} Supervisor
                        </span>
                      </div>

                      <textarea
                        rows={3}
                        value={replyInputText}
                        onChange={(e) => setReplyInputText(e.target.value)}
                        placeholder="Type response back to guest or front desk..."
                        className="w-full rounded-xl border border-white/10 bg-ink-900 p-3 text-xs text-white placeholder-mist-600 focus:outline-none focus:border-purple-400 leading-relaxed"
                      />

                      <div className="flex items-center justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingMessageId(null);
                            setReplyInputText('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.04] text-mist-400 hover:text-white transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendReply(msg.id)}
                          className="px-4 py-1.5 rounded-xl bg-purple-500 text-ink-950 font-bold hover:bg-purple-400 transition flex items-center gap-1.5 shadow-md shadow-purple-500/20"
                        >
                          <Send className="h-3 w-3" />
                          <span>Send Response</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mandatory Frontend Simulation Disclaimer */}
      <div className="p-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] flex items-start gap-3 text-xs text-mist-300">
        <Info className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-200">Frontend Simulation Only:</strong> Automated guest communications and status updates are simulated inside browser state and mirrored into the Guest Portal and activity feed. No actual SMS gateways or external telco networks are triggered.
        </div>
      </div>

      {sentSuccessAlert && (
        <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{sentSuccessAlert}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MESSAGE COMPOSER & DISPATCHED LOG SECTION                               */}
      {/* ========================================================================= */}
      <div id="message-composer-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Message Composer Form */}
        <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-400" />
              <h2 className="text-base font-bold font-display text-white">Message Composer</h2>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
              {currentDept} Automation
            </span>
          </div>

          <form onSubmit={handleSendSimulation} className="space-y-4 text-xs">
            {/* Target Request Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-mist-300">Target Guest Request / Room Stay</label>
              <select
                value={selectedTaskId}
                onChange={(e) => {
                  setSelectedTaskId(e.target.value);
                  setIsCustomMode(false);
                }}
                className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-white focus:outline-none focus:border-purple-400"
              >
                {activeTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    Room {t.room} · {t.title} ({t.status}) · {t.assignee || 'Unassigned'}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Selector Pills */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-mist-300">Automated Message Template</label>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(!isCustomMode)}
                  className="text-[11px] text-purple-300 hover:text-white underline"
                >
                  {isCustomMode ? 'Use Preset Template' : 'Write Custom Message'}
                </button>
              </div>

              {!isCustomMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AUTOMATED_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        selectedTemplateId === tpl.id
                          ? 'border-purple-400 bg-purple-500/10 text-white font-semibold'
                          : 'border-white/5 bg-white/[0.02] text-mist-400 hover:border-white/10'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-purple-300 block">
                        {tpl.category}
                      </span>
                      <span className="text-xs">{tpl.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Live Preview Box / Editor */}
            <div className="space-y-1.5">
              <label className="font-semibold text-mist-300">
                {isCustomMode ? 'Custom Message Text' : 'Rendered Simulated Message Preview'}
              </label>

              {isCustomMode ? (
                <textarea
                  rows={4}
                  placeholder="Type simulated message to guest..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-ink-950 p-3 text-white placeholder-mist-600 focus:outline-none focus:border-purple-400"
                />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-mist-400 border-b border-white/5 pb-2">
                    <span>To: Room {targetRoom} (Guest Portal / Simulated SMS)</span>
                    <span className="font-mono text-purple-300 font-bold">Auto-populated</span>
                  </div>
                  <p className="text-white text-xs leading-relaxed italic bg-ink-950/60 p-3 rounded-xl border border-white/5">
                    &ldquo;{previewText}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-purple-500 text-ink-950 text-xs font-bold hover:bg-purple-400 transition shadow-lg shadow-purple-500/20 active:scale-95 flex items-center gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Dispatch Simulated Message</span>
              </button>
            </div>
          </form>
        </div>

        {/* Recent Automated Message Log */}
        <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-ink-900/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-mist-400" />
              <h2 className="text-base font-bold font-display text-white">Dispatched Log</h2>
            </div>
            <span className="text-[11px] font-mono text-mist-400">Simulated Feed</span>
          </div>

          {messageLog.length === 0 ? (
            <div className="py-12 text-center text-mist-500 space-y-2 text-xs">
              <MessageSquare className="h-7 w-7 mx-auto text-mist-600" />
              <p>No automated guest messages sent yet during this session.</p>
              <p className="text-[11px] text-mist-600">Choose a template on the left to trigger a simulated guest notice.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto no-scrollbar">
              {messageLog.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Room {log.room}</span>
                    <span className="text-[10px] text-mist-400 font-mono">{log.sentAt}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-purple-300 px-2 py-0.5 rounded-full bg-purple-500/10 inline-block">
                    {log.templateType}
                  </span>
                  <p className="text-mist-300 text-[11px] leading-relaxed italic bg-ink-950/40 p-2 rounded-xl border border-white/5">
                    &ldquo;{log.messageText}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-mist-500 pt-1">
                    <span>Sender: {log.sender}</span>
                    <span className="text-emerald-400 font-semibold">{log.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
