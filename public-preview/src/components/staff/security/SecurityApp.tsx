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
  Smartphone,
  Monitor,
  Radio,
  PlusCircle,
  PhoneCall,
  CheckCircle2,
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
import { SecurityLogIncidentModal } from './SecurityLogIncidentModal';
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
  } = useDemo();

  const [activeTab, setActiveTab] = useState<SecurityTab>('home');
  const [selectedIncident, setSelectedIncident] = useState<WorkItem | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
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

  const navItems: Array<{ id: SecurityTab; label: string; icon: typeof Shield; badge?: number; tone?: string }> = [
    { id: 'home', label: 'Command Overview', icon: Shield },
    { id: 'incidents', label: 'Active Incidents', icon: Activity, badge: activeCount > 0 ? activeCount : undefined, tone: 'warning' },
    { id: 'alerts', label: 'Safety Alerts', icon: Bell, badge: criticalOrNewCount > 0 ? criticalOrNewCount : undefined, tone: 'danger' },
    { id: 'handover', label: 'Shift Handover', icon: Users },
    { id: 'playbook', label: 'Playbooks & SOPs', icon: BookOpen },
    { id: 'history', label: 'Incident Archive', icon: History },
    { id: 'profile', label: 'Officer Profile', icon: User },
  ];

  /* -------------------------------------------------------------
   * MOBILE VIEW SIMULATOR (If toggled by user)
   * ------------------------------------------------------------- */
  if (viewMode === 'mobile') {
    return (
      <div className="py-4 flex flex-col items-center justify-center">
        {/* Toggle bar to switch back to desktop */}
        <div className="mb-4 flex items-center justify-between w-full max-w-[412px] px-2">
          <span className="text-xs text-mist-400">Mobile Simulator Mode</span>
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            className="px-3 py-1 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold hover:bg-sky-500/30 transition flex items-center gap-1.5"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Switch to Desktop View</span>
          </button>
        </div>

        {/* Centered Phone Shell Container */}
        <div className="relative flex flex-col w-full h-[844px] max-h-[calc(100vh-8rem)] max-w-[412px] rounded-[2.5rem] border-[8px] border-[#0f172a] shadow-[0_25px_80px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] bg-ink-950 overflow-hidden text-white">
          {/* Phone Speaker Notch */}
          <div className="flex absolute top-0 inset-x-0 z-50 justify-center pointer-events-none pt-2">
            <div className="h-4 w-28 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500/80 animate-pulse" />
              <span className="h-1 w-10 rounded-full bg-white/20" />
            </div>
          </div>

          {/* Header */}
          <header className="shrink-0 border-b border-white/[0.08] bg-ink-950/95 backdrop-blur-xl px-4 pt-6 pb-3 z-40">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 text-xs font-black text-ink-950 shadow-md">
                  IR
                </div>
                <div>
                  <h1 className="text-xs font-bold text-white">Inspector Roy</h1>
                  <p className="text-[10px] text-mist-400">Safety & Security · Night Shift</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!isSoundOn)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-mist-300"
                >
                  {isSoundOn ? <Volume2 className="h-4 w-4 text-sky-400" /> : <VolumeX className="h-4 w-4 text-mist-500" />}
                </button>
              </div>
            </div>
          </header>

          {/* Scrollable Viewport */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4">
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
              <SecurityIncidentsTab items={items} onSelectIncident={(inc) => setSelectedIncident(inc)} />
            )}
            {activeTab === 'alerts' && <SecurityAlertsTab />}
            {activeTab === 'handover' && <SecurityHandoverTab />}
            {activeTab === 'playbook' && <SecurityPlaybookTab />}
            {activeTab === 'history' && <SecurityHistoryTab items={items} onSelectIncident={(inc) => setSelectedIncident(inc)} />}
            {activeTab === 'profile' && <SecurityProfileTab />}
          </div>

          {/* Bottom Bar */}
          <nav className="shrink-0 border-t border-white/[0.08] bg-ink-950/95 backdrop-blur-xl px-2 py-2 z-40">
            <div className="grid grid-cols-6 gap-1">
              {navItems.slice(0, 6).map((n) => {
                const Icon = n.icon;
                const isSelected = activeTab === n.id;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setActiveTab(n.id)}
                    className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] transition ${
                      isSelected ? 'text-sky-400 font-bold bg-white/5' : 'text-mist-400 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-0.5" />
                    <span className="truncate max-w-[45px]">{n.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

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
    );
  }

  /* -------------------------------------------------------------
   * FULL DESKTOP SECURITY COMMAND CENTER (Primary View)
   * ------------------------------------------------------------- */
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      {/* 1. TOP COMMAND HEADER BAR */}
      <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-white font-display">
                Hotel Safety & Security Command Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-400/20 border border-sky-400/30 text-[10px] font-bold text-sky-300 uppercase tracking-wider">
                Live Monitoring
              </span>
              {criticalOrNewCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-[10px] font-bold text-rose-300 uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  {criticalOrNewCount} Urgent Alerts
                </span>
              )}
            </div>
            <p className="text-xs text-mist-300 mt-0.5">
              Inspector Roy &bull; Safety & Security Lead &bull; Night Shift (22:00 – 07:00) &bull; Radio CH-3 Guard Ops
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto justify-end">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!isSoundOn)}
            title={isSoundOn ? 'Mute alert siren' : 'Enable alert siren'}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              isSoundOn
                ? 'border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20'
                : 'border-white/10 bg-white/5 text-mist-400 hover:text-white'
            }`}
          >
            {isSoundOn ? <Volume2 className="h-3.5 w-3.5 text-sky-400" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span>{isSoundOn ? 'Siren Active' : 'Muted'}</span>
          </button>



          {/* Mobile View Toggle */}
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-mist-300 hover:text-white hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Preview Mobile Responder View"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Phone View</span>
          </button>

          {/* Log Incident Button */}
          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-ink-950 font-bold text-xs transition shadow-md shadow-sky-500/20 flex items-center gap-1.5"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Log Field Incident</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN DESKTOP 2-COLUMN LAYOUT */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Left Sticky Sidebar Navigation */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="sticky top-20 rounded-2xl border border-white/10 bg-ink-900/90 p-3 backdrop-blur-xl shadow-xl space-y-1.5">
            <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-mist-400">
                Security Navigation
              </span>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-sky-500 text-ink-950 font-bold shadow-md shadow-sky-500/20'
                        : 'text-mist-300 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isSelected ? 'text-ink-950' : 'text-sky-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isSelected
                            ? 'bg-ink-950 text-sky-400'
                            : item.tone === 'danger'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            </div>
        </aside>

        {/* Right Main Content Area */}
        <div ref={scrollRef} className="flex-1 min-w-0 w-full space-y-6">
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
      </div>

      {/* Incident Detail Modal */}
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

      {/* Log Incident Modal */}
      {showLogModal && (
        <SecurityLogIncidentModal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          onSubmit={(inc) => {
            createSecurityIncident(inc);
            setShowLogModal(false);
          }}
        />
      )}
    </div>
  );
}
