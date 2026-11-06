'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  ShieldAlert,
  KeyRound,
  ArrowRightLeft,
  DollarSign,
  PhoneCall,
  UserCheck,
  Search,
  Clock,
  AlertTriangle,
  BadgePercent,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Printer,
  X,
  ExternalLink,
  ShieldCheck,
  Building2,
  Wrench,
  Scale,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { Modal } from '@/components/frontdesk/Modal';
import { useDemo } from '@/lib/store';
import { cn, money } from '@/lib/utils';
import type { DepartmentServicePolicy } from '@/types/demo';

export interface ComprehensivePolicy {
  id: string;
  code: string;
  department: 'Front Office' | 'Financial & Recovery' | 'Security & Safety' | 'Operations & Engineering';
  category: 'Operating Procedure' | 'Guest Recovery' | 'Escalation Threshold' | 'Service Standard';
  title: string;
  scope: string;
  authorityLimit?: number;
  summary: string;
  checklist: string[];
  escalationTarget: string;
  policyOwner: string;
  effectiveDate: string;
  lastUpdated: string;
}

const FRONT_DESK_POLICIES: ComprehensivePolicy[] = [
  {
    id: 'pol-fo-101',
    code: 'POL-FO-101',
    department: 'Front Office',
    category: 'Operating Procedure',
    title: 'Mandatory Government Photo ID & Verification Protocol',
    scope: 'Front Desk Counter, Pre-Arrival & Mobile Check-In',
    summary: 'Prior to issuing physical RFID keycards or releasing active digital mobile passes, Front Desk staff must visually inspect a valid government-issued photo ID (Passport for international guests; Driver License / National ID for domestic guests) matching the booking reservation.',
    checklist: [
      'Inspect physical photo ID matching primary guest name on booking record.',
      'For foreign nationals, verify passport validity and visa / entry stamp.',
      'Check in-house PMS status and verify credit card pre-authorization before key encoding.',
      'Duplicate or replacement keys require in-person ID re-verification; no room keys issued based on verbal requests.',
    ],
    escalationTarget: 'Escalate identity discrepancies, fraudulent documents, or unauthorized key requests to Duty Manager & Security immediately.',
    policyOwner: 'Lead Front Desk Coordinator (Sunita Patel)',
    effectiveDate: '2026-01-01',
    lastUpdated: '2026-10-29',
  },
  {
    id: 'pol-fo-102',
    code: 'POL-FO-102',
    department: 'Front Office',
    category: 'Operating Procedure',
    title: 'Check-In, Check-Out Hours & Tiered Early Arrival Pricing',
    scope: 'Property-Wide Arrivals & Departures',
    summary: 'Standard check-in begins at 15:00 and check-out is strictly at 11:00. Early arrivals and late departures follow established fee structures and complimentary courtesy windows based on inspected room readiness.',
    checklist: [
      'Standard Check-In: 15:00 | Standard Check-Out: 11:00 (RFID passes auto-expire at 11:00).',
      'Arrival between 11:00–13:00: Tiered early check-in fee of ₹1,500 ($20) applies.',
      'Arrival after 13:00: Complimentary early check-in permitted if room status is "Ready".',
      'Arrival before 11:00: Requires 50% day-use room rate subject to inventory availability.',
      'Late check-out up to 13:00: Complimentary for VIP Chairman & Ambassador guests upon prior request.',
    ],
    escalationTarget: 'Discretionary fee waivers exceeding ₹1,500 must be noted on guest folio with reason code.',
    policyOwner: 'Front Office Manager (Maya Lin)',
    effectiveDate: '2026-03-15',
    lastUpdated: '2026-10-25',
  },
  {
    id: 'pol-rec-201',
    code: 'POL-REC-201',
    department: 'Financial & Recovery',
    category: 'Guest Recovery',
    title: 'Autonomous Front Desk Discretionary Goodwill Compensation Authority',
    scope: 'Front Desk Counter, Billing & Service Recovery',
    authorityLimit: 2500,
    summary: 'Front Desk operators possess autonomous authority to issue immediate service recovery credits, folio discounts, dining vouchers, or amenity waivers up to ₹2,500 ($150) per stay to resolve guest service defects without manager pre-approval.',
    checklist: [
      'Autonomous threshold: up to ₹2,500 ($150) per room stay.',
      'Valid triggers: Housekeeping turnover delays >30 mins, minor noise disturbances, minibar discrepancies, or amenity defects.',
      'Actionable remedies: Folio room rate credit, complimentary breakfast voucher, or waived early arrival fee.',
      'Audit rule: Always log customer complaint reference and reason in PMS notes upon credit issuance.',
    ],
    escalationTarget: 'Proposed service compensation exceeding ₹2,500 must be routed to Duty Manager Marcus Vance.',
    policyOwner: 'Front Desk Coordinator & Duty Manager',
    effectiveDate: '2026-07-01',
    lastUpdated: '2026-10-30',
  },
  {
    id: 'pol-fo-103',
    code: 'POL-FO-103',
    department: 'Front Office',
    category: 'Operating Procedure',
    title: 'Room Move & Emergency Relocation Protocol',
    scope: 'In-House Guests & Maintenance Relocations',
    summary: 'Front Desk may initiate room relocations only to vacant, inspected ("ready") rooms when prompted by maintenance faults, persistent noise, safety concerns, or approved guest upgrades. The previous room access session is immediately revoked.',
    checklist: [
      'Relocate only into verified clean and inspected ("ready") rooms of equal or upgraded tier.',
      'Instantly revoke previous room RFID keycards and digital passes upon move confirmation.',
      'Notify Housekeeping dispatch immediately to initiate priority turnover of vacated room.',
      'Offer bellhop luggage transfer assistance and deliver updated digital pass QR to guest phone.',
    ],
    escalationTarget: 'Escalate to Duty Manager if no vacant inspected rooms of equal or higher tier are available.',
    policyOwner: 'Front Desk Operations Lead',
    effectiveDate: '2026-08-15',
    lastUpdated: '2026-10-29',
  },
  {
    id: 'pol-sec-301',
    code: 'POL-SEC-301',
    department: 'Security & Safety',
    category: 'Operating Procedure',
    title: 'Guest Incident Escalation, Welfare Check & Emergency Line *100',
    scope: 'Property-Wide Safety & Security Dispatch',
    summary: 'Establishes rapid response standards for life safety, medical emergencies, domestic disturbances, and room welfare checks. Front Desk serves as first responder triage coordinating with Security Patrol.',
    checklist: [
      'Direct Security & Emergency Line: Dial *100 from any front desk terminal or house phone.',
      'Do Not Disturb (DND) welfare rule: Active DND exceeding 24 hours requires supervisor wellness check.',
      'Medical emergencies: Immediately alert Duty Manager and call City Paramedics (112 / 911).',
      'Unregistered visitors: Security escort required for all non-guests seeking floor elevator access after 22:00.',
    ],
    escalationTarget: 'Immediate dispatch to Senior Security Officer Roy & Duty Manager Marcus Vance via Channel 3.',
    policyOwner: 'Chief of Hotel Security & Safety',
    effectiveDate: '2026-04-01',
    lastUpdated: '2026-10-28',
  },
  {
    id: 'pol-fin-202',
    code: 'POL-FIN-202',
    department: 'Financial & Recovery',
    category: 'Guest Recovery',
    title: 'Automated Minibar & POS Incidental Charge Dispute Handling',
    scope: 'Billing Reconciliations & Folio Check-Out',
    authorityLimit: 2000,
    summary: 'Automated smart minibar sensors and in-room dining charges contested by guests at checkout may be instantly credited by Front Desk up to ₹2,000 upon guest verbal confirmation of unopened seals.',
    checklist: [
      'Review sensor event log against timestamp of minibar door opening.',
      'If guest confirms seals unbroken, issue courtesy credit note under Minibar Discrepancy code.',
      'Notify Food & Beverage minibar team for physical inventory recount.',
      'Deposit hold releases must be processed within 15 minutes of checkout sign-off.',
    ],
    escalationTarget: 'Escalate minibar charge disputes exceeding ₹2,000 to Financial Operator Kavita Sundaram.',
    policyOwner: 'Finance & Front Office Cashiering',
    effectiveDate: '2026-09-01',
    lastUpdated: '2026-10-27',
  },
  {
    id: 'pol-ops-401',
    code: 'POL-OPS-401',
    department: 'Operations & Engineering',
    category: 'Escalation Threshold',
    title: 'Duty Manager Discretionary Authority Limit (₹10,000 / $600)',
    scope: 'Hotel-Wide Operations & Executive Escalations',
    authorityLimit: 10000,
    summary: 'Duty Managers hold authorization to approve guest compensation, billing adjustments, room upgrades, and comprehensive service recovery credits up to ₹10,000 without General Manager sign-off.',
    checklist: [
      'Authorizes credits between ₹2,501 and ₹10,000.',
      'Covers major room outages (AC failure, plumbing leaks, severe allergen breaches).',
      'Requires documented incident summary and Front Desk case reference ID.',
      'Any claim exceeding ₹10,000 requires direct executive authorization from General Manager Priya Nair.',
    ],
    escalationTarget: 'Escalate to General Manager Priya Nair if compensation exceeds ₹10,000.',
    policyOwner: 'Duty Manager Marcus Vance',
    effectiveDate: '2026-06-01',
    lastUpdated: '2026-10-25',
  },
  {
    id: 'pol-eng-501',
    code: 'POL-ENG-501',
    department: 'Operations & Engineering',
    category: 'Service Standard',
    title: 'Critical HVAC & Room Engineering Defect SLA Protocol',
    scope: 'All Guest Rooms & Public Spaces',
    authorityLimit: 2500,
    summary: 'Any reported heating, ventilation, air conditioning, or electrical defect that cannot be resolved by on-duty engineering within 20 minutes triggers an immediate room move offer and courtesy credit.',
    checklist: [
      'Engineering SLA: 10 minutes acknowledgment; 20 minutes diagnosis on site.',
      'If unresolved in 20 minutes: Front Desk initiates room move offer to clean ready room.',
      'Apply ₹2,500 goodwill recovery credit to guest folio upon room transfer.',
      'Flag malfunctioning room as Out of Order (OOO) in PMS until technician sign-off.',
    ],
    escalationTarget: 'Escalate to Chief Engineer Arun Patel and Duty Manager Marcus Vance.',
    policyOwner: 'Director of Engineering & Facilities',
    effectiveDate: '2026-07-15',
    lastUpdated: '2026-10-26',
  },
];

