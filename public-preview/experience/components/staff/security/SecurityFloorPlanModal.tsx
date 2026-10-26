'use client';

import { MapPin, X, Compass, ShieldAlert, ArrowUpRight, Flame, DoorClosed } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-ink-900 border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Tactical Floor Orientation</h3>
              <p className="text-[11px] text-mist-400">Level {floor} · {location}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-mist-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tactical Map SVG Visualizer */}
        <div className="mt-4 rounded-xl bg-ink-950 border border-white/10 p-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-mist-400 mb-2 font-mono">
            <span>LEVEL {floor} ARCHITECTURAL SCHEMATIC</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> GRID OK
            </span>
          </div>

          <svg viewBox="0 0 400 240" className="w-full h-auto rounded-lg bg-ink-900/80 border border-white/5">
            {/* Grid background lines */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="400" height="240" fill="url(#grid)" />

            {/* Corridors and Rooms */}
            <rect x="40" y="40" width="320" height="160" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4 2" />

            {/* Rooms Left & Right */}
            <rect x="50" y="50" width="70" height="50" fill="rgba(30, 41, 59, 0.5)" stroke="#475569" strokeWidth="1" />
            <text x="85" y="80" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">Unit {floor}01</text>

            <rect x="50" y="140" width="70" height="50" fill="rgba(30, 41, 59, 0.5)" stroke="#475569" strokeWidth="1" />
            <text x="85" y="170" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">Unit {floor}02</text>

            <rect x="280" y="50" width="70" height="50" fill="rgba(30, 41, 59, 0.5)" stroke="#475569" strokeWidth="1" />
            <text x="315" y="80" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">Unit {floor}08</text>

            <rect x="280" y="140" width="70" height="50" fill="rgba(30, 41, 59, 0.5)" stroke="#475569" strokeWidth="1" />
            <text x="315" y="170" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">Unit {floor}09</text>

            {/* Central Service Core & Elevators */}
            <rect x="150" y="50" width="100" height="50" fill="rgba(15, 23, 42, 0.8)" stroke="#64748b" strokeWidth="1.5" />
            <text x="200" y="72" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="bold">SERVICE ELEVATORS</text>
            <text x="200" y="88" textAnchor="middle" fill="#64748b" fontSize="8">Shaft A & B (Keycard)</text>

            {/* Hallway Centerline */}
            <path d="M 40 120 L 360 120" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" strokeDasharray="3 3" />

            {/* Emergency Exit Stairwells */}
            <g transform="translate(15, 110)">
              <rect width="20" height="20" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="1" rx="3" />
              <text x="10" y="14" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold">E1</text>
            </g>
            <g transform="translate(365, 110)">
              <rect width="20" height="20" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="1" rx="3" />
              <text x="10" y="14" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold">E2</text>
            </g>

            {/* Fire Hose Cabinet */}
            <circle cx="150" cy="120" r="5" fill="#f43f5e" />
            <text x="150" y="136" textAnchor="middle" fill="#fda4af" fontSize="7">FHC</text>

            {/* Target Incident Marker with Pulse */}
            <g transform="translate(200, 165)">
              <circle cx="0" cy="0" r="16" fill="rgba(244, 63, 94, 0.25)" className="animate-ping" />
              <circle cx="0" cy="0" r="8" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" stroke="#ffffff" strokeWidth="1.2" />
            </g>
            <text x="200" y="195" textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="bold">INCIDENT ZONE</text>
          </svg>

          {/* Map Legend */}
          <div className="mt-3 flex items-center justify-between text-[10px] text-mist-400 px-1">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Target Zone
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded bg-emerald-500/40 border border-emerald-400" /> Emergency Stairwell
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-400" /> Fire Hose (FHC)
            </span>
          </div>
        </div>

        {/* Location Orientation Details */}
        <div className="mt-4 space-y-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-mist-400 font-medium">Assigned Zone:</span>
              <span className="text-white font-semibold">{location}</span>
            </div>
            {room && (
              <div className="flex items-center justify-between">
                <span className="text-mist-400 font-medium">Room Number:</span>
                <span className="text-white font-mono font-semibold">Room {room}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-mist-400 font-medium">Vertical Access:</span>
              <span className="text-mist-200">Service Lift B or Stairwell E-1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-mist-400 font-medium">Authorization Scope:</span>
              <span className="text-amber-400 font-medium">Inspector Master Keycard active</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <p>
              <strong>Security Protocol:</strong> Maintain perimeter standoff distance until scene occupancy is confirmed. Do not tamper with fire detection wiring or BMS sensor housings.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
          >
            Close Orientation View
          </button>
        </div>
      </div>
    </div>
  );
}
