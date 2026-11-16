'use client';

import React from 'react';

/**
 * LuxuryBotanicalBackground Component
 * Specifically tailored for The Grand ADP Guest Portal (Burgundy Theme).
 * 
 * Exact 1:1 recreation of the reference artwork:
 * 1. Warm pale champagne ivory & parchment canvas (#F7F3E8 / #FBF8F1) with subtle matte paper tone.
 * 2. Left vertical decorative pattern (~7% canvas width):
 *    - Straight double-line vertical gold divider running top-to-bottom at ~7.2% width.
 *    - Stacked Art Deco semicircular fan patterns with fine radiating curved lines originating from vertex points.
 *    - Alternating fan orientations partially cropped by the left edge.
 * 3. Top-right geometric pattern:
 *    - Three large circular ornamental forms along the top edge + overlapping circular fan motifs below toward the right.
 *    - Delicate radial lines extending from center to curved perimeter.
 *    - Low-contrast champagne-beige & pale gold strokes fading softly into the background.
 * 4. Bottom-right sculptural floral design:
 *    - Dimensional folded-petal floral sculpture.
 *    - Prominent deep dusty-burgundy (#641329, #7E1A33) and muted mauve (#A05268, #B27B8A) folded petals.
 *    - Large ivory & champagne-beige outer petals (#FFFDF8, #F8F2E6) with smooth 3D shading.
 *    - Metallic champagne-gold edge tracing (#D8BE90, #ECC880).
 *    - Embossed vein details and realistic sculptural petal folds.
 * 5. Delicate geometric ornamental border:
 *    - Inset rectangular border with double-line styling and Art Deco corner intersections.
 * 6. Bottom-center diamond ornament:
 *    - Two symmetrical horizontal hairlines with a centered tiny champagne diamond flourish.
 * 7. Clean open center:
 *    - 100% unobstructed central area for headings, cards, and guest controls.
 */
