'use client';

import { useState, useEffect, useCallback } from 'react';

export type AlertSeverity = 'Critical' | 'Warning' | 'Urgent';

export interface FrontDeskEmergencyAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  timestamp: string;
  location?: string;
  active: boolean;
}

const STORAGE_KEY = 'grand_adp_frontdesk_emergency_alert';
const CLEARED_KEY = 'grand_adp_frontdesk_alert_cleared';
const ACK_KEY_PREFIX = 'grand_adp_frontdesk_alert_acknowledged_';
const BROADCAST_EVENT = 'grand-adp-emergency-alert-change';

export const DEFAULT_EMERGENCY_ALERT: FrontDeskEmergencyAlert = {
  id: 'fd-alert-default-thermal',
  title: 'Basement Utility Substation Thermal Fluctuation',
  description: 'Thermal camera sensor flagged 4°C above baseline in breaker cabinet 3. Security patrol dispatched to investigate before broadcast.',
  severity: 'Critical',
  location: 'Basement Substation B3',
  timestamp: 'Today, 14:15',
  active: true,
};

export const ALERT_PRESETS = [
  {
    title: 'Basement Utility Substation Thermal Fluctuation',
    severity: 'Critical' as AlertSeverity,
    description: 'Thermal camera sensor flagged 4°C above baseline in breaker cabinet 3. Security patrol dispatched to investigate before broadcast.',
    location: 'Basement Substation B3',
  },
  {
    title: 'Severe Weather & Coastal Wind Advisory',
    severity: 'Warning' as AlertSeverity,
    description: 'High-velocity wind gusts detected along the waterfront boardwalk. Infinity pool terrace closed temporarily for guest safety.',
    location: 'Pool Terrace & Boardwalk',
  },
  {
    title: 'West Wing Water System Routine Calibration',
    severity: 'Urgent' as AlertSeverity,
    description: 'Planned routine recalibration of West Wing water pressure risers between 14:00–15:00. Hot and cold water remain operational throughout.',
    location: 'West Wing Floors 1–5',
  },
];

export function getStoredEmergencyAlert(): FrontDeskEmergencyAlert | null {
  if (typeof window === 'undefined') return DEFAULT_EMERGENCY_ALERT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // If user explicitly clicked clear from Front Desk console, do not show default
      const wasExplicitlyCleared = localStorage.getItem(CLEARED_KEY) === 'true';
      return wasExplicitlyCleared ? null : DEFAULT_EMERGENCY_ALERT;
    }
    const parsed = JSON.parse(raw) as FrontDeskEmergencyAlert;
    return parsed && parsed.active ? parsed : null;
  } catch {
    return DEFAULT_EMERGENCY_ALERT;
  }
}

export function isAlertAcknowledged(alertId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(ACK_KEY_PREFIX + alertId) === 'true';
  } catch {
    return false;
  }
}

export function acknowledgeAlert(alertId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACK_KEY_PREFIX + alertId, 'true');
  } catch {}
  window.dispatchEvent(new CustomEvent(BROADCAST_EVENT));
}

export function saveEmergencyAlert(alert: FrontDeskEmergencyAlert | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (alert && alert.active) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alert));
      localStorage.removeItem(CLEARED_KEY);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(CLEARED_KEY, 'true');
    }
  } catch {}
  window.dispatchEvent(new CustomEvent(BROADCAST_EVENT, { detail: alert }));
}

export function clearStoredEmergencyAlert(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(CLEARED_KEY, 'true');
  } catch {}
  window.dispatchEvent(new CustomEvent(BROADCAST_EVENT, { detail: null }));
}

export function useEmergencyBroadcast() {
  const [alert, setAlert] = useState<FrontDeskEmergencyAlert | null>(null);
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  const syncState = useCallback(() => {
    const active = getStoredEmergencyAlert();
    setAlert(active);
    if (active) {
      setIsAcknowledged(isAlertAcknowledged(active.id));
    } else {
      setIsAcknowledged(false);
    }
  }, []);

  useEffect(() => {
    syncState();
    const handleUpdate = () => syncState();
    window.addEventListener(BROADCAST_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(BROADCAST_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [syncState]);

  const broadcast = useCallback(
    (data: { title: string; description: string; severity: AlertSeverity; location?: string }) => {
      const newAlert: FrontDeskEmergencyAlert = {
        id: `fd-alert-${Date.now()}`,
        title: data.title,
        description: data.description,
        severity: data.severity,
        location: data.location,
        timestamp: 'Just now',
        active: true,
      };
      saveEmergencyAlert(newAlert);
      setIsAcknowledged(false);
      return newAlert;
    },
    []
  );

  const clear = useCallback(() => {
    clearStoredEmergencyAlert();
  }, []);

  const acknowledge = useCallback(
    (targetAlertId?: string) => {
      const idToAck = targetAlertId || alert?.id;
      if (idToAck) {
        acknowledgeAlert(idToAck);
        setIsAcknowledged(true);
      }
    },
    [alert]
  );

  return {
    alert,
    isBroadcastActive: !!(alert && alert.active),
    isAcknowledged,
    broadcast,
    clear,
    acknowledge,
    syncState,
  };
}
