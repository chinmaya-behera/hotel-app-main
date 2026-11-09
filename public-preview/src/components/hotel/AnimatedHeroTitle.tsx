'use client';

import { useState, useEffect, useRef } from 'react';

interface WordConfig {
  id: number;
  text: string;
  isGradient: boolean;
  startChar: number;
  endChar: number;
}

const WORDS: WordConfig[] = [
  { id: 0, text: 'Where', isGradient: false, startChar: 0, endChar: 5 },
  { id: 1, text: 'Timeless', isGradient: false, startChar: 6, endChar: 14 },
  { id: 2, text: 'Luxury', isGradient: true, startChar: 15, endChar: 21 },
  { id: 3, text: 'Meets', isGradient: false, startChar: 22, endChar: 27 },
  { id: 4, text: 'Coastal', isGradient: false, startChar: 28, endChar: 35 },
  { id: 5, text: 'Calm', isGradient: false, startChar: 36, endChar: 40 },
];

const FULL_TEXT = 'Where Timeless Luxury Meets Coastal Calm';
const TOTAL_CHARS = FULL_TEXT.length; // 40

export function AnimatedHeroTitle() {
  const [charCount, setCharCount] = useState(0);
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  const containerRef = useRef<HTMLHeadingElement>(null);

  // 1. Handcrafted Typewriter Writing Animation
  useEffect(() => {
    // Check for reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCharCount(TOTAL_CHARS);
      setIsTypingDone(true);
      setShowCursor(false);
      return;
    }

    let current = 0;
    // Initial delay before writing begins for a dramatic entrance
    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        current += 1;
        setCharCount(current);

        if (current >= TOTAL_CHARS) {
          clearInterval(interval);
          setIsTypingDone(true);

          // Cursor blinks for 1.8s after typing completes, then smoothly fades out
          setTimeout(() => {
            setShowCursor(false);
          }, 1800);
        }
      }, 42); // 42ms per char for an organic, elegant writing speed

      return () => clearInterval(interval);
    }, 250);

    return () => clearTimeout(startDelay);
  }, []);

  // 2. High-performance Scroll-Driven Revealing Animation
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const currentScroll = window.scrollY;

      // If user scrolls down immediately, fast-forward typing so full headline is revealed
      if (currentScroll > 40 && !isTypingDone) {
        setCharCount(TOTAL_CHARS);
        setIsTypingDone(true);
        setShowCursor(false);
      }

      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(currentScroll);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isTypingDone]);

  // Compute normalized scroll progress for the hero area (0 to 1 over first 400px of scrolling)
  const scrollProgress = Math.min(1, Math.max(0, scrollY / 400));

  return (
    <h1
      ref={containerRef}
      className="relative mt-5 font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] select-none"
    >
      {/* Accessible & SEO: Screen readers and bots always read the complete semantic text */}
      <span className="sr-only">{FULL_TEXT}</span>

      {/* Visual Animated Output */}
      <span aria-hidden="true" className="inline-flex flex-wrap justify-center items-baseline gap-x-[0.28em] gap-y-1">
        {WORDS.map((word, wordIndex) => {
          // Calculate characters typed for this word
          const countInWord = Math.max(0, Math.min(word.text.length, charCount - word.startChar));
          const typedSlice = word.text.slice(0, countInWord);
          const untypedSlice = word.text.slice(countInWord);

          const isStarted = charCount >= word.startChar;
          const isFinished = charCount >= word.endChar;

          // Cursor placement: show cursor at active write head
          const hasCursor =
            showCursor &&
            ((!isFinished && isStarted) ||
              (isFinished && wordIndex === WORDS.length - 1 && charCount >= TOTAL_CHARS) ||
              (isFinished && wordIndex < WORDS.length - 1 && charCount === word.endChar));

          // Scroll reveal calculation per word:
          // As the user scrolls, a radiant luminous wave scrubs sequentially through the words
          const wordStepStart = (wordIndex / WORDS.length) * 0.65;
          const wordStepEnd = wordStepStart + 0.35;
          const wordScrollFactor = Math.min(
            1,
            Math.max(0, (scrollProgress - wordStepStart) / (wordStepEnd - wordStepStart))
          );

          // Subtle parallax lift & depth translation on scroll
          const translateY = isTypingDone ? -scrollY * 0.08 * (1 + wordIndex * 0.05) : 0;

          // Scroll reveal glow & illumination intensity (peaks as scroll passes through each word)
          const revealGlow = isTypingDone ? Math.sin(wordScrollFactor * Math.PI) * 0.75 : 0;
          const scrollScale = isTypingDone ? 1 + wordScrollFactor * 0.035 : 1;

          return (
            <span
              key={word.id}
              className="inline-flex items-baseline transition-transform duration-300 ease-out"
              style={{
                transform: `translate3d(0, ${translateY}px, 0) scale(${scrollScale})`,
                willChange: 'transform',
              }}
            >
              {word.isGradient ? (
                <span
                  className="text-gradient relative inline-block transition-all duration-300"
                  style={{
                    filter:
                      revealGlow > 0.05
                        ? `drop-shadow(0 0 ${16 + revealGlow * 20}px rgba(240,169,207,${0.45 + revealGlow * 0.55}))`
                        : undefined,
                  }}
                >
                  {/* Typed visible characters */}
                  <span>{typedSlice}</span>
                  {/* Pre-allocated untyped characters to eliminate layout shifts */}
                  {!isTypingDone && untypedSlice.length > 0 && (
                    <span className="opacity-0 pointer-events-none select-none">{untypedSlice}</span>
                  )}
                </span>
              ) : (
                <span
                  className="relative inline-block text-white transition-all duration-300"
                  style={{
                    filter:
                      revealGlow > 0.05
                        ? `drop-shadow(0 0 ${12 + revealGlow * 16}px rgba(251,191,36,${0.35 + revealGlow * 0.5}))`
                        : undefined,
                  }}
                >
                  {/* Typed visible characters */}
                  <span>{typedSlice}</span>
                  {/* Pre-allocated untyped characters to eliminate layout shifts */}
                  {!isTypingDone && untypedSlice.length > 0 && (
                    <span className="opacity-0 pointer-events-none select-none">{untypedSlice}</span>
                  )}
                </span>
              )}

              {/* Typing Cursor attached to current writing character */}
              {hasCursor && (
                <span
                  className="inline-block w-[3px] sm:w-[4px] h-[0.76em] ml-1 align-baseline rounded-full bg-gradient-to-b from-amber-300 via-rose-300 to-sky-300 shadow-[0_0_12px_rgba(251,191,36,0.95)] animate-pulse"
                  style={{
                    boxShadow: '0 0 14px #fbbf24, 0 0 28px rgba(244,114,182,0.6)',
                  }}
                />
              )}
            </span>
          );
        })}
      </span>
    </h1>
  );
}
