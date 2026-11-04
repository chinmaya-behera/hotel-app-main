'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  Layers,
  Clock,
  Bell,
  SunMoon,
  BedDouble,
  Activity,
} from 'lucide-react';
import type { GuestTabId } from '@/components/guest/types';

interface TourStep {
  title: string;
  tip: string;
  targetSelector: string;
  tabTarget?: GuestTabId;
  subtabTarget?: string;
  icon: React.ComponentType<{ className?: string }>;
}

// 7-step sequence walking through all core sections of the guest app
const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome & Room Info',
    tip: 'Your personalized stay overview with your room badge (Room 402), checkout schedule, and verified stay details.',
    targetSelector: '[data-tour="tour-welcome-card"]',
    tabTarget: 'home',
    icon: BedDouble,
  },
  {
    title: 'Quick Services',
    tip: 'Instant access to the 6 core services: Dining, Room Service, Maintenance, Front Desk, Reminders, and Lost & Found.',
    targetSelector: '[data-tour="tour-services-grid"]',
    tabTarget: 'home',
    icon: Sparkles,
  },
  {
    title: 'Pending Requests & Live Timeline',
    tip: 'Real-time multi-stage tracking for your active room dining orders, housekeeping requests, and front desk tasks.',
    targetSelector: '[data-tour="tour-pending-requests"]',
    tabTarget: 'home',
    icon: Clock,
  },
  {
    title: 'Services Directory Tab',
    tip: 'Browse the complete hotel catalog across all 10 departments with commercial amenity requests and curated dining menus.',
    targetSelector: '[data-tour="tour-services-tab"]',
    tabTarget: 'services',
    icon: Layers,
  },
  {
    title: 'My Activity & Order History',
    tip: 'Track all service requests and orders with detailed 4-stage operational progress timelines and staff dispatch status.',
    targetSelector: '[data-tour="tour-activity-tab"]',
    tabTarget: 'activity',
    icon: Activity,
  },
  {
    title: 'Notifications & Alerts',
    tip: 'Stay informed with emergency hotel advisories, Front Desk broadcasts, service updates, and concierge announcements.',
    targetSelector: '[data-tour="tour-notifications-tab"]',
    tabTarget: 'notifications',
    icon: Bell,
  },
  {
    title: 'Theme & Guide Controls',
    tip: 'Easily toggle between Light and Dark mode, or restart this interactive App Guide whenever you need assistance.',
    targetSelector: '[data-tour="tour-header-controls"]',
    tabTarget: 'home',
    icon: SunMoon,
  },
];

interface GuestInteractiveTourProps {
  room: string;
  guestName: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: GuestTabId, subtab?: string) => void;
  isLight?: boolean;
}

