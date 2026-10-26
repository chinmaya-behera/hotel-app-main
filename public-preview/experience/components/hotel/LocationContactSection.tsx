'use client';

import { useState } from 'react';
import {
  Clock,
  Compass,
  Mail,
  MapPin,
  Phone,
  Plane,
  Send,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CONTACT, HOTEL_NAME } from '@/lib/hotelCatalog';
import { useDemo } from '@/lib/store';

export function LocationContactSection() {
  const { notify, submitEnquiry } = useDemo();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Stay Inquiry');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    submitEnquiry({kind:'contact',name,subject,details:email+' · '+message});
  };

  return (
    <section id="location" className="py-14 sm:py-20 border-t border-white/[0.08] bg-ink-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            <MapPin className="h-3.5 w-3.5" />
            <span>Prime Coastal Location</span>
          </div>
          <h2 className="mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Find Us & Get in Touch
          </h2>
          <p className="mt-2 text-sm sm:text-base text-mist-300">
            Situated moments from the promenade with panoramic skyline views. Front Desk and Concierge are available
            around the clock.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Details & Stylized Map Card (Col 1-7) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-ink-900/60 p-6 backdrop-blur shadow-xl space-y-6">
              <h3 className="font-display text-xl font-bold text-white">Property Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-mist-300">
                <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <MapPin className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Physical Address</span>
                    <p className="mt-0.5">{CONTACT.address}</p>
                    <span className="text-[10px] text-amber-300 font-mono mt-1 block">Coastal Esplanade, Wing B</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <Phone className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Direct Concierge</span>
                    <p className="mt-0.5">{CONTACT.phone}</p>
                    <span className="text-[10px] text-emerald-400 mt-1 block">{CONTACT.hours}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <Mail className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Email Reservations</span>
                    <p className="mt-0.5">{CONTACT.email}</p>
                    <span className="text-[10px] text-mist-400 mt-1 block">Replies within 15 minutes</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <Plane className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Airport Transfer</span>
                    <p className="mt-0.5">25 mins from International Terminal</p>
                    <span className="text-[10px] text-mist-400 mt-1 block">Bookable via in-room concierge</span>
                  </div>
                </div>
              </div>

              {/* Stylized Architectural Map Graphic */}
              <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-white/10 bg-ink-950 p-4">
                <svg viewBox="0 0 600 200" className="h-full w-full object-cover opacity-80" aria-hidden>
                  {/* Stylized Grid Lines */}
                  <g stroke="#334155" strokeWidth="1" opacity="0.3">
                    <line x1="0" y1="50" x2="600" y2="50" />
                    <line x1="0" y1="100" x2="600" y2="100" />
                    <line x1="0" y1="150" x2="600" y2="150" />
                    <line x1="150" y1="0" x2="150" y2="200" />
                    <line x1="300" y1="0" x2="300" y2="200" />
                    <line x1="450" y1="0" x2="450" y2="200" />
                  </g>
                  {/* Coastline */}
                  <path d="M 0 160 Q 200 120 400 170 T 600 140 L 600 200 L 0 200 Z" fill="#0284c7" opacity="0.3" />
                  {/* Hotel Marker */}
                  <circle cx="300" cy="90" r="28" fill="#f59e0b" opacity="0.2" className="animate-ping" />
                  <circle cx="300" cy="90" r="14" fill="#f59e0b" />
                  <text x="300" y="130" textAnchor="middle" fill="#fef3c7" fontSize="12" fontWeight="bold">
                    {HOTEL_NAME}
                  </text>
                </svg>
                <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] text-mist-200 backdrop-blur">
                  Coastal Esplanade & Residences
                </div>
              </div>
            </div>
          </div>

          {/* Contact Inquiry Form (Col 8-12) */}
          <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-ink-900/80 p-6 backdrop-blur shadow-xl">
            <h3 className="font-display text-xl font-bold text-white">Send a Direct Inquiry</h3>
            <p className="text-xs text-mist-300 mt-1">
              Have questions about accessible suites, events, or group bookings?
            </p>

            {!sent ? (
              <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-mist-200">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Thorne"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="field w-full text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-mist-200">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="david@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field w-full text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-mist-200">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="field w-full text-xs"
                  >
                    <option value="General Stay Inquiry">General Stay Inquiry</option>
                    <option value="Accessible Room Specifications">Accessible Room Specifications</option>
                    <option value="Group Booking & Events">Group Booking & Events</option>
                    <option value="Dining & Private Terrace">Dining & Private Terrace</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-mist-200">Your Message *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us how we can assist..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="field w-full text-xs resize-none"
                  />
                </div>

                <Button type="submit" variant="accent" size="md" iconRight={Send} className="w-full justify-center mt-2">
                  Send Inquiry to Front Desk
                </Button>
              </form>
            ) : (
              <div className="mt-8 text-center py-6 space-y-3">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="font-display text-lg font-bold text-white">Inquiry Received</h4>
                <p className="text-xs text-mist-300">
                  Thank you <strong className="text-white">{name}</strong>. Your message regarding &ldquo;{subject}&rdquo;
                  has been simulated and received by the Front Desk coordinator.
                </p>
                <Button variant="subtle" size="sm" onClick={() => setSent(false)}>
                  Send Another Message
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
