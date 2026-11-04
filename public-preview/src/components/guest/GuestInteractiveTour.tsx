'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  UtensilsCrossed,
  Layers,
  Wrench,
  Clock,
  Bell,
  Receipt,
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

// 7-step sequence strictly matching hotel navigation
const TOUR_STEPS: TourStep[] = [
  {
    title: 'Home',
    tip: 'Your hotel services, all in one place.',
    targetSelector: '[data-tour="tour-home"]',
    tabTarget: 'home',
    icon: Sparkles,
  },
  {
    title: 'Dining',
    tip: 'Browse the menu and order food.',
    targetSelector: '[data-tour="tour-quick-dining"]',
    tabTarget: 'home',
    icon: UtensilsCrossed,
  },
  {
    title: 'Services',
    tip: 'Request room service, spa, concierge and recreation.',
    targetSelector: '[data-tour="tour-quick-services"]',
    tabTarget: 'home',
    icon: Layers,
  },
  {
    title: 'Maintenance',
    tip: 'Request help with your room.',
    targetSelector: '[data-tour="tour-quick-maintenance"]',
    tabTarget: 'home',
    icon: Wrench,
  },
  {
    title: 'Requests',
    tip: 'Track your service requests.',
    targetSelector: '[data-tour="tour-my-activity"]',
    tabTarget: 'home',
    icon: Clock,
  },
  {
    title: 'Notifications',
    tip: 'Stay updated with hotel messages.',
    targetSelector: '[data-tour="tour-alerts-notifications"]',
    tabTarget: 'notifications',
    icon: Bell,
  },
  {
    title: 'Folio',
    tip: 'Check your bill and charges.',
    targetSelector: '[data-tour="tour-folio"]',
    tabTarget: 'home',
    icon: Receipt,
  },
];

interface GuestInteractiveTourProps {
  room: string;
  guestName: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: GuestTabId, subtab?: string) => void;
}

export function GuestInteractiveTour({
  room,
  guestName,
  isOpen,
  onClose,
  onNavigate,
}: GuestInteractiveTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [welcomePromptOpen, setWelcomePromptOpen] = useState(false);

  const storageKey = `grand_azure_tour_completed_${room}`;

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

  // Update target rectangle and auto-scroll
  const updateTargetPosition = useCallback(() => {
    if (!isOpen) return;

    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    if (step.tabTarget) {
      onNavigate(step.tabTarget, step.subtabTarget);
    }

    setTimeout(() => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
        }, 180);
      } else {
        setTargetRect(null);
      }
    }, 120);
  }, [currentStep, isOpen, onNavigate]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      onNavigate('home');
    }
  }, [isOpen, onNavigate]);

  useEffect(() => {
    if (isOpen) {
      updateTargetPosition();
      window.addEventListener('resize', updateTargetPosition);
      window.addEventListener('scroll', updateTargetPosition, true);
      return () => {
        window.removeEventListener('resize', updateTargetPosition);
        window.removeEventListener('scroll', updateTargetPosition, true);
      };
    }
  }, [isOpen, updateTargetPosition]);

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-xs rounded-2xl bg-ink-950 border border-cyan-400/40 p-4 text-white shadow-2xl space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-cyan-400/20 text-cyan-300">
                <Compass className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-white">Welcome, {guestName.split(' ')[0]}!</h3>
                <p className="text-[10px] text-cyan-300 font-medium">Room {room} &bull; Quick Tour</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSkipWelcome}
              className="p-1 rounded-lg text-mist-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-mist-200 leading-relaxed">
            Take a 30-second interactive tour to explore your dining, service requests, and room features.
          </p>

          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={handleSkipWelcome}
              className="flex-1 py-1.5 px-3 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white transition-colors"
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
              className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-400 text-ink-950 text-xs font-bold hover:bg-cyan-300 shadow-md flex items-center justify-center gap-1 transition-all"
            >
              <span>Start Tour</span>
              <ArrowRight className="h-3 w-3" />
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

  // Floating bubble position calculation
  let bubbleStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 95,
  };

  if (targetRect) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const bubbleWidth = isMobile ? Math.min(320, window.innerWidth - 32) : 320;
    const spaceBelow = window.innerHeight - targetRect.bottom;

    let leftPos = targetRect.left + targetRect.width / 2 - bubbleWidth / 2;
    leftPos = Math.max(16, Math.min(window.innerWidth - bubbleWidth - 16, leftPos));

    if (spaceBelow > 160) {
      // Position below element
      bubbleStyle = {
        position: 'fixed',
        left: `${leftPos}px`,
        top: `${Math.min(window.innerHeight - 170, targetRect.bottom + 10)}px`,
        width: `${bubbleWidth}px`,
        zIndex: 95,
      };
    } else {
      // Position above element
      bubbleStyle = {
        position: 'fixed',
        left: `${leftPos}px`,
        bottom: `${Math.min(window.innerHeight - 170, window.innerHeight - targetRect.top + 10)}px`,
        width: `${bubbleWidth}px`,
        zIndex: 95,
      };
    }
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden pointer-events-auto">
      {/* Subtle dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[1px] transition-all duration-300"
        onClick={onClose}
      />

      {/* Target Highlight Ring & Glow */}
      {targetRect && (
        <div
          className="fixed rounded-2xl pointer-events-none transition-all duration-300 ring-2 ring-cyan-400 ring-offset-2 ring-offset-black/60 shadow-[0_0_20px_rgba(34,211,238,0.45)] z-[85]"
          style={{
            left: `${Math.max(0, targetRect.left - 4)}px`,
            top: `${Math.max(0, targetRect.top - 4)}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
          }}
        />
      )}

      {/* Compact Floating Guide Bubble */}
      <div
        style={bubbleStyle}
        className="rounded-2xl bg-ink-950/95 border border-cyan-400/50 p-3 sm:p-3.5 text-white shadow-2xl backdrop-blur-md space-y-2.5 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Step Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-400 text-ink-950 font-bold">
              <StepIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-bold text-white">{step.title}</span>
            <span className="text-[10px] text-cyan-300 font-bold bg-cyan-400/10 border border-cyan-400/30 px-1.5 py-0.2 rounded-full">
              {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinishTour}
            className="p-1 rounded-lg text-mist-400 hover:text-white"
            title="Skip Tour"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Short friendly instruction */}
        <p className="text-xs sm:text-sm text-mist-100 font-medium leading-snug">
          {step.tip}
        </p>

        {/* Controls: Skip, Back, Next */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
          <button
            type="button"
            onClick={handleFinishTour}
            className="text-[11px] font-semibold text-mist-400 hover:text-white transition-colors"
          >
            Skip
          </button>

          <div className="flex items-center gap-1.5">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 text-[11px] font-semibold text-mist-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1 rounded-xl bg-cyan-400 text-ink-950 text-xs font-bold hover:bg-cyan-300 transition-colors shadow-sm"
            >
              <span>{isLast ? 'Done' : 'Next'}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
