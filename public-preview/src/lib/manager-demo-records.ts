import type { DemoState, WorkItem } from '../types/demo';
import { nextOperationalReference } from './operational-references.ts';

const examples = [
  { id: 'hk', reference: 'HK', department: 'Housekeeping', category: 'housekeeping', room: '402', location: 'Room 402', open: 'Refresh towels before arrival', done: 'Deliver extra pillows' },
  { id: 'eng', reference: 'REP', department: 'Maintenance & Engineering', category: 'maintenance', room: '304', location: 'Room 304', open: 'Check a noisy air conditioner', done: 'Replace a reading lamp' },
  { id: 'spa', reference: 'TSK', department: 'Spa & Wellness', category: 'spa', room: '', location: 'Spa reception', open: 'Confirm a treatment room change', done: 'Prepare treatment linen' },
  { id: 'fb', reference: 'FB', department: 'Food & Beverages', category: 'room_service', room: '402', location: 'Room 402', open: 'Deliver a vegetable sandwich', done: 'Deliver a fruit platter' },
] as const;

export function withManagerDemoRecords(state: DemoState, now: number): DemoState {
  const queue = state.items.department_dispatcher_supervisor;
  const known = new Set(queue.map(task => task.id));
  const reserved = new Set<string>();
  const additions: WorkItem[] = [];
  const at = (minutesFromNow: number) => new Date(now + minutesFromNow * 60000).toISOString();

  for (const example of examples) {
    for (const done of [false, true]) {
      const id = `manager-demo-${example.id}-${done ? 'done' : 'open'}`;
      if (known.has(id)) continue;

      const dining = example.id === 'fb';
      const createdAt = at(done ? -150 : -90);
      const ref = nextOperationalReference(state, example.reference, example.room, createdAt, reserved);
      reserved.add(ref);
      additions.push({
        id, ref, department: example.department, category: example.category,
        room: example.room || undefined, location: example.location, meta: example.location,
        title: `Sample · ${done ? example.done : example.open}`,
        description: 'Practice record for the Department Manager demo.',
        status: done ? (dining ? 'Delivered' : 'Completed') : 'Unassigned',
        priority: done || dining ? 'normal' : 'urgent',
        createdAt, slaDue: at(done ? -110 : -45),
        history: done
          ? [
              { at: createdAt, status: 'Unassigned', actor: 'Demo queue' },
              { at: at(-145), status: 'In progress', actor: 'Demo team' },
              { at: at(-125), status: dining ? 'Delivered' : 'Completed', actor: 'Demo team', note: 'Service finished and checked.' },
            ]
          : [{ at: createdAt, status: 'Unassigned', actor: 'Demo queue' }],
        ...(dining ? {
          orderedAt: createdAt,
          requestedServiceAt: done ? undefined : at(45),
          orderLines: [{
            itemId: done ? 'demo-fruit-platter' : 'demo-vegetable-sandwich',
            name: done ? 'Fruit platter' : 'Vegetable sandwich',
            cuisine: 'Continental', menuCategory: done ? 'Desserts' : 'Mains', qty: 1, price: done ? 420 : 550,
          }],
        } : {}),
      });
    }
  }

  const operations = state.managerOperations;
  const medicalId = 'manager-demo-spa-follow-up';
  const medicalCases = operations?.medicalCases ?? [];
  if (operations && !medicalCases.some(record => record.id === medicalId)) {
    const createdAt = at(-120);
    state = {
      ...state,
      managerOperations: {
        ...operations,
        medicalCases: [...medicalCases, {
          id: medicalId, reference: nextOperationalReference(state, 'INC', '', createdAt, reserved),
          guest: 'Sample guest', location: 'Spa reception', urgency: 'routine', status: 'monitoring',
          createdAt, followUpAt: at(-15),
          history: [{ at: createdAt, author: 'Demo wellness team', note: 'Practice follow-up. Check in with the guest after they have rested.' }],
        }],
      },
    };
  }

  if (!additions.length) return state;
  // Keep one authoritative copy in the department queue so reporting counts it once.
  return { ...state, items: { ...state.items, department_dispatcher_supervisor: [...additions, ...queue] } };
}
