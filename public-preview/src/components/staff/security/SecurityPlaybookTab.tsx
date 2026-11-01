'use client';

import { useState } from 'react';
import {
  BookOpen,
  FileText,
  Shield,
  ShieldAlert,
  Flame,
  Radio,
  Clock,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useDemo } from '@/lib/store';

export function SecurityPlaybookTab() {
  const { state } = useDemo();
  const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>('playbook-1');

  const policies = (state.departmentPolicies ?? []).filter(
    (p) =>
      p.department.toLowerCase().includes('security') ||
      p.department.toLowerCase().includes('safety') ||
      p.department.toLowerCase().includes('operations'),
  );

  const playbooks = [
    {
      id: 'playbook-1',
      code: 'SOP SEC-01',
      title: 'Safety Alert Broadcast Multi-Tier Approval Playbook',
      department: 'Security & Safety Operations',
      trigger: 'Life-safety event, active fire sensor, severe weather, or infrastructure failure',
      authorityLimit: 'Security drafts -> Front Desk validates -> Manager approves -> Front Desk broadcasts',
      steps: [
        '1. Detection: Responder confirms location and potential property-wide operational hazard.',
        '2. Draft Creation: Create draft alert in Safety Alerts tab specifying priority and affected zones.',
        '3. Front Desk Triage: Front Desk coordinates guest notification and verifies perimeter impact.',
        '4. Manager Authorization: General Manager Priya Nair (or Duty Manager) reviews and signs off.',
        '5. System Broadcast: Broadcast is activated across all staff and guest displays simultaneously.',
        '6. Stand-down: Security marks resolved when perimeter is certified safe.',
      ],
      escalation: 'General Manager Priya Nair (Authority: All Property Broadcasts)',
    },
    {
      id: 'playbook-2',
      code: 'SOP SEC-02',
      title: 'Guest Incident Verification & Evidence Chain of Custody',
      department: 'Security Dispatch',
      trigger: 'Guest-reported noise, theft allegation, uninvited visitor, or physical hazard',
      authorityLimit: 'Unverified guest reports must be validated by Front Desk before verified security logging',
      steps: [
        '1. Intake: Triage report source (Guest Portal vs Telephone vs In-Person).',
        '2. Front Desk Validation: Cross-reference guest room reservation and active stay status.',
        '3. Officer Dispatch: Physical response time target < 4 minutes.',
        '4. Evidence Capture: Photograph scene observations with encrypted timestamp watermark.',
        '5. Confidential Storage: Secure evidence in restricted locker; restricted from public guest view.',
      ],
      escalation: 'Duty Manager Marcus Vance (Clearance: Level 2)',
    },
    {
      id: 'playbook-3',
      code: 'SOP SEC-03',
      title: 'BMS Fire & Smoke Detector Alarm Response',
      department: 'Security & Engineering',
      trigger: 'Automated thermal camera sensor or smoke detector activation',
      authorityLimit: 'Evacuation broadcast requires General Manager authorization',
      steps: [
        '1. Check BMS telemetry on security console for detector chamber ID.',
        '2. Dispatch primary patrol officer with thermal scanner and master elevator key.',
        '3. If smoke verified, immediately notify Duty Manager and initiate Floor 4 containment.',
        '4. Note: Municipal Fire Department auto-dial integration is pending configuration.',
      ],
      escalation: 'General Manager Priya Nair & City Fire Dispatch (Manual phone backup)',
    },
  ];

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-150 text-white">
      {/* Header Info */}
      <div className="px-1">
        <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-sky-400" />
          <span>Security Standard Playbooks & Policies</span>
        </h2>
        <p className="text-[11px] text-mist-400">
          Role-specific tactical response instructions, authority limits, and documented SOPs
        </p>
      </div>

      {/* Playbook Selector */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-mist-400 px-1">
          Tactical Response Playbooks
        </span>

        {playbooks.map((pb) => {
          const isSelected = selectedPlaybook === pb.id;
          return (
            <div
              key={pb.id}
              className={`rounded-2xl p-3.5 border transition-all cursor-pointer ${
                isSelected
                  ? 'border-sky-500/50 bg-sky-950/30 shadow-lg shadow-sky-500/10'
                  : 'border-white/10 bg-ink-900 hover:border-white/20'
              }`}
              onClick={() => setSelectedPlaybook(pb.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold text-sky-400">{pb.code}</span>
                <span className="text-[10px] text-mist-400">{pb.department}</span>
              </div>
              <h3 className="text-xs font-bold text-white mt-1">{pb.title}</h3>

              {isSelected && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-mist-400 uppercase tracking-wider block">Activation Trigger</span>
                    <span className="text-mist-200 text-[11px]">{pb.trigger}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-mist-400 uppercase tracking-wider block">Authority Limit</span>
                    <span className="text-amber-300 text-[11px] font-medium">{pb.authorityLimit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-mist-400 uppercase tracking-wider block mb-1">Standard Operating Steps</span>
                    <ul className="space-y-1 text-[11px] text-mist-200 pl-1">
                      {pb.steps.map((s, idx) => (
                        <li key={idx} className="leading-tight">{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-1 text-[10px] text-mist-400">
                    <span>Escalation: <strong className="text-white">{pb.escalation}</strong></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Notice on Missing/Pending Configuration */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1 text-amber-200">
        <div className="flex items-center gap-1.5 font-bold">
          <AlertTriangle className="h-4 w-4" />
          <span>Policy Configuration Pending</span>
        </div>
        <p className="text-[11px] text-amber-300/80 leading-relaxed">
          Local Municipal Fire Code Compliance & Automated 911/101 Dispatch Integration is marked as <strong>NEEDS CONFIGURATION</strong> per hotel platform roadmap. Rely on manual emergency telephone protocols.
        </p>
      </div>

      {/* General Documented Policies Section */}
      <div className="space-y-2 pt-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-mist-400 px-1">
          Documented Hotel Authority Policies
        </span>

        <div className="space-y-2">
          {policies.map((p) => (
            <div key={p.id} className="p-3 rounded-xl bg-ink-900 border border-white/10 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-[11px]">{p.title}</span>
                <span className="text-[10px] text-sky-400 font-mono">{p.category}</span>
              </div>
              <p className="text-[11px] text-mist-300 leading-snug">{p.summary}</p>
              <div className="text-[10px] text-mist-400 pt-1 flex justify-between">
                <span>Owner: {p.policyOwner}</span>
                <span className="text-amber-300">Escalate: {p.escalationTarget.split(' ')[0]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
