'use client';

import React from 'react';

/**
 * Premium Botanical Art Nouveau Background Component
 * Specifically designed for The Grand ADP Guest Portal (Emerald Theme only).
 * Features:
 * - Scalable vector Ginkgo fan leaves with fine radiating venation.
 * - Graceful fern branches and cascading foliage along left, right, and top corners.
 * - Inset geometric ornamental border with Art Nouveau corner brackets.
 * - Centered bottom ornamental diamond flourish.
 * - Restrained luxury palette: Pale Sage (#C5D0C1), Muted Sage (#A7B9A7), Champagne Gold (#CDBD96).
 * - Non-interactive (pointer-events-none, aria-hidden).
 */
export function BotanicalBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none botanical-art-nouveau-canvas"
      style={{
        background: `
          radial-gradient(1200px 700px at 10% 5%, rgba(197, 208, 193, 0.28) 0%, transparent 65%),
          radial-gradient(1100px 700px at 90% 95%, rgba(205, 189, 150, 0.22) 0%, transparent 65%),
          radial-gradient(800px 500px at 50% 50%, rgba(247, 243, 233, 0.5) 0%, transparent 80%),
          #F1EEE3
        `,
      }}
    >
      {/* 1. TOP-LEFT BOTANICAL SPRAY (Cascading branch, delicate leaf clusters & veins) */}
      <svg
        className="absolute top-0 left-0 w-72 sm:w-96 md:w-[460px] h-72 sm:h-96 md:h-[460px] max-w-full opacity-80"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.85">
          {/* Main graceful arching branch */}
          <path
            d="M-30,-20 C60,40 120,110 160,210 C185,270 190,340 180,410"
            stroke="#A7B9A7"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Champagne gold secondary tendril */}
          <path
            d="M-10,30 C50,80 100,160 115,250 C125,310 115,370 85,430"
            stroke="#CDBD96"
            strokeWidth="1.1"
            strokeDasharray="4 2"
            opacity="0.6"
          />

          {/* Leaf 1 - top horizontal leaf */}
          <path
            d="M45,25 C90,15 140,40 170,80 C130,85 85,70 45,25 Z"
            fill="rgba(197, 208, 193, 0.18)"
            stroke="#8FA895"
            strokeWidth="1.0"
          />
          <path d="M45,25 Q110,50 170,80" stroke="#8FA895" strokeWidth="0.7" />
          <path d="M80,38 Q100,32 115,30 M105,48 Q125,45 140,46 M130,60 Q145,62 158,68" stroke="#8FA895" strokeWidth="0.5" opacity="0.7" />

          {/* Leaf 2 - drooping upper leaf */}
          <path
            d="M85,70 C140,75 190,120 210,180 C165,175 120,145 85,70 Z"
            fill="rgba(205, 189, 150, 0.14)"
            stroke="#CDBD96"
            strokeWidth="1.0"
          />
          <path d="M85,70 Q150,125 210,180" stroke="#CDBD96" strokeWidth="0.7" />
          <path d="M120,95 Q145,98 165,110 M145,120 Q168,130 185,148 M175,150 Q192,160 202,172" stroke="#CDBD96" strokeWidth="0.5" opacity="0.7" />

          {/* Leaf 3 - central elongated laurel leaf */}
          <path
            d="M130,150 C185,170 235,230 250,300 C205,290 160,250 130,150 Z"
            fill="rgba(184, 200, 183, 0.18)"
            stroke="#A7B9A7"
            strokeWidth="1.1"
          />
          <path d="M130,150 Q195,225 250,300" stroke="#A7B9A7" strokeWidth="0.7" />
          <path d="M165,185 Q195,195 215,220 M190,225 Q215,245 232,270 M148,168 Q170,165 185,175" stroke="#A7B9A7" strokeWidth="0.5" opacity="0.7" />

          {/* Leaf 4 - outer delicate blade */}
          <path
            d="M160,210 C210,240 250,310 260,380 C220,360 185,310 160,210 Z"
            fill="rgba(197, 208, 193, 0.15)"
            stroke="#8FA895"
            strokeWidth="1.0"
          />
          <path d="M160,210 Q215,295 260,380" stroke="#8FA895" strokeWidth="0.6" />

          {/* Leaf 5 - lower curved tapering leaf */}
          <path
            d="M175,290 C215,335 240,405 230,470 C195,435 175,370 175,290 Z"
            fill="rgba(205, 189, 150, 0.16)"
            stroke="#CDBD96"
            strokeWidth="1.0"
          />
          <path d="M175,290 Q210,380 230,470" stroke="#CDBD96" strokeWidth="0.6" />

          {/* Fern frond sprig (lower left) */}
          <path d="M110,260 Q70,300 40,360" stroke="#A7B9A7" strokeWidth="1.2" />
          <path d="M100,270 Q85,265 72,275 M92,285 Q75,282 65,295 M82,305 Q65,305 55,320 M72,325 Q58,328 48,345" stroke="#A7B9A7" strokeWidth="0.8" />

          {/* Art Nouveau decorative circular spiral loop */}
          <path
            d="M170,380 C165,410 135,430 110,415 C90,400 95,370 115,360 C130,350 145,365 140,380"
            stroke="#CDBD96"
            strokeWidth="0.8"
            opacity="0.5"
          />
        </g>
      </svg>

      {/* 2. TOP-RIGHT BOTANICAL SPRAY (Gracefully drooping branches, willow & fern foliage) */}
      <svg
        className="absolute top-0 right-0 w-72 sm:w-96 md:w-[460px] h-72 sm:h-96 md:h-[460px] max-w-full opacity-80"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.85" transform="translate(500, 0) scale(-1, 1)">
          {/* Main branch mirroring with subtle organic differences */}
          <path
            d="M-30,-20 C70,50 130,120 175,225 C195,285 195,360 170,430"
            stroke="#A7B9A7"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M0,40 C60,100 110,180 120,270 C125,335 105,395 70,450"
            stroke="#CDBD96"
            strokeWidth="1.0"
            strokeDasharray="5 2.5"
            opacity="0.55"
          />

          {/* Leaf pair 1 */}
          <path
            d="M50,30 C100,20 150,50 180,95 C140,100 90,80 50,30 Z"
            fill="rgba(197, 208, 193, 0.2)"
            stroke="#8FA895"
            strokeWidth="1.0"
          />
          <path d="M50,30 Q120,65 180,95" stroke="#8FA895" strokeWidth="0.7" />
          <path d="M90,45 Q115,40 130,38 M120,58 Q142,54 158,58 M145,72 Q162,75 172,82" stroke="#8FA895" strokeWidth="0.5" opacity="0.7" />

          {/* Leaf pair 2 */}
          <path
            d="M95,80 C155,90 205,135 225,195 C180,188 130,155 95,80 Z"
            fill="rgba(205, 189, 150, 0.15)"
            stroke="#CDBD96"
            strokeWidth="1.0"
          />
          <path d="M95,80 Q165,140 225,195" stroke="#CDBD96" strokeWidth="0.7" />

          {/* Leaf pair 3 */}
          <path
            d="M140,165 C200,185 250,250 265,320 C215,310 170,265 140,165 Z"
            fill="rgba(184, 200, 183, 0.18)"
            stroke="#A7B9A7"
            strokeWidth="1.1"
          />
          <path d="M140,165 Q205,245 265,320" stroke="#A7B9A7" strokeWidth="0.7" />
          <path d="M175,200 Q208,210 230,235 M205,242 Q230,262 248,288" stroke="#A7B9A7" strokeWidth="0.5" opacity="0.7" />

          {/* Leaf pair 4 */}
          <path
            d="M175,230 C225,260 260,330 265,400 C225,380 195,325 175,230 Z"
            fill="rgba(197, 208, 193, 0.15)"
            stroke="#8FA895"
            strokeWidth="1.0"
          />

          {/* Fern frond sprig */}
          <path d="M125,280 Q85,320 50,380" stroke="#CDBD96" strokeWidth="1.1" />
          <path d="M115,290 Q98,285 85,295 M105,305 Q88,302 78,315 M95,325 Q78,325 68,340 M85,345 Q70,348 60,365" stroke="#CDBD96" strokeWidth="0.8" />
        </g>
      </svg>

      {/* 3. LEFT-SIDE MID-FLIGHT BOTANICAL FOLIAGE (Long curved branch & slender leaves) */}
      <svg
        className="hidden md:block absolute top-1/3 -left-4 w-40 lg:w-48 h-[420px] opacity-70"
        viewBox="0 0 160 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.8">
          <path
            d="M-10,20 C35,80 40,160 20,230 C0,300 30,370 15,420"
            stroke="#A7B9A7"
            strokeWidth="1.3"
          />
          {/* Alternating soft sage leaves */}
          <path d="M25,85 C60,75 90,95 105,120 C75,125 45,110 25,85 Z" fill="rgba(197, 208, 193, 0.16)" stroke="#8FA895" strokeWidth="0.9" />
          <path d="M25,85 Q65,102 105,120" stroke="#8FA895" strokeWidth="0.6" />

          <path d="M30,150 C70,145 105,170 120,205 C85,208 55,188 30,150 Z" fill="rgba(205, 189, 150, 0.14)" stroke="#CDBD96" strokeWidth="0.9" />
          <path d="M30,150 Q75,178 120,205" stroke="#CDBD96" strokeWidth="0.6" />

          <path d="M20,230 C55,230 85,260 95,295 C65,295 40,270 20,230 Z" fill="rgba(184, 200, 183, 0.16)" stroke="#A7B9A7" strokeWidth="0.9" />
          <path d="M20,230 Q60,265 95,295" stroke="#A7B9A7" strokeWidth="0.6" />

          <path d="M25,320 C60,325 85,355 90,390 C62,388 42,360 25,320 Z" fill="rgba(197, 208, 193, 0.14)" stroke="#8FA895" strokeWidth="0.8" />
        </g>
      </svg>

      {/* 4. RIGHT-SIDE MID-FLIGHT BOTANICAL FOLIAGE (Fern fronds & champagne curves) */}
      <svg
        className="hidden md:block absolute top-1/3 -right-4 w-40 lg:w-48 h-[420px] opacity-70"
        viewBox="0 0 160 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.8" transform="translate(160, 0) scale(-1, 1)">
          <path
            d="M-10,20 C40,90 35,170 15,240 C-5,310 35,375 20,420"
            stroke="#A7B9A7"
            strokeWidth="1.3"
          />
          <path d="M25,95 C65,85 95,105 110,130 C80,135 50,120 25,95 Z" fill="rgba(205, 189, 150, 0.15)" stroke="#CDBD96" strokeWidth="0.9" />
          <path d="M25,95 Q70,112 110,130" stroke="#CDBD96" strokeWidth="0.6" />

          <path d="M30,165 C72,160 108,185 125,220 C90,225 60,200 30,165 Z" fill="rgba(197, 208, 193, 0.16)" stroke="#8FA895" strokeWidth="0.9" />
          <path d="M30,165 Q80,192 125,220" stroke="#8FA895" strokeWidth="0.6" />

          <path d="M20,245 C58,245 90,275 100,310 C70,310 42,285 20,245 Z" fill="rgba(184, 200, 183, 0.16)" stroke="#A7B9A7" strokeWidth="0.9" />
          <path d="M20,245 Q62,280 100,310" stroke="#A7B9A7" strokeWidth="0.6" />
        </g>
      </svg>

      {/* 5. BOTTOM-LEFT ORNAMENTAL CORNERPIECE (Signature Ginkgo biloba fan leaves & fern fronds) */}
      <svg
        className="absolute bottom-0 left-0 w-80 sm:w-[420px] md:w-[520px] lg:w-[600px] h-80 sm:h-[420px] md:h-[520px] lg:h-[600px] max-w-full opacity-90"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.9">
          {/* Main Ginkgo Leaf 1 (Large fan leaf radiating upward and inward) */}
          {/* Petiole / Stem */}
          <path
            d="M0,600 C80,560 160,490 220,380"
            stroke="#A7B9A7"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Ginkgo Fan Blade with distinct central notch and scalloped outer edge */}
          <path
            d="M220,380 C190,330 140,290 85,280 C60,275 90,240 140,230 C200,220 260,240 310,285 C335,310 330,335 305,330 C265,320 235,345 220,380 Z"
            fill="rgba(197, 208, 193, 0.22)"
            stroke="#8FA895"
            strokeWidth="1.2"
          />
          {/* Intricate Radiating Ginkgo Veins from base point (220, 380) */}
          <path d="M220,380 Q170,330 95,285" stroke="#8FA895" strokeWidth="0.6" opacity="0.75" />
          <path d="M220,380 Q180,310 120,260" stroke="#8FA895" strokeWidth="0.6" opacity="0.75" />
          <path d="M220,380 Q195,295 155,245" stroke="#8FA895" strokeWidth="0.6" opacity="0.75" />
          <path d="M220,380 Q225,285 200,238" stroke="#8FA895" strokeWidth="0.6" opacity="0.75" />
          <path d="M220,380 Q250,295 245,245" stroke="#8FA895" strokeWidth="0.6" opacity="0.75" />
          <path d="M220,380 Q270,315 285,268" stroke="#8FA895" strokeWidth="0.6" opacity="0.75" />
          <path d="M220,380 Q285,335 305,305" stroke="#8FA895" strokeWidth="0.6" opacity="0.75" />

          {/* Secondary Ginkgo Leaf 2 (Champagne gold accent, overlapping slightly lower) */}
          <path
            d="M-20,580 C60,540 130,480 180,440"
            stroke="#CDBD96"
            strokeWidth="1.4"
          />
          <path
            d="M180,440 C150,400 100,375 50,370 C30,368 60,330 110,320 C165,310 215,325 255,360 C275,380 265,400 245,395 C215,385 195,410 180,440 Z"
            fill="rgba(205, 189, 150, 0.18)"
            stroke="#CDBD96"
            strokeWidth="1.1"
          />
          <path d="M180,440 Q130,405 60,375" stroke="#CDBD96" strokeWidth="0.6" opacity="0.7" />
          <path d="M180,440 Q150,380 90,345" stroke="#CDBD96" strokeWidth="0.6" opacity="0.7" />
          <path d="M180,440 Q170,365 130,328" stroke="#CDBD96" strokeWidth="0.6" opacity="0.7" />
          <path d="M180,440 Q195,365 180,322" stroke="#CDBD96" strokeWidth="0.6" opacity="0.7" />
          <path d="M180,440 Q215,375 220,340" stroke="#CDBD96" strokeWidth="0.6" opacity="0.7" />
          <path d="M180,440 Q230,395 248,370" stroke="#CDBD96" strokeWidth="0.6" opacity="0.7" />

          {/* Tertiary Smaller Ginkgo Leaf 3 (Tucked behind to create depth) */}
          <path
            d="M260,420 C235,390 195,375 160,370 C140,368 165,340 200,330 C245,320 285,335 315,365 C300,385 285,390 260,420 Z"
            fill="rgba(184, 200, 183, 0.16)"
            stroke="#A7B9A7"
            strokeWidth="0.9"
          />
          <path d="M260,420 Q210,390 170,372" stroke="#A7B9A7" strokeWidth="0.5" opacity="0.6" />
          <path d="M260,420 Q235,365 205,335" stroke="#A7B9A7" strokeWidth="0.5" opacity="0.6" />
          <path d="M260,420 Q265,365 260,332" stroke="#A7B9A7" strokeWidth="0.5" opacity="0.6" />
          <path d="M260,420 Q285,375 305,355" stroke="#A7B9A7" strokeWidth="0.5" opacity="0.6" />

          {/* Large Feather Fern Frond spreading diagonally upward-inward */}
          <path
            d="M0,520 C90,470 210,430 360,410 C420,400 480,410 530,430"
            stroke="#A7B9A7"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Fern Pinnules (alternating feather leaflets) */}
          <path d="M120,480 Q105,445 90,425 Q125,450 145,475" fill="rgba(197, 208, 193, 0.2)" stroke="#8FA895" strokeWidth="0.8" />
          <path d="M170,460 Q160,420 150,395 Q180,425 198,455" fill="rgba(205, 189, 150, 0.15)" stroke="#CDBD96" strokeWidth="0.8" />
          <path d="M225,445 Q220,400 215,370 Q240,405 255,440" fill="rgba(197, 208, 193, 0.2)" stroke="#8FA895" strokeWidth="0.8" />
          <path d="M285,432 Q285,385 285,350 Q305,390 318,428" fill="rgba(205, 189, 150, 0.15)" stroke="#CDBD96" strokeWidth="0.8" />
          <path d="M345,420 Q350,375 358,340 Q370,380 380,418" fill="rgba(197, 208, 193, 0.2)" stroke="#8FA895" strokeWidth="0.8" />
          <path d="M405,415 Q415,375 430,345 Q432,385 438,418" fill="rgba(184, 200, 183, 0.18)" stroke="#A7B9A7" strokeWidth="0.8" />
          <path d="M465,418 Q480,385 500,360 Q495,395 495,422" fill="rgba(205, 189, 150, 0.15)" stroke="#CDBD96" strokeWidth="0.8" />

          {/* Art Nouveau decorative curling tendril flourish */}
          <path
            d="M360,490 C410,480 460,510 470,550 C480,590 440,620 400,610 C360,600 350,560 380,540 C405,525 430,550 420,570"
            stroke="#CDBD96"
            strokeWidth="0.9"
            opacity="0.5"
          />
        </g>
      </svg>

      {/* 6. BOTTOM-RIGHT ORNAMENTAL CORNERPIECE (Mirrored Ginkgo fan leaves & fern fronds) */}
      <svg
        className="absolute bottom-0 right-0 w-80 sm:w-[420px] md:w-[520px] lg:w-[600px] h-80 sm:h-[420px] md:h-[520px] lg:h-[600px] max-w-full opacity-90"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.9" transform="translate(600, 0) scale(-1, 1)">
          {/* Main Ginkgo Leaf 1 */}
          <path
            d="M0,600 C80,560 160,490 220,380"
            stroke="#A7B9A7"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M220,380 C190,330 140,290 85,280 C60,275 90,240 140,230 C200,220 260,240 310,285 C335,310 330,335 305,330 C265,320 235,345 220,380 Z"
            fill="rgba(197, 208, 193, 0.22)"
            stroke="#8FA895"
            strokeWidth="1.2"
          />
          {/* Veins */}
          <path d="M220,380 Q170,330 95,285" stroke="#8FA895" strokeWidth="0.6" opacity="0.75" />
          <path d="M220,380 Q180,310 120,260" stroke="#8FA895" strokeWidth="0.6" opacity="0.75" />
          <path d="M220,380 Q195,295 155,245" stroke="#8FA895" strokeWidth="0.6" opacity="0.75" />
          <path d="M220,380 Q225,285 200,238" stroke="#8FA895" strokeWidth="0.6" opacity="0.75" />
          <path d="M220,380 Q250,295 245,245" stroke="#8FA895" strokeWidth="0.6" opacity="0.75" />
          <path d="M220,380 Q270,315 285,268" stroke="#8FA895" strokeWidth="0.6" opacity="0.75" />
          <path d="M220,380 Q285,335 305,305" stroke="#8FA895" strokeWidth="0.6" opacity="0.75" />

          {/* Secondary Ginkgo Leaf 2 */}
          <path
            d="M-20,580 C60,540 130,480 180,440"
            stroke="#CDBD96"
            strokeWidth="1.4"
          />
          <path
            d="M180,440 C150,400 100,375 50,370 C30,368 60,330 110,320 C165,310 215,325 255,360 C275,380 265,400 245,395 C215,385 195,410 180,440 Z"
            fill="rgba(205, 189, 150, 0.18)"
            stroke="#CDBD96"
            strokeWidth="1.1"
          />
          <path d="M180,440 Q130,405 60,375" stroke="#CDBD96" strokeWidth="0.6" opacity="0.7" />
          <path d="M180,440 Q150,380 90,345" stroke="#CDBD96" strokeWidth="0.6" opacity="0.7" />
          <path d="M180,440 Q170,365 130,328" stroke="#CDBD96" strokeWidth="0.6" opacity="0.7" />
          <path d="M180,440 Q195,365 180,322" stroke="#CDBD96" strokeWidth="0.6" opacity="0.7" />
          <path d="M180,440 Q215,375 220,340" stroke="#CDBD96" strokeWidth="0.6" opacity="0.7" />
          <path d="M180,440 Q230,395 248,370" stroke="#CDBD96" strokeWidth="0.6" opacity="0.7" />

          {/* Large Feather Fern Frond spreading toward center */}
          <path
            d="M0,520 C90,470 210,430 360,410 C420,400 480,410 530,430"
            stroke="#A7B9A7"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M120,480 Q105,445 90,425 Q125,450 145,475" fill="rgba(197, 208, 193, 0.2)" stroke="#8FA895" strokeWidth="0.8" />
          <path d="M170,460 Q160,420 150,395 Q180,425 198,455" fill="rgba(205, 189, 150, 0.15)" stroke="#CDBD96" strokeWidth="0.8" />
          <path d="M225,445 Q220,400 215,370 Q240,405 255,440" fill="rgba(197, 208, 193, 0.2)" stroke="#8FA895" strokeWidth="0.8" />
          <path d="M285,432 Q285,385 285,350 Q305,390 318,428" fill="rgba(205, 189, 150, 0.15)" stroke="#CDBD96" strokeWidth="0.8" />
          <path d="M345,420 Q350,375 358,340 Q370,380 380,418" fill="rgba(197, 208, 193, 0.2)" stroke="#8FA895" strokeWidth="0.8" />
          <path d="M405,415 Q415,375 430,345 Q432,385 438,418" fill="rgba(184, 200, 183, 0.18)" stroke="#A7B9A7" strokeWidth="0.8" />
        </g>
      </svg>

      {/* 7. GEOMETRIC ORNAMENTAL BORDER & ART NOUVEAU CORNER BRACKETS */}
      <div className="absolute inset-2 sm:inset-4 lg:inset-6 pointer-events-none border border-[#CDBD96]/30 rounded-lg sm:rounded-xl">
        {/* Inner thin accent line */}
        <div className="absolute inset-1 sm:inset-1.5 border border-[#A7B9A7]/20 rounded-md sm:rounded-lg pointer-events-none" />

        {/* Top-Left Corner Geometric Bracket */}
        <div className="absolute -top-[1px] -left-[1px] w-5 sm:w-8 h-5 sm:h-8 border-t-2 border-l-2 border-[#CDBD96]/60 rounded-tl-sm pointer-events-none">
          <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-[#CDBD96]/40 rotate-45" />
        </div>

        {/* Top-Right Corner Geometric Bracket */}
        <div className="absolute -top-[1px] -right-[1px] w-5 sm:w-8 h-5 sm:h-8 border-t-2 border-r-2 border-[#CDBD96]/60 rounded-tr-sm pointer-events-none">
          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#CDBD96]/40 rotate-45" />
        </div>

        {/* Bottom-Left Corner Geometric Bracket */}
        <div className="absolute -bottom-[1px] -left-[1px] w-5 sm:w-8 h-5 sm:h-8 border-b-2 border-l-2 border-[#CDBD96]/60 rounded-bl-sm pointer-events-none">
          <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-[#CDBD96]/40 rotate-45" />
        </div>

        {/* Bottom-Right Corner Geometric Bracket */}
        <div className="absolute -bottom-[1px] -right-[1px] w-5 sm:w-8 h-5 sm:h-8 border-b-2 border-r-2 border-[#CDBD96]/60 rounded-br-sm pointer-events-none">
          <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-[#CDBD96]/40 rotate-45" />
        </div>

        {/* Bottom-Center Ornamental Diamond Flourish */}
        <div className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none px-3 bg-[#F1EEE3]/90">
          <div className="w-8 sm:w-16 h-[1px] bg-gradient-to-r from-transparent via-[#CDBD96]/60 to-[#CDBD96]" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border border-[#CDBD96] rotate-45 flex items-center justify-center">
            <div className="w-1 h-1 bg-[#8FA895] rotate-45" />
          </div>
          <div className="w-8 sm:w-16 h-[1px] bg-gradient-to-l from-transparent via-[#CDBD96]/60 to-[#CDBD96]" />
        </div>
      </div>
    </div>
  );
}

