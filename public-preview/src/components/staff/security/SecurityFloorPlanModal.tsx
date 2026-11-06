'use client';

import { X, Compass, ShieldAlert } from 'lucide-react';

interface SecurityFloorPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: string;
  floor?: number;
  room?: string;
  title: string;
}

export function SecurityFloorPlanModal({
  isOpen,
  onClose,
  location,
  floor = 1,
  room,
  title,
}: SecurityFloorPlanModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/45 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[var(--warm-paper)] border border-[var(--dm-line)] rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto text-[var(--dm-ink)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--dm-line)]">
          <div className="flex items-center gap-3">
            <span className="dm-attention-icon">
              <Compass size={18} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-[var(--dm-ink)]">Tactical Floor Orientation</h3>
              <p className="text-xs text-[var(--dm-muted)]">Level {floor} · {location}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="dm-icon-button"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tactical Map SVG Visualizer */}
        <div className="mt-4 rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-[var(--dm-muted)] mb-2 font-mono">
            <span>LEVEL {floor} ARCHITECTURAL SCHEMATIC</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" /> SENSORS ONLINE
            </span>
          </div>

          <svg viewBox="0 0 400 240" className="w-full h-auto rounded-lg bg-[var(--warm-paper)] border border-[var(--dm-line)]">
            {/* Grid background lines */}
            <defs>
              <pattern id="warm-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(215, 203, 185, 0.35)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="400" height="240" fill="url(#warm-grid)" />

            {/* Corridors and Rooms */}
            <rect x="40" y="40" width="320" height="160" fill="none" stroke="#d5c8b5" strokeWidth="2" strokeDasharray="4 2" />
            
            {/* Rooms Left & Right */}
            <rect x="50" y="50" width="70" height="50" fill="rgba(245, 240, 230, 0.85)" stroke="#cfc0aa" strokeWidth="1" />
            <text x="85" y="80" textAnchor="middle" fill="#605545" fontSize="10" fontFamily="sans-serif">Unit {floor}01</text>

            <rect x="50" y="140" width="70" height="50" fill="rgba(245, 240, 230, 0.85)" stroke="#cfc0aa" strokeWidth="1" />
            <text x="85" y="170" textAnchor="middle" fill="#605545" fontSize="10" fontFamily="sans-serif">Unit {floor}02</text>

            <rect x="280" y="50" width="70" height="50" fill="rgba(245, 240, 230, 0.85)" stroke="#cfc0aa" strokeWidth="1" />
            <text x="315" y="80" textAnchor="middle" fill="#605545" fontSize="10" fontFamily="sans-serif">Unit {floor}08</text>

            <rect x="280" y="140" width="70" height="50" fill="rgba(245, 240, 230, 0.85)" stroke="#cfc0aa" strokeWidth="1" />
            <text x="315" y="170" textAnchor="middle" fill="#605545" fontSize="10" fontFamily="sans-serif">Unit {floor}09</text>

            {/* Central Service Core & Elevators */}
            <rect x="150" y="50" width="100" height="50" fill="rgba(235, 227, 214, 0.95)" stroke="#b5a48e" strokeWidth="1.5" />
            <text x="200" y="72" textAnchor="middle" fill="#2c2419" fontSize="9" fontWeight="bold">SERVICE ELEVATORS</text>
            <text x="200" y="88" textAnchor="middle" fill="#756754" fontSize="8">Shaft A &amp; B (Keycard)</text>

            {/* Hallway Centerline */}
            <path d="M 40 120 L 360 120" stroke="rgba(190, 160, 120, 0.45)" strokeWidth="1" strokeDasharray="3 3" />

            {/* Emergency Exit Stairwells */}
            <g transform="translate(15, 110)">
              <rect width="20" height="20" fill="rgba(16, 185, 129, 0.15)" stroke="#059669" strokeWidth="1" rx="3" />
              <text x="10" y="14" textAnchor="middle" fill="#047857" fontSize="9" fontWeight="bold">E1</text>
            </g>
            <g transform="translate(365, 110)">
              <rect width="20" height="20" fill="rgba(16, 185, 129, 0.15)" stroke="#059669" strokeWidth="1" rx="3" />
              <text x="10" y="14" textAnchor="middle" fill="#047857" fontSize="9" fontWeight="bold">E2</text>
            </g>

            {/* Fire Hose Cabinet */}
            <circle cx="150" cy="120" r="5" fill="#e11d48" />
            <text x="150" y="136" textAnchor="middle" fill="#be123c" fontSize="7" fontWeight="bold">FHC</text>

            {/* Target Incident Marker with Pulse */}
            <g transform="translate(200, 165)">
              <circle cx="0" cy="0" r="16" fill="rgba(225, 29, 72, 0.2)" className="animate-ping" />
              <circle cx="0" cy="0" r="8" fill="#e11d48" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" stroke="#ffffff" strokeWidth="1.2" />
            </g>
            <text x="200" y="195" textAnchor="middle" fill="#be123c" fontSize="9" fontWeight="bold">INCIDENT ZONE</text>
          </svg>

          {/* Map Legend */}
          <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--dm-muted)] px-1">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-600" /> Target Zone
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded bg-emerald-100 border border-emerald-600" /> Emergency Stairwell
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Fire Hose (FHC)
            </span>
          </div>
        </div>

        {/* Location Orientation Details */}
        <div className="mt-4 space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[var(--dm-surface)] border border-[var(--dm-line)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--dm-muted)] font-medium">Assigned Zone:</span>
              <span className="text-[var(--dm-ink)] font-semibold">{location}</span>
            </div>
            {room && (
              <div className="flex items-center justify-between">
                <span className="text-[var(--dm-muted)] font-medium">Room Number:</span>
                <span className="text-[var(--dm-ink)] font-mono font-semibold">Room {room}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[var(--dm-muted)] font-medium">Vertical Access:</span>
              <span className="text-[var(--dm-ink)]">Service Lift B or Stairwell E-1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--dm-muted)] font-medium">Authorization Scope:</span>
              <span className="dm-status urgent">Inspector Master Keycard active</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2.5">
            <ShieldAlert size={16} className="shrink-0 text-amber-600 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Security Protocol:</strong> Maintain perimeter standoff distance until scene occupancy is confirmed. Do not tamper with fire detection wiring or BMS sensor housings.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-3 border-t border-[var(--dm-line)] flex justify-end">
          <button
            onClick={onClose}
            className="dm-primary px-5 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
          >
            Close Orientation View
          </button>
        </div>
      </div>
    </div>
  );
}