export function FrontDeskPoliciesPanel() {
  const { state } = useDemo();
  const [activeDept, setActiveDept] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);
  const [selectedPolicyModal, setSelectedPolicyModal] = useState<ComprehensivePolicy | null>(null);

  const departments = [
    { id: 'all', label: 'All Policies' },
    { id: 'Front Office', label: 'Front Office (FO)' },
    { id: 'Financial & Recovery', label: 'Financial & Recovery' },
    { id: 'Security & Safety', label: 'Security & Safety' },
    { id: 'Operations & Engineering', label: 'Operations & Engineering' },
  ];

  const filteredPolicies = useMemo(() => {
    return FRONT_DESK_POLICIES.filter((p) => {
      if (activeDept !== 'all' && p.department !== activeDept) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.scope.toLowerCase().includes(q) ||
          p.checklist.some((c) => c.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [activeDept, search]);

  const toggleExpand = (id: string) => {
    setExpandedPolicyId((prev) => (prev === id ? null : id));
  };

  const getDeptIcon = (dept: ComprehensivePolicy['department']) => {
    switch (dept) {
      case 'Front Office':
        return KeyRound;
      case 'Financial & Recovery':
        return Scale;
      case 'Security & Safety':
        return ShieldAlert;
      case 'Operations & Engineering':
        return Wrench;
      default:
        return FileText;
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Quick Operating Parameters Reference Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Check-In / Check-Out Hours */}
        <div className="p-3 rounded-xl border border-sky-500/25 bg-sky-500/[0.04] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-400">
            <Clock className="h-3 w-3" />
            <span>Check-In / Out Hours</span>
          </div>
          <p className="text-base font-bold text-white tracking-tight">In: 15:00 · Out: 11:00</p>
          <p className="text-[11px] text-mist-300 truncate">RFID &amp; digital passes expire at 11:00</p>
        </div>

        {/* Early Check-In Fees */}
        <div className="p-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.04] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            <BadgePercent className="h-3 w-3" />
            <span>Early Arrival Tier</span>
          </div>
          <p className="text-base font-bold text-white tracking-tight">₹1,500 (11:00–13:00)</p>
          <p className="text-[11px] text-mist-300 truncate">Complimentary after 13:00 if room ready</p>
        </div>

        {/* Photo ID Verification */}
        <div className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            <UserCheck className="h-3 w-3" />
            <span>ID Verification SOP</span>
          </div>
          <p className="text-base font-bold text-white tracking-tight">Govt Photo ID / Passport</p>
          <p className="text-[11px] text-mist-300 truncate">Mandatory prior to issuing key passes</p>
        </div>

        {/* Discretionary Goodwill Threshold */}
        <div className="p-3 rounded-xl border border-cyan-500/25 bg-cyan-500/[0.04] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>Goodwill Authority</span>
          </div>
          <p className="text-base font-bold text-white tracking-tight">₹2,500 ($150) / stay</p>
          <p className="text-[11px] text-mist-300 truncate">Autonomous front desk service recovery</p>
        </div>
      </div>

      {/* 2. Controls Row: Department Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
        {/* Department Filter Pills */}
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Policy departments">
          {departments.map((dept) => {
            const isSelected = activeDept === dept.id;
            const count =
              dept.id === 'all'
                ? FRONT_DESK_POLICIES.length
                : FRONT_DESK_POLICIES.filter((p) => p.department === dept.id).length;
            return (
              <button
                key={dept.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveDept(dept.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                  isSelected
                    ? 'chip-accent text-white shadow-sm'
                    : 'border border-white/10 text-mist-300 hover:bg-white/5 hover:text-white',
                )}
              >
                <span>{dept.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Policy */}
        <div className="relative w-full sm:w-60">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mist-400" />
          <input
            type="text"
            placeholder="Search policy, code, keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field text-xs w-full py-1.5 pl-8 rounded-lg bg-black/40 border-white/10 text-mist-200 placeholder:text-mist-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mist-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Documented Policies Directory Cards */}
      <div className="space-y-3">
        {filteredPolicies.length === 0 ? (
          <div className="p-12 text-center text-sm text-mist-400 border border-dashed border-white/10 rounded-2xl">
            <FileText className="h-8 w-8 text-mist-500 mx-auto mb-2" />
            <p>No operational policies match &ldquo;{search}&rdquo;.</p>
          </div>
        ) : (
          filteredPolicies.map((pol) => {
            const Icon = getDeptIcon(pol.department);
            const isExpanded = expandedPolicyId === pol.id;

            return (
              <div
                key={pol.id}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-4.5 space-y-3 hover:border-white/20 transition-all shadow-sm"
              >
                {/* Policy Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                        {pol.code}
                      </span>
                      <Badge tone="info">{pol.department}</Badge>
                      <Badge tone="neutral">{pol.category}</Badge>
                      {pol.authorityLimit !== undefined && pol.authorityLimit > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Limit: {money(pol.authorityLimit)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      {pol.title}
                    </h3>
                  </div>

                  <span className="text-[11px] font-mono text-mist-400 shrink-0">
                    Updated: {pol.lastUpdated}
                  </span>
                </div>

                {/* Summary Narrative */}
                <p className="text-xs text-mist-200 leading-relaxed">{pol.summary}</p>

                {/* Expandable Protocol Checklist */}
                {isExpanded && (
                  <div className="pt-2 border-t border-white/5 space-y-2 animate-fade-in">
                    <p className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Standard Operating Procedure Checklist:</span>
                    </p>
                    <ul className="space-y-1.5 pl-2">
                      {pol.checklist.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-mist-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer Governance Meta & Action Links */}
                <div className="pt-2.5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-mist-400">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>Scope: <strong className="text-mist-200">{pol.scope}</strong></span>
                    <span>·</span>
                    <span className="text-amber-300 font-medium">Escalation: {pol.escalationTarget}</span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => toggleExpand(pol.id)}
                      className="text-cyan-300 hover:text-cyan-200 font-semibold flex items-center gap-1 px-2 py-1 rounded transition"
                    >
                      <span>{isExpanded ? 'Hide Checklist' : 'View Checklist'}</span>
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>

                    <Button
                      size="sm"
                      variant="subtle"
                      iconLeft={FileText}
                      onClick={() => setSelectedPolicyModal(pol)}
                      className="text-[11px] py-1"
                    >
                      Full SOP Doc
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Full Document SOP Modal */}
      {selectedPolicyModal && (
        <Modal
          title={`${selectedPolicyModal.code} · Standard Operating Procedure`}
          description={selectedPolicyModal.title}
          onClose={() => setSelectedPolicyModal(null)}
        >
          <div className="space-y-4 text-xs">
            {/* Header Meta */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-mist-400 block">Department:</span>
                <span className="font-bold text-white">{selectedPolicyModal.department}</span>
              </div>
              <div>
                <span className="text-mist-400 block">Category:</span>
                <span className="font-bold text-cyan-300">{selectedPolicyModal.category}</span>
              </div>
              <div>
                <span className="text-mist-400 block">Policy Owner:</span>
                <span className="font-bold text-white">{selectedPolicyModal.policyOwner}</span>
              </div>
              <div>
                <span className="text-mist-400 block">Effective Date:</span>
                <span className="font-bold text-white">{selectedPolicyModal.effectiveDate}</span>
              </div>
            </div>

            {/* Directive Policy Statement */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                1. Directive Statement
              </h4>
              <p className="text-mist-200 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
                {selectedPolicyModal.summary}
              </p>
            </div>

            {/* Step-by-Step Procedure Checklist */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                2. Operational Execution Checklist
              </h4>
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-2">
                {selectedPolicyModal.checklist.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-mist-200">
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Escalation Guidelines */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-1">
              <p className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>3. Escalation &amp; Exception Handling:</span>
              </p>
              <p className="text-[11px] leading-relaxed">{selectedPolicyModal.escalationTarget}</p>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button variant="subtle" onClick={() => setSelectedPolicyModal(null)}>
                Close
              </Button>
              <Button
                variant="accent"
                iconLeft={Printer}
                onClick={() => {
                  window.print?.();
                }}
              >
                Print SOP Document
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
