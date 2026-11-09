'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** Accessible dialog: Portaled to document.body so parent transforms and sticky scroll containers don't displace it. */
export function Modal({ title, description, onClose, children, footer }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const previous = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-modal-close])');
    (first ?? ref.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus();
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fd-backdrop fixed inset-0 z-[1100] flex items-center justify-center p-2.5 sm:p-6"
      style={{ background: 'rgba(8, 14, 28, 0.72)', backdropFilter: 'blur(4px)' }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fd-dialog w-full max-w-lg max-h-[90dvh] sm:max-h-[85vh] flex flex-col rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden my-auto"
        style={{ background: 'rgb(var(--ink-850))' }}
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/[0.08] px-4 sm:px-5 py-3.5 sm:py-4 shrink-0">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-white">
              {title}
            </h2>
            {description && <p className="mt-1 text-xs text-mist-400">{description}</p>}
          </div>
          <button
            type="button"
            data-modal-close
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-mist-300 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 sm:py-4 space-y-4">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.08] px-4 sm:px-5 py-3.5 sm:py-4 shrink-0">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-mist-300">
      {children}
    </label>
  );
}
