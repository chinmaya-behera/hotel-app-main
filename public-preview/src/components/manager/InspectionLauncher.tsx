'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { BedDouble, Building2, ClipboardCheck, Layers, X } from 'lucide-react';
import { useDemo } from '@/lib/store';
import { departmentId, managerDepartment } from '@/lib/manager-domain';
import { INSPECTION_AREAS, INSPECTION_OPTIONS, inspectionTargets } from '@/lib/manager-workflows';

export function InspectionLauncher() {
  const { state, departmentManagerCommand } = useDemo();
  const d = managerDepartment(state.managerDepartment), templates = INSPECTION_OPTIONS[d.id];
  const rooms = state.frontDesk.rooms;
  const floors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b);
  const staff = state.staffAccounts.filter(st => departmentId(st.department) === d.id && ['department_supervisor', 'department_dispatcher_supervisor'].includes(st.roleId) && st.status === 'active');
  const [scope, setScope] = useState<'room' | 'floor' | 'all'>('room');
  const [room, setRoom] = useState(rooms.find(r => r.no === '402')?.no || rooms[0]?.no || INSPECTION_AREAS[d.id][0]);
  const [floor, setFloor] = useState(floors[0]);
  const dialog = useRef<HTMLDialogElement>(null), title = useId();
  let targets: ReturnType<typeof inspectionTargets> = [];
  try { targets = inspectionTargets(state, d.id, { scope, location: room, floor }); } catch { /* Empty room inventories show an explicit empty selection. */ }
  const close = () => dialog.current?.close();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    if (departmentManagerCommand({ type: 'inspection-launch', scope, location: room, floor, inspectionType: String(form.get('inspectionType')) as typeof templates[number]['type'], priority: String(form.get('priority')) as 'normal' | 'urgent' | 'vip', instructions: String(form.get('instructions') || ''), supervisorId: String(form.get('supervisor')) })) close();
  };
  return <><button className="dm-primary" onClick={() => dialog.current?.showModal()}><ClipboardCheck size={17}/> Start inspection</button><dialog className="dm-dialog dm-inspection-launcher" ref={dialog} aria-labelledby={title}><form onSubmit={submit}>
    <div className="dm-inspection-scroll"><div className="dm-dialog-heading"><div className="dm-inspection-heading"><span className="dm-attention-icon"><ClipboardCheck size={23}/></span><div><h2 id={title}>Conduct quality inspection</h2><p>{d.name} · Assign a supervisor to inspect a room, a floor or all rooms.</p></div></div><button type="button" className="dm-icon-button" aria-label="Close inspection launcher" onClick={close}><X size={19}/></button></div>
    <fieldset className="dm-scope-fieldset"><legend>Select inspection scope</legend><div className="dm-scope-grid">{([
      { id: 'room', label: 'Particular room / area', hint: 'Inspect one room or department service area', count: '1 location', Icon: BedDouble },
      { id: 'floor', label: 'Overall rooms on floor', hint: 'Create one inspection for each room on a floor', count: 'Floor sweep', Icon: Layers },
      { id: 'all', label: 'All rooms (hotel-wide)', hint: 'Department quality checks throughout the hotel', count: `${rooms.length} rooms`, Icon: Building2 },
    ] as const).map(item => <button key={item.id} type="button" className="dm-scope-card" aria-pressed={scope === item.id} onClick={() => setScope(item.id)}><span><item.Icon size={23}/><small>{item.count}</small></span><strong>{item.label}</strong><p>{item.hint}</p></button>)}</div></fieldset>
    <div className="dm-scope-selection">
      {scope === 'room' && <><label className="dm-field">Room or department service area<select aria-label="Inspection location" value={room} onChange={e => setRoom(e.target.value)}><optgroup label="Guest rooms">{rooms.map(r => <option key={r.no} value={r.no}>Room {r.no} · Floor {r.floor}</option>)}</optgroup><optgroup label={`${d.name} service areas`}>{INSPECTION_AREAS[d.id].map(area => <option key={area}>{area}</option>)}</optgroup></select></label><div className="dm-room-shortcuts">{rooms.slice(0, 5).map(r => <button className="dm-small-button" type="button" key={r.no} aria-pressed={room === r.no} onClick={() => setRoom(r.no)}>{r.no}</button>)}</div></>}
      {scope === 'floor' && <><p className="dm-field-label">Select floor to sweep</p><div className="dm-floor-grid">{floors.map(f => <button className="dm-floor-button" type="button" key={f} aria-pressed={floor === f} onClick={() => setFloor(f)}><strong>Floor {f}</strong><small>{rooms.filter(r => r.floor === f).length} rooms</small></button>)}</div><p className="dm-scope-description">Includes {targets.length} rooms: {targets.map(t => t.location).join(', ') || 'None'}</p></>}
      {scope === 'all' && <><strong>Property-wide {d.name.toLowerCase()} sweep</strong><p className="dm-scope-description">This creates {targets.length} individual inspections across {floors.length} floors. Each room has its own checklist and outcome.</p></>}
    </div>
    <div className="dm-form-grid"><label className="dm-field">Inspection type<select name="inspectionType" required>{templates.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}</select></label><label className="dm-field">Priority<select name="priority"><option value="normal">Normal</option><option value="urgent">Urgent</option><option value="vip">VIP</option></select></label></div>
    <label className="dm-field">Assign department supervisor<select name="supervisor" required defaultValue=""><option value="" disabled>Select a {d.name} supervisor</option>{staff.map(st => <option key={st.id} value={st.id}>{st.name} · {st.shift}</option>)}</select></label>
    {!staff.length && <p className="dm-reminder-due">No active supervisor is available in this department.</p>}
    <label className="dm-field">Special directives / inspection notes (optional)<textarea name="instructions" maxLength={2000} placeholder={d.standard}/></label></div>
    <div className="dm-dialog-actions dm-launch-actions"><span>Scope: <strong>{scope === 'room' ? room : scope === 'floor' ? `Floor ${floor}` : 'Hotel-wide'} · {targets.length} inspection{targets.length === 1 ? '' : 's'}</strong></span><button type="button" className="dm-secondary" onClick={close}>Cancel</button><button type="submit" className="dm-primary" disabled={!staff.length || !targets.length}><ClipboardCheck size={16}/> Launch inspection</button></div>
  </form></dialog></>;
}
