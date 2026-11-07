'use client';

import { useMemo } from 'react';
import { qrMatrix } from '@/lib/qr';

/** Renders a real, scannable QR code as crisp SVG (dark modules on white, with the 4-module quiet zone). */
export function QrCode({ value, size = 168, label }: { value: string; size?: number; label?: string }) {
  const { path, dim } = useMemo(() => {
    const m = qrMatrix(value);
    const n = m.length;
    let d = '';
    for (let y = 0; y < n; y++) {
      let x = 0;
      while (x < n) {
        if (!m[y][x]) {
          x++;
          continue;
        }
        let run = 1;
        while (x + run < n && m[y][x + run]) run++;
        d += `M${x + 4} ${y + 4}h${run}v1h-${run}z`;
        x += run;
      }
    }
    return { path: d, dim: n + 8 };
  }, [value]);

  return (
    <svg
      role="img"
      aria-label={label ?? 'QR code'}
      viewBox={`0 0 ${dim} ${dim}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className="rounded-xl bg-white"
    >
      <rect width={dim} height={dim} fill="#ffffff" />
      <path d={path} fill="#0b1020" />
    </svg>
  );
}
