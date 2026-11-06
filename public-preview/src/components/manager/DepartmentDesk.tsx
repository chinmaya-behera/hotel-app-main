'use client';

import { useRef, useState, type FormEvent } from 'react';
import { ArrowRight, BedDouble, CalendarDays, Flower2, Package, Plus, UtensilsCrossed, Wrench, X } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { departmentId, isOpen, managerDepartment, managerTasks, type ManagerDepartmentId } from '@/lib/manager-domain';
import type { ManagerStockItem } from '@/types/demo';

export const DESK_LABELS: Record<ManagerDepartmentId, string> = {
  housekeeping: 'Room readiness',
  wellness: 'Appointments',
  engineering: 'Maintenance plan',
  'food-beverages': 'Menu & allergens',
};

function localDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function DepartmentDesk({ summary = false, onOpen, onInspect }: { summary?: boolean; onOpen: () => void; onInspect: () => void }) {
  const { state, departmentManagerCommand } = useDemo();
  const department = managerDepartment(state.managerDepartment);
  const operations = state.managerOperations;
  const [roomFilter, setRoomFilter] = useState('attention');
  const [menuSearch, setMenuSearch] = useState('');
  const [menuLimit, setMenuLimit] = useState(6);
  const [showPast, setShowPast] = useState(false);
  const [modal, setModal] = useState<'appointment' | ManagerStockItem | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  if (!operations) return null;

  const stock = operations.stock.filter(item => departmentId(item.department) === department.id);
  const rooms = state.frontDesk.rooms;
  const appointments = operations.appointments.filter(a => showPast || a.status === 'booked').toSorted((a, b) => a.start.localeCompare(b.start));
  const therapists = state.staffAccounts.filter(staff => departmentId(staff.department) === 'wellness' && staff.roleId === 'task_fulfiller' && staff.status === 'active' && !['break', 'off_duty'].includes(staff.availability || 'on_duty'));
  const assets = operations.assets;
  const today = new Date().toLocaleDateString('en-CA');
  const tasks = managerTasks(state, department.id);
  const summaryText = department.id === 'housekeeping'
    ? `${rooms.filter(r => r.readiness === 'ready').length} rooms ready · ${rooms.filter(r => r.dnd || state.guestPreferences?.[r.no]?.dnd).length} do not disturb`
    : department.id === 'wellness'
      ? `${operations.appointments.filter(a => a.status === 'booked').length} appointment${operations.appointments.filter(a => a.status === 'booked').length === 1 ? '' : 's'} · ${therapists.length} available therapist${therapists.length === 1 ? '' : 's'}`
      : department.id === 'engineering'
        ? `${assets.filter(a => a.nextDue <= today).length} services due · ${assets.filter(a => a.workOrderRef).length} linked work orders`
        : `${(state.diningMenu ?? []).filter(item => item.isAvailable).length} menu items available`;

  const DeskIcon = department.id === 'housekeeping' ? BedDouble : department.id === 'wellness' ? Flower2 : department.id === 'engineering' ? Wrench : UtensilsCrossed;
  if (summary) return <section className="dm-panel dm-desk-summary"><div className="dm-desk-card-label"><span className="dm-attention-icon"><DeskIcon size={21}/></span><span>Department tools</span></div><h2>{DESK_LABELS[department.id]}</h2><p>{summaryText}</p><div className="dm-desk-card-detail">{department.id === 'housekeeping' ? 'Prepare arrivals, check room status and coordinate your supplies.' : department.id === 'wellness' ? 'Manage treatment schedules, room availability and therapist bookings.' : department.id === 'engineering' ? 'Stay ahead of service dates and keep work orders moving.' : 'Keep guest menus current and review listed allergens.'}</div><button className="dm-primary" onClick={onOpen}>Open department desk <ArrowRight size={16}/></button></section>;

  const openModal = (next: NonNullable<typeof modal>) => { setModal(next); dialog.current?.showModal(); };
  const close = () => { dialog.current?.close(); setModal(null); };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = (name: string) => String(form.get(name) || '').trim();
    const ok = modal === 'appointment'
      ? departmentManagerCommand({ type: 'appointment', guest: field('guest'), treatment: field('treatment'), room: field('room'), therapistId: field('therapist'), start: new Date(field('start')).toISOString(), durationMinutes: Number(field('duration')) })
      : modal && departmentManagerCommand({ type: 'stock-count', stockId: modal.id, quantity: Number(field('quantity')) });
    if (ok) close();
  };
  const selectedRooms = rooms.filter(room => {
    if (roomFilter === 'all') return true;
    if (roomFilter === 'dnd') return room.dnd || state.guestPreferences?.[room.no]?.dnd;
    if (roomFilter === 'arrivals') return state.frontDesk.stays.some(stay => stay.room === room.no && stay.status === 'expected');
    return room.readiness !== 'ready';
  });
  const menu = (state.diningMenu ?? []).filter(item => `${item.name} ${item.category} ${item.allergens.join(' ')}`.toLowerCase().includes(menuSearch.toLowerCase()));

  return <div className="dm-desk">
    {department.id === 'housekeeping' && <section className="dm-panel">
      <div className="dm-panel-heading"><div><h2>Room readiness</h2><p>Prioritize arrivals, respect do-not-disturb requests and send cleaning to dispatch.</p></div><select aria-label="Room readiness filter" value={roomFilter} onChange={e => setRoomFilter(e.target.value)}><option value="attention">Needs attention</option><option value="arrivals">Expected arrivals</option><option value="dnd">Do not disturb</option><option value="all">All rooms</option></select></div>
      <div className="dm-room-grid">{selectedRooms.map(room => {
        const dnd = room.dnd || state.guestPreferences?.[room.no]?.dnd;
        const arrival = state.frontDesk.stays.find(stay => stay.room === room.no && stay.status === 'expected');
        const existing = tasks.some(t => t.room === room.no && t.category === 'housekeeping' && isOpen(t.status));
        const canClean = !dnd && ['dirty', 'inspection_failed'].includes(room.readiness) && !existing;
        return <article className="dm-room" key={room.no}>
          <div><strong>{room.no}</strong><span className="dm-status">{room.readiness.replaceAll('_', ' ')}</span></div>
          <p>Floor {room.floor} · {room.occupied ? 'Occupied' : 'Vacant'}</p>
          <small>{dnd ? 'Do not disturb · entry paused' : arrival ? `${arrival.vip ? 'VIP · ' : ''}Expected arrival` : 'No arrival flag'}</small>
          {room.readiness === 'inspection_pending' ? <button className="dm-text-button" onClick={onInspect}>Open inspections</button> : <button className="dm-small-button" disabled={!canClean} onClick={() => departmentManagerCommand({ type: 'room-cleaning', room: room.no })}>{existing ? 'Cleaning already queued' : dnd ? 'Entry paused' : room.readiness === 'out_of_order' ? 'Engineering clearance needed' : 'Request cleaning'}</button>}
        </article>;
      })}</div>{selectedRooms.length === 0 && <p className="dm-empty">No rooms match this view.</p>}
    </section>}

    {department.id === 'wellness' && <section className="dm-panel">
      <div className="dm-panel-heading"><div><h2>Appointment planner</h2><p>Room and therapist conflicts include a 15-minute reset between treatments.</p></div><button className="dm-primary" disabled={therapists.length === 0} onClick={() => openModal('appointment')}><Plus size={15}/> New appointment</button></div>
      <div className="dm-inline-toolbar"><span>{summaryText}</span><label><input type="checkbox" checked={showPast} onChange={e => setShowPast(e.target.checked)}/> Include completed & cancelled</label></div>
      {therapists.length === 0 && <p className="dm-report-note">No therapist is available. Review staff availability before scheduling.</p>}
      {appointments.length === 0 && <div className="dm-empty"><CalendarDays size={23}/><h3>A clear schedule</h3><p>Add an appointment to reserve a therapist and treatment room.</p></div>}
      {appointments.map(appointment => <article className="dm-record" key={appointment.id}>
        <div className="dm-record-title"><h3>{appointment.treatment} · {appointment.guest}</h3><span className="dm-status">{appointment.status}</span></div>
        <p>{new Date(appointment.start).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {appointment.durationMinutes} min + {appointment.bufferMinutes} min reset</p>
        <small>{appointment.room} · {state.staffAccounts.find(staff => staff.id === appointment.therapistId)?.name || 'Assigned therapist'}</small>
        {appointment.status === 'booked' && <div className="dm-record-actions"><button className="dm-small-button" disabled={Date.now() < Date.parse(appointment.start) + appointment.durationMinutes * 60000} onClick={() => departmentManagerCommand({ type: 'appointment-status', appointmentId: appointment.id, status: 'completed' })}>Complete treatment</button><button className="dm-text-button" onClick={() => departmentManagerCommand({ type: 'appointment-status', appointmentId: appointment.id, status: 'cancelled' })}>Cancel appointment</button></div>}
      </article>)}
    </section>}

    {department.id === 'engineering' && <section className="dm-panel">
      <div className="dm-panel-heading"><div><h2>Preventive maintenance</h2><p>Create one linked work order per asset. Record service after the work is completed.</p></div></div>
      {assets.toSorted((a, b) => a.nextDue.localeCompare(b.nextDue)).map(asset => {
        const work = asset.workOrderRef ? tasks.find(task => task.ref === asset.workOrderRef) : undefined;
        const complete = work && ['completed', 'resolved'].includes(work.status.toLowerCase());
        return <article className="dm-record" key={asset.id}>
          <div className="dm-record-title"><h3>{asset.name}</h3><span className="dm-status">{asset.nextDue < today ? 'Overdue' : asset.nextDue === today ? 'Due today' : `Due ${asset.nextDue}`}</span></div>
          <p>{asset.location} · Every {asset.intervalDays} days</p><small>{asset.lastServiced ? `Last serviced ${new Date(asset.lastServiced).toLocaleDateString('en-IN')}` : 'No service recorded in this demo'}</small>
          <div className="dm-record-actions">{complete ? <button className="dm-small-button" onClick={() => departmentManagerCommand({ type: 'asset-service', assetId: asset.id })}>Record service & next due date</button> : <button className="dm-small-button" disabled={!!work && isOpen(work.status)} onClick={() => departmentManagerCommand({ type: 'asset-work-order', assetId: asset.id })}>{work && isOpen(work.status) ? `Work order · ${work.status}` : 'Create maintenance work order'}</button>}</div>
        </article>;
      })}
    </section>}

    {department.id !== 'food-beverages' && <section className="dm-panel">
      <div className="dm-panel-heading"><div><h2>{department.id === 'housekeeping' ? 'Linen & supplies' : department.id === 'wellness' ? 'Treatment supplies' : 'Spare parts'}</h2><p>Record counts and request the quantity needed to reach each target. Requests do not change stock.</p></div><Package size={19}/></div>
      <div className="dm-table-wrap"><table className="dm-table"><thead><tr><th>Item</th><th>On hand / target</th><th>Shortfall</th><th>Actions</th></tr></thead><tbody>{stock.map(item => {
        const pending = state.resourceRequests?.some(request => request.id === item.requisitionId && request.status === 'pending');
        return <tr key={item.id}><td><strong>{item.name}</strong><small>{item.unit}{item.lastCountedAt ? ` · Counted ${new Date(item.lastCountedAt).toLocaleDateString('en-IN')}` : ' · Sample opening count'}</small></td><td>{item.onHand} / {item.par}</td><td>{Math.max(0, item.par - item.onHand)} {item.unit}</td><td><div className="dm-record-actions"><button className="dm-text-button" onClick={() => openModal(item)}>Update count</button><button className="dm-small-button" disabled={pending || item.onHand >= item.par} onClick={() => departmentManagerCommand({ type: 'replenish', stockId: item.id })}>{pending ? 'Request pending' : 'Request stock'}</button></div></td></tr>;
      })}</tbody></table></div>
    </section>}

    {department.id === 'food-beverages' && <section className="dm-panel">
      <div className="dm-panel-heading"><div><h2>Menu availability & allergens</h2><p>Availability changes are shared with the guest dining menu.</p></div></div>
      <div className="dm-toolbar"><input aria-label="Search menu or allergens" value={menuSearch} onChange={e => { setMenuSearch(e.target.value); setMenuLimit(6); }} placeholder="Search item, category or allergen…"/></div>
      {menu.slice(0, menuLimit).map(item => <article className="dm-record" key={item.id}><div className="dm-record-title"><h3>{item.name}</h3><button className="dm-small-button" role="switch" aria-checked={item.isAvailable} aria-label={`Availability for ${item.name}`} onClick={() => departmentManagerCommand({ type: 'menu-availability', menuId: item.id, available: !item.isAvailable })}>{item.isAvailable ? 'Available' : 'Unavailable'}</button></div><p>{item.category} · ₹{item.price.toLocaleString('en-IN')}</p><small>Listed allergens: {item.allergens.length ? item.allergens.join(', ') : 'None listed — confirm with kitchen'}</small></article>)}
      {menu.length === 0 && <p className="dm-empty">No matching menu items.</p>}
      {menuLimit < menu.length && <div className="dm-toolbar"><button className="dm-text-button" onClick={() => setMenuLimit(value => value + 6)}>Show more items ({menu.length - menuLimit} remaining)</button></div>}
    </section>}

    <dialog ref={dialog} className="dm-dialog" onClose={() => setModal(null)} aria-labelledby="department-desk-dialog-title"><form onSubmit={submit} key={modal === 'appointment' ? 'appointment' : modal?.id}>
      <div className="dm-dialog-heading"><h2 id="department-desk-dialog-title">{modal === 'appointment' ? 'New appointment' : 'Update stock count'}</h2><button className="dm-icon-button" type="button" onClick={close} aria-label="Close department action"><X size={19}/></button></div>
      {modal === 'appointment' ? <>
        <label className="dm-field">Guest / room reference<input name="guest" required maxLength={100} placeholder="Room 402"/></label>
        <label className="dm-field">Treatment<select name="treatment"><option>Relaxation massage</option><option>Facial treatment</option><option>Wellness consultation</option></select></label>
        <div className="dm-form-grid"><label className="dm-field">Start time<input type="datetime-local" name="start" required min={localDateTime(new Date())} defaultValue={localDateTime(new Date(Date.now() + 3600000))}/></label><label className="dm-field">Duration<select name="duration" defaultValue="60">{[30, 45, 60, 90].map(value => <option key={value} value={value}>{value} minutes</option>)}</select></label></div>
        <label className="dm-field">Therapist<select name="therapist" required>{therapists.map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}</select></label>
        <label className="dm-field">Treatment room<select name="room">{[1, 2, 3].map(room => <option key={room}>Treatment room {room}</option>)}</select></label>
        <p className="dm-dialog-description">A 15-minute room reset is reserved after the treatment.</p>
      </> : modal && <><p className="dm-dialog-description">{modal.name} · Target {modal.par} {modal.unit}</p><label className="dm-field">Count on hand ({modal.unit})<input name="quantity" type="number" min="0" max="1000000" step={['sets', 'pieces', 'bottles'].includes(modal.unit) ? '1' : '0.1'} required defaultValue={modal.onHand}/></label></>}
      <div className="dm-dialog-actions"><button className="dm-secondary" type="button" onClick={close}>Cancel</button><button className="dm-primary" type="submit">{modal === 'appointment' ? 'Reserve appointment' : 'Save count'}</button></div>
    </form></dialog>
  </div>;
}
