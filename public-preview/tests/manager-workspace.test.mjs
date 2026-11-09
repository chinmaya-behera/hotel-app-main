import test from 'node:test';
import assert from 'node:assert/strict';
import { applyManagerCommand, ensureManagerState, managerTasks } from '../src/lib/manager-domain.ts';
import { withManagerDemoRecords } from '../src/lib/manager-demo-records.ts';
import { initialiseDepartmentHistory, captureDepartmentHistory } from '../src/lib/department-record-history.ts';
import { isPastTaskDeadline, measureSla, taskPolicy, taskSla, stampTaskTimings, operationalSlas, percentile, slaSummary } from '../src/lib/manager-performance.ts';
import { operationalWeek, shiftInterval, schedulingConflicts, rosterWorkload } from '../src/lib/manager-scheduling.ts';
import { seedItems } from '../src/lib/mockData.ts';

test('demo queues initialise every current and legacy role without breaking manager startup', () => {
  for (const role of ['department_dispatcher', 'department_supervisor', 'department_dispatcher_supervisor', 'department_manager', 'executive_viewer', 'general_manager']) {
    assert.ok(Array.isArray(seedItems[role]), `${role} has an initial queue`);
  }
  assert.deepEqual(seedItems.department_dispatcher_supervisor, [...seedItems.department_dispatcher, ...seedItems.department_supervisor]);
});
const now = Date.parse('2026-11-06T09:00:00Z');
const iso = offset => new Date(now + offset * 60000).toISOString();
function fixture(department = 'housekeeping') {
  return ensureManagerState({ persona:'department_manager',managerDepartment:department,staffAccounts:[{id:'staff',employeeId:'EMP-1',name:'Demo attendant',department:'Housekeeping',roleId:'task_fulfiller',status:'active',availability:'on_duty',maxWorkload:2,floorZone:'Floor 4'},{id:'eng',employeeId:'EMP-2',name:'Demo engineer',department:'Engineering',roleId:'task_fulfiller',status:'active',availability:'on_duty'}],inspections:[],notifications:[],auditTrail:[],shiftSchedules:[],workflowConfig:{ackSlaMinutes:5,resolutionSlaMinutes:20,dualSlaEnabled:true},routingRules:[{id:'hk-rule',category:'housekeeping',department:'Housekeeping',ackSlaMinutes:3,resolutionSlaMinutes:25,active:true}],items:Object.fromEntries(['task_fulfiller','department_dispatcher','department_supervisor','department_dispatcher_supervisor','department_manager','front_desk_coordinator','financial_operator','security_responder','executive_viewer','general_manager','platform_admin'].map(role=>[role,[]])) });
}
const task = (extra={})=>({id:'task',ref:'HK-DEMO',title:'Demo request',meta:'',department:'Housekeeping',category:'housekeeping',status:'Assigned',createdAt:iso(0),...extra});
const publish = (state,extra={},id='shift')=>applyManagerCommand(state,{type:'schedule-shift',staffId:'staff',date:'2026-11-07',pattern:'Day',start:'08:00',end:'16:00',zone:'Floor 4',reason:'Demo schedule change',...extra},id,iso(0));

test('department demo records are timed, scoped and retain user changes on reload', () => {
  const seeded = withManagerDemoRecords(fixture(), now);
  const samples = managerTasks(seeded, 'housekeeping').filter(item => item.id.startsWith('manager-demo-'));
  assert.equal(samples.length, 2);
  const [overdue, completed] = samples;
  assert.ok(isPastTaskDeadline(taskSla(seeded, overdue, now)));
  assert.equal(taskSla(seeded, completed, now).resolution.outcome, 'met');

  const updated = applyManagerCommand(seeded, {
    type: 'task-update', taskId: overdue.id, staffId: 'staff', priority: 'urgent', status: 'Completed', note: 'Practice task completed',
  }, 'demo-complete', iso(0));
  const reloaded = withManagerDemoRecords(structuredClone(updated), now + 86400000);
  const saved = managerTasks(reloaded, 'housekeeping').filter(item => item.id === overdue.id);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].status, 'Completed');
  assert.equal(saved[0].createdAt, overdue.createdAt);
  assert.equal(reloaded.managerOperations.medicalCases.length, 1);
});

