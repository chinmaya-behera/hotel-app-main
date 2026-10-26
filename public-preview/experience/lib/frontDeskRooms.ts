/**
 * Front Desk room-block workflow (FRONTEND ONLY, pure reducers over the shared demo state).
 *
 * Out-of-order rooms need Duty Manager approval (backlog F27): Front Desk requests the block,
 * the Duty Manager approves it from their own queue, and only then can Front Desk apply it.
 * Front Desk can never block a room on its own authority.
 */
import type { DemoState, WorkItem } from '../types/demo.ts';
import type { FdResult } from './frontDesk.ts';

const nowLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
let counter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${counter++}`;

export const oooTitle = (room: string) => `Out-of-order approval · Room ${room}`;

function findRequest(s: DemoState, room: string): WorkItem | undefined {
  return s.items.department_manager.find((i) => i.title === oooTitle(room));
}

export type OooState = 'none' | 'pending' | 'approved' | 'applied';

export function oooState(s: DemoState, room: string): OooState {
  const rec = s.frontDesk.rooms.find((r) => r.no === room);
  if (rec?.readiness === 'out_of_order') return 'applied';
  const req = findRequest(s, room);
  if (!req) return 'none';
  if (req.status === 'Resolved') return 'approved';
  return 'pending';
}

export function requestOutOfOrder(s: DemoState, roomNo: string, reason: string): FdResult {
  const room = s.frontDesk.rooms.find((r) => r.no === roomNo);
  if (!room) return { error: 'Room not found.' };
  if (room.occupied) return { error: `Room ${roomNo} is occupied. Move the guest first, then request the block.` };
  if (room.readiness === 'out_of_order') return { error: `Room ${roomNo} is already out of order.` };
  if (reason.trim().length < 5) return { error: 'Give a reason (5+ characters) so the Duty Manager can decide.' };
  if (oooState(s, roomNo) === 'pending') return { error: 'A request for this room is already waiting for the Duty Manager.' };

  const request: WorkItem = {
    id: uid('ooo'),
    title: oooTitle(roomNo),
    meta: `Requested by Front Desk · ${reason.trim()}`,
    status: 'Escalated',
    chip: 'Room block request',
    tone: 'warning',
    room: roomNo,
  };
  return {
    next: {
      ...s,
      items: { ...s.items, department_manager: [request, ...s.items.department_manager.filter((i) => i.title !== oooTitle(roomNo))] },
      frontDesk: {
        ...s.frontDesk,
        rooms: s.frontDesk.rooms.map((r) => (r.no === roomNo ? { ...r, note: 'Out-of-order requested · waiting for Duty Manager' } : r)),
      },
      feed: [{ id: uid('fd'), at: nowLabel(), role: 'Front Desk', text: `Out-of-order requested · Room ${roomNo} · ${reason.trim()}` }, ...s.feed].slice(0, 30),
    },
    message: `Room ${roomNo} block sent to the Duty Manager. It stays sellable until approved.`,
  };
}

export function applyOutOfOrder(s: DemoState, roomNo: string): FdResult {
  if (oooState(s, roomNo) !== 'approved') return { error: 'The Duty Manager has not approved this block yet.' };
  return {
    next: {
      ...s,
      frontDesk: {
        ...s.frontDesk,
        rooms: s.frontDesk.rooms.map((r) =>
          r.no === roomNo ? { ...r, readiness: 'out_of_order' as const, dnd: false, note: 'Blocked in PMS · approved by Duty Manager' } : r,
        ),
      },
      feed: [{ id: uid('fd'), at: nowLabel(), role: 'Front Desk', text: `Room ${roomNo} blocked out of order · Duty Manager approved` }, ...s.feed].slice(0, 30),
    },
    message: `Room ${roomNo} is now out of order and cannot be assigned.`,
  };
}
