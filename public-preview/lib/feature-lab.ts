import {isRole, roleInfo, visibleTasks, type HotelState, type Role} from './hotel-domain.ts';

// Persisted, synthetic provider fixtures. No action in this module calls a live PMS,
// key system, payment provider, emergency service, or identity provider.
export type Scope={property:string;department:string;outlet:string;floor:string;shift:string};
export type Actor={role:Role;person:string;username:string;baseRole?:Role};
type Grant={id:string;target:Role;targetUsername?:string;profile:Role;scope:Scope;expires:string;reason:string;requester:string;approver:string;status:string;support:boolean};
type Attachment={id:string;task:string;incident:string;name:string;content:string;digest:string;actor:string;at:string};
type Operation={property?:string;id:string;provider:string;key:string;payload:string;status:string;attempts:number;reference:string;mode:string;effects:number;revision:number;room:string;operation:string};
type Change={id:string;kind:string;value:string;reason:string;requester:string;approver:string;status:string};
export type FeatureLab={
 clock:number; grants:Grant[]; selected:Record<string,string>;
 coverage:{staff:string;available:boolean;shift:string;backup:string}[];
 restrictions:{room:string;entry:string;unsafe:boolean;note:string}[];
 escalations:{id:string;task:string;level:number;contact:string;reason:string;at:string;status:string}[];
 attachments:Attachment[]; operations:Operation[]; providers:Record<string,string>;
 reservations:{id:string;room:string;guest:string;verified:boolean;status:string;key:string}[];
 transactions:{id:string;room:string;amount:number;currency:string;kind:string;reference:string;evidence:string;reason:string;requester:string;approver:string;executor:string;reviewer:string;status:string;key:string}[];
 notifications:{id:string;incident:string;contact:string;status:string;at:string}[];
 changes:Change[]; settings:{sessionMinutes:number;exportEnabled:boolean;mfaRequired:boolean};
 mfa:Record<string,{verifiedUntil:string;challenge:string}>;
 snapshots:{id:string;at:string;rooms:HotelState['rooms'];tasks:HotelState['tasks']}[];
 recoveries:{snapshot:string;at:string;rooms:number;tasks:number;valid:boolean}[];
 revenueSummaries?:{property?:string;id:string;currency:string;amount:number;receipts:number;approver:string;at:string}[];
 history:{at:string;actor:string;action:string;result:string}[];
};
type Extended=HotelState&{featureLab?:FeatureLab};
const baseScope=(role:Role):Scope=>({property:'Main',department:roleInfo(role).department,outlet:'All',floor:'All',shift:'All'});
const staffRoles=['frontdesk','dispatcher','supervisor','manager','executive','admin','finance','security','fulfiller'];
export function lab(s:HotelState):FeatureLab{
 const state=s as Extended;
 return state.featureLab??=( {clock:0,grants:[],selected:{},coverage:s.staff.map(x=>({staff:x.name,available:x.active,shift:'Day',backup:x.name==='Oliver Reed'?'Isabella Scott':x.name==='Alex Morgan'?'Lucas Martin':x.department==='Housekeeping'?'Oliver Reed':'Alex Morgan'})),restrictions:s.rooms.map(r=>({room:r.id,entry:'Allowed',unsafe:false,note:''})),escalations:[],attachments:[],operations:[],providers:{PMS:'Online',POS:'Online',Payment:'Online',Messaging:'Online',Emergency:'Online'},reservations:[],transactions:[],notifications:[],changes:[],settings:{sessionMinutes:480,exportEnabled:true,mfaRequired:false},mfa:{},snapshots:[],recoveries:[],history:[]} );
}
const value=(v:unknown,label:string,max=500)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error(label+' is required (maximum '+max+' characters).');return v.trim();};
const need=(actor:Actor,roles:string[])=>{if(!roles.includes(actor.role))throw Error('This profile is not authorized for this feature.');};
const done=(s:string)=>['Completed','Inspected'].includes(s);
const uid=(prefix:string)=>prefix+crypto.randomUUID().slice(0,8).toUpperCase();
export function effectiveProfile(s:HotelState,actor:Actor,now=Date.now()){
 const l=lab(s),id=l.selected[actor.username],g=l.grants.find(x=>x.id===id&&x.target===(actor.baseRole||actor.role)&&(!x.targetUsername||x.targetUsername===actor.username)&&x.status==='Applied'&&Date.parse(x.expires)>now&&!x.support);
 return {role:g?.profile||(actor.baseRole||actor.role),scope:g?.scope||baseScope(actor.baseRole||actor.role),grant:g?.id||'base'};
}
export function inScope(s:HotelState,actor:Actor,room:string,department?:string){
 const scope=effectiveProfile(s,actor).scope,r=s.rooms.find(x=>x.id===room);
 return (r?.property||'Main')===scope.property&&(!department||scope.department==='All departments'||scope.department===department||['Front Office','Finance','IT','Security'].includes(scope.department))&&(scope.floor==='All'||String(r?.floor)===scope.floor)&&(scope.outlet==='All'||scope.outlet===(r?.outlet||'Rooms'))&&(scope.shift==='All'||scope.shift===(r?.shift||'Day'));
}
export function assertFeatureScope(s:HotelState,actor:Actor,b:Record<string,any>){
 const t=s.tasks.find(x=>x.id===b.id),financial=s.financials.find(x=>x.id===b.id),incident=s.incidents.find(x=>x.id===b.id),room=t?.room||financial?.room||incident?.room||s.rooms.find(x=>x.id===b.id)?.id||b.room;
 if(room&&!inScope(s,actor,String(room),t?.department))throw Error('Record unavailable in the selected property, outlet, floor or shift scope.');
 if(b.target&&s.rooms.some(x=>x.id===b.target)&&!inScope(s,actor,b.target))throw Error('Destination unavailable in this scope.');
}
export function guardOperationalAction(s:HotelState,actor:Actor,action:string,b:Record<string,any>){
 assertFeatureScope(s,actor,b);if(action==='staff'&&b.id===actor.username.replace(/\.demo$/,''))throw Error('Cannot change your own current account access.');const l=lab(s),t=s.tasks.find(x=>x.id===b.id),r=l.restrictions.find(x=>x.room===(t?.room||b.room||b.id));
 if(action==='assign'){const person=l.coverage.find(x=>x.staff===b.assignee),shift=s.rooms.find(x=>x.id===t?.room)?.shift||'Day';if(person&&(!person.available||person.shift!==shift))throw Error('Staff member is unavailable for the active '+shift+' shift.');}
 if(action==='transition'&&['In progress','On the way','Completed'].includes(b.status)&&r&&(r.unsafe||r.entry==='Do not enter'))throw Error('Room entry is restricted. Arrange authorized clearance or a contact-free service.');
 if(['registerRoom','room'].includes(action)&&r?.unsafe)throw Error('Unsafe room cannot be occupied or released. Security clearance is required.');
 if(action==='export'&&!l.settings.exportEnabled)throw Error('Sensitive exports are disabled by the approved policy.');
}
export function routeIncident(s:HotelState,incidentId:string,now=Date.now()){
 const l=lab(s),incident=s.incidents.find(i=>i.id===incidentId);if(!incident||l.notifications.some(n=>n.incident===incidentId))return;
 const delivered=l.providers.Emergency==='Online',o:Operation={id:uid('OP-'),provider:'Emergency',key:'alert-'+incidentId,payload:incidentId,status:delivered?'Confirmed':'Failed',attempts:1,reference:delivered?'SANDBOX-ALERT-'+incidentId:'',mode:'Success',effects:delivered?1:0,revision:1,room:incident.room,operation:'Immediate emergency routing'};
 l.operations.unshift(o);for(const contact of ['Lucas Martin','Alex Morgan'])l.notifications.unshift({id:uid('AL-'),incident:incidentId,contact,status:delivered?'Delivered to sandbox inbox':'Delivery failed — use the property emergency plan',at:new Date(now).toISOString()});
}
export function scopedHotel(s:HotelState,actor:Actor):HotelState{
 const scope=effectiveProfile(s,actor).scope;
 const tasks=s.tasks.filter(t=>inScope(s,actor,t.room,t.department)),rooms=s.rooms.filter(r=>inScope(s,actor,r.id));
 return {...s,tasks,rooms,financials:s.financials.filter(f=>inScope(s,actor,f.room)),messages:s.messages.filter(m=>inScope(s,actor,m.room)),incidents:s.incidents.filter(i=>inScope(s,actor,i.room)),handovers:s.handovers.filter(h=>scope.department==='All departments'||h.department===scope.department)};
}
export function featureView(s:HotelState,a:Actor,now=Date.now()){
 const l=lab(s),allowedTasks=visibleTasks(scopedHotel(s,a),a.role,a.person),ids=new Set(allowedTasks.map(t=>t.id)),isAdmin=a.role==='admin',isExec=a.role==='executive',money=['finance','executive'].includes(a.role),security=a.role==='security';
 return {...l,selected:undefined,mfa:undefined,snapshots:isAdmin?l.snapshots.map(({id,at,rooms,tasks})=>({id,at,rooms:rooms.length,tasks:tasks.length})):[],
  grants:l.grants.filter(g=>isAdmin||isExec||g.target===(a.baseRole||a.role)&&(!g.targetUsername||g.targetUsername===a.username)||g.requester===a.person),changes:l.changes.filter(c=>isAdmin||isExec||c.requester===a.person),
  coverage:l.coverage.filter(c=>s.staff.some(x=>x.name===c.staff&&(isAdmin||isExec||a.role==='frontdesk'||x.department===roleInfo(a.role).department))),
  restrictions:l.restrictions.filter(r=>inScope(s,a,r.room)),escalations:l.escalations.filter(e=>ids.has(e.task)),
  attachments:l.attachments.filter(e=>e.incident?security:ids.has(e.task)).map(({content,...rest})=>rest),
  operations:l.operations.filter(o=>(o.room?inScope(s,a,o.room):(o.property||'Main')===effectiveProfile(s,a).scope.property)&&(isAdmin||o.provider==='Payment'&&money||o.provider==='PMS'&&a.role==='frontdesk'||o.provider==='Emergency'&&security||o.provider==='Messaging'&&['frontdesk','dispatcher'].includes(a.role)||o.provider==='POS'&&a.role==='finance')),
  reservations:a.role==='frontdesk'?l.reservations.filter(r=>inScope(s,a,r.room)):[],transactions:money?l.transactions.filter(t=>inScope(s,a,t.room)):[],notifications:security||isExec?l.notifications:[],history:isAdmin?l.history:[],recoveries:isAdmin?l.recoveries:[],
  revenueSummaries:money?(l.revenueSummaries||[]).filter(r=>(r.property||'Main')===effectiveProfile(s,a).scope.property):[],
  settings:isAdmin||isExec?l.settings:undefined,scope:effectiveProfile(s,a,now),actor:a,now:new Date(now+l.clock*60000).toISOString(),
  tasks:allowedTasks.map(t=>({id:t.id,title:t.title,room:t.room,status:t.status})),rooms:s.rooms.filter(r=>inScope(s,a,r.id)).map(r=>({id:r.id,status:r.status})),
  profiles:staffRoles,can:{access:['manager','executive','admin'].includes(a.role),coverage:['dispatcher','supervisor','manager'].includes(a.role),safety:['security','frontdesk','supervisor'].includes(a.role),escalation:['dispatcher','supervisor','manager','executive'].includes(a.role),pms:a.role==='frontdesk',finance:money,evidence:['fulfiller','supervisor','manager','security'].includes(a.role),integration:['admin','finance','frontdesk','dispatcher','security'].includes(a.role),recovery:isAdmin,configuration:['admin','executive','manager'].includes(a.role)}};
}
export function applyFeature(s:HotelState,a:Actor,action:string,b:Record<string,any>,now=Date.now()){
 const l=lab(s),at=new Date(now).toISOString(),clock=now+l.clock*60000;let result='Saved';
 const task=()=>{const t=visibleTasks(scopedHotel(s,a),a.role).find(t=>t.id===b.task);if(!t)throw Error('Task unavailable in scope.');return t;};
 const room=()=>{const r=s.rooms.find(r=>r.id===b.room&&inScope(s,a,r.id));if(!r)throw Error('Room unavailable in scope.');return r;};
 const op=()=>{const o=l.operations.find(x=>x.id===b.id);if(!o)throw Error('Operation unavailable.');need(a,o.provider==='PMS'?['frontdesk']:o.provider==='Payment'||o.provider==='POS'?['finance']:o.provider==='Emergency'?['security','admin']:['frontdesk','dispatcher','admin']);if(o.room?!inScope(s,a,o.room):(o.property||'Main')!==effectiveProfile(s,a).scope.property)throw Error('Operation unavailable in scope.');return o;};
 const process=(o:Operation,verify=false)=>{
  if(o.status==='Confirmed')return;
  if(o.status==='Uncertain'&&!verify)throw Error('Outcome is uncertain. Verify the provider before any retry.');
  if(l.providers[o.provider]==='Offline'){o.status='Failed';o.attempts++;return;}
  o.attempts++;
  if(o.mode==='Timeout after success'&&!verify){if(!o.effects)o.effects=1;o.reference='SANDBOX-'+o.id;o.status='Uncertain';return;}
  if(o.mode==='Declined'){o.status='Rejected';return;}
  if(!o.effects)o.effects=1;o.reference='SANDBOX-'+o.id;o.status='Confirmed';
 };
 const completePms=(o:Operation)=>{
  if(o.provider!=='PMS'||o.status!=='Confirmed')return;
  const reservation=l.reservations.find(x=>x.id===o.payload),r=s.rooms.find(x=>x.id===o.room);if(!reservation||!r)return;
  // A late or duplicate check-in/key result cannot reopen a departed stay.
  if(reservation.status==='Departed')return;
  if(o.operation==='Check-in'&&reservation.status==='Reserved'){reservation.status='Checked in';r.status='Occupied';r.guest=reservation.guest;}
  if(o.operation==='Issue key'&&reservation.status==='Checked in')reservation.key='SANDBOX-KEY-'+r.id;
  if(o.operation==='Checkout'){reservation.status='Departed';r.status='Cleaning';r.guest='';r.email='';r.verified=false;reservation.key='Revoked';}
 };
 if(action==='requestGrant'){
  need(a,['manager','executive','admin']);const targetRole=isRole(b.target)?b.target:b.target==='finance-review.demo'?'finance':typeof b.target==='string'&&isRole(b.target.replace(/\.demo$/,''))?b.target.replace(/\.demo$/,'') as Role:null;if(!targetRole||!isRole(b.profile))throw Error('Choose valid account and profile.');const targetUsername=isRole(b.target)?b.target+'.demo':b.target;
  const minutes=Number(b.minutes);if(!Number.isInteger(minutes)||minutes<5||minutes>480)throw Error('Grant duration must be 5–480 minutes.');
  const scope:Scope={property:value(b.property,'Property'),department:roleInfo(b.profile).department,outlet:value(b.outlet,'Outlet'),floor:value(b.floor,'Floor'),shift:value(b.shift,'Shift')};
  if(!['Main','Annex'].includes(scope.property)||!['All','Rooms','Restaurant'].includes(scope.outlet)||!['All','1','2'].includes(scope.floor)||!['All','Day','Night'].includes(scope.shift))throw Error('Invalid scope.');
  l.grants.unshift({id:uid('GR-'),target:targetRole,targetUsername,profile:b.profile,scope,expires:new Date(now+minutes*60000).toISOString(),reason:value(b.reason,'Business reason'),requester:a.person,approver:'',status:'Requested',support:b.support===true});
 }
 else if(action==='approveGrant'||action==='applyGrant'||action==='revokeGrant'){
  need(a,action==='approveGrant'?['executive']:['admin']);const g=l.grants.find(x=>x.id===b.id);if(!g)throw Error('Grant unavailable.');
  if(action==='approveGrant'){if(g.requester===a.person||(g.targetUsername==='finance-review.demo'?'Avery Shah':roleInfo(g.target).person)===a.person||g.status!=='Requested')throw Error('Independent access approval is required.');g.approver=a.person;g.status=b.reject?'Rejected':'Approved';}
  else if(action==='applyGrant'){if(g.status!=='Approved'||!g.approver||Date.parse(g.expires)<=now)throw Error('Unexpired independent approval required.');g.status='Applied';}
  else g.status='Revoked';
 }
 else if(action==='switchProfile'){
  if(b.id==='base')delete l.selected[a.username];else{const g=l.grants.find(x=>x.id===b.id&&x.target===(a.baseRole||a.role)&&(!x.targetUsername||x.targetUsername===a.username)&&x.status==='Applied'&&Date.parse(x.expires)>now&&!x.support);if(!g)throw Error('No current approved profile grant.');l.selected[a.username]=g.id;}result='Profile selected. Return to the hotel workspace to use it.';
 }
 else if(action==='scopeProbe'){
  const property=value(b.property,'Property'),floor=value(b.floor,'Floor'),outlet=value(b.outlet,'Outlet'),shift=value(b.shift,'Shift'),scope=effectiveProfile(s,a).scope;
  result=property===scope.property&&(scope.floor==='All'||scope.floor===floor)&&(scope.outlet==='All'||scope.outlet===outlet)&&(scope.shift==='All'||scope.shift===shift)?'Allowed: selected grant covers this scope.':'Denied: no single selected grant covers this property / outlet / floor / shift.';
 }
 else if(action==='coverage'){
  need(a,['dispatcher','supervisor','manager']);const c=l.coverage.find(x=>x.staff===b.staff),person=s.staff.find(x=>x.name===b.staff&&x.department===roleInfo(a.role).department);if(!c||!person)throw Error('Staff unavailable in department.');
  if(!['Day','Night'].includes(b.shift)||!s.staff.some(x=>x.name===b.backup&&x.active&&x.name!==b.staff))throw Error('Choose shift and distinct active backup.');c.available=b.available===true;c.shift=b.shift;c.backup=b.backup;
 }
 else if(action==='safety'){
  const r=room(),restriction=l.restrictions.find(x=>x.room===r.id)!;const note=value(b.note,'Restriction / clearance reason');
  if(b.operation==='entry'){need(a,['frontdesk','supervisor','security']);if(!['Allowed','Do not enter','Contact-free'].includes(b.entry))throw Error('Choose entry policy.');restriction.entry=b.entry;}
  else if(b.operation==='unsafe'){need(a,['security']);restriction.unsafe=true;}
  else if(b.operation==='clear'){need(a,['security']);if(b.verified!==true)throw Error('Safety verification is required.');restriction.unsafe=false;}
  else if(b.operation==='ready'){need(a,['supervisor']);if(restriction.unsafe||restriction.entry==='Do not enter'||r.status==='Occupied')throw Error('Room cannot be released while occupied, unsafe or restricted.');r.status='Available';}
  else throw Error('Unknown safety action.');restriction.note=note;
 }
 else if(action==='escalate'){
  need(a,['dispatcher','supervisor','manager','executive']);const minutes=Number(b.minutes||0);if(![0,5,30,60,120].includes(minutes))throw Error('Choose an available controlled-clock advance.');l.clock+=minutes;
  for(const t of visibleTasks(scopedHotel(s,a),a.role).filter(t=>!done(t.status)&&!t.duplicateOf)){
   const elapsed=now+l.clock*60000-Date.parse(t.due),ack=t.status==='Open'&&Date.parse(t.acknowledgementDue||t.due)<now+l.clock*60000;
   const level=elapsed>3600000?3:elapsed>1800000?2:elapsed>0||ack?1:0;
   if(!level)continue;const policy=s.policies.find(x=>x.category===t.department),primary=policy?.primary||'Alex Morgan',coverage=l.coverage.find(x=>x.staff===primary),contact=level===3?'Alex Morgan':level===2?'Isabella Scott':coverage?.available?primary:policy?.backup||'Alex Morgan';
   if(l.escalations.some(x=>x.task===t.id&&x.level===level))continue;
   const escalation={id:uid('ESC-'),task:t.id,level,contact,reason:ack?'Acknowledgement or completion target exceeded':'Completion target exceeded',at:new Date(now+l.clock*60000).toISOString(),status:l.providers.Messaging==='Offline'?'Delivery failed':'Delivered to sandbox inbox'};
   l.escalations.unshift(escalation);
   if(escalation.status==='Delivery failed')l.operations.unshift({id:uid('OP-'),provider:'Messaging',key:escalation.id,payload:escalation.id,status:'Failed',attempts:1,reference:'',mode:'Success',effects:0,revision:1,room:t.room,operation:'Escalation delivery'});
  }result='Due work scanned; duplicate escalation levels were not redelivered.';
 }
 else if(action==='template'){
  need(a,['frontdesk','dispatcher']);const r=room();if(a.role==='dispatcher'&&!visibleTasks(s,a.role).some(t=>t.room===r.id))throw Error('No department case in this room.');
  const templates:Record<string,string>={Acknowledged:'We have received your request. Your team will update you shortly.',Delayed:'Your service is taking longer than expected. We will update you at '+value(b.eta,'Next update time',80)+'.',Completed:'Your requested service is complete. Please let us know if you need anything else.'};
  const message=templates[b.template];if(!message)throw Error('Choose an approved template.');s.messages.push({id:uid('MSG-'),room:r.id,text:message,at,actor:a.person});
 }
 else if(action==='attachment'){
  need(a,['fulfiller','supervisor','manager','security']);const incident=b.incident?s.incidents.find(x=>x.id===b.incident):undefined;
  if(b.incident){need(a,['security']);if(!incident)throw Error('Incident unavailable.');}else task();
  const name=value(b.name,'Filename',100),content=value(b.content,'Text file',3000);if(!/^[a-zA-Z0-9_. -]+\.txt$/i.test(name)||/[\x00-\x08\x0b\x0c\x0e-\x1f]|<\/?(?:script|html|iframe)/i.test(content))throw Error('Only plain .txt evidence up to 3,000 characters is accepted.');
  if(!/^[0-9a-f]{64}$/.test(b.digest||''))throw Error('Server content digest required.');
  l.attachments.unshift({id:uid('ATT-'),task:b.incident?'':b.task,incident:b.incident||'',name,content,digest:b.digest,actor:a.person,at});
 }
 else if(action==='provider'){
  need(a,['admin']);if(!Object.hasOwn(l.providers,b.provider)||!['Online','Offline'].includes(b.status))throw Error('Choose sandbox provider state.');l.providers[b.provider]=b.status;
 }
 else if(action==='pms'){
  need(a,['frontdesk']);const r=room(),restriction=l.restrictions.find(x=>x.room===r.id),operation=value(b.operation,'PMS operation');
  if(!['Reservation','Check-in','Issue key','Checkout'].includes(operation))throw Error('Choose an entitled PMS workflow.');
  if(operation==='Reservation'){if(r.status!=='Available')throw Error('Choose an available room.');l.reservations.unshift({id:uid('RES-'),room:r.id,guest:value(b.guest,'Guest name',100),verified:b.verified===true,status:'Reserved',key:''});}
  else{const reservation=l.reservations.find(x=>x.room===r.id&&x.status!=='Departed');if(!reservation)throw Error('Create a reservation first.');if(b.verified!==true)throw Error('Identity verification is required.');
   if(restriction?.unsafe||restriction?.entry==='Do not enter')throw Error('Safety restriction prevents this PMS operation.');if(operation==='Check-in'&&r.status!=='Available')throw Error('Room is not ready.');
   if(['Issue key','Checkout'].includes(operation)&&reservation.status!=='Checked in')throw Error('Check in before issuing a key or recording departure.');
   const key='pms-'+reservation.id+'-'+operation;let o=l.operations.find(x=>x.key===key);if(!o){o={id:uid('OP-'),provider:'PMS',key,payload:reservation.id,status:'Queued',attempts:0,reference:'',mode:'Success',effects:0,revision:1,room:r.id,operation};l.operations.unshift(o);}process(o);
   completePms(o);
  }
 }
 else if(action==='financialRequest'){
  need(a,['finance']);const r=room(),amount=Number(b.amount);if(!Number.isFinite(amount)||amount<=0||amount>10000||!/^\d+(?:\.\d{1,2})?$/.test(String(amount)))throw Error('Enter an exact amount from 0.01 to the illustrative 10,000 limit.');
  if(!['USD','INR'].includes(b.currency)||!['Refund','Folio adjustment','Receivable'].includes(b.kind))throw Error('Unsupported currency or transaction type.');
  l.transactions.unshift({id:uid('TX-'),room:r.id,amount,currency:b.currency,kind:b.kind,reference:value(b.reference,'Original provider reference',100),evidence:value(b.evidence,'Evidence reference'),reason:value(b.reason,'Reason'),requester:a.person,approver:'',executor:'',reviewer:'',status:'Requested',key:uid('PAY-')});
 }
 else if(['financialApprove','financialExecute','financialReview'].includes(action)){
  need(a,action==='financialApprove'?['executive']:['finance']);const f=l.transactions.find(x=>x.id===b.id&&inScope(s,a,x.room));if(!f)throw Error('Financial exception unavailable.');
  if(action==='financialApprove'){if(f.requester===a.person||f.status!=='Requested')throw Error('Independent approval required.');f.approver=a.person;f.status=b.reject?'Rejected':'Approved';}
  if(action==='financialExecute'){
   if(f.status!=='Approved'&&f.status!=='Uncertain'&&f.status!=='Failed')throw Error('Approved transaction required.');if(f.approver===a.person)throw Error('Approver cannot execute.');
   let o=l.operations.find(x=>x.key===f.key);if(!o){o={id:uid('OP-'),provider:'Payment',key:f.key,payload:JSON.stringify([f.amount,f.currency,f.kind,f.reference]),status:'Queued',attempts:0,reference:'',mode:['Success','Timeout after success','Declined'].includes(b.mode)?b.mode:'Success',effects:0,revision:1,room:f.room,operation:f.kind};l.operations.unshift(o);}process(o);f.executor=a.person;f.status=o.status;
  }
  if(action==='financialReview'){const o=l.operations.find(x=>x.key===f.key);if(!o||o.status!=='Confirmed'||f.executor===a.person)throw Error('Confirmed provider outcome and independent reviewer required.');f.reviewer=a.person;f.status='Reconciled';}
 }
 else if(action==='providerOperation'){
  need(a,['finance','frontdesk','dispatcher','security']);const provider=value(b.provider,'Provider');if(!['POS','Messaging'].includes(provider))throw Error('Choose POS or Messaging.');need(a,provider==='POS'?['finance']:['frontdesk','dispatcher']);
  const scope=effectiveProfile(s,a).scope;if(scope.floor!=='All'||scope.shift!=='All'||!['All','Restaurant'].includes(scope.outlet))throw Error('Property-wide POS/messaging adapter entitlement is required.');const key=value(b.key,'Duplicate-prevention key',80);let payload=value(b.payload,'Operation payload',300);
  if(provider==='POS'&&b.amount){const amount=Number(b.amount);if(!Number.isFinite(amount)||amount<=0||amount>10000||!/^\d+(?:\.\d{1,2})?$/.test(String(amount))||!['USD','INR'].includes(b.currency))throw Error('Choose a supported receipt amount and currency.');payload=JSON.stringify({receipt:payload,amount:Math.round(amount*100)/100,currency:b.currency});}
  let o=l.operations.find(x=>x.key===key&&x.provider===provider&&(x.property||'Main')===scope.property);if(o&&o.payload!==payload)throw Error('Idempotency key is already bound to a different request.');if(!o){o={id:uid('OP-'),property:scope.property,provider,key,payload,status:'Queued',attempts:0,reference:'',mode:'Success',effects:0,revision:1,room:'',operation:'Sandbox sync'};l.operations.unshift(o);}process(o);
 }
 else if(action==='publishRevenue'){
  need(a,['executive']);const scope=effectiveProfile(s,a).scope;if(scope.floor!=='All'||scope.shift!=='All'||!['All','Restaurant'].includes(scope.outlet))throw Error('Property-wide revenue-summary entitlement is required.');if(!['USD','INR'].includes(b.currency))throw Error('Choose an approved currency.');let cents=0,receipts=0;
  for(const o of l.operations.filter(o=>o.provider==='POS'&&o.status==='Confirmed'&&o.effects===1&&(o.property||'Main')===scope.property))try{const receipt=JSON.parse(o.payload);if(receipt.currency===b.currency&&Number.isFinite(receipt.amount)){cents+=Math.round(receipt.amount*100);receipts++;}}catch{/* Nonmonetary POS syncs are not revenue. */}
  if(!receipts)throw Error('No confirmed monetary sandbox POS receipts in this currency.');
  (l.revenueSummaries??=[]).unshift({id:uid('REV-'),property:scope.property,currency:b.currency,amount:cents/100,receipts,approver:a.person,at});result='Approved sandbox POS revenue snapshot published. This is not live hotel revenue.';
 }
 else if(action==='retryOperation'||action==='verifyOperation'||action==='callback'){
  const o=op();if(action==='callback'){const revision=Number(b.revision);if(!Number.isInteger(revision)||revision<1)throw Error('Positive source revision required.');if(revision<=o.revision)result='Duplicate or stale callback ignored; no state or entitlement restored.';else{o.revision=revision;process(o,true);}}
  else process(o,action==='verifyOperation');
  completePms(o);
  const transaction=l.transactions.find(f=>f.key===o.key);if(transaction&&transaction.status!=='Reconciled')transaction.status=o.status;
  const escalation=l.escalations.find(x=>x.id===o.payload);if(escalation&&o.status==='Confirmed')escalation.status='Delivered to sandbox inbox';
  for(const n of l.notifications.filter(n=>n.incident===o.payload))if(o.status==='Confirmed')n.status='Delivered to sandbox inbox';
 }
 else if(action==='emergency'){
  need(a,['security']);const r=room(),title=value(b.title,'Incident title',160),incident={id:uid('INC-'),title,room:r.id,severity:'High',status:'Open',notes:value(b.note,'Response plan / actions'),responder:a.person,evidence:[] as string[]};s.incidents.unshift(incident);
  const o:Operation={id:uid('OP-'),provider:'Emergency',key:'alert-'+incident.id,payload:incident.id,status:'Queued',attempts:0,reference:'',mode:'Success',effects:0,revision:1,room:r.id,operation:'Immediate emergency routing'};l.operations.unshift(o);process(o);
  for(const contact of ['Lucas Martin','Alex Morgan'])l.notifications.unshift({id:uid('AL-'),incident:incident.id,contact,status:o.status==='Confirmed'?'Delivered to sandbox inbox':'Delivery failed — use the property emergency plan',at});
  result='Incident routed immediately to Security and management sandbox inboxes. No real responders are dispatched.';
 }
 else if(action==='requestSla'){
  need(a,['manager','admin']);const category=value(b.category,'Department'),ack=Number(b.acknowledgement),completion=Number(b.completion);
  if(!s.policies.some(p=>p.category===category)||a.role==='manager'&&category!==roleInfo(a.role).department)throw Error('Category unavailable in scope.');
  if(!Number.isInteger(ack)||!Number.isInteger(completion)||ack<1||completion<ack||completion>1440)throw Error('Enter valid SLA minutes.');
  if(!s.staff.some(x=>x.name===b.primary&&x.active&&(x.department===category||x.department==='All departments'))||!s.staff.some(x=>x.name===b.backup&&x.active&&(x.department===category||x.department==='All departments'))||b.primary===b.backup)throw Error('Choose distinct active primary and backup.');
  l.changes.unshift({id:uid('CFG-'),kind:'SLA '+category,value:JSON.stringify({acknowledgement:ack,completion,primary:b.primary,backup:b.backup}),reason:value(b.reason,'Reason'),requester:a.person,approver:'',status:'Requested'});
 }
 else if(action==='requestChange'){
  need(a,['manager','admin']);const kind=value(b.kind,'Configuration kind'),setting=value(b.value,'Proposed value');
  if(!['Session minutes','Exports enabled','MFA exercise required'].includes(kind))throw Error('Choose a controlled setting.');
  if(kind==='Session minutes'&&(!Number.isInteger(Number(setting))||Number(setting)<5||Number(setting)>480))throw Error('Session minutes must be 5–480.');if(kind!=='Session minutes'&&!['true','false'].includes(setting))throw Error('Use true or false.');
  l.changes.unshift({id:uid('CFG-'),kind,value:setting,reason:value(b.reason,'Reason'),requester:a.person,approver:'',status:'Requested'});
 }
 else if(action==='approveChange'||action==='applyChange'){
  need(a,action==='approveChange'?['executive']:['admin']);const c=l.changes.find(x=>x.id===b.id);if(!c)throw Error('Change unavailable.');
  if(action==='approveChange'){if(c.requester===a.person||c.status!=='Requested')throw Error('Independent configuration approval required.');c.approver=a.person;c.status=b.reject?'Rejected':'Approved';}
  else{if(c.status!=='Approved')throw Error('Approved change required.');if(c.kind.startsWith('SLA ')){const p=s.policies.find(p=>p.category===c.kind.slice(4));if(!p)throw Error('Category unavailable.');Object.assign(p,JSON.parse(c.value));}if(c.kind==='Session minutes')l.settings.sessionMinutes=Number(c.value);if(c.kind==='Exports enabled')l.settings.exportEnabled=c.value==='true';if(c.kind==='MFA exercise required')l.settings.mfaRequired=c.value==='true';c.status='Applied';}
 }
 else if(action==='mfaChallenge'){
  // A visibly labelled exercise, not a real second factor or authentication claim.
  l.mfa[a.username]={challenge:String(Math.floor(100000+Math.random()*900000)),verifiedUntil:''};result='Exercise code: '+l.mfa[a.username].challenge+' (demo only; a production factor must be delivered independently).';
 }
 else if(action==='mfaVerify'){
  const m=l.mfa[a.username];if(!m||m.challenge!==b.code)throw Error('Exercise code is incorrect.');m.challenge='';m.verifiedUntil=new Date(now+300000).toISOString();result='MFA exercise verified for five minutes. This is not production MFA.';
 }
 else if(action==='supportRead'){
  const g=l.grants.find(x=>x.id===b.id&&x.target===(a.baseRole||a.role)&&x.support&&x.status==='Applied'&&Date.parse(x.expires)>now);if(!g)throw Error('Current approved temporary support grant required.');result='Read-only support: '+s.tasks.length+' tasks; '+s.rooms.length+' rooms. Guest identity, incident evidence and folios are excluded.';
 }
 else if(action==='snapshot'){
  need(a,['admin']);if(l.snapshots.length>=5)throw Error('Five sandbox recovery points already exist.');l.snapshots.unshift({id:uid('BKP-'),at,rooms:structuredClone(scopedHotel(s,a).rooms),tasks:structuredClone(scopedHotel(s,a).tasks)});result='Operational recovery point saved; identity, guest sessions, finance and protected evidence are excluded.';
 }
 else if(action==='restoreDrill'){
  need(a,['admin']);const snap=l.snapshots.find(x=>x.id===b.id);if(!snap)throw Error('Recovery point unavailable.');const copy=structuredClone(snap),valid=copy.tasks.every(t=>copy.rooms.some(r=>r.id===t.room));l.recoveries.unshift({snapshot:snap.id,at,rooms:copy.rooms.length,tasks:copy.tasks.length,valid});result=valid?'Restored into a detached drill copy; room/task references verified. Active hotel and revoked sessions were not changed.':'Recovery validation failed.';
 }
 else throw Error('Unknown feature action.');
 l.history.unshift({at,actor:a.person,action,result});s.audit.unshift({at,actor:a.person,text:'Feature '+action+' · '+(b.id||b.task||b.room||'sandbox')});return result;
}