test('routing rules override property fallbacks only for the matching active department/category',()=>{
  const s=fixture(); assert.equal(taskPolicy(s,task()).resolutionTargetMinutes,25);
  assert.equal(taskPolicy(s,task({category:'laundry'})).resolutionTargetMinutes,20);
  s.routingRules[0].active=false; assert.equal(taskPolicy(s,task()).ackTargetMinutes,5);
});
test('SLA boundary, risk window, exclusions, disabled acknowledgement and unknown closed timing are distinct',()=>{
  const base={kind:'Resolution',reference:'X',title:'X',start:now,target:10,now:now+9*60000,source:'Policy'};
  assert.equal(measureSla(base).outcome,'at_risk');
  assert.equal(measureSla({...base,end:now+10*60000}).outcome,'met');
  assert.equal(measureSla({...base,end:now+10*60000+1}).outcome,'breached');
  assert.equal(measureSla({...base,closed:true}).outcome,'unknown');
  assert.equal(measureSla({...base,excluded:true}).outcome,'excluded');
  assert.equal(measureSla({...base,disabled:true}).outcome,'disabled');
  assert.equal(measureSla({...base,start:undefined}).outcome,'unknown');
});
test('new tasks record full timestamps, assignment is not acknowledgement, and policy is frozen after capture',()=>{
  let s=fixture(),next=structuredClone(s); next.items.department_dispatcher_supervisor=[task({createdAt:'09:00'})];
  s=stampTaskTimings(s,next,iso(0));
  let actual=managerTasks(s,'housekeeping').find(t=>t.id==='task');
  assert.equal(actual.serviceTiming.createdAt,iso(0));assert.equal(actual.serviceTiming.acknowledgedAt,undefined);
  next=structuredClone(s);next.items.department_dispatcher_supervisor[0].status='Accepted';s=stampTaskTimings(s,next,iso(2));
  next=structuredClone(s);next.items.department_dispatcher_supervisor[0].status='Completed';s=stampTaskTimings(s,next,iso(20));
  s.workflowConfig.resolutionSlaMinutes=1;s.routingRules[0].resolutionSlaMinutes=1;
  actual=managerTasks(s,'housekeeping').find(t=>t.id==='task');const measured=taskSla(s,actual,now+21*60000);
  assert.equal(measured.ack.outcome,'met');assert.equal(measured.resolution.outcome,'met');assert.equal(measured.resolution.target,25);
});
test('old clock-only records remain undated after updates; reported overdue text cannot fabricate timed compliance',()=>{
  let s=fixture();s.items.department_dispatcher_supervisor=[task({createdAt:'09:00',ackStatus:'overdue',slaDue:'Overdue',tone:'danger'})];
  const next=structuredClone(s);next.items.department_dispatcher_supervisor[0].status='Accepted';s=stampTaskTimings(s,next,iso(2));
  const metrics=taskSla(s,s.items.department_dispatcher_supervisor[0],now);
  assert.equal(metrics.created,undefined);assert.equal(metrics.ack.outcome,'unknown');assert.equal(metrics.resolution.outcome,'unknown');
});
test('accepted work with an untimed acknowledgement is unknown rather than a fabricated breach',()=>{
  const s=fixture();const result=taskSla(s,task({status:'Accepted',history:[{at:'09:05',status:'Accepted'}]}),now+60*60000);
  assert.equal(result.ack.outcome,'unknown');assert.equal(result.resolution.outcome,'breached');
});
test('explicit deadlines, duration overrides and scheduled delivery slots are honoured',()=>{
  const s=fixture();
  assert.equal(taskSla(s,task({slaDue:iso(40),status:'Assigned'}),now+30*60000).resolution.outcome,'pending');
  assert.equal(taskSla(s,task({slaDue:iso(40)}),now+30*60000).resolution.target,40);
  assert.equal(taskSla(s,task({slaDue:'40 mins'}),now+30*60000).resolution.outcome,'pending');
  const scheduled=taskSla(s,task({requestedServiceAt:iso(1440)}),now+60*60000);
  assert.equal(scheduled.resolution.outcome,'pending');assert.equal(scheduled.resolution.deadline,now+1440*60000);assert.equal(scheduled.resolution.elapsed,undefined);
});
test('reopening retains the original elapsed clock and clears only the current completion timestamp',()=>{
  const s=fixture();s.items.department_dispatcher_supervisor=[task({status:'Completed',serviceTiming:{createdAt:iso(0),acknowledgedAt:iso(1),completedAt:iso(10),ackEnabled:true,ackTargetMinutes:3,resolutionTargetMinutes:25,policySource:'Frozen'}})];
  const next=structuredClone(s);next.items.department_dispatcher_supervisor[0].status='In progress';const reopened=stampTaskTimings(s,next,iso(30));
  const result=taskSla(reopened,reopened.items.department_dispatcher_supervisor[0],now+31*60000);
  assert.equal(result.resolved,undefined);assert.equal(result.created,now);assert.equal(result.resolution.outcome,'breached');
});
test('compliance excludes unknown, cancelled and pending outcomes and quantiles use real valid durations',()=>{
  const rows=['met','met','breached','pending','unknown','excluded','disabled'].map(outcome=>({outcome}));
  assert.equal(slaSummary(rows).measured,3);assert.equal(Math.round(slaSummary(rows).compliance),67);
  assert.equal(slaSummary([{outcome:'unknown'}]).compliance,undefined);
  assert.equal(percentile([10,20,30,40,NaN,-5],0.5),20);assert.equal(percentile([],0.9),undefined);
});
test('inspection and complaint targets are measurable; medical follow-ups use their actual due time',()=>{
  const s=fixture('wellness');s.guestComplaints=[{complaintId:'C1',department:'Wellness',guestName:'Demo',room:'Spa 1',title:'Concern',description:'Demo',submittedAt:iso(-60),status:'Resolved',history:[{at:iso(-20),status:'Resolved'}]}];
  s.inspections=[{id:'I1',department:'Wellness',roomNumber:'Spa 1',type:'periodic',createdAt:iso(-60),completedAt:iso(-20),status:'passed',items:[]}];
  s.managerOperations.medicalCases=[{id:'M1',reference:'MED-1',location:'Spa 1',createdAt:iso(-60),status:'monitoring',followUpAt:iso(-10),followUpAcknowledgedAt:iso(-5),history:[]}];
  const rows=operationalSlas(s,'wellness',now,now-86400000);
  assert.equal(rows.find(r=>r.kind==='Complaint resolution').outcome,'met');assert.equal(rows.find(r=>r.kind==='Inspection turnaround').outcome,'breached');assert.equal(rows.find(r=>r.kind==='Medical follow-up').outcome,'breached');
});
test('preventive service compliance uses the original due date, and still exposes outstanding overdue assets',()=>{
  const s=fixture('engineering');s.departmentRecordHistory=[{action:'completed',record:{kind:'asset',reference:'serviced-demo',title:'Demo asset',completedAt:iso(-60)},changes:[{field:'Next due',before:'2026-11-06',after:'2026-12-06'}]}];
  s.managerOperations.assets=[{id:'overdue-demo',name:'Overdue demo asset',nextDue:'2026-11-05',lastServiced:iso(-6000),intervalDays:30}];
  const rows=operationalSlas(s,'engineering',now,now-86400000);
  assert.equal(rows.find(row=>row.reference==='serviced-demo').outcome,'met');
  assert.equal(rows.find(row=>row.reference==='serviced-demo').deadline,Date.parse('2026-11-06T23:59:59+05:30'));
  assert.equal(rows.find(row=>row.reference==='overdue-demo').outcome,'breached');
});
test('department target changes are scoped, validated and logged as retained policy versions',()=>{
  const s=initialiseDepartmentHistory(fixture());const next=captureDepartmentHistory(s,applyManagerCommand(s,{type:'service-targets',complaintMinutes:90,inspectionMinutes:45},'targets',iso(0)),iso(0));
  assert.deepEqual(next.departmentServiceTargets.housekeeping,{complaintMinutes:90,inspectionMinutes:45});assert.equal(next.departmentServiceTargets.wellness,undefined);
  assert.ok(next.departmentRecordHistory.some(event=>event.record.reference==='service-targets-housekeeping'));
  assert.throws(()=>applyManagerCommand(s,{type:'service-targets',complaintMinutes:-1,inspectionMinutes:30},'bad'),/whole minutes/);
});
test('week grids start Monday and overnight shifts end on the following hotel date',()=>{
  assert.deepEqual(operationalWeek('2026-11-08'),['2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-08']);
  const interval=shiftInterval({date:'2026-11-06',startTime:'23:00',endTime:'07:00',status:'scheduled'});
  assert.equal(interval.hours,8);assert.equal(interval.end,Date.parse('2026-11-07T07:00:00+05:30'));
  assert.equal(shiftInterval({date:'2026-11-06',startTime:'',endTime:'',status:'off'}),undefined);
});
test('scheduling enforces exact 11-hour rest across overnight and week boundaries without partial writes',()=>{
  let s=fixture();s=publish(s,{date:'2026-11-08',pattern:'Night',start:'23:00',end:'07:00'},'night');
  const before=structuredClone(s);
  assert.throws(()=>publish(s,{date:'2026-11-09',pattern:'Evening',start:'17:59',end:'23:59'},'short-rest'),/11 required/);
  assert.deepEqual(s,before);
  const valid=publish(s,{date:'2026-11-09',pattern:'Evening',start:'18:00',end:'23:59'},'rest-ok');
  assert.equal(valid.shiftSchedules.length,2);
});
test('overlaps, long shifts, past dates, invalid dates and cross-department writes are rejected',()=>{
  let s=fixture();s=publish(s);
  assert.throws(()=>publish(s,{date:'2026-11-08',start:'08:00',end:'23:00'}),/12 hours/);
  assert.throws(()=>publish(s,{date:'2026-11-05'}),/Past shifts/);
  assert.throws(()=>publish(s,{date:'2026-02-30'}),/Past shifts/);
  assert.throws(()=>publish(s,{staffId:'eng'}),/your department/);
  assert.throws(()=>publish(s,{reason:''}),/audit reason/);
  s.shiftSchedules.push({...s.shiftSchedules[0],id:'overlap',date:'2026-11-08',startTime:'01:00',endTime:'09:00'});
  assert.ok(schedulingConflicts(s.shiftSchedules).length>0);
});
test('Off is explicit, schedule edits retain reasons and versions, and future planning does not change attendance',()=>{
  let s=initialiseDepartmentHistory(fixture());const before=s;
  let next=publish(s);s=captureDepartmentHistory(s,next,iso(0));next=publish(s,{pattern:'Off',start:'',end:'',reason:'Rest day planned'});s=captureDepartmentHistory(s,next,iso(1));
  assert.equal(s.shiftSchedules.length,1);assert.equal(s.shiftSchedules[0].status,'off');assert.equal(s.staffAccounts[0].availability,'on_duty');
  const events=s.departmentRecordHistory.filter(event=>event.record.kind==='schedule');assert.equal(events.length,2);assert.match(events[1].record.notes,/Rest day planned/);assert.equal(events[1].record.fields.Shift,'Off');assert.equal(before.shiftSchedules.length,0);
});
test('workload matches account and employee IDs, deduplicates mirrors and requires published shift plus capacity',()=>{
  const s=fixture();s.items.department_dispatcher_supervisor=[task({assigneeId:'staff'}),task({id:'two',ref:'HK-TWO',assigneeId:'EMP-1'})];s.items.task_fulfiller=[...s.items.department_dispatcher_supervisor];
  s.shiftSchedules=[{id:'current',employeeId:'EMP-1',employeeName:'Demo attendant',department:'Housekeeping',roleId:'task_fulfiller',date:'2026-11-06',shiftType:'Day',startTime:'08:00',endTime:'20:00',status:'scheduled',floorZone:'4'}];
  let row=rosterWorkload(s,'housekeeping',now).find(row=>row.staff.id==='staff');assert.equal(row.active.length,2);assert.equal(row.available,false);
  s.items.department_dispatcher_supervisor[1].status='Completed';row=rosterWorkload(s,'housekeeping',now).find(row=>row.staff.id==='staff');assert.equal(row.active.length,1);assert.equal(row.available,true);
  s.staffAccounts[0].availability='break';assert.equal(rosterWorkload(s,'housekeeping',now).find(row=>row.staff.id==='staff').available,false);
});
