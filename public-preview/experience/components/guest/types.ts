export type GuestTabId =
  | 'home'
  | 'housekeeping'
  | 'room_service'
  | 'maintenance'
  | 'spa'
  | 'requests'
  | 'folio'
  | 'lost_found';

export interface GuestTabProps {
  room: string;
  guestName: string;
  onNavigate: (tab: GuestTabId) => void;
}