export function GuestInteractiveTour({
  room,
  guestName,
  isOpen,
  onClose,
  onNavigate,
  isLight = false,
}: GuestInteractiveTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [welcomePromptOpen, setWelcomePromptOpen] = useState(false);
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

  const storageKey = `grand_adp_tour_completed_${room}`;

  // Check if first-time guest
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(storageKey);
      if (!completed && !isOpen) {
        const timer = setTimeout(() => {
          setWelcomePromptOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [storageKey, isOpen]);

  // Recalculate target position based ONLY on existing DOM element (no navigation re-triggering)
  const recalculateTargetRect = useCallback(() => {
    if (!isOpen) return;
    const step = TOUR_STEPS[currentStepRef.current];
    if (!step) return;

    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen]);

  // Handle step transitions and view navigation
  useEffect(() => {
    if (!isOpen) return;

    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    // Navigate to the target tab if needed
    if (step.tabTarget) {
      onNavigate(step.tabTarget, step.subtabTarget);
    }

    // Delay slightly to give tab panel time to mount and layout
    const timer = setTimeout(() => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // After scrolling settles, measure exact bounding box
        setTimeout(() => {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
        }, 220);
      } else {
        setTargetRect(null);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [currentStep, isOpen, onNavigate]);

  // On open, reset to first step and navigate to home
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      onNavigate('home');
    }
  }, [isOpen, onNavigate]);

  // Listen to window scroll & resize to dynamically keep spotlight aligned
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('resize', recalculateTargetRect);
      window.addEventListener('scroll', recalculateTargetRect, true);
      return () => {
        window.removeEventListener('resize', recalculateTargetRect);
        window.removeEventListener('scroll', recalculateTargetRect, true);
      };
    }
  }, [isOpen, recalculateTargetRect]);

  function handleSkipWelcome() {
    setWelcomePromptOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'skipped');
    }
  }

  function handleFinishTour() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'completed');
    }
    onClose();
  }

  function handleNext() {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinishTour();
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  // FIRST-TIME COMPACT WELCOME CARD
  if (welcomePromptOpen && !isOpen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className={`relative w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-3.5 transition-all ${
          isLight
            ? 'bg-white text-slate-900 border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.15)]'
            : 'bg-ink-950 border border-cyan-400/40 text-white shadow-[0_20px_50px_rgba(0,0,0,0.7)]'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className={`grid h-9 w-9 place-items-center rounded-xl font-bold ${
                isLight ? 'bg-cyan-50 text-cyan-600 border border-cyan-200' : 'bg-cyan-400/20 text-cyan-300'
              }`}>
                <Compass className="h-5 w-5" />
              </span>
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Welcome, {guestName.split(' ')[0]}!
                </h3>
                <p className={`text-xs font-semibold ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>
                  Room {room} &bull; Interactive Tour
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSkipWelcome}
              className={`p-1 rounded-lg ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-mist-400 hover:text-white'}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-mist-200'}`}>
            Take a 30-second tour of your digital hotel portal to explore dining orders, room amenities, Front Desk alerts, and live activity tracking.
          </p>

          <div className={`flex items-center gap-2 pt-2 border-t ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
            <button
              type="button"
              onClick={handleSkipWelcome}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                isLight
                  ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  : 'border-white/10 text-mist-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => {
                setWelcomePromptOpen(false);
                onNavigate('home');
                setCurrentStep(0);
                const event = new CustomEvent('open-guest-tour');
                window.dispatchEvent(event);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 text-white text-xs font-bold hover:bg-cyan-400 shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Start Tour</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  // Floating bubble position calculation with strict screen boundary clamping
  let bubbleStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 100,
  };

  if (targetRect) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const bubbleWidth = isMobile ? Math.min(340, window.innerWidth - 32) : 360;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

    // Center horizontally relative to target, clamped cleanly inside viewport
    let leftPos = targetRect.left + targetRect.width / 2 - bubbleWidth / 2;
    leftPos = Math.max(16, Math.min(viewportWidth - bubbleWidth - 16, leftPos));

    const spaceBelow = viewportHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    if (spaceBelow >= 210 || spaceBelow > spaceAbove) {
      // Place below the target element
      const topPos = Math.min(viewportHeight - 220, targetRect.bottom + 14);
      bubbleStyle = {
        position: 'fixed',
        left: `${leftPos}px`,
        top: `${Math.max(16, topPos)}px`,
        width: `${bubbleWidth}px`,
        zIndex: 100,
      };
    } else {
      // Place above the target element
      const bottomPos = Math.min(viewportHeight - 80, viewportHeight - targetRect.top + 14);
      bubbleStyle = {
        position: 'fixed',
        left: `${leftPos}px`,
        bottom: `${Math.max(16, bottomPos)}px`,
        width: `${bubbleWidth}px`,
        zIndex: 100,
      };
    }
  }

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden pointer-events-auto">
      {/* 
        TRUE SPOTLIGHT CUTOUT EFFECT:
        Uses a massive box-shadow (0 0 0 9999px rgba(...)) on a transparent cutout box.
        This leaves the target element 100% UNTOUCHED, CRISP, AND FULLY BRIGHT
        while seamlessly dimming every other pixel on the screen!
      */}
      {targetRect ? (
        <div
          className="fixed pointer-events-none rounded-2xl transition-all duration-300 z-[95]"
          style={{
            left: `${Math.max(0, targetRect.left - 6)}px`,
            top: `${Math.max(0, targetRect.top - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            boxShadow: isLight
              ? '0 0 0 9999px rgba(15, 23, 42, 0.55), 0 0 20px rgba(6, 182, 212, 0.50)'
              : '0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 25px rgba(34, 211, 238, 0.65)',
            border: isLight ? '2.5px solid #06b6d4' : '2.5px solid #22d3ee',
            background: 'transparent',
          }}
        />
      ) : (
        /* Fallback dimmed backdrop before target rect is measured */
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-[1px] transition-all duration-300 z-[90]"
          onClick={onClose}
        />
      )}

      {/* Floating Tour Bubble Card */}
      <div
        style={bubbleStyle}
        className={`rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-3 animate-in fade-in zoom-in-95 duration-200 transition-all ${
          isLight
            ? 'bg-white/95 text-slate-900 border border-cyan-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.2)]'
            : 'bg-ink-950/95 text-white border border-cyan-400/50 shadow-[0_16px_40px_rgba(0,0,0,0.85)]'
        }`}
      >
        {/* Step Header */}
        <div className={`flex items-center justify-between pb-2 border-b ${
          isLight ? 'border-slate-100' : 'border-white/10'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`grid h-7 w-7 place-items-center rounded-xl font-bold ${
              isLight ? 'bg-cyan-500 text-white shadow-sm' : 'bg-cyan-400 text-ink-950 shadow-sm'
            }`}>
              <StepIcon className="h-4 w-4" />
            </span>
            <span className={`text-xs sm:text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {step.title}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isLight
                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                : 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/30'
            }`}>
              {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinishTour}
            className={`p-1 rounded-lg transition-colors ${
              isLight ? 'text-slate-400 hover:text-slate-700' : 'text-mist-400 hover:text-white'
            }`}
            title="Skip Tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Short friendly instruction */}
        <p className={`text-xs sm:text-sm font-medium leading-relaxed ${
          isLight ? 'text-slate-700' : 'text-mist-100'
        }`}>
          {step.tip}
        </p>

        {/* Controls: Skip, Back, Next */}
        <div className={`flex items-center justify-between pt-2 border-t ${
          isLight ? 'border-slate-100' : 'border-white/10'
        }`}>
          <button
            type="button"
            onClick={handleFinishTour}
            className={`text-xs font-semibold transition-colors ${
              isLight ? 'text-slate-500 hover:text-slate-900' : 'text-mist-400 hover:text-white'
            }`}
          >
            Skip
          </button>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  isLight
                    ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'border-white/15 text-mist-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                isLight
                  ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-ink-950'
              }`}
            >
              <span>{isLast ? 'Done' : 'Next'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
