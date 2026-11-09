'use client';

import { Clock } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

const pad = (value: number) => String(value).padStart(2, '0');
const clamp = (value: string, min: number, max: number) => Math.max(min, Math.min(max, Number(value)));

export function displayTime(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return `${pad(hour % 12 || 12)}:${pad(minute)} ${hour < 12 ? 'a.m.' : 'p.m.'}`;
}

export function TimePickerModal({ value, onClose, onConfirm }: {
  value: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
}) {
  const [initialHour, initialMinute] = (value || '09:00').split(':').map(Number);
  const [hour, setHour] = useState(pad(initialHour % 12 || 12));
  const [minute, setMinute] = useState(pad(initialMinute));
  const [pm, setPm] = useState(initialHour >= 12);
  const dialog = useRef<HTMLDialogElement>(null);
  const hourInput = useRef<HTMLInputElement>(null);
  const title = useId();
  useEffect(() => {
    dialog.current?.showModal();
    hourInput.current?.select();
  }, []);

  const confirm = () => {
    onConfirm(pad(clamp(hour, 1, 12) % 12 + (pm ? 12 : 0)) + ':' + pad(clamp(minute, 0, 59)));
    dialog.current?.close();
  };
  const keys = (event: KeyboardEvent, value: string, min: number, max: number, update: (value: string) => void) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      confirm();
    }
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const next = clamp(value, min, max) + (event.key === 'ArrowUp' ? 1 : -1);
    update(pad(next > max ? min : next < min ? max : next));
  };
  const inputStyle = 'w-[min(22vw,6rem)] h-20 text-5xl text-center rounded-lg border-2 border-transparent bg-[#333537] text-zinc-100 outline-none focus:border-[#7fcfff] focus:bg-[#004a77] focus:text-[#c2e7ff]';
  const actionStyle = 'px-3 py-1.5 text-sm font-medium text-[#8ab4f8] hover:text-blue-300';

  return createPortal(
    <dialog ref={dialog} aria-labelledby={title} onClose={event => {
      // The picker is portaled, but React still bubbles its close event to the parent form dialog.
      event.stopPropagation();
      onClose();
    }}
      className="m-auto max-w-[calc(100%-1.5rem)] rounded-3xl border border-zinc-700 bg-[#28292a] p-5 text-zinc-100 shadow-2xl backdrop:bg-black/60 sm:p-6">
      <h2 id={title} className="mb-5 text-sm font-medium text-zinc-300">Select time</h2>
      <div className="flex items-start gap-2">
        <label className="grid gap-1.5 text-xs text-zinc-300">
          <input ref={hourInput} autoFocus aria-label="Hour" inputMode="numeric" maxLength={2} value={hour}
            onChange={event => setHour(event.target.value.replace(/[^0-9]/g, ''))}
            onBlur={() => setHour(pad(clamp(hour, 1, 12)))}
            onKeyDown={event => keys(event, hour, 1, 12, setHour)} className={inputStyle}/>
          Hour
        </label>
        <span aria-hidden="true" className="mt-4 text-4xl font-bold">:</span>
        <label className="grid gap-1.5 text-xs text-zinc-300">
          <input aria-label="Minute" inputMode="numeric" maxLength={2} value={minute}
            onChange={event => setMinute(event.target.value.replace(/[^0-9]/g, ''))}
            onBlur={() => setMinute(pad(clamp(minute, 0, 59)))}
            onKeyDown={event => keys(event, minute, 0, 59, setMinute)} className={inputStyle}/>
          Minute
        </label>
        <div className="grid h-20 overflow-hidden rounded-lg" role="group" aria-label="Time of day">
          {[false, true].map(period => <button key={String(period)} type="button" aria-pressed={pm === period}
            onClick={() => setPm(period)}
            className={`border px-2 text-sm first:rounded-t-lg last:rounded-b-lg ${pm === period ? 'border-[#8e6d9e] bg-[#4a3356] text-purple-100' : 'border-zinc-600 text-zinc-300'}`}>
            {period ? 'p.m.' : 'a.m.'}
          </button>)}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button type="button" aria-label="Focus hour input" className="p-1.5 text-zinc-300" onClick={() => hourInput.current?.select()}><Clock size={20}/></button>
        <div>
          <button type="button" className={actionStyle} onClick={() => dialog.current?.close()}>Cancel</button>
          <button type="button" className={actionStyle} onClick={confirm}>OK</button>
        </div>
      </div>
    </dialog>, document.body,
  );
}
