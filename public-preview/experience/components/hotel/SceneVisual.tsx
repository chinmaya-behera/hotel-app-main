import type { CSSProperties } from 'react';
import type { SceneKind } from '@/lib/hotelCatalog';

interface SceneVisualProps {
  scene: SceneKind;
  className?: string;
  label?: string;
  aspect?: 'video' | 'wide' | 'square';
}

/**
 * Self-contained luxury architectural illustrations for rooms, amenities and hotel areas.
 * Works seamlessly offline in both dark and light themes with gradients and mood lighting.
 */
export function SceneVisual({ scene, className = '', label, aspect = 'video' }: SceneVisualProps) {
  const aspectClass =
    aspect === 'wide' ? 'aspect-[21/9]' : aspect === 'square' ? 'aspect-square' : 'aspect-[16/10]';

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-ink-950 border border-white/[0.08] shadow-inner select-none ${aspectClass} ${className}`}
    >
      <SceneArtwork scene={scene} />

      {/* Atmospheric lighting gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-sky-400/10 mix-blend-screen" />

      {label && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
          <span className="rounded-md bg-black/60 px-2 py-1 font-medium text-white/90 backdrop-blur-md border border-white/10">
            {label}
          </span>
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-mist-200 backdrop-blur-md">
            Atelier Hotel
          </span>
        </div>
      )}
    </div>
  );
}

function SceneArtwork({ scene }: { scene: SceneKind }) {
  switch (scene) {
    case 'bedroom':
      return (
        <svg viewBox="0 0 800 500" className="h-full w-full object-cover" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <linearGradient id="bg-bed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d1b2a" />
              <stop offset="60%" stopColor="#1b263b" />
              <stop offset="100%" stopColor="#0b131f" />
            </linearGradient>
            <radialGradient id="lamp-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="headboard" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="50%" stopColor="#4b5563" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>
            <linearGradient id="linen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f3f4f6" />
              <stop offset="100%" stopColor="#d1d5db" />
            </linearGradient>
            <linearGradient id="throw" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c29d59" />
              <stop offset="100%" stopColor="#e5c378" />
            </linearGradient>
          </defs>
          <rect width="800" height="500" fill="url(#bg-bed)" />
          {/* Wall Paneling */}
          <g opacity="0.25" stroke="#9ca3af" strokeWidth="1">
            <line x1="120" y1="40" x2="120" y2="350" />
            <line x1="240" y1="40" x2="240" y2="350" />
            <line x1="560" y1="40" x2="560" y2="350" />
            <line x1="680" y1="40" x2="680" y2="350" />
            <rect x="250" y="50" width="300" height="150" fill="none" strokeWidth="1.5" stroke="#e5c378" />
          </g>
          {/* Ambient Window Left */}
          <rect x="30" y="60" width="80" height="260" rx="4" fill="#60a5fa" opacity="0.15" />
          <line x1="70" y1="60" x2="70" y2="320" stroke="#93c5fd" strokeWidth="1" opacity="0.3" />
          {/* Bedside Glows */}
          <circle cx="170" cy="200" r="100" fill="url(#lamp-glow)" />
          <circle cx="630" cy="200" r="100" fill="url(#lamp-glow)" />
          {/* Pendants */}
          <line x1="170" y1="0" x2="170" y2="180" stroke="#d4af37" strokeWidth="2" />
          <circle cx="170" cy="185" r="9" fill="#fef3c7" />
          <line x1="630" y1="0" x2="630" y2="180" stroke="#d4af37" strokeWidth="2" />
          <circle cx="630" cy="185" r="9" fill="#fef3c7" />
          {/* Headboard */}
          <rect x="180" y="160" width="440" height="180" rx="12" fill="url(#headboard)" />
          <rect x="200" y="175" width="400" height="150" rx="8" fill="#1f2937" stroke="#4b5563" strokeWidth="1" />
          {/* Pillows */}
          <rect x="220" y="240" width="160" height="70" rx="8" fill="#e5e7eb" transform="rotate(-3 220 240)" />
          <rect x="420" y="240" width="160" height="70" rx="8" fill="#e5e7eb" transform="rotate(3 420 240)" />
          <rect x="240" y="260" width="130" height="55" rx="6" fill="#f9fafb" />
          <rect x="430" y="260" width="130" height="55" rx="6" fill="#f9fafb" />
          {/* Mattress & Duvet */}
          <rect x="190" y="295" width="420" height="150" rx="10" fill="url(#linen)" />
          {/* Folded Throw Runner */}
          <rect x="190" y="380" width="420" height="50" fill="url(#throw)" />
          {/* Bed Base & Floor */}
          <rect x="150" y="440" width="500" height="20" rx="4" fill="#111827" />
          <rect x="0" y="455" width="800" height="45" fill="#0f172a" />
        </svg>
      );

    case 'living':
      return (
        <svg viewBox="0 0 800 500" className="h-full w-full object-cover" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <linearGradient id="bg-liv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#111827" />
              <stop offset="100%" stopColor="#1f2937" />
            </linearGradient>
            <linearGradient id="sofa-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="50%" stopColor="#4b5563" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>
          </defs>
          <rect width="800" height="500" fill="url(#bg-liv)" />
          {/* Panoramic Window */}
          <rect x="100" y="40" width="600" height="240" rx="6" fill="#0c1929" stroke="#374151" strokeWidth="2" />
          <g opacity="0.3" stroke="#38bdf8" strokeWidth="1">
            <line x1="300" y1="40" x2="300" y2="280" />
            <line x1="500" y1="40" x2="500" y2="280" />
            <circle cx="200" cy="120" r="1.5" fill="#fff" />
            <circle cx="420" cy="90" r="2" fill="#fff" />
            <circle cx="580" cy="140" r="1.5" fill="#fff" />
            <rect x="180" y="160" width="24" height="120" fill="#38bdf8" opacity="0.1" />
            <rect x="360" y="140" width="35" height="140" fill="#38bdf8" opacity="0.15" />
            <rect x="520" y="150" width="28" height="130" fill="#38bdf8" opacity="0.12" />
          </g>
          {/* Modern Sofa */}
          <rect x="160" y="270" width="480" height="120" rx="14" fill="url(#sofa-grad)" />
          <rect x="190" y="285" width="200" height="80" rx="10" fill="#4b5563" />
          <rect x="410" y="285" width="200" height="80" rx="10" fill="#4b5563" />
          {/* Cushions */}
          <rect x="200" y="295" width="60" height="55" rx="6" fill="#c29d59" transform="rotate(-6 200 295)" />
          <rect x="535" y="295" width="60" height="55" rx="6" fill="#0284c7" transform="rotate(6 535 295)" />
          {/* Low Coffee Table */}
          <ellipse cx="400" cy="430" rx="180" ry="35" fill="#111827" stroke="#d4af37" strokeWidth="2" />
          <ellipse cx="400" cy="430" rx="170" ry="30" fill="#1e293b" opacity="0.8" />
          {/* Coffee book & vase */}
          <rect x="340" y="415" width="40" height="20" rx="2" fill="#f8fafc" opacity="0.8" />
          <circle cx="430" cy="420" r="8" fill="#d97706" />
        </svg>
      );

    case 'bath':
      return (
        <svg viewBox="0 0 800 500" className="h-full w-full object-cover" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <linearGradient id="bg-bath" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="tub-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
          <rect width="800" height="500" fill="url(#bg-bath)" />
          {/* Marble tile grid */}
          <g opacity="0.1" stroke="#94a3b8" strokeWidth="1">
            <line x1="0" y1="100" x2="800" y2="100" />
            <line x1="0" y1="200" x2="800" y2="200" />
            <line x1="0" y1="300" x2="800" y2="300" />
            <line x1="0" y1="400" x2="800" y2="400" />
            <line x1="200" y1="0" x2="200" y2="500" />
            <line x1="400" y1="0" x2="400" y2="500" />
            <line x1="600" y1="0" x2="600" y2="500" />
          </g>
          {/* Backlit Vanity Mirror */}
          <rect x="250" y="40" width="300" height="140" rx="70" fill="#0f172a" stroke="#d4af37" strokeWidth="2" />
          <circle cx="400" cy="110" r="60" fill="#38bdf8" opacity="0.05" />
          {/* Bathtub */}
          <path d="M 180 260 C 180 380, 620 380, 620 260 Z" fill="url(#tub-grad)" stroke="#94a3b8" strokeWidth="2" />
          <ellipse cx="400" cy="260" rx="220" ry="30" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
          <ellipse cx="400" cy="263" rx="200" ry="24" fill="#38bdf8" opacity="0.3" />
          {/* Gold Tap */}
          <path d="M 400 180 L 400 230" stroke="#d4af37" strokeWidth="6" strokeLinecap="round" />
          <path d="M 385 180 L 415 180" stroke="#d4af37" strokeWidth="4" strokeLinecap="round" />
          {/* Robe Hook & Towel */}
          <rect x="680" y="100" width="16" height="180" rx="6" fill="#f1f5f9" opacity="0.8" />
        </svg>
      );

    case 'pool':
      return (
        <svg viewBox="0 0 800 500" className="h-full w-full object-cover" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <linearGradient id="bg-pool" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="sun-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <rect width="800" height="240" fill="#0f172a" />
          {/* Sunset Horizon */}
          <circle cx="400" cy="230" r="80" fill="url(#sun-grad)" opacity="0.8" />
          <rect width="800" height="260" y="240" fill="url(#bg-pool)" />
          {/* Water reflection bands */}
          <path d="M 0 280 Q 200 270 400 280 T 800 280 L 800 500 L 0 500 Z" fill="#0284c7" opacity="0.3" />
          <path d="M 0 340 Q 250 330 500 340 T 800 340 L 800 500 L 0 500 Z" fill="#38bdf8" opacity="0.25" />
          {/* Pool Loungers */}
          <g stroke="#cbd5e1" strokeWidth="3" fill="none">
            <path d="M 120 420 L 170 390 L 220 390" strokeLinecap="round" />
            <line x1="130" y1="420" x2="130" y2="445" />
            <line x1="210" y1="390" x2="210" y2="445" />
            <path d="M 580 420 L 630 390 L 680 390" strokeLinecap="round" />
            <line x1="590" y1="420" x2="590" y2="445" />
            <line x1="670" y1="390" x2="670" y2="445" />
          </g>
          {/* Sun Umbrellas */}
          <path d="M 80 320 Q 140 270 200 320 Z" fill="#f8fafc" />
          <line x1="140" y1="285" x2="140" y2="430" stroke="#64748b" strokeWidth="3" />
          <path d="M 600 320 Q 660 270 720 320 Z" fill="#f8fafc" />
          <line x1="660" y1="285" x2="660" y2="430" stroke="#64748b" strokeWidth="3" />
        </svg>
      );

    case 'dining':
      return (
        <svg viewBox="0 0 800 500" className="h-full w-full object-cover" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <radialGradient id="table-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="500" fill="#18181b" />
          {/* Warm Chandeliers */}
          <circle cx="240" cy="130" r="120" fill="url(#table-glow)" />
          <circle cx="560" cy="130" r="120" fill="url(#table-glow)" />
          <line x1="240" y1="0" x2="240" y2="100" stroke="#eab308" strokeWidth="2" />
          <line x1="560" y1="0" x2="560" y2="100" stroke="#eab308" strokeWidth="2" />
          <ellipse cx="240" cy="105" rx="35" ry="12" fill="#ca8a04" />
          <ellipse cx="560" cy="105" rx="35" ry="12" fill="#ca8a04" />
          {/* Restaurant Tables with white linen */}
          <ellipse cx="240" cy="360" rx="140" ry="55" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="2" />
          <ellipse cx="560" cy="360" rx="140" ry="55" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="2" />
          {/* Candle & Wine Glasses */}
          <ellipse cx="240" cy="335" rx="5" ry="3" fill="#f59e0b" />
          <line x1="240" y1="330" x2="240" y2="335" stroke="#ea580c" strokeWidth="2" />
          <circle cx="215" cy="345" r="7" fill="#dc2626" opacity="0.6" />
          <ellipse cx="560" cy="335" rx="5" ry="3" fill="#f59e0b" />
          <line x1="560" y1="330" x2="560" y2="335" stroke="#ea580c" strokeWidth="2" />
          <circle cx="535" cy="345" r="7" fill="#dc2626" opacity="0.6" />
        </svg>
      );

    case 'spa':
      return (
        <svg viewBox="0 0 800 500" className="h-full w-full object-cover" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <radialGradient id="spa-zen" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="500" fill="#0f172a" />
          <circle cx="400" cy="220" r="200" fill="url(#spa-zen)" />
          {/* Bamboo Silhouette Left */}
          <g stroke="#059669" strokeWidth="4" opacity="0.4">
            <line x1="60" y1="0" x2="60" y2="500" />
            <line x1="100" y1="0" x2="100" y2="500" />
            <line x1="140" y1="0" x2="140" y2="500" />
          </g>
          {/* Treatment Bed */}
          <rect x="220" y="270" width="360" height="70" rx="10" fill="#334155" stroke="#10b981" strokeWidth="1" />
          <rect x="240" y="255" width="70" height="30" rx="6" fill="#f8fafc" />
          <rect x="250" y="280" width="300" height="40" rx="4" fill="#e2e8f0" opacity="0.9" />
          {/* Hot Stones & Lotus Flower */}
          <ellipse cx="370" cy="295" rx="12" ry="7" fill="#1e293b" />
          <ellipse cx="400" cy="295" rx="14" ry="8" fill="#1e293b" />
          <ellipse cx="430" cy="295" rx="11" ry="6" fill="#1e293b" />
          <circle cx="480" cy="295" r="9" fill="#f472b6" opacity="0.8" />
        </svg>
      );

    case 'rooftop':
    case 'view-skyline':
      return (
        <svg viewBox="0 0 800 500" className="h-full w-full object-cover" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <linearGradient id="sky-twilight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0b0f19" />
              <stop offset="45%" stopColor="#1e1b4b" />
              <stop offset="75%" stopColor="#431407" />
              <stop offset="100%" stopColor="#1c1917" />
            </linearGradient>
          </defs>
          <rect width="800" height="500" fill="url(#sky-twilight)" />
          {/* Skyline Towers */}
          <g fill="#0f172a" opacity="0.9">
            <rect x="50" y="180" width="70" height="320" />
            <rect x="140" y="120" width="90" height="380" />
            <polygon points="185,70 140,120 230,120" />
            <rect x="250" y="210" width="80" height="290" />
            <rect x="350" y="150" width="100" height="350" />
            <rect x="470" y="100" width="85" height="400" />
            <line x1="512" y1="50" x2="512" y2="100" stroke="#f43f5e" strokeWidth="2" />
            <rect x="575" y="170" width="90" height="330" />
            <rect x="680" y="140" width="75" height="360" />
          </g>
          {/* Tower Window Lights */}
          <g fill="#fef08a" opacity="0.6">
            <rect x="155" y="150" width="4" height="6" />
            <rect x="175" y="170" width="4" height="6" />
            <rect x="195" y="150" width="4" height="6" />
            <rect x="370" y="180" width="5" height="7" />
            <rect x="390" y="210" width="5" height="7" />
            <rect x="485" y="130" width="5" height="7" />
            <rect x="510" y="160" width="5" height="7" />
            <rect x="600" y="200" width="4" height="6" />
          </g>
          {/* Glass Balcony Railing */}
          <rect x="0" y="420" width="800" height="80" fill="#1e293b" opacity="0.5" stroke="#38bdf8" strokeWidth="1" />
          <line x1="0" y1="420" x2="800" y2="420" stroke="#60a5fa" strokeWidth="2" />
        </svg>
      );

    case 'lobby':
      return (
        <svg viewBox="0 0 800 500" className="h-full w-full object-cover" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <radialGradient id="lobby-chandelier" cx="0.5" cy="0.2" r="0.6">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="500" fill="#0f172a" />
          <circle cx="400" cy="100" r="240" fill="url(#lobby-chandelier)" />
          {/* Grand Columns */}
          <g fill="#1e293b" stroke="#d4af37" strokeWidth="1">
            <rect x="120" y="0" width="50" height="440" />
            <rect x="630" y="0" width="50" height="440" />
          </g>
          {/* Concierge Desk */}
          <rect x="250" y="320" width="300" height="120" rx="8" fill="#18181b" stroke="#eab308" strokeWidth="2" />
          <rect x="270" y="300" width="260" height="25" rx="4" fill="#3f3f46" />
          <circle cx="400" cy="285" r="10" fill="#ca8a04" />
          {/* Polished Marble Floor */}
          <rect x="0" y="440" width="800" height="60" fill="#090d16" />
          <line x1="0" y1="440" x2="800" y2="440" stroke="#334155" strokeWidth="1" />
        </svg>
      );

    case 'fitness':
      return (
        <svg viewBox="0 0 800 500" className="h-full w-full object-cover" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <rect width="800" height="500" fill="#090d16" />
          {/* Mirror wall */}
          <rect x="100" y="60" width="600" height="260" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1" opacity="0.6" />
          {/* Dumbbell racks */}
          <rect x="180" y="320" width="200" height="90" rx="4" fill="#27272a" stroke="#71717a" strokeWidth="1" />
          <circle cx="210" cy="340" r="14" fill="#52525b" />
          <circle cx="250" cy="340" r="14" fill="#52525b" />
          <circle cx="290" cy="340" r="14" fill="#52525b" />
          {/* Treadmills */}
          <g stroke="#38bdf8" strokeWidth="4" fill="none">
            <line x1="480" y1="410" x2="570" y2="410" />
            <line x1="560" y1="410" x2="540" y2="330" />
            <line x1="535" y1="330" x2="555" y2="330" />
            <line x1="620" y1="410" x2="710" y2="410" />
            <line x1="700" y1="410" x2="680" y2="330" />
            <line x1="675" y1="330" x2="695" y2="330" />
          </g>
        </svg>
      );

    case 'view-city':
    case 'view-pool':
    case 'view-garden':
    default:
      return (
        <svg viewBox="0 0 800 500" className="h-full w-full object-cover" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <linearGradient id="bg-garden" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#064e3b" />
              <stop offset="60%" stopColor="#047857" />
              <stop offset="100%" stopColor="#065f46" />
            </linearGradient>
          </defs>
          <rect width="800" height="500" fill="url(#bg-garden)" />
          {/* Courtyard archway */}
          <path d="M 200 500 L 200 240 Q 400 120 600 240 L 600 500 Z" fill="#022c22" opacity="0.6" />
          <circle cx="400" cy="380" r="70" fill="#059669" opacity="0.5" />
          <circle cx="400" cy="380" r="25" fill="#34d399" opacity="0.7" />
        </svg>
      );
  }
}
