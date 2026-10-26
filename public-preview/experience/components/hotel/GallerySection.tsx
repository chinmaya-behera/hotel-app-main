'use client';

import { useState } from 'react';
import { Image as ImageIcon, Sparkles, Maximize2 } from 'lucide-react';
import { SceneVisual } from '@/components/hotel/SceneVisual';
import { GALLERY, type SceneKind } from '@/lib/hotelCatalog';

export function GallerySection() {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Spaces' | 'Wellness' | 'Suites'>('All');

  const filteredGallery = GALLERY.filter((item) => {
    if (activeFilter === 'Spaces') return ['lobby', 'dining', 'rooftop'].includes(item.scene);
    if (activeFilter === 'Wellness') return ['pool', 'spa', 'fitness'].includes(item.scene);
    if (activeFilter === 'Suites') return ['bedroom', 'living', 'bath'].includes(item.scene);
    return true;
  });

  return (
    <section id="gallery" className="py-14 sm:py-20 border-t border-white/[0.08]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Visual Journey</span>
            </div>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Moments & Atmosphere
            </h2>
            <p className="mt-2 text-sm sm:text-base text-mist-300 max-w-2xl">
              Explore the design language of Atelier Hotel, from soaring lobby columns to sun-drenched pool terraces.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {(['All', 'Spaces', 'Wellness', 'Suites'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                  activeFilter === filter
                    ? 'bg-amber-400 text-ink-950 font-bold'
                    : 'border border-white/10 text-mist-300 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGallery.map((item, idx) => (
            <div
              key={idx}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-ink-900/60 p-2.5 backdrop-blur transition-all duration-300 hover:border-amber-400/40 hover:shadow-2xl"
            >
              <SceneVisual scene={item.scene} aspect="video" label={item.title} />
              <div className="p-3">
                <h3 className="font-display text-base font-bold text-white group-hover:text-amber-200 transition-colors">
                  {item.title}
                </h3>
                <span className="text-[11px] text-mist-400 uppercase tracking-wider block mt-0.5">
                  Atelier Hotel Architectural Showcase
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
