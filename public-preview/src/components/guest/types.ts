export type GuestMainSection =
  | 'home'
  | 'services'
  | 'activity'
  | 'notifications'
  | 'profile';

export type GuestServicesSubtab =
  | 'all'
  | 'book'
  | 'housekeeping'
  | 'dining'
  | 'room_service'
  | 'events_celebrations'
  | 'maintenance'
  | 'spa'
  | 'concierge'
  | 'recreation'
  | 'front_desk'
  | 'compensation'
  | 'reminders'
  | 'dnd'
  | 'complaints'
  | 'lost_found'
  | 'folio';

export type GuestNotificationsSubtab = 'personal' | 'alerts';
export type GuestProfileSubtab = 'profile_info' | 'bookings' | 'folio';
export type GuestLostFoundSubtab = 'lost' | 'found';

export type GuestTabId =
  | GuestMainSection
  // Direct and backward-compatible targets
  | 'alerts'
  | 'complaints'
  | 'lost_found'
  | 'housekeeping'
  | 'dining'
  | 'room_service'
  | 'events_celebrations'
  | 'maintenance'
  | 'spa'
  | 'concierge'
  | 'recreation'
  | 'front_desk'
  | 'compensation'
  | 'reminders'
  | 'dnd'
  | 'requests'
  | 'folio';

export interface GuestTabProps {
  room: string;
  guestName: string;
  onNavigate: (tab: GuestTabId, subtab?: string) => void;
  initialSubtab?: string;
}
