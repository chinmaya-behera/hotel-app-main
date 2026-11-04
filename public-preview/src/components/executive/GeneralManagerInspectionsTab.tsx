'use client';

import { useState, type FormEvent } from 'react';
import { MANAGER_DEPARTMENTS, departmentId, managerDepartment } from '@/lib/manager-domain';
import { useDemo } from '@/lib/store';

export function GeneralManagerInspectionsTab() {
  const { state, initiateInspectionDirective } = useDemo();
  const [department, setDepartment] = useState('housekeeping');
  const d = managerDepartment(department);
  const inspections = (state.inspections ?? []).filter(i => departmentId(i.department) === d.id);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = event.currentTarget, data = new FormData(form);
    initiateInspectionDirective({ department: d.name, roomNumber: String(data.get('location')).trim(), roomType: d.name, type: d.id === 'engineering' ? 'maintenance_check' : 'periodic', instructions: String(data.get('instructions')).trim(), initiatedBy: 'General Manager', initiatedRole: 'general_manager' });
    form.reset();
  };
  return <section className="rounded-3xl border border-white/10 bg-ink-900 p-6 space-y-6"><div><h2 className="text-xl font-display text-white">Department inspection directives</h2><p className="mt-2 text-xs text-mist-400">Send a quality inspection to a department manager. The manager assigns a supervisor in their own department.</p></div><label className="block text-xs text-mist-300">Target department<select value={department} onChange={event => setDepartment(event.target.value)} className="block mt-2 w-full rounded-xl bg-ink-950 border border-white/10 p-3 text-white">{MANAGER_DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label><form key={department} onSubmit={submit} className="space-y-4"><label className="block text-xs text-mist-300">Room or service location<input name="location" required maxLength={100} placeholder="Room 402, treatment room or restaurant" className="block mt-2 w-full rounded-xl bg-ink-950 border border-white/10 p-3 text-white"/></label><label className="block text-xs text-mist-300">Inspection instructions<textarea name="instructions" required maxLength={2000} defaultValue={d.standard} className="block mt-2 w-full rounded-xl bg-ink-950 border border-white/10 p-3 text-white"/></label><button type="submit" className="rounded-xl bg-amber-400 px-4 py-3 text-xs font-bold text-ink-950">Send to {d.name} Manager</button></form><div className="border-t border-white/10 pt-5 space-y-3"><h3 className="text-sm font-semibold text-white">Inspection tracking · {d.name}</h3>{inspections.map(i => <article className="rounded-xl border border-white/10 p-4" key={i.id}><div className="flex justify-between gap-3"><strong className="text-sm text-white">{i.roomNumber}</strong><span className="text-xs text-amber-300">{i.status}</span></div><p className="text-xs text-mist-300 mt-2">{i.instructions}</p><p className="text-xs text-mist-400 mt-2">From {i.initiatedBy || 'Department supervisor'} · Supervisor: {i.assignedSupervisorName || 'Awaiting manager assignment'}</p></article>)}</div></section>;
}
