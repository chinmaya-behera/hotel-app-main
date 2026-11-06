'use client';

import { useState, useEffect, useCallback } from 'react';

/** Request types a fulfiller can send to their Department Supervisor. */
export type DutyRequestKind = 'on_duty' | 'off_duty';
export type RequestKind = 'break' | DutyRequestKind;

export interface BreakRequestRecord {
  id: string;
  employeeName: string;
  supervisorName: string;
  breakType: string;
  durationMinutes: number;
  reason?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  respondedAt?: string;
  /** Epoch ms when the approved break started (set on approval). */
  startedAt?: number;
  /** Epoch ms when the approved break is due to end (set on approval). */
  endsAt?: number;
}

export interface DutyRequestRecord {
  id: string;
  kind: DutyRequestKind;
  employeeName: string;
  employeeId: string;
  departmentName: string;
  supervisorName: string;
  reasonLabel: string;
  note?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface DutyReasonOption {
  id: string;
  label: string;
  desc: string;
}

export const BREAK_OPTIONS = [
  {
    id: 'tea',
    label: '15-min Tea / Coffee Break',
    durationMinutes: 15,
    desc: 'Quick beverage and refreshment interval',
  },
  {
    id: 'meal',
    label: '30-min Meal / Lunch Break',
    durationMinutes: 30,
    desc: 'Designated shift meal window with floor coverage',
  },
  {
    id: 'rest',
    label: '10-min Rest / Stretch Break',
    durationMinutes: 10,
    desc: 'Short physical rest between turnover rounds',
  },
  {
    id: 'other',
    label: 'Custom Break Request',
    durationMinutes: 20,
    desc: 'Document custom reason for supervisor review',
  },
];

export const ON_DUTY_REASONS: DutyReasonOption[] = [
  {
    id: 'start_shift',
    label: 'Start of Shift · Clock-in',
    desc: 'Begin the assigned shift and start receiving tasks',
  },
  {
    id: 'return_absence',
    label: 'Return from Leave / Absence',
    desc: 'Resume duty after approved time away',
  },
  {
    id: 'other',
    label: 'Other (add a note)',
    desc: 'Explain the reason for your supervisor',
  },
];

export const OFF_DUTY_REASONS: DutyReasonOption[] = [
  {
    id: 'shift_complete',
    label: 'Shift Completed · Clock-out',
    desc: 'Assigned work is closed or handed over',
  },
  {
    id: 'unwell',
    label: 'Feeling Unwell',
    desc: 'Unable to continue the shift',
  },
  {
    id: 'emergency',
    label: 'Personal / Family Emergency',
    desc: 'Urgent need to leave the property',
  },
  {
    id: 'other',
    label: 'Other (add a note)',
    desc: 'Explain the reason for your supervisor',
  },
];

export const DUTY_KIND_LABEL: Record<DutyRequestKind, string> = {
  on_duty: 'On Duty',
  off_duty: 'Off Duty',
};

/** Formats a millisecond duration as mm:ss (e.g. 12:05). */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const nowLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/* ------------------------------------------------------------------ */
/* Break requests                                                      */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'fulfiller_break_request_v1';
const EVENT_NAME = 'fulfiller_break_request_change';

export function getStoredBreakRequest(): BreakRequestRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BreakRequestRecord;
  } catch {
    return null;
  }
}

export function saveStoredBreakRequest(record: BreakRequestRecord | null) {
  if (typeof window === 'undefined') return;
  try {
    if (record) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: record }));
  } catch {
    // ignore local storage errors
  }
}

