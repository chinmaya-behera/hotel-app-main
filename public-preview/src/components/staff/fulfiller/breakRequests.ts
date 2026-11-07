'use client';

import { useState, useEffect, useCallback } from 'react';

export type DutyRequestType = 'on_duty' | 'off_duty' | 'break';

export interface DutyRequestRecord {
  id: string;
  employeeName: string;
  supervisorName: string;
  requestType: DutyRequestType;
  title: string;
  reason: string;
  customReason?: string;
  durationMinutes?: number;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  respondedAt?: string;
  // Backward compatibility:
  breakType?: string;
}

export type BreakRequestRecord = DutyRequestRecord;

export const ON_DUTY_REASONS = [
  {
    id: 'shift_start',
    label: 'Shift Start / Report for Duty',
    desc: 'Commence scheduled service rounds on assigned floors',
  },
  {
    id: 'relieve',
    label: 'Relieving Colleague / Shift Handover',
    desc: 'Take over floor coverage from previous shift attendant',
  },
  {
    id: 'surge',
    label: 'Occupancy Surge / Overtime Support',
    desc: 'Respond to high arrival volume and express turnover requests',
  },
  {
    id: 'return',
    label: 'Returning to Duty from Break or Leave',
    desc: 'Ready to receive and fulfill pending guest service tasks',
  },
  {
    id: 'other',
    label: 'Others',
    desc: 'Specify custom reason for supervisor authorization',
  },
];

export const OFF_DUTY_REASONS = [
  {
    id: 'shift_complete',
    label: 'Shift Concluded / Turnover Tasks Done',
    desc: 'All assigned room turnovers and service items completed',
  },
  {
    id: 'handover_done',
    label: 'Shift Handover to Reliever Complete',
    desc: 'Master keycard and linen inventory transferred to reliever',
  },
  {
    id: 'scheduled_end',
    label: 'Scheduled Shift Hours Concluded',
    desc: 'End of scheduled shift roster window',
  },
  {
    id: 'emergency_leave',
    label: 'Emergency / Personal Leave',
    desc: 'Urgent medical or personal departure required',
  },
  {
    id: 'other',
    label: 'Others',
    desc: 'Specify custom reason for supervisor authorization',
  },
];

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
    label: 'Others (Custom Duration & Reason)',
    durationMinutes: 20,
    desc: 'Document custom reason and duration for supervisor review',
  },
];

export const OTHER_DUTY_OPTIONS = [
  {
    id: 'swap',
    label: 'Shift Swap / Floor Coverage Adjustment',
    desc: 'Coordinate coverage change with a team colleague',
  },
  {
    id: 'dept_assist',
    label: 'Cross-Department Support (F&B / Banquet / Front Desk)',
    desc: 'Temporary assistance during peak guest events',
  },
  {
    id: 'special_event',
    label: 'Special VIP Staging / Dedicated Floor Protocol',
    desc: 'Assigned to private VIP arrival or event preparation',
  },
  {
    id: 'restock',
    label: 'Chemical & Linen Restock Period',
    desc: 'Re-supplying floor service pantries and carts',
  },
  {
    id: 'other',
    label: 'Others',
    desc: 'Specify custom duty request for supervisor review',
  },
];

const STORAGE_KEY = 'fulfiller_duty_request_v2';
const EVENT_NAME = 'fulfiller_duty_request_change';

export function getStoredBreakRequest(): DutyRequestRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DutyRequestRecord;
  } catch {
    return null;
  }
}

export function saveStoredBreakRequest(record: DutyRequestRecord | null) {
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
  const [breakRequest, setBreakRequest] = useState<DutyRequestRecord | null>(null);

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

  const createDutyRequest = useCallback(
    (params: {
      employeeName: string;
      supervisorName: string;
      requestType: DutyRequestType;
      title: string;
      reason: string;
      customReason?: string;
      durationMinutes?: number;
    }): DutyRequestRecord => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const record: DutyRequestRecord = {
        id: `duty-req-${Date.now()}`,
        employeeName: params.employeeName,
        supervisorName: params.supervisorName,
        requestType: params.requestType,
        title: params.title,
        reason: params.reason,
        customReason: params.customReason,
        durationMinutes: params.durationMinutes,
        requestedAt: timeStr,
        status: 'pending',
        breakType: params.title,
      };
      saveStoredBreakRequest(record);
      setBreakRequest(record);
      return record;
    },
    [],
  );

  const createBreakRequest = useCallback(
    (params: {
      employeeName: string;
      supervisorName: string;
      breakType: string;
      durationMinutes: number;
      reason?: string;
    }): DutyRequestRecord => {
      return createDutyRequest({
        employeeName: params.employeeName,
        supervisorName: params.supervisorName,
        requestType: 'break',
        title: params.breakType,
        reason: params.breakType,
        customReason: params.reason,
        durationMinutes: params.durationMinutes,
      });
    },
    [createDutyRequest],
  );

  const approveBreakRequest = useCallback(() => {
    const current = getStoredBreakRequest();
    if (!current) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated: DutyRequestRecord = {
      ...current,
      status: 'approved',
      respondedAt: timeStr,
    };
    saveStoredBreakRequest(updated);
    setBreakRequest(updated);
  }, []);

  const rejectBreakRequest = useCallback(() => {
    const current = getStoredBreakRequest();
    if (!current) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated: DutyRequestRecord = {
      ...current,
      status: 'rejected',
      respondedAt: timeStr,
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
    dutyRequest: breakRequest,
    createDutyRequest,
    createBreakRequest,
    approveBreakRequest,
    rejectBreakRequest,
    cancelBreakRequest,
    completeBreakRequest,
  };
}
