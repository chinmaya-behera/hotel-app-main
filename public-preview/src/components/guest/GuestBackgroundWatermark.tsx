'use client';

import React from 'react';
import type { GuestPalette } from '@/types/demo';

interface GuestBackgroundWatermarkProps {
  palette: GuestPalette;
  isDark: boolean;
}

export function GuestBackgroundWatermark({ palette, isDark }: GuestBackgroundWatermarkProps) {
  if (palette === 'burgundy') {
    // Royal Burgundy: Fan Palm / Palm Frond Botanical Line Art
    const strokeColor = isDark ? '#A13054' : '#74172F';
    const goldStroke = isDark ? '#DEC9A4' : '#C9A45C';
    const strokeOpacity = isDark ? 0.07 : 0.08;
    const goldOpacity = isDark ? 0.08 : 0.09;

    return (
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
        {/* Top-Left Fan Palm Frond */}
        <svg
          className="absolute -top-12 -left-12 h-80 w-80 sm:h-96 sm:w-96 lg:h-[480px] lg:w-[480px] transition-opacity duration-500"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" strokeOpacity={strokeOpacity}>
            {/* Radiating Fan Palm Ribs */}
            <path d="M20,20 Q120,60 220,50 T380,40" />
            <path d="M20,20 Q100,100 190,120 T360,130" />
            <path d="M20,20 Q80,140 160,190 T320,230" />
            <path d="M20,20 Q60,180 120,260 T240,340" />
            <path d="M20,20 Q40,210 80,310 T160,380" />
            {/* Scalloped Fan Palm Leaf Edges */}
            <path d="M380,40 C370,80 370,95 360,130 C345,180 340,195 320,230 C290,290 270,305 240,340 C200,370 180,375 160,380" />
            {/* Inner Radiating Leaf Grooves */}
            <path d="M20,20 Q110,80 205,85 T370,85" stroke={goldStroke} strokeOpacity={goldOpacity} strokeWidth="1.2" />
            <path d="M20,20 Q90,120 175,155 T340,180" stroke={goldStroke} strokeOpacity={goldOpacity} strokeWidth="1.2" />
            <path d="M20,20 Q70,160 140,225 T280,285" stroke={goldStroke} strokeOpacity={goldOpacity} strokeWidth="1.2" />
            <path d="M20,20 Q50,195 100,285 T200,360" stroke={goldStroke} strokeOpacity={goldOpacity} strokeWidth="1.2" />
          </g>
          {/* Secondary Arched Palm Frond */}
          <g stroke={goldStroke} strokeWidth="1.4" strokeLinecap="round" strokeOpacity={goldOpacity}>
            <path d="M0,80 Q100,160 260,190 T390,210" />
            <path d="M110,135 Q140,105 170,100" />
            <path d="M150,150 Q190,115 220,110" />
            <path d="M190,165 Q240,125 270,120" />
            <path d="M230,178 Q290,135 320,130" />
            <path d="M270,190 Q330,150 360,145" />
            <path d="M130,145 Q160,175 180,200" />
            <path d="M170,160 Q210,195 230,225" />
            <path d="M210,175 Q260,215 280,245" />
            <path d="M250,187 Q310,230 330,265" />
          </g>
        </svg>

        {/* Top-Right Fan Palm Frond */}
        <svg
          className="absolute -top-16 -right-16 h-80 w-80 sm:h-96 sm:w-96 lg:h-[500px] lg:w-[500px] scale-x-[-1] transition-opacity duration-500"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" strokeOpacity={strokeOpacity}>
            <path d="M20,20 Q120,60 220,50 T380,40" />
            <path d="M20,20 Q100,100 190,120 T360,130" />
            <path d="M20,20 Q80,140 160,190 T320,230" />
            <path d="M20,20 Q60,180 120,260 T240,340" />
            <path d="M380,40 C370,80 370,95 360,130 C345,180 340,195 320,230 C290,290 270,305 240,340" />
          </g>
          <g stroke={goldStroke} strokeWidth="1.3" strokeLinecap="round" strokeOpacity={goldOpacity}>
            <path d="M20,20 Q110,80 205,85 T370,85" />
            <path d="M20,20 Q90,120 175,155 T340,180" />
            <path d="M20,20 Q70,160 140,225 T280,285" />
          </g>
        </svg>

        {/* Bottom-Left Palm Frond */}
        <svg
          className="absolute -bottom-16 -left-16 h-80 w-80 sm:h-96 sm:w-96 lg:h-[480px] lg:w-[480px] scale-y-[-1] transition-opacity duration-500"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" strokeOpacity={strokeOpacity}>
            <path d="M20,20 Q120,60 220,50 T380,40" />
            <path d="M20,20 Q100,100 190,120 T360,130" />
            <path d="M20,20 Q80,140 160,190 T320,230" />
            <path d="M380,40 C370,80 370,95 360,130 C345,180 340,195 320,230" />
          </g>
          <g stroke={goldStroke} strokeWidth="1.3" strokeLinecap="round" strokeOpacity={goldOpacity}>
            <path d="M20,20 Q110,80 205,85 T370,85" />
            <path d="M20,20 Q90,120 175,155 T340,180" />
          </g>
        </svg>

        {/* Bottom-Right Palm Frond */}
        <svg
          className="absolute -bottom-16 -right-16 h-80 w-80 sm:h-96 sm:w-96 lg:h-[500px] lg:w-[500px] scale-x-[-1] scale-y-[-1] transition-opacity duration-500"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" strokeOpacity={strokeOpacity}>
            <path d="M20,20 Q120,60 220,50 T380,40" />
            <path d="M20,20 Q100,100 190,120 T360,130" />
            <path d="M20,20 Q80,140 160,190 T320,230" />
            <path d="M20,20 Q60,180 120,260 T240,340" />
            <path d="M380,40 C370,80 370,95 360,130 C345,180 340,195 320,230 C290,290 270,305 240,340" />
          </g>
          <g stroke={goldStroke} strokeWidth="1.3" strokeLinecap="round" strokeOpacity={goldOpacity}>
            <path d="M20,20 Q110,80 205,85 T370,85" />
            <path d="M20,20 Q90,120 175,155 T340,180" />
            <path d="M20,20 Q70,160 140,225 T280,285" />
          </g>
        </svg>
      </div>
    );
  }

  // Botanical Emerald: Monstera, Tropical Foliage & Eucalyptus Line Art
  const leafColor = isDark ? '#34D399' : '#175B49';
  const leafOpacity = isDark ? 0.06 : 0.08;
  const secondaryColor = isDark ? '#6EE7B7' : '#206A55';
  const secondaryOpacity = isDark ? 0.05 : 0.07;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* Top-Left Monstera & Tropical Leaf Cluster */}
      <svg
        className="absolute -top-12 -left-12 h-80 w-80 sm:h-96 sm:w-96 lg:h-[480px] lg:w-[480px] transition-opacity duration-500"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Monstera Stem and Main Rib */}
        <path
          d="M30,30 Q120,130 220,200 T360,260"
          stroke={leafColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity={leafOpacity}
        />
        {/* Monstera Leaf Contour with Fenestrations / Cuts */}
        <path
          d="M100,50 C140,40 180,60 210,80 C185,100 160,105 190,120 C230,105 270,130 290,160 C250,170 235,185 260,205 C310,195 340,230 350,270 C310,265 295,280 310,310 C325,340 280,360 250,340 C240,300 220,300 210,330 C180,320 160,280 170,250 C140,260 130,240 145,215 C120,200 110,160 135,135 C100,125 90,90 100,50 Z"
          stroke={leafColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity={leafOpacity}
        />
        {/* Monstera Internal Slits / Holes */}
        <ellipse cx="200" cy="150" rx="20" ry="6" transform="rotate(-30 200 150)" stroke={leafColor} strokeWidth="1.3" strokeOpacity={leafOpacity} />
        <ellipse cx="250" cy="220" rx="22" ry="7" transform="rotate(-20 250 220)" stroke={leafColor} strokeWidth="1.3" strokeOpacity={leafOpacity} />
        <ellipse cx="200" cy="230" rx="18" ry="6" transform="rotate(35 200 230)" stroke={leafColor} strokeWidth="1.3" strokeOpacity={leafOpacity} />

        {/* Secondary Eucalyptus / Laurel Branchlet */}
        <g stroke={secondaryColor} strokeWidth="1.4" strokeLinecap="round" strokeOpacity={secondaryOpacity}>
          <path d="M10,120 Q100,190 200,290 T280,390" />
          {/* Leaves along branch */}
          <path d="M50,150 C40,130 70,120 80,140 C90,160 60,170 50,150 Z" />
          <path d="M90,185 C110,170 125,195 110,210 C95,225 75,200 90,185 Z" />
          <path d="M125,220 C105,210 120,185 145,195 C170,205 145,230 125,220 Z" />
          <path d="M160,255 C185,240 200,265 180,285 C160,305 135,270 160,255 Z" />
          <path d="M195,295 C175,285 190,260 215,270 C240,280 215,305 195,295 Z" />
          <path d="M230,335 C255,320 270,345 250,365 C230,385 205,350 230,335 Z" />
        </g>
      </svg>

      {/* Top-Right Tropical Botanical Cluster */}
      <svg
        className="absolute -top-16 -right-16 h-80 w-80 sm:h-96 sm:w-96 lg:h-[500px] lg:w-[500px] scale-x-[-1] transition-opacity duration-500"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M30,30 Q120,130 220,200 T360,260"
          stroke={leafColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity={leafOpacity}
        />
        <path
          d="M100,50 C140,40 180,60 210,80 C185,100 160,105 190,120 C230,105 270,130 290,160 C250,170 235,185 260,205 C310,195 340,230 350,270 C310,265 295,280 310,310 C325,340 280,360 250,340 C240,300 220,300 210,330 C180,320 160,280 170,250 C140,260 130,240 145,215 C120,200 110,160 135,135 C100,125 90,90 100,50 Z"
          stroke={leafColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity={leafOpacity}
        />
        <g stroke={secondaryColor} strokeWidth="1.4" strokeLinecap="round" strokeOpacity={secondaryOpacity}>
          <path d="M10,120 Q100,190 200,290 T280,390" />
          <path d="M50,150 C40,130 70,120 80,140 C90,160 60,170 50,150 Z" />
          <path d="M125,220 C105,210 120,185 145,195 C170,205 145,230 125,220 Z" />
          <path d="M195,295 C175,285 190,260 215,270 C240,280 215,305 195,295 Z" />
        </g>
      </svg>

      {/* Bottom-Left Palm & Monstera Cluster */}
      <svg
        className="absolute -bottom-16 -left-16 h-80 w-80 sm:h-96 sm:w-96 lg:h-[480px] lg:w-[480px] scale-y-[-1] transition-opacity duration-500"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M30,30 Q120,130 220,200 T360,260"
          stroke={leafColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity={leafOpacity}
        />
        <path
          d="M100,50 C140,40 180,60 210,80 C185,100 160,105 190,120 C230,105 270,130 290,160 C250,170 235,185 260,205 C310,195 340,230 350,270 C310,265 295,280 310,310 C325,340 280,360 250,340 C240,300 220,300 210,330 C180,320 160,280 170,250 C140,260 130,240 145,215 C120,200 110,160 135,135 C100,125 90,90 100,50 Z"
          stroke={leafColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity={leafOpacity}
        />
      </svg>

      {/* Bottom-Right Tropical Cluster */}
      <svg
        className="absolute -bottom-16 -right-16 h-80 w-80 sm:h-96 sm:w-96 lg:h-[500px] lg:w-[500px] scale-x-[-1] scale-y-[-1] transition-opacity duration-500"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M30,30 Q120,130 220,200 T360,260"
          stroke={leafColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity={leafOpacity}
        />
        <path
          d="M100,50 C140,40 180,60 210,80 C185,100 160,105 190,120 C230,105 270,130 290,160 C250,170 235,185 260,205 C310,195 340,230 350,270 C310,265 295,280 310,310 C325,340 280,360 250,340 C240,300 220,300 210,330 C180,320 160,280 170,250 C140,260 130,240 145,215 C120,200 110,160 135,135 C100,125 90,90 100,50 Z"
          stroke={leafColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity={leafOpacity}
        />
        <g stroke={secondaryColor} strokeWidth="1.4" strokeLinecap="round" strokeOpacity={secondaryOpacity}>
          <path d="M10,120 Q100,190 200,290 T280,390" />
          <path d="M50,150 C40,130 70,120 80,140 C90,160 60,170 50,150 Z" />
          <path d="M125,220 C105,210 120,185 145,195 C170,205 145,230 125,220 Z" />
        </g>
      </svg>
    </div>
  );
}

