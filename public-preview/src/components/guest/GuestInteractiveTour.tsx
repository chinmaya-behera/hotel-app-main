'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Compass,
  MessageSquare,
  ListChecks,
  Bell,
  BedDouble,
  Receipt,
  HelpCircle,
} from 'lucide-react';
import type { GuestTabId } from '@/components/guest/types';

interface TourStep {
  title: string;
  targetSelector: string;
  tabTarget?: GuestTabId;
  subtabTarget?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tip?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Your Guest Dashboard',
    targetSelector: '[data-tour="tour-home"]',
    tabTarget: 'home',
    icon: Compass,
    description:
      'Welcome to your personal resort dashboard. Here you can access your stay summary, ongoing requests, and all hotel services at a glance.',
    tip: 'Tap your room number or profile anytime to access your account.',
  },
  {
    title: 'Quick Access Services',
    targetSelector: '[data-tour="tour-services-grid"]',
    tabTarget: 'home',
    icon: Sparkles,
    description:
      'Direct one-tap access to all 10 hotel services — including Housekeeping, Gourmet In-Room Dining, Maintenance, Spa, and more without searching menus.',
    tip: 'Tap any card to instantly request amenities or order in-room dining.',
  },
  {
    title: 'Front Desk 24/7 Channel',
    targetSelector: '[data-tour="tour-front-desk"]',
    tabTarget: 'home',
    icon: MessageSquare,
    description:
      'Message our Front Desk team directly, request luggage assistance, or schedule wake-up calls with instant two-way staff replies.',
    tip: 'Our coordinators are available 24 hours a day to assist you.',
  },
  {
    title: 'Pending Requests Timeline',
    targetSelector: '[data-tour="tour-my-activity"]',
    tabTarget: 'home',
    icon: ListChecks,
    description:
      'Track all your active and in-progress requests chronologically. Once a service is completed, it automatically clears from this timeline.',
    tip: 'Tap History to view your complete log of past and completed requests.',
  },
  {
    title: 'Alerts & Notifications',
    targetSelector: '[data-tour="tour-alerts-notifications"]',
    tabTarget: 'notifications',
    icon: Bell,
    description:
      'Stay informed with important hotel announcements, safety advisories, weather updates, and personal notifications regarding your stay.',
    tip: 'Hotel-wide safety alerts and your personal notifications are kept neatly separated.',
  },
  {
    title: 'My Stay & Digital Room Key',
    targetSelector: '[data-tour="tour-my-stay"]',
    tabTarget: 'profile',
    subtabTarget: 'bookings',
    icon: BedDouble,
    description:
      'Check your suite details, view check-in and checkout schedules, and access your scannable vector SVG room QR key and 4-digit door PIN.',
    tip: 'Hold the QR code 5cm from your suite door lock to unlock your room.',
  },
  {
    title: 'My Folio & Express Checkout',
    targetSelector: '[data-tour="tour-folio"]',
    tabTarget: 'home',
    icon: Receipt,
    description:
      'Review live itemized incidental charges with 18% GST calculation, download formal PDF tax invoices, and check out with your card on file.',
    tip: 'Express checkout automatically settles your folio with zero lobby wait time.',
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
        // First-time guest detected: show small welcome prompt after a short delay
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

    // Ensure we are on the right tab for the target element
    if (step.tabTarget) {
      onNavigate(step.tabTarget, step.subtabTarget);
    }

    // Allow DOM to render then locate element
    setTimeout(() => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        // Auto scroll into view
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
        }, 200);
      } else {
        // Fallback to center if element is temporarily not in DOM
        setTargetRect(null);
      }
    }, 150);
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

  function handleStartTour() {
    setWelcomePromptOpen(false);
    setCurrentStep(0);
    onNavigate('home');
    window.dispatchEvent(new CustomEvent('open-guest-tour'));
  }

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

  // FIRST-TIME WELCOME CARD MODAL
  if (welcomePromptOpen && !isOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-amber-400/40 p-5 text-white shadow-2xl space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/20 text-amber-300">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  The Grand ADP
                </p>
                <h3 className="text-sm font-bold text-white">Welcome, {guestName.split(' ')[0]}!</h3>
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
            Everything you need for a comfortable stay is in one place. Take a 30-second interactive tour to explore your digital room key, in-room dining, and 24/7 Front Desk access.
          </p>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2 text-[11px] text-mist-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>One-tap Housekeeping, Dining &amp; Maintenance</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-mist-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Digital Room QR Door Key &amp; Keypad PIN</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-mist-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Live Order Delivery Tracking &amp; Express Checkout</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleSkipWelcome}
              className="flex-1 py-2 px-3 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white transition-colors"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => {
                setWelcomePromptOpen(false);
                onNavigate('home');
                setCurrentStep(0);
                // Trigger tour in parent
                const event = new CustomEvent('open-guest-tour');
                window.dispatchEvent(event);
              }}
              className="flex-2 py-2 px-3 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Start Quick Tour</span>
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

  // Tooltip position calculation
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 95,
  };

  if (targetRect) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    if (isMobile) {
      // On mobile: pin near bottom or above element with clean margins
      if (spaceBelow > 260) {
        tooltipStyle = {
          position: 'fixed',
          left: '16px',
          right: '16px',
          top: `${Math.min(window.innerHeight - 280, targetRect.bottom + 12)}px`,
          zIndex: 95,
        };
      } else {
        tooltipStyle = {
          position: 'fixed',
          left: '16px',
          right: '16px',
          bottom: '20px',
          zIndex: 95,
        };
      }
    } else {
      // On desktop: position nicely below or above target element
      const leftPos = Math.max(
        24,
        Math.min(window.innerWidth - 420, targetRect.left + targetRect.width / 2 - 200),
      );

      if (spaceBelow > 260) {
        tooltipStyle = {
          position: 'fixed',
          left: `${leftPos}px`,
          top: `${targetRect.bottom + 14}px`,
          width: '400px',
          zIndex: 95,
        };
      } else {
        tooltipStyle = {
          position: 'fixed',
          left: `${leftPos}px`,
          bottom: `${window.innerHeight - targetRect.top + 14}px`,
          width: '400px',
          zIndex: 95,
        };
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden pointer-events-auto">
      {/* Dimmed backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-[2px] transition-all duration-300"
        onClick={onClose}
      />

      {/* Target Highlight Ring & Spotlight Cutout */}
      {targetRect && (
        <div
          className="fixed rounded-2xl pointer-events-none transition-all duration-300 ring-4 ring-amber-400 ring-offset-4 ring-offset-black/40 shadow-2xl z-[91]"
          style={{
            left: `${targetRect.left - 4}px`,
            top: `${targetRect.top - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
          }}
        />
      )}

      {/* Interactive Tooltip Card */}
      <div
        style={tooltipStyle}
        className="rounded-2xl bg-slate-900 border border-amber-400/50 p-4 text-white shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Step Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-400 text-ink-950 font-bold">
              <StepIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </p>
              <h3 className="text-xs font-bold text-white">{step.title}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinishTour}
            className="p-1 rounded-lg text-mist-400 hover:text-white"
            title="Skip Tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Explanation Text */}
        <div className="space-y-1.5 text-xs text-mist-200">
          <p className="leading-relaxed">{step.description}</p>
          {step.tip && (
            <div className="flex items-start gap-1.5 p-2 rounded-lg bg-white/5 border border-white/5 text-[11px] text-amber-300">
              <HelpCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{step.tip}</span>
            </div>
          )}
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {TOUR_STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep
                  ? 'w-5 bg-amber-400'
                  : i < currentStep
                  ? 'w-1.5 bg-amber-400/50'
                  : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Controls: Prev, Next, Skip */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10">
          <button
            type="button"
            onClick={handleFinishTour}
            className="text-[11px] font-semibold text-mist-400 hover:text-white transition-colors"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-mist-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Prev</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400 text-ink-950 text-xs font-bold hover:bg-amber-300 transition-colors shadow-md"
            >
              <span>{isLast ? 'Finish Tour' : 'Next'}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
