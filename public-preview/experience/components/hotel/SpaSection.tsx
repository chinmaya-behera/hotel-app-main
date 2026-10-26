'use client';

import { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Droplets,
  Flower2,
  Footprints,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SceneVisual } from '@/components/hotel/SceneVisual';
import { spaServices } from '@/lib/mockData';
import { useDemo } from '@/lib/store';
import { money } from '@/lib/utils';

export function SpaSection() {
  const { notify, submitEnquiry } = useDemo();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [appointmentDone, setAppointmentDone] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'}));
  const [slot, setSlot] = useState('11:00');

  const chosen = spaServices.find((s) => s.id === selectedService) ?? spaServices[0];

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppointmentDone(true);
    submitEnquiry({kind:'spa',name,details:chosen.name+' · '+date+' · '+slot});
  };

  return (
    <section id="spa" className="py-14 sm:py-20 border-t border-white/[0.08] bg-ink-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              <Flower2 className="h-3.5 w-3.5" />
              <span>Sanctuary & Rejuvenation</span>
            </div>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
              The Grand Wellness & Spa
            </h2>
            <p className="mt-2 text-sm sm:text-base text-mist-300 max-w-2xl">
              An oasis of calm located on Level 2, offering therapeutic massages, rejuvenating facials, an open-air pool deck,
              and sunrise yoga sessions.
            </p>
          </div>

          <Button
            size="sm"
            variant="accent"
            iconLeft={Sparkles}
            onClick={() => {
              setSelectedService('sp1');
              setAppointmentDone(false);
              setAppointmentOpen(true);
            }}
          >
            Book a Treatment
          </Button>
        </div>

        {/* Spa Visual Highlights */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <SceneVisual scene="spa" aspect="video" label="Wellness Sanctuary & Treatment Suites · Level 2" />
          <SceneVisual scene="pool" aspect="video" label="Sun Deck & Heated Pool · Level 2 Terrace" />
        </div>

        {/* Treatment Menu Grid */}
        <div className="mt-10">
          <h3 className="font-display text-xl font-bold text-white mb-4">
            Curated Treatment Offerings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaServices.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-ink-900/60 p-5 backdrop-blur hover:border-emerald-400/30 transition shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-400/20">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-mono text-base font-bold text-emerald-300">
                        {money(service.price)}
                      </span>
                    </div>

                    <h4 className="font-display text-lg font-bold text-white mt-3">
                      {service.name}
                    </h4>
                    <p className="text-xs text-mist-400 mt-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-300" />
                      Duration: {service.duration}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] text-mist-400">Level 2 Sanctuary</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedService(service.id);
                        setAppointmentDone(false);
                        setAppointmentOpen(true);
                      }}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
                    >
                      Request Slot →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointment Inquiry Dialog */}
        {appointmentOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/85 backdrop-blur-md"
          >
            <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-ink-900 p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
              <button
                type="button"
                onClick={() => setAppointmentOpen(false)}
                className="absolute top-4 right-4 text-mist-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {!appointmentDone ? (
                <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    <Flower2 className="h-4 w-4" />
                    <span>Spa Treatment Request</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">Book {chosen.name}</h3>
                  <p className="text-mist-400 text-xs">
                    {chosen.duration} session · {money(chosen.price)} (posted to room folio upon treatment)
                  </p>

                  <div className="space-y-1">
                    <label className="font-semibold text-mist-200">Guest Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="field w-full text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-mist-200">Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="field w-full text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-mist-200">Preferred Slot</label>
                      <select
                        value={slot}
                        onChange={(e) => setSlot(e.target.value)}
                        className="field w-full text-xs"
                      >
                        {['09:00', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30'].map((s) => (
                          <option key={s} value={s}>
                            {s} hrs
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" variant="accent" size="md" className="w-full justify-center">
                      Confirm Appointment Inquiry
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="font-display text-lg font-bold text-white">Spa Inquiry Sent</h4>
                  <p className="text-xs text-mist-300">
                    {chosen.name} reserved for <strong className="text-white">{name}</strong> on {date} at {slot}.
                    (Simulated demo request).
                  </p>
                  <Button variant="subtle" size="sm" onClick={() => setAppointmentOpen(false)}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
