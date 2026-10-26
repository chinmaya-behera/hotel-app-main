'use client';

import { Moon, Sun } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { cn } from '@/lib/utils';

/** Site-wide light/dark switch. The theme is shared by every page, including the Guest Portal. */
export function ThemeToggle({ className }: { className?: string }) {
  const { state, setTheme } = useDemo();
  const isLight = state.theme === 'light';
  const label = isLight ? 'Switch to dark theme' : 'Switch to light theme';

  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      aria-label={label}
      title={label}
      className={cn('btn btn-ghost btn-sm', className)}
    >
      {isLight ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
    </button>
  );
}
