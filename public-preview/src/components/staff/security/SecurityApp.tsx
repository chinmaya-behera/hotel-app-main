'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Shield,
  Activity,
  Bell,
  History,
  User,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  ShieldAlert,
  ChevronLeft,
  Flame,
  Users,
  BookOpen,
} from 'lucide-react';
import { useDemo } from '@/lib/store';
import type { WorkItem } from '@/types/demo';
import { SecurityHomeTab } from './SecurityHomeTab';
import { SecurityIncidentsTab } from './SecurityIncidentsTab';
import { SecurityAlertsTab } from './SecurityAlertsTab';
import { SecurityHistoryTab } from './SecurityHistoryTab';
import { SecurityProfileTab } from './SecurityProfileTab';
import { SecurityPlaybookTab } from './SecurityPlaybookTab';
import { SecurityHandoverTab } from './SecurityHandoverTab';
import { SecurityIncidentDetailModal } from './SecurityIncidentDetailModal';
import { playSecurityChime, playPanicSiren } from './securityChime';

type SecurityTab = 'home' | 'incidents' | 'alerts' | 'handover' | 'playbook' | 'history' | 'profile';

export function SecurityApp() {
  const {
    state,
    setPersona,
    setSoundEnabled,
    setTheme,
    acknowledgeSecurityItem,
    arriveSecurityItem,
    resolveSecurityItem,
    requestSecurityBackup,
    escalateSecurityItem,
    addSecurityNote,
    createSecurityIncident,
    markNotificationRead,
    clearAllNotifications,
  } = useDemo();

  const [activeTab, setActiveTab] = useState<SecurityTab>('home');
  const [selectedIncident, setSelectedIncident] = useState<WorkItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number | null>(null);

  // Set persona on mount
  useEffect(() => {
    setPersona('security_responder');
  }, [setPersona]);

  const items = state.items.security_responder ?? [];
  const isSoundOn = state.soundEnabled ?? true;

  // Audio siren trigger when critical or new incident arrives
  useEffect(() => {
    if (prevCountRef.current !== null && items.length > prevCountRef.current) {
      if (isSoundOn) {
        const latest = items[0];
        if (latest?.priority === 'critical') {
          playPanicSiren();
        } else {
          playSecurityChime();
        }
      }
    }
    prevCountRef.current = items.length;
  }, [items, isSoundOn]);

  // Scroll to top on tab switch
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Derived counts for navigation badges
  const activeCount = items.filter((i) => i.status !== 'Resolved').length;
  const criticalOrNewCount = items.filter(
    (i) => (i.priority === 'critical' || i.status === 'New') && i.status !== 'Resolved',
  ).length;

  const isLight = state.theme === 'light';

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#050b14] via-[#071120] to-[#03060a]">
      {/* Centered Phone Shell Container on Desktop, Full Screen on Mobile */}
      <div className="relative flex flex-col w-full h-full sm:h-[844px] sm:max-h-[calc(100dvh-2rem)] sm:w-[412px] sm:rounded-[2.8rem] sm:border-[8px] sm:border-[#0f172a] sm:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] bg-ink-950 overflow-hidden text-white">
        {/* Phone Speaker Notch (Desktop Shell Only) */}
        <div className="hidden sm:flex absolute top-0 inset-x-0 z-50 justify-center pointer-events-none pt-2">
          <div className="h-4 w-28 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500/80 animate-pulse" />
            <span className="h-1 w-10 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Mobile Header Bar */}
        <header className="shrink-0 border-b border-white/[0.08] bg-ink-950/95 backdrop-blur-xl px-4 pt-3 pb-3 sm:pt-6 z-40">
          <div className="flex items-center justify-between gap-3">
            {/* Identity */}
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 text-xs font-black text-ink-950 shadow-md shadow-sky-500/20">
                IR
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs font-bold text-white truncate">Inspector Roy</h1>
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20 shrink-0 animate-pulse" />
                </div>
                <p className="text-[10px] text-mist-400 truncate">Safety & Security · Night Shift</p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1.5">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!isSoundOn)}
                title={isSoundOn ? 'Mute alert siren' : 'Enable alert siren'}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-mist-300 hover:text-white transition-colors"
              >
                {isSoundOn ? <Volume2 className="h-4 w-4 text-sky-400" /> : <VolumeX className="h-4 w-4 text-mist-500" />}
              </button>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() => setTheme(isLight ? 'dark' : 'light')}
                title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-mist-300 hover:text-white transition-colors"
              >
                {isLight ? <Moon className="h-4 w-4 text-amber-400" /> : <Sun className="h-4 w-4 text-amber-300" />}
              </button>

              {/* Switch Role back to selector */}
              <Link
                href="/roles"
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-mist-300 hover:text-white transition-colors"
                title="Switch Role"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Quick Section Horizontal Sub-bar */}
        <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/[0.08] bg-ink-950/80 overflow-x-auto scrollbar-none text-[11px]">
          {(
            [
              ['home', 'Overview'],
              ['incidents', 'Incidents'],
              ['alerts', 'Safety Alerts'],
              ['handover', 'Shift Handover'],
              ['playbook', 'Playbooks & SOP'],
              ['history', 'Archive'],
              ['profile', 'Profile'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-2.5 py-1 rounded-xl whitespace-nowrap font-medium transition ${
                activeTab === key
                  ? 'bg-sky-500 text-ink-950 font-bold shadow-md shadow-sky-500/20'
                  : 'text-mist-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Scrollable Main Content Viewport */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4 touch-pan-y">
          {activeTab === 'home' && (
            <SecurityHomeTab
              items={items}
              feed={state.feed}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              onNavigateTab={(t) => setActiveTab(t)}
              onAcknowledge={acknowledgeSecurityItem}
              onArrive={arriveSecurityItem}
              onResolve={resolveSecurityItem}
              onRequestBackup={requestSecurityBackup}
              onEscalate={escalateSecurityItem}
              onAddNote={addSecurityNote}
              onCreateIncident={createSecurityIncident}
            />
          )}

          {activeTab === 'incidents' && (
            <SecurityIncidentsTab
              items={items}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
            />
          )}

          {activeTab === 'alerts' && <SecurityAlertsTab />}

          {activeTab === 'handover' && <SecurityHandoverTab />}

          {activeTab === 'playbook' && <SecurityPlaybookTab />}

          {activeTab === 'history' && (
            <SecurityHistoryTab
              items={items}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
            />
          )}

          {activeTab === 'profile' && <SecurityProfileTab />}
        </div>

        {/* Fixed Mobile Bottom Navigation Bar */}
        <nav
          role="navigation"
          aria-label="Security Responder Navigation"
          className="shrink-0 border-t border-white/[0.08] bg-ink-950/95 backdrop-blur-xl px-2 py-2 sm:pb-3 z-40"
        >
          <div className="grid grid-cols-6 gap-1">
            {/* 1. Home */}
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                activeTab === 'home' ? 'text-sky-400 font-bold bg-white/5' : 'text-mist-400 hover:text-mist-200'
              }`}
            >
              <Shield className={`h-4 w-4 ${activeTab === 'home' ? 'text-sky-400 stroke-[2.5]' : ''}`} />
              <span className="text-[9px] mt-1">Home</span>
            </button>

            {/* 2. Incidents */}
            <button
              type="button"
              onClick={() => setActiveTab('incidents')}
              className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                activeTab === 'incidents' ? 'text-sky-400 font-bold bg-white/5' : 'text-mist-400 hover:text-mist-200'
              }`}
            >
              <Activity className={`h-4 w-4 ${activeTab === 'incidents' ? 'text-sky-400 stroke-[2.5]' : ''}`} />
              <span className="text-[9px] mt-1">Incidents</span>
              {activeCount > 0 && (
                <span className="absolute top-1 right-2 h-3.5 w-3.5 rounded-full bg-amber-500 text-[8px] font-bold text-ink-950 flex items-center justify-center ring-2 ring-ink-950">
                  {activeCount}
                </span>
              )}
            </button>

            {/* 3. Alerts */}
            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                activeTab === 'alerts' ? 'text-rose-400 font-bold bg-white/5' : 'text-mist-400 hover:text-mist-200'
              }`}
            >
              <Bell className={`h-4 w-4 ${activeTab === 'alerts' ? 'text-rose-400 stroke-[2.5]' : ''}`} />
              <span className="text-[9px] mt-1">Alerts</span>
              {criticalOrNewCount > 0 && (
                <span className="absolute top-1 right-2 h-3.5 w-3.5 rounded-full bg-rose-500 text-[8px] font-bold text-white flex items-center justify-center ring-2 ring-ink-950 animate-pulse">
                  {criticalOrNewCount}
                </span>
              )}
            </button>

            {/* 4. Handover */}
            <button
              type="button"
              onClick={() => setActiveTab('handover')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                activeTab === 'handover' ? 'text-sky-400 font-bold bg-white/5' : 'text-mist-400 hover:text-mist-200'
              }`}
            >
              <Users className={`h-4 w-4 ${activeTab === 'handover' ? 'text-sky-400 stroke-[2.5]' : ''}`} />
              <span className="text-[9px] mt-1">Handover</span>
            </button>

            {/* 5. Playbook */}
            <button
              type="button"
              onClick={() => setActiveTab('playbook')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                activeTab === 'playbook' ? 'text-amber-400 font-bold bg-white/5' : 'text-mist-400 hover:text-mist-200'
              }`}
            >
              <BookOpen className={`h-4 w-4 ${activeTab === 'playbook' ? 'text-amber-400 stroke-[2.5]' : ''}`} />
              <span className="text-[9px] mt-1">SOP</span>
            </button>

            {/* 6. Profile */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                activeTab === 'profile' ? 'text-sky-400 font-bold bg-white/5' : 'text-mist-400 hover:text-mist-200'
              }`}
            >
              <User className={`h-4 w-4 ${activeTab === 'profile' ? 'text-sky-400 stroke-[2.5]' : ''}`} />
              <span className="text-[9px] mt-1">Profile</span>
            </button>
          </div>
        </nav>

        {/* Global Incident Detail Modal */}
        {selectedIncident && (
          <SecurityIncidentDetailModal
            item={items.find((i) => i.id === selectedIncident.id) || selectedIncident}
            isOpen={!!selectedIncident}
            onClose={() => setSelectedIncident(null)}
            onAcknowledge={acknowledgeSecurityItem}
            onArrive={arriveSecurityItem}
            onResolve={resolveSecurityItem}
            onRequestBackup={requestSecurityBackup}
            onEscalate={escalateSecurityItem}
            onAddNote={addSecurityNote}
          />
        )}
      </div>
    </div>
  );
}