export function useBreakRequest() {
  const [breakRequest, setBreakRequest] = useState<BreakRequestRecord | null>(null);

  useEffect(() => {
    setBreakRequest(getStoredBreakRequest());

    const handleChange = () => {
      setBreakRequest(getStoredBreakRequest());
    };

    window.addEventListener(EVENT_NAME, handleChange);
    window.addEventListener('storage', handleChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  const createBreakRequest = useCallback(
    (params: {
      employeeName: string;
      supervisorName: string;
      breakType: string;
      durationMinutes: number;
      reason?: string;
    }): BreakRequestRecord => {
      const record: BreakRequestRecord = {
        id: `brk-${Date.now()}`,
        employeeName: params.employeeName,
        supervisorName: params.supervisorName,
        breakType: params.breakType,
        durationMinutes: params.durationMinutes,
        reason: params.reason,
        requestedAt: nowLabel(),
        status: 'pending',
      };
      saveStoredBreakRequest(record);
      setBreakRequest(record);
      return record;
    },
    [],
  );

  const approveBreakRequest = useCallback(() => {
    const current = getStoredBreakRequest();
    if (!current) return;
    const startedAt = Date.now();
    const updated: BreakRequestRecord = {
      ...current,
      status: 'approved',
      respondedAt: nowLabel(),
      startedAt,
      endsAt: startedAt + current.durationMinutes * 60_000,
    };
    saveStoredBreakRequest(updated);
    setBreakRequest(updated);
  }, []);

  const rejectBreakRequest = useCallback(() => {
    const current = getStoredBreakRequest();
    if (!current) return;
    const updated: BreakRequestRecord = {
      ...current,
      status: 'rejected',
      respondedAt: nowLabel(),
    };
    saveStoredBreakRequest(updated);
    setBreakRequest(updated);
  }, []);

  const cancelBreakRequest = useCallback(() => {
    saveStoredBreakRequest(null);
    setBreakRequest(null);
  }, []);

  const completeBreakRequest = useCallback(() => {
    saveStoredBreakRequest(null);
    setBreakRequest(null);
  }, []);

  return {
    breakRequest,
    createBreakRequest,
    approveBreakRequest,
    rejectBreakRequest,
    cancelBreakRequest,
    completeBreakRequest,
  };
}

/* ------------------------------------------------------------------ */
/* On Duty / Off Duty requests                                         */
/* ------------------------------------------------------------------ */

const DUTY_STORAGE_KEY = 'fulfiller_duty_request_v1';
const DUTY_EVENT_NAME = 'fulfiller_duty_request_change';

export function getStoredDutyRequest(): DutyRequestRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DUTY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DutyRequestRecord;
  } catch {
    return null;
  }
}

export function saveStoredDutyRequest(record: DutyRequestRecord | null) {
  if (typeof window === 'undefined') return;
  try {
    if (record) {
      localStorage.setItem(DUTY_STORAGE_KEY, JSON.stringify(record));
    } else {
      localStorage.removeItem(DUTY_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent(DUTY_EVENT_NAME, { detail: record }));
  } catch {
    // ignore local storage errors
  }
}

export function useDutyRequest() {
  const [dutyRequest, setDutyRequest] = useState<DutyRequestRecord | null>(null);

  useEffect(() => {
    setDutyRequest(getStoredDutyRequest());

    const handleChange = () => {
      setDutyRequest(getStoredDutyRequest());
    };

    window.addEventListener(DUTY_EVENT_NAME, handleChange);
    window.addEventListener('storage', handleChange);

    return () => {
      window.removeEventListener(DUTY_EVENT_NAME, handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  const createDutyRequest = useCallback(
    (params: {
      kind: DutyRequestKind;
      employeeName: string;
      employeeId: string;
      departmentName: string;
      supervisorName: string;
      reasonLabel: string;
      note?: string;
    }): DutyRequestRecord => {
      const record: DutyRequestRecord = {
        id: `duty-${Date.now()}`,
        kind: params.kind,
        employeeName: params.employeeName,
        employeeId: params.employeeId,
        departmentName: params.departmentName,
        supervisorName: params.supervisorName,
        reasonLabel: params.reasonLabel,
        note: params.note,
        requestedAt: nowLabel(),
        status: 'pending',
      };
      saveStoredDutyRequest(record);
      setDutyRequest(record);
      return record;
    },
    [],
  );

  /** Resolves the pending request as approved: clears it and returns it so the caller can apply the status. */
  const approveDutyRequest = useCallback((): DutyRequestRecord | null => {
    const current = getStoredDutyRequest();
    saveStoredDutyRequest(null);
    setDutyRequest(null);
    return current;
  }, []);

  const cancelDutyRequest = useCallback(() => {
    saveStoredDutyRequest(null);
    setDutyRequest(null);
  }, []);

  return {
    dutyRequest,
    createDutyRequest,
    approveDutyRequest,
    cancelDutyRequest,
  };
}
