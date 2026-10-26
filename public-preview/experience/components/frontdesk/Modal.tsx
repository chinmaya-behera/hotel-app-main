'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** Accessible dialog: Escape and backdrop close it, focus moves inside, and the page behind does not scroll. */
export function Modal({ title, description, onClose, children, footer }: ModalProps) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
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
  }, []);

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fd-backdrop fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4"
      style={{ background: 'rgb(8 14 28 / 0.6)' }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fd-dialog my-auto w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl"
        style={{ background: 'rgb(var(--ink-850))' }}
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-white">
              {title}
            </h2>
            {description && <p className="mt-1 text-xs text-mist-400">{description}</p>}
          </div>
          <button type="button" data-modal-close onClick={onClose} aria-label="Close dialog" className="btn btn-subtle btn-sm">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>
        <div className="space-y-4 px-5 py-4">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.08] px-5 py-4">{footer}</footer>}
      </div>
    </div>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-mist-300">
      {children}
    </label>
  );
}
