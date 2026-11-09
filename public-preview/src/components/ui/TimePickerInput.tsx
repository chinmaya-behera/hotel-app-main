'use client';

import { Clock } from 'lucide-react';
import { useState } from 'react';
import { displayTime, TimePickerModal } from './TimePickerModal';

export function TimePickerInput({ label, value, onChange, disabled, className = 'field' }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" aria-label={label + (value ? ', ' + displayTime(value) : ', select time')}
      aria-haspopup="dialog" disabled={disabled} className={className}
      onClick={() => setOpen(true)}>
      <span className="inline-flex items-center gap-2"><Clock size={16}/>{value ? displayTime(value) : 'Select time'}</span>
    </button>
    {open && <TimePickerModal value={value} onConfirm={onChange} onClose={() => setOpen(false)}/>}
  </>;
}

export function DateTimePickerInput({ label, name, defaultValue = '', value, onChange, minDate }: {
  label: string; name?: string; defaultValue?: string; value?: string; onChange?: (value: string) => void; minDate?: string;
}) {
  const [local, setLocal] = useState(defaultValue);
  const current = value ?? local;
  const [date, time] = current.split('T');
  const update = onChange ?? setLocal;
  return <div className="dm-field">
    <span>{label}</span>
    <div className="dm-form-grid">
      <input type="date" aria-label={label + ' date'} min={minDate} value={date} onInput={event => {
        const nextDate = event.currentTarget.value;
        update(nextDate ? nextDate + 'T' + (time || '09:00') : '');
      }}/>
      <TimePickerInput label={label + ' time'} value={time || ''} disabled={!date} onChange={next => update(date + 'T' + next)}/>
    </div>
    {name && <input type="hidden" name={name} value={current}/>}
  </div>;
}

export function localDateTime(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return '';
  const date = new Date(value);
  return new Date(+date - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