export function LuxuryBotanicalBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none luxury-botanical-canvas"
      style={{
        background: `
          radial-gradient(1200px 750px at 45% 35%, #FBF8F1 0%, #F6F0E4 52%, #EDE4D2 100%),
          #F7F3E8
        `,
      }}
    >
      <svg
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle drop shadow for 3D petal depth */}
          <filter id="petal-shadow" x="-15%" y="-15%" width="135%" height="135%">
            <feDropShadow dx="3" dy="6" stdDeviation="7" floodColor="#3A121A" floodOpacity="0.22" />
          </filter>
          <filter id="petal-shadow-soft" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="2" dy="4" stdDeviation="5" floodColor="#421820" floodOpacity="0.14" />
          </filter>
          <filter id="ivory-shadow" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="3" dy="5" stdDeviation="6" floodColor="#6B5945" floodOpacity="0.15" />
          </filter>

          {/* Gradients for Dimensional Burgundy Petals */}
          <linearGradient id="burgundy-main-grad" x1="1200" y1="520" x2="1550" y2="880" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8A223E" />
            <stop offset="35%" stopColor="#74172F" />
            <stop offset="75%" stopColor="#5E1024" />
            <stop offset="100%" stopColor="#430816" />
          </linearGradient>

          <linearGradient id="burgundy-curl-grad" x1="1300" y1="620" x2="1600" y2="760" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9E3550" />
            <stop offset="30%" stopColor="#801C35" />
            <stop offset="70%" stopColor="#641329" />
            <stop offset="100%" stopColor="#460A1A" />
          </linearGradient>

          <linearGradient id="mauve-fold-grad" x1="1240" y1="680" x2="1520" y2="840" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#B26E80" />
            <stop offset="40%" stopColor="#96455D" />
            <stop offset="80%" stopColor="#722439" />
            <stop offset="100%" stopColor="#501222" />
          </linearGradient>

          {/* Gradients for Dimensional Ivory & Champagne Outer Petals */}
          <linearGradient id="ivory-outer-grad-1" x1="1300" y1="400" x2="1620" y2="700" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFDF9" />
            <stop offset="45%" stopColor="#FAF4E8" />
            <stop offset="80%" stopColor="#ECE0CD" />
            <stop offset="100%" stopColor="#DECDB4" />
          </linearGradient>

          <linearGradient id="ivory-outer-grad-2" x1="1050" y1="720" x2="1480" y2="920" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFDF9" />
            <stop offset="40%" stopColor="#F8F2E4" />
            <stop offset="75%" stopColor="#EADECB" />
            <stop offset="100%" stopColor="#D8C8B0" />
          </linearGradient>

          <linearGradient id="ivory-curl-inside" x1="1400" y1="700" x2="1580" y2="860" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F5ECE0" />
            <stop offset="50%" stopColor="#E5D6C1" />
            <stop offset="100%" stopColor="#CFBCA2" />
          </linearGradient>

          {/* Metallic Champagne Gold Gradients for Petal Edges */}
          <linearGradient id="metallic-gold-rim" x1="1100" y1="500" x2="1600" y2="900" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F5E4BD" />
            <stop offset="45%" stopColor="#D8BE90" />
            <stop offset="70%" stopColor="#ECC880" />
            <stop offset="100%" stopColor="#C9A45C" />
          </linearGradient>

          {/* Hairline Fades for Bottom-Center Diamond */}
          <linearGradient id="fade-line-left" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D8BE90" stopOpacity="0" />
            <stop offset="100%" stopColor="#D8BE90" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="fade-line-right" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D8BE90" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#D8BE90" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* =================================================================== */}
        {/* 1. LEFT VERTICAL DECORATIVE STRIP (~7% width = 114px)               */}
        {/* =================================================================== */}
        <g id="left-vertical-pattern">
          {/* Subtle warm cream background tint for the strip */}
          <rect x="0" y="0" width="114" height="900" fill="rgba(216, 190, 144, 0.08)" />

          {/* Thin, straight, double-line vertical gold divider running top-to-bottom at ~7.2% */}
          <line x1="114" y1="0" x2="114" y2="900" stroke="#D8BE90" strokeWidth="1.2" opacity="0.65" />
          <line x1="117.5" y1="0" x2="117.5" y2="900" stroke="#E6D7BD" strokeWidth="0.8" opacity="0.45" />

          {/* Vertically stacked Art Deco fan-shaped semicircular patterns */}
          {/* Module 1 (y: 0 to 110) - radiating from (0, 0) */}
          <g opacity="0.6">
            <path d="M0,0 M114,0 A114,114 0 0,1 0,114" stroke="#D8BE90" strokeWidth="0.9" fill="none" />
            <path d="M0,0 M85,0 A85,85 0 0,1 0,85" stroke="#E0CCAA" strokeWidth="0.6" strokeDasharray="3 2" fill="none" />
            <line x1="0" y1="0" x2="113" y2="18" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="0" x2="107" y2="38" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="0" x2="98" y2="58" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="0" x2="84" y2="76" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="0" x2="66" y2="92" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="0" x2="45" y2="104" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="0" x2="22" y2="111" stroke="#D8BE90" strokeWidth="0.65" />
          </g>

          {/* Module 2 (y: 80 to 220) - radiating from divider (114, 150) curving leftward */}
          <g opacity="0.65">
            <path d="M114,150 M114,50 A100,100 0 0,0 14,150 A100,100 0 0,0 114,250" stroke="#D8BE90" strokeWidth="0.9" fill="none" />
            <path d="M114,150 M114,75 A75,75 0 0,0 39,150 A75,75 0 0,0 114,225" stroke="#E0CCAA" strokeWidth="0.6" strokeDasharray="3 2" fill="none" />
            <line x1="114" y1="150" x2="20" y2="115" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="150" x2="15" y2="135" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="150" x2="14" y2="150" stroke="#D8BE90" strokeWidth="0.75" />
            <line x1="114" y1="150" x2="15" y2="165" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="150" x2="20" y2="185" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="150" x2="35" y2="205" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="150" x2="55" y2="222" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="150" x2="80" y2="238" stroke="#D8BE90" strokeWidth="0.65" />
          </g>

          {/* Module 3 (y: 200 to 340) - radiating from (0, 270) curving rightward */}
          <g opacity="0.65">
            <path d="M0,270 M0,165 A105,105 0 0,1 105,270 A105,105 0 0,1 0,375" stroke="#D8BE90" strokeWidth="0.9" fill="none" />
            <path d="M0,270 M0,195 A75,75 0 0,1 75,270 A75,75 0 0,1 0,345" stroke="#E0CCAA" strokeWidth="0.6" strokeDasharray="3 2" fill="none" />
            <line x1="0" y1="270" x2="95" y2="230" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="270" x2="103" y2="250" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="270" x2="105" y2="270" stroke="#D8BE90" strokeWidth="0.75" />
            <line x1="0" y1="270" x2="103" y2="290" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="270" x2="95" y2="310" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="270" x2="78" y2="330" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="270" x2="56" y2="348" stroke="#D8BE90" strokeWidth="0.65" />
          </g>

          {/* Module 4 (y: 320 to 460) - radiating from divider (114, 390) curving leftward */}
          <g opacity="0.65">
            <path d="M114,390 M114,290 A100,100 0 0,0 14,390 A100,100 0 0,0 114,490" stroke="#D8BE90" strokeWidth="0.9" fill="none" />
            <path d="M114,390 M114,315 A75,75 0 0,0 39,390 A75,75 0 0,0 114,465" stroke="#E0CCAA" strokeWidth="0.6" strokeDasharray="3 2" fill="none" />
            <line x1="114" y1="390" x2="20" y2="355" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="390" x2="15" y2="375" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="390" x2="14" y2="390" stroke="#D8BE90" strokeWidth="0.75" />
            <line x1="114" y1="390" x2="15" y2="405" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="390" x2="20" y2="425" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="390" x2="35" y2="445" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="390" x2="55" y2="462" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="390" x2="80" y2="478" stroke="#D8BE90" strokeWidth="0.65" />
          </g>

          {/* Module 5 (y: 440 to 580) - radiating from (0, 510) curving rightward */}
          <g opacity="0.65">
            <path d="M0,510 M0,405 A105,105 0 0,1 105,510 A105,105 0 0,1 0,615" stroke="#D8BE90" strokeWidth="0.9" fill="none" />
            <path d="M0,510 M0,435 A75,75 0 0,1 75,510 A75,75 0 0,1 0,585" stroke="#E0CCAA" strokeWidth="0.6" strokeDasharray="3 2" fill="none" />
            <line x1="0" y1="510" x2="95" y2="470" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="510" x2="103" y2="490" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="510" x2="105" y2="510" stroke="#D8BE90" strokeWidth="0.75" />
            <line x1="0" y1="510" x2="103" y2="530" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="510" x2="95" y2="550" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="510" x2="78" y2="570" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="510" x2="56" y2="588" stroke="#D8BE90" strokeWidth="0.65" />
          </g>

          {/* Module 6 (y: 560 to 700) - radiating from divider (114, 630) curving leftward */}
          <g opacity="0.65">
            <path d="M114,630 M114,530 A100,100 0 0,0 14,630 A100,100 0 0,0 114,730" stroke="#D8BE90" strokeWidth="0.9" fill="none" />
            <path d="M114,630 M114,555 A75,75 0 0,0 39,630 A75,75 0 0,0 114,705" stroke="#E0CCAA" strokeWidth="0.6" strokeDasharray="3 2" fill="none" />
            <line x1="114" y1="630" x2="20" y2="595" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="630" x2="15" y2="615" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="630" x2="14" y2="630" stroke="#D8BE90" strokeWidth="0.75" />
            <line x1="114" y1="630" x2="15" y2="645" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="630" x2="20" y2="665" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="630" x2="35" y2="685" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="630" x2="55" y2="702" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="630" x2="80" y2="718" stroke="#D8BE90" strokeWidth="0.65" />
          </g>

          {/* Module 7 (y: 680 to 820) - radiating from (0, 750) curving rightward */}
          <g opacity="0.65">
            <path d="M0,750 M0,645 A105,105 0 0,1 105,750 A105,105 0 0,1 0,855" stroke="#D8BE90" strokeWidth="0.9" fill="none" />
            <path d="M0,750 M0,675 A75,75 0 0,1 75,750 A75,75 0 0,1 0,825" stroke="#E0CCAA" strokeWidth="0.6" strokeDasharray="3 2" fill="none" />
            <line x1="0" y1="750" x2="95" y2="710" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="750" x2="103" y2="730" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="750" x2="105" y2="750" stroke="#D8BE90" strokeWidth="0.75" />
            <line x1="0" y1="750" x2="103" y2="770" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="750" x2="95" y2="790" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="750" x2="78" y2="810" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="0" y1="750" x2="56" y2="828" stroke="#D8BE90" strokeWidth="0.65" />
          </g>

          {/* Module 8 (y: 800 to 900) - radiating from divider (114, 870) */}
          <g opacity="0.65">
            <path d="M114,870 M114,770 A100,100 0 0,0 14,870 A100,100 0 0,0 35,900" stroke="#D8BE90" strokeWidth="0.9" fill="none" />
            <line x1="114" y1="870" x2="20" y2="835" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="870" x2="15" y2="855" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="870" x2="14" y2="870" stroke="#D8BE90" strokeWidth="0.75" />
            <line x1="114" y1="870" x2="18" y2="888" stroke="#D8BE90" strokeWidth="0.65" />
            <line x1="114" y1="870" x2="35" y2="900" stroke="#D8BE90" strokeWidth="0.65" />
          </g>
        </g>

        {/* =================================================================== */}
        {/* 2. TOP-RIGHT GEOMETRIC CIRCULAR MOTIFS                              */}
        {/* =================================================================== */}
        <g id="top-right-pattern" opacity="0.45">
          {/* Circular Motif 1 (Top Edge, left-most: center at 1260, -25, r=160) */}
          <g>
            <circle cx="1260" cy="-25" r="160" stroke="#D8BE90" strokeWidth="0.9" fill="none" />
            <circle cx="1260" cy="-25" r="120" stroke="#E6D7BD" strokeWidth="0.6" strokeDasharray="3 2" fill="none" />
            <circle cx="1260" cy="-25" r="80" stroke="#D8BE90" strokeWidth="0.6" fill="none" />
            {/* Rays extending downward and rightward */}
            <line x1="1260" y1="-25" x2="1140" y2="85" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1260" y1="-25" x2="1180" y2="105" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1260" y1="-25" x2="1225" y2="125" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1260" y1="-25" x2="1275" y2="134" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1260" y1="-25" x2="1330" y2="130" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1260" y1="-25" x2="1380" y2="112" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1260" y1="-25" x2="1415" y2="75" stroke="#D8BE90" strokeWidth="0.5" />
          </g>

          {/* Circular Motif 2 (Top Edge, middle: center at 1430, -10, r=180) */}
          <g>
            <circle cx="1430" cy="-10" r="180" stroke="#D8BE90" strokeWidth="1.0" fill="none" />
            <circle cx="1430" cy="-10" r="135" stroke="#E6D7BD" strokeWidth="0.65" strokeDasharray="4 2.5" fill="none" />
            <circle cx="1430" cy="-10" r="90" stroke="#D8BE90" strokeWidth="0.6" fill="none" />
            {/* Rays */}
            <line x1="1430" y1="-10" x2="1290" y2="105" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1430" y1="-10" x2="1340" y2="135" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1430" y1="-10" x2="1395" y2="160" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1430" y1="-10" x2="1455" y2="168" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1430" y1="-10" x2="1515" y2="158" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1430" y1="-10" x2="1570" y2="130" stroke="#D8BE90" strokeWidth="0.5" />
          </g>

          {/* Circular Motif 3 (Top Edge, right-most: center at 1600, -20, r=190) */}
          <g>
            <circle cx="1600" cy="-20" r="190" stroke="#D8BE90" strokeWidth="1.0" fill="none" />
            <circle cx="1600" cy="-20" r="140" stroke="#E6D7BD" strokeWidth="0.6" strokeDasharray="3 2" fill="none" />
            <line x1="1600" y1="-20" x2="1430" y2="60" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1600" y1="-20" x2="1470" y2="105" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1600" y1="-20" x2="1520" y2="145" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1600" y1="-20" x2="1575" y2="168" stroke="#D8BE90" strokeWidth="0.5" />
          </g>

          {/* Circular Motif 4 (Overlapping below: center at 1350, 110, r=140) */}
          <g>
            <circle cx="1350" cy="110" r="140" stroke="#D8BE90" strokeWidth="0.85" fill="none" />
            <circle cx="1350" cy="110" r="95" stroke="#E6D7BD" strokeWidth="0.55" strokeDasharray="3 2" fill="none" />
            <line x1="1350" y1="110" x2="1245" y2="200" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1350" y1="110" x2="1285" y2="225" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1350" y1="110" x2="1335" y2="245" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1350" y1="110" x2="1390" y2="248" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1350" y1="110" x2="1440" y2="235" stroke="#D8BE90" strokeWidth="0.5" />
          </g>

          {/* Circular Motif 5 (Overlapping right: center at 1520, 130, r=160) */}
          <g>
            <circle cx="1520" cy="130" r="160" stroke="#D8BE90" strokeWidth="0.9" fill="none" />
            <circle cx="1520" cy="130" r="110" stroke="#E6D7BD" strokeWidth="0.6" strokeDasharray="3 2" fill="none" />
            <line x1="1520" y1="130" x2="1390" y2="220" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1520" y1="130" x2="1445" y2="255" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1520" y1="130" x2="1510" y2="288" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1520" y1="130" x2="1575" y2="278" stroke="#D8BE90" strokeWidth="0.5" />
          </g>

          {/* Circular Motif 6 (Further down right edge: center at 1620, 240, r=150) */}
          <g>
            <circle cx="1620" cy="240" r="150" stroke="#D8BE90" strokeWidth="0.85" fill="none" />
            <line x1="1620" y1="240" x2="1490" y2="310" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1620" y1="240" x2="1530" y2="350" stroke="#D8BE90" strokeWidth="0.5" />
            <line x1="1620" y1="240" x2="1590" y2="385" stroke="#D8BE90" strokeWidth="0.5" />
          </g>
        </g>

        {/* =================================================================== */}
        {/* 3. INSET GEOMETRIC ORNAMENTAL BORDER & ART DECO CORNER BRACKETS     */}
        {/* =================================================================== */}
        <g id="geometric-border" opacity="0.6">
          {/* Top border double line (running below header area) */}
          <line x1="114" y1="22" x2="1578" y2="22" stroke="#D8BE90" strokeWidth="0.9" />
          <line x1="114" y1="25.5" x2="1578" y2="25.5" stroke="#E6D7BD" strokeWidth="0.6" />

          {/* Right border double line */}
          <line x1="1578" y1="22" x2="1578" y2="878" stroke="#D8BE90" strokeWidth="0.9" />
          <line x1="1574.5" y1="22" x2="1574.5" y2="878" stroke="#E6D7BD" strokeWidth="0.6" />

          {/* Bottom border double line */}
          <line x1="114" y1="878" x2="1578" y2="878" stroke="#D8BE90" strokeWidth="0.9" />
          <line x1="114" y1="874.5" x2="1578" y2="874.5" stroke="#E6D7BD" strokeWidth="0.6" />

          {/* Top-Right Corner Bracket */}
          <path d="M1560,22 L1578,22 L1578,40" stroke="#D8BE90" strokeWidth="1.4" fill="none" />
          <rect x="1568" y="18" width="5" height="5" transform="rotate(45 1570.5 20.5)" fill="#D8BE90" opacity="0.75" />

          {/* Bottom-Right Corner Bracket */}
          <path d="M1560,878 L1578,878 L1578,860" stroke="#D8BE90" strokeWidth="1.4" fill="none" />
          <rect x="1568" y="874" width="5" height="5" transform="rotate(45 1570.5 876.5)" fill="#D8BE90" opacity="0.75" />

          {/* Bottom-Left Corner Bracket at divider junction */}
          <path d="M132,878 L114,878 L114,860" stroke="#D8BE90" strokeWidth="1.4" fill="none" />
        </g>

        {/* =================================================================== */}
        {/* 4. BOTTOM-CENTER ORNAMENTAL DIAMOND FLOURISH                        */}
        {/* =================================================================== */}
        <g id="bottom-center-diamond" transform="translate(800, 862)">
          {/* Left horizontal hairline */}
          <line x1="-54" y1="0" x2="-8" y2="0" stroke="url(#fade-line-left)" strokeWidth="0.9" />
          {/* Right horizontal hairline */}
          <line x1="8" y1="0" x2="54" y2="0" stroke="url(#fade-line-right)" strokeWidth="0.9" />
          {/* Centered Diamond Shape */}
          <polygon points="0,-4.5 4.5,0 0,4.5 -4.5,0" fill="#D8BE90" stroke="#C9A45C" strokeWidth="0.75" />
          <circle cx="0" cy="0" r="1.2" fill="#74172F" />
        </g>

        {/* =================================================================== */}
        {/* 5. BOTTOM-RIGHT SCULPTURAL FOLDED-PETAL FLORAL ARRANGEMENT          */}
        {/*    (Dimensional, overlapping organic petals, burgundy & ivory)      */}
        {/* =================================================================== */}
        <g id="sculptural-floral-composition" transform="translate(0, 0)">
          {/* --------------------------------------------------------------- */}
          {/* LAYER A: BACKING IVORY OUTER PETALS & AMBIENT SHADOWS           */}
          {/* --------------------------------------------------------------- */}
          {/* Large Upper Ivory Petal (extending upward along right edge) */}
          <g filter="url(#ivory-shadow)">
            <path
              d="M1490,440 C1460,490 1445,560 1470,640 C1510,580 1550,520 1620,490 C1620,450 1560,420 1490,440 Z"
              fill="url(#ivory-outer-grad-1)"
              stroke="#D8BE90"
              strokeWidth="0.8"
            />
            {/* Fine embossed veins on upper petal */}
            <path d="M1490,440 Q1520,530 1560,590" stroke="#D8BE90" strokeWidth="0.5" opacity="0.6" />
            <path d="M1510,480 Q1535,530 1575,565" stroke="#D8BE90" strokeWidth="0.4" opacity="0.5" />
            <path d="M1475,530 Q1510,565 1550,600" stroke="#D8BE90" strokeWidth="0.4" opacity="0.5" />
          </g>

          {/* Large Leftmost Ivory Petal (sweeping inward across lower cards) */}
          <g filter="url(#ivory-shadow)">
            <path
              d="M1060,820 C1130,760 1230,740 1350,770 C1280,830 1190,880 1120,910 C1080,880 1060,850 1060,820 Z"
              fill="url(#ivory-outer-grad-2)"
              stroke="#D8BE90"
              strokeWidth="0.85"
            />
            {/* Embossed veins */}
            <path d="M1060,820 Q1200,790 1350,770" stroke="#D8BE90" strokeWidth="0.55" opacity="0.6" />
            <path d="M1120,800 Q1210,810 1310,815" stroke="#D8BE90" strokeWidth="0.4" opacity="0.45" />
            <path d="M1170,825 Q1235,845 1300,860" stroke="#D8BE90" strokeWidth="0.4" opacity="0.45" />
          </g>

          {/* --------------------------------------------------------------- */}
          {/* LAYER B: DEEP BURGUNDY & DUSTY MAUVE FOLDED SCULPTURAL PETALS   */}
          {/* --------------------------------------------------------------- */}
          {/* Burgundy Petal 1 - Upper-Right Curving Fold */}
          <g filter="url(#petal-shadow)">
            <path
              d="M1420,560 C1380,620 1370,700 1410,770 C1460,710 1520,660 1590,620 C1590,580 1500,530 1420,560 Z"
              fill="url(#burgundy-curl-grad)"
              stroke="url(#metallic-gold-rim)"
              strokeWidth="1.1"
            />
            {/* Realistic folded crease highlight */}
            <path
              d="M1420,560 Q1465,650 1530,705"
              stroke="#ECC880"
              strokeWidth="0.8"
              opacity="0.75"
            />
            {/* Internal embossed vein striations */}
            <path d="M1400,650 Q1450,685 1510,715" stroke="#C9A45C" strokeWidth="0.45" opacity="0.5" />
            <path d="M1415,700 Q1455,730 1505,745" stroke="#C9A45C" strokeWidth="0.45" opacity="0.5" />
          </g>

          {/* Burgundy Petal 2 - Central Deep Folded Cup */}
          <g filter="url(#petal-shadow)">
            <path
              d="M1250,690 C1210,750 1230,830 1320,890 C1380,830 1440,780 1520,740 C1460,690 1350,650 1250,690 Z"
              fill="url(#burgundy-main-grad)"
              stroke="url(#metallic-gold-rim)"
              strokeWidth="1.2"
            />
            {/* Metallic rim tracing */}
            <path
              d="M1250,690 C1350,650 1460,690 1520,740"
              stroke="#F5E4BD"
              strokeWidth="1.3"
            />
            {/* Embossed dimensional fold lines */}
            <path d="M1250,690 Q1340,770 1420,830" stroke="#ECC880" strokeWidth="0.75" opacity="0.7" />
            <path d="M1270,745 Q1335,795 1400,845" stroke="#C9A45C" strokeWidth="0.45" opacity="0.55" />
            <path d="M1300,790 Q1345,830 1395,865" stroke="#C9A45C" strokeWidth="0.45" opacity="0.55" />
          </g>

          {/* Dusty Mauve Accent Petal - Tucked Organic Ribbon */}
          <g filter="url(#petal-shadow-soft)">
            <path
              d="M1330,620 C1280,670 1285,735 1350,780 C1390,730 1430,690 1490,660 C1450,625 1390,605 1330,620 Z"
              fill="url(#mauve-fold-grad)"
              stroke="#D8BE90"
              strokeWidth="0.9"
            />
            <path d="M1330,620 Q1385,690 1440,730" stroke="#E6D7BD" strokeWidth="0.6" opacity="0.65" />
          </g>

          {/* --------------------------------------------------------------- */}
          {/* LAYER C: FOREGROUND SCULPTURAL FOLDED IVORY PETAL               */}
          {/*    (Prominent curved porcelain petal with visible curled fold)  */}
          {/* --------------------------------------------------------------- */}
          <g filter="url(#ivory-shadow)">
            {/* Petal Underside / Shadow within the curl */}
            <path
              d="M1410,740 C1460,690 1540,680 1620,710 L1620,800 C1540,780 1470,780 1410,740 Z"
              fill="url(#ivory-curl-inside)"
              opacity="0.85"
            />

            {/* Main sweeping foreground ivory blade */}
            <path
              d="M1340,840 C1400,770 1480,720 1590,720 C1620,780 1600,850 1530,900 C1440,910 1380,880 1340,840 Z"
              fill="url(#ivory-outer-grad-1)"
              stroke="url(#metallic-gold-rim)"
              strokeWidth="1.1"
            />

            {/* Gracefully curled petal rim showing realistic 3D turnover fold */}
            <path
              d="M1440,780 C1490,735 1550,725 1610,745 C1570,785 1520,810 1460,820 Z"
              fill="url(#ivory-curl-inside)"
              stroke="#D8BE90"
              strokeWidth="0.85"
            />

            {/* Fine engraved radiating vein lines */}
            <path d="M1340,840 Q1450,810 1560,780" stroke="#D8BE90" strokeWidth="0.65" opacity="0.75" />
            <path d="M1370,855 Q1455,835 1540,820" stroke="#D8BE90" strokeWidth="0.45" opacity="0.6" />
            <path d="M1410,875 Q1470,860 1530,850" stroke="#D8BE90" strokeWidth="0.45" opacity="0.5" />
            <path d="M1380,820 Q1460,780 1540,755" stroke="#D8BE90" strokeWidth="0.5" opacity="0.6" />
          </g>

          {/* Delicate metallic gold rim accentuating the outer petal tip */}
          <path
            d="M1340,840 Q1400,770 1480,720"
            stroke="#F5E4BD"
            strokeWidth="1.2"
          />
        </g>
      </svg>
    </div>
  );
}
