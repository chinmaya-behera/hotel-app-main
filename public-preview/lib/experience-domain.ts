import {seedExperience,createExperienceEngine} from '../experience/lib/engine.ts';
import type {DemoState,RoleId,WorkItem} from '../experience/types/demo.ts';
import type {HotelState,Role} from './hotel-domain.ts';
import {dashboards} from '../experience/lib/dashboards.ts';
import {menuItems as menu,spaServices} from '../experience/lib/mockData.ts';
import {stayBalance,checkoutBlockers} from '../experience/lib/frontDesk.ts';

export const EXPERIENCE_ROLES:Record<Role,RoleId>={executive:'executive_viewer',frontdesk:'front_desk_coordinator',dispatcher:'department_dispatcher',fulfiller:'task_fulfiller',supervisor:'department_supervisor',manager:'department_manager',finance:'financial_operator',security:'security_responder',admin:'platform_admin'};
export const EXPERIENCE_PATHS:Record<Role,string>={executive:'executive',frontdesk:'front-desk',dispatcher:'dispatcher',fulfiller:'fulfiller',supervisor:'supervisor',manager:'duty-manager',finance:'finance',security:'security',admin:'admin'};
export type ExperienceActor={role:Role;username:string;person:string;room?:string;guest?:boolean;public?:boolean;allowedRooms?:string[];scoped?:boolean};
type Envelope=HotelState&{experience?:DemoState;experienceCommands?:{id:string;username:string;result:unknown}[]};
export function experience(s:HotelState):DemoState{
 const box=s as Envelope;if(!box.experience){box.experience=seedExperience();box.experience.theme='light';
  for(const r of s.rooms){if(!box.experience.frontDesk.rooms.some(x=>x.no===r.id))box.experience.frontDesk.rooms.push({no:r.id,floor:r.floor,occupied:r.status==='Occupied',readiness:r.status==='Cleaning'?'dirty':'ready',dnd:false});}
 }
 for(const room of s.rooms.filter(r=>r.status==='Occupied'))if(!box.experience.frontDesk.stays.some(st=>st.room===room.id&&st.status==='in_house')&&!box.experience.frontDesk.stays.some(st=>st.room===room.id&&st.status==='checked_out'))box.experience.frontDesk.stays.push({id:'native-'+room.id,room:room.id,guest:room.guest||'Registered guest',roomType:room.type,arrival:room.arrival,departure:room.departure,nights:1,status:'in_house',preCheckIn:'verified',idChecked:true,paid:0,cardMask:'Sandbox guarantee'});
 reconcileWorkflow(box.experience,box.experience,{role:'frontdesk',username:'system',person:'System'},'hydrate',[],'hydrate');return box.experience;
}
const blankItems=():DemoState['items']=>({task_fulfiller:[],department_dispatcher:[],department_supervisor:[],department_manager:[],front_desk_coordinator:[],financial_operator:[],security_responder:[],executive_viewer:[],platform_admin:[]});
export function experienceView(full:DemoState,actor:ExperienceActor):DemoState{
 const s=structuredClone(full),role=EXPERIENCE_ROLES[actor.role];
 if(actor.role==='fulfiller'){const staff=s.staffAccounts.find(st=>st.name===actor.person);s.fulfillerAvailability=staff?.availability||'on_duty';}
s.persona=actor.public||actor.guest?null:role;s.theme='light';
 const roomAllowed=(room?:string)=>!room||!actor.allowedRooms||actor.allowedRooms.includes(room);
 for(const key of Object.keys(s.items) as RoleId[])s.items[key]=s.items[key].filter(i=>roomAllowed(i.room));
 s.frontDesk.rooms=s.frontDesk.rooms.filter(r=>roomAllowed(r.no));s.frontDesk.stays=s.frontDesk.stays.filter(r=>roomAllowed(r.room));s.frontDesk.complaints=s.frontDesk.complaints.filter(r=>roomAllowed(r.room));
 s.folios=Object.fromEntries(Object.entries(s.folios).filter(([room])=>roomAllowed(room)));
 s.bookings=s.bookings.filter(b=>roomAllowed(b.room));s.invoices=s.invoices?.filter(i=>roomAllowed(i.roomNumber));s.transactions=s.transactions?.filter(i=>roomAllowed(i.roomNumber));s.refundRequests=s.refundRequests?.filter(i=>roomAllowed(i.roomNumber));s.inspections=s.inspections?.filter(i=>roomAllowed(i.roomNumber));s.incidents=s.incidents?.filter(i=>roomAllowed((i as any).room));
 (s as any).preferences=actor.public||actor.guest?{}:{[actor.username]:(s as any).preferences?.[actor.username]||{}};
 const inRoom=(i:WorkItem)=>i.room===actor.room&&i.guest;
 if(actor.public||actor.guest){
  s.items=Object.fromEntries(Object.entries(s.items).map(([key,rows])=>[key,actor.guest&&key!=='security_responder'?rows.filter(inRoom):[]])) as DemoState['items'];
  s.folios=actor.guest&&actor.room?{[actor.room]:s.folios[actor.room]||[]}:{};
  s.frontDesk={rooms:s.frontDesk.rooms,stays:s.frontDesk.stays.map(st=>actor.guest&&st.room===actor.room?st:{...st,guest:'Reserved',paid:0,cardMask:'',charges:undefined}),sync:[],complaints:[]};
  s.staffAccounts=[];s.auditTrail=[];s.feed=[];s.notifications=[];s.resourceRequests=[];s.shiftHandovers=[];s.incidents=[];s.invoices=[];s.transactions=[];s.refundRequests=[];s.inspections=[];
  s.bookings=s.bookings.filter(b=>actor.guest?b.room===actor.room:actor.username==='website');s.lostFound=s.lostFound.filter(i=>!i.sensitive&&(!i.claimed||i.claimedRoom===actor.room)).map(i=>({...i,loggedBy:'Front Desk'}));return s;
 }
 const visible=new Set<RoleId>([role]);
 if(['frontdesk','dispatcher','supervisor','manager','executive'].includes(actor.role))for(const r of ['task_fulfiller','department_dispatcher','department_supervisor','department_manager','front_desk_coordinator'] as RoleId[])visible.add(r);
 if(['finance','executive'].includes(actor.role))visible.add('financial_operator');
 s.items=Object.fromEntries(Object.entries(s.items).map(([key,rows])=>[key,visible.has(key as RoleId)?rows:[]])) as DemoState['items'];
 if(actor.role==='fulfiller')s.items.task_fulfiller=s.items.task_fulfiller.filter(i=>i.assignee===actor.person);
 if(!['frontdesk','finance','executive'].includes(actor.role)){s.folios={};s.bookings=[];s.invoices=[];s.transactions=[];s.refundRequests=[];s.frontDesk.stays=[];s.frontDesk.sync=[];s.frontDesk.complaints=[];}
 if(!['security','manager','executive','supervisor'].includes(actor.role))s.incidents=[];
 else if(actor.role!=='security')s.incidents=(s.incidents||[]).map(i=>({...i,timeline:i.department.toLowerCase().includes('security')?[]:i.timeline}));
 if(!['supervisor','manager'].includes(actor.role))s.inspections=[];
 if(actor.role!=='admin'&&actor.role!=='executive')s.auditTrail=s.auditTrail.filter(a=>a.actor===actor.person);
 s.feed=s.feed.filter(f=>actor.role==='admin'||actor.role==='executive'||!f.role.toLowerCase().includes('security'));
 s.notifications=(s.notifications||[]).map(n=>({...n,roleId:n.roleId||(n.targetRole as RoleId),message:n.message||n.summary||n.title})).filter(n=>n.roleId===role);
 if(actor.role!=='admin')s.staffAccounts=s.staffAccounts.map(st=>({...st,email:'',financialLimit:st.roleId===role?st.financialLimit:0}));
 s.staffAccounts.sort((a,b)=>Number(b.name===actor.person)-Number(a.name===actor.person));return s;
}
const permissions:Record<string,Role[]>={
 advance:['fulfiller','dispatcher','supervisor','manager','frontdesk','finance','security','executive'],fdAction:['frontdesk'],
 cycleIntegration:['admin'],toggleStaffStatus:['admin'],updateStaffRole:['admin'],addStaffAccount:['admin'],updateWorkflowConfig:['admin'],revokeRoomSession:['admin','frontdesk'],restoreRoomSession:['admin','frontdesk'],setIntegrationState:['admin'],testConnector:['admin'],simulateTestTask:['admin'],recordAuditEvent:['admin','executive','finance','manager','dispatcher','supervisor','frontdesk','security','fulfiller'],
 setSoundEnabled:['fulfiller','security'],setFulfillerAvailability:['fulfiller'],requestTaskReassignment:['fulfiller'],resolveReassignment:['dispatcher','supervisor'],requestEmergencyShiftChange:['fulfiller'],attachTaskPhoto:['fulfiller','security','supervisor'],markNotificationRead:['admin','executive','finance','manager','dispatcher','supervisor','frontdesk','security','fulfiller'],clearAllNotifications:['admin','executive','finance','manager','dispatcher','supervisor','frontdesk','security','fulfiller'],
 assignDispatcherTask:['dispatcher','supervisor'],autoAssignTask:['dispatcher'],autoAssignAllPending:['dispatcher'],reassignDispatcherTask:['dispatcher','supervisor'],linkDuplicateTask:['dispatcher'],escalateTaskToManager:['dispatcher','supervisor'],redistributeUnstartedTasks:['dispatcher','supervisor'],toggleRoutingRule:['dispatcher','admin'],updateStaffAvailability:['dispatcher','supervisor','manager'],updateStaffCapacity:['dispatcher','supervisor','manager'],
 reviewResourceRequest:['manager'],createResourceRequest:['manager','supervisor'],submitShiftHandover:['manager','supervisor'],acknowledgeShiftHandover:['manager','supervisor'],resolveComplaintCase:['manager'],addManagerNote:['manager'],updateIncidentStatus:['manager','security'],reviewExecutiveItem:['executive'],addExecutiveComment:['executive'],requestExecutiveDirective:['executive'],
 acknowledgeSecurityItem:['security'],arriveSecurityItem:['security'],resolveSecurityItem:['security'],requestSecurityBackup:['security'],escalateSecurityItem:['security'],addSecurityNote:['security'],createSecurityIncident:['security'],recordInvoicePayment:['finance'],createInvoice:['finance'],reviewRefundRequest:['finance','executive'],updateTransactionStatus:['finance'],reconcileTransaction:['finance'],approveInspection:['supervisor'],reopenInspection:['supervisor'],reviewFulfillerReassignment:['supervisor'],escalateSupervisorIssue:['supervisor'],addLostFoundItem:['frontdesk'],
};
const guestActions=new Set(['submitGuestRequest','placeRoomServiceOrder','cancelGuestItem','submitGuestFeedback','disputeFolioCharge','claimLostItem','expressCheckout']);
const publicBookings=new Set(['createBooking','submitPreArrival','requestEarlyCheckIn','modifyBooking','cancelBooking']);
const fdCommands=new Set(['verifyPreCheckIn','settleBalance','checkOut','moveRoom','decideEarlyCheckIn','checkIn','requestStep','escalateRequest','routeRequest','captureCase','syncAction','applyApprovedComp','logComplaint','requestOutOfOrder','applyOutOfOrder']);
const error=(message:string):never=>{throw Error(message);};
function bounded(value:unknown,depth=0):void{if(depth>12)error('Request is too deeply nested.');if(typeof value==='string'&&value.length>350000)error('Input is too long.');if(Array.isArray(value)){if(value.length>100)error('Too many input records.');value.forEach(v=>bounded(v,depth+1));}else if(value&&typeof value==='object'){if(Object.keys(value).some(k=>['__proto__','constructor','prototype'].includes(k)))error('Invalid input key.');Object.values(value).forEach(v=>bounded(v,depth+1));}}
export function runExperience(s:DemoState,actor:ExperienceActor,action:string,args:any[],commandId:string){
 bounded(args);const role=EXPERIENCE_ROLES[actor.role],before=structuredClone(s);let requested=action;
 if(action==='submitEnquiry'){
  const input=args[0];if(!input||!['dining','spa','contact'].includes(input.kind)||!String(input.name||'').trim()||String(input.name).length>100)error('Enter your name and a valid inquiry.');
  const details=String(input.details||'').trim();if(!details||details.length>1500)error('Enter inquiry details under 1,500 characters.');
  const ref='ENQ-'+commandId.slice(0,8).toUpperCase(),item:WorkItem={id:commandId,title:input.kind==='dining'?'Dining reservation inquiry':input.kind==='spa'?'Spa appointment inquiry':String(input.subject||'Website inquiry'),meta:'Website · '+input.name,status:'Received',ref,category:'concierge',description:details,channel:'Website',owner:'Front Desk',createdAt:new Date().toISOString(),history:[{at:new Date().toISOString(),status:'Received',note:'Submitted through the hotel website'}]};s.items.front_desk_coordinator.unshift(item);s.auditTrail.unshift({id:crypto.randomUUID(),timestamp:new Date().toISOString(),actor:'Website guest',actorRole:'guest',action:'Public inquiry received',category:'Hotel',resource:ref,outcome:'success'});return {state:s,result:ref,message:'Inquiry '+ref+' saved and sent to Front Desk.'};
 }
 if(action==='savePreferences'){
  if(actor.public||actor.guest)error('Staff sign-in is required.');const section=String(args[0]||'profile'),preferences=args[1];if(!preferences||typeof preferences!=='object'||JSON.stringify(preferences).length>3000)error('Invalid preferences.');
  if(section==='finance'&&actor.role!=='finance')error('Finance entitlement is required.');(s as any).preferences??={};(s as any).preferences[actor.username]={...((s as any).preferences[actor.username]||{}),[section]:preferences};return {state:s,result:null,message:'Your preferences have been saved.'};
 }
 if(action==='setResponderStatus'){
  if(actor.role!=='security'||!['on_patrol','responding','break','off_duty'].includes(args[0]))error('Choose a valid responder status.');const staff=s.staffAccounts.find(st=>st.name===actor.person);if(staff)staff.availability=args[0]==='break'?'break':args[0]==='off_duty'?'off_duty':'on_duty';(s as any).responderStatus=args[0];return {state:s,result:null,message:'Responder availability saved.'};
 }
 if(action==='flagWorkload'){
  if(!['manager','supervisor'].includes(actor.role))error('Management entitlement is required.');const staff=s.staffAccounts.find(st=>st.id===args[0]);if(!staff)error('Staff record unavailable.');s.notifications??=[];s.notifications.unshift({id:commandId,roleId:'department_dispatcher',title:'Workload review requested',message:actor.person+' requested a workload review for '+staff!.name,timestamp:new Date().toISOString(),read:false,type:'alert'});return {state:s,result:null,message:'Dispatcher notified of workload review.'};
 }
 if(action==='systemDiagnostic'){
  if(actor.role!=='admin')error('Administrator entitlement is required.');const inconsistent=(s.invoices||[]).filter(i=>Math.abs(i.totalAmount-i.paidAmount-i.outstandingBalance)>.01).length,message=inconsistent?inconsistent+' invoice balance exceptions need Finance review.':'Balance consistency check passed; no ledger changes were made.';s.auditTrail.unshift({id:commandId,timestamp:new Date().toISOString(),actor:actor.person,actorRole:role,action:'Reconciliation diagnostic',category:'Integration',resource:'Invoice balance totals',outcome:inconsistent?'warning':'success',details:message});return {state:s,result:null,message};
 }
 if(action==='resetWorkspace'){
  if(actor.role!=='admin'||actor.scoped)error('Property-wide administrator entitlement is required.');const next=seedExperience();next.auditTrail=[{id:commandId,timestamp:new Date().toISOString(),actor:actor.person,actorRole:role,action:'Reset synthetic operational fixtures',category:'Workflow' as const,resource:'Client workspace',outcome:'success' as const},...s.auditTrail].slice(0,2000);next.staffAccounts=s.staffAccounts;next.revokedRooms=next.frontDesk.rooms.map(r=>r.no);(next as any).preferences=(s as any).preferences;return {state:next,result:null,message:'Synthetic operations restored. Staff access and audit history retained; guest sessions revoked.'};
 }
 if(action==='setRoomDnd'){
  if(!actor.guest||args[0]!==actor.room||typeof args[1]!=='boolean')error('Verified room access is required.');const room=s.frontDesk.rooms.find(r=>r.no===actor.room);if(!room)error('Room unavailable.');room!.dnd=args[1];for(const item of Object.values(s.items).flat().filter(i=>i.room===actor.room))item.dnd=args[1];return {state:s,result:null,message:args[1]?'Do Not Disturb enabled. Room entry is paused.':'Do Not Disturb cleared.'};
 }
 if(action==='fdAction'){
  if(typeof args[0]!=='string'||!Array.isArray(args[1]))error('Choose a valid front desk command.');requested=args[0];
  if(actor.public){if(!publicBookings.has(requested))error('Staff sign-in is required.');}
  else if(actor.guest)error('Staff sign-in is required for stay administration.');
  else if(actor.role!=='frontdesk'&&!publicBookings.has(requested))error('Front Desk entitlement is required.');
  if(!publicBookings.has(requested)&&!fdCommands.has(requested))error('Unknown front desk command.');
 }else if(actor.guest){if(!guestActions.has(action))error('Guest action is not permitted.');}
 else if(actor.public)error('Verify your room session first.');
 else if(!permissions[action]?.includes(actor.role))error('This role is not authorized for that action.');
 const view=experienceView(s,actor),allVisible=Object.values(view.items).flat();
 validateWorkflow(s,view,actor,action,args);
 const itemArg=['advance','attachTaskPhoto','cancelGuestItem','submitGuestFeedback'].includes(action)?args[1]:args[0];
 const target=allVisible.find(i=>i.id===itemArg);
 if(['advance','requestTaskReassignment','attachTaskPhoto','cancelGuestItem','submitGuestFeedback','acknowledgeSecurityItem','arriveSecurityItem','resolveSecurityItem','requestSecurityBackup','escalateSecurityItem','addSecurityNote','assignDispatcherTask','autoAssignTask','reassignDispatcherTask','linkDuplicateTask','escalateTaskToManager','addManagerNote','reviewExecutiveItem','addExecutiveComment'].includes(action)&&!target)error('Task unavailable in this scope.');
 if(['advance','attachTaskPhoto','cancelGuestItem','submitGuestFeedback'].includes(action)){if(!Object.hasOwn(s.items,args[0]))error('Unknown task queue.');if(!view.items[args[0] as RoleId].some(i=>i.id===args[1]))error('Task unavailable in this scope.');}
 if(actor.guest){
  const room=action==='submitGuestRequest'?args[0]?.room:['placeRoomServiceOrder','disputeFolioCharge','claimLostItem','expressCheckout'].includes(action)?args[0]:target?.room;
  if(room!==actor.room||s.revokedRooms.includes(room))error('Room access was revoked or does not match this session.');
  if(action==='submitGuestRequest'){if(!['housekeeping','maintenance','spa','concierge','room_service','lost_found'].includes(args[0]?.category))error('Choose a valid service.');if(!String(args[0].title||'').trim())error('Describe the request.');delete args[0].lifecycle;const charge=args[0].folioCharge;delete args[0].folioCharge;if(args[0].category==='spa'&&charge){const treatment=spaServices.find(p=>args[0].title===p.name+' booking');if(!treatment)error('Choose a listed treatment.');args[0].folioCharge={label:'Spa · '+treatment!.name,amount:treatment!.price};}args[0].dnd=s.frontDesk.rooms.find(r=>r.no===actor.room)?.dnd;if(args[0].category==='housekeeping'&&args[0].dnd)error('Clear Do Not Disturb before requesting room entry.');}
  if(action==='placeRoomServiceOrder'){if(!Array.isArray(args[1])||!args[1].length)error('Choose at least one menu item.');args[1]=args[1].map((line:any)=>{const product=menu.find(m=>m.id===line.itemId);if(!product||!Number.isInteger(line.qty)||line.qty<1||line.qty>20)error('Choose valid menu items and quantities.');return {...line,name:product!.name,price:product!.price};});}
 }
 if(action==='advance'){
  if(args[0]!==role)error('Use your own role queue to progress work.');
  const candidate=args[2],next=(dashboards[args[0] as RoleId]?.transitions[target!.status]||[]).find(t=>t.next===candidate?.next);
  if(!next)throw Error('This state transition is unavailable.');args[2]=next;
  if(next.reasons&&!String(args[3]||'').trim())error('A reason is required for this transition.');
  if(next.next==='Completed'&&target!.evidenceRequired&&!target!.photoUrl)error('Attach completion evidence before completing this task.');
  if(next.blockedIf==='self'&&target!.selfRequested)error('Independent approval is required.');
  if(actor.role==='fulfiller'&&(s.frontDesk.rooms.find(r=>r.no===target!.room)?.dnd||s.frontDesk.rooms.find(r=>r.no===target!.room)?.readiness==='out_of_order')&&['In progress','Completed','On the way'].includes(next.next))error('Room entry is restricted by Do Not Disturb.');
 }
 if(['assignDispatcherTask','autoAssignTask','reassignDispatcherTask'].includes(action)&&target?.dnd)error('Do not enter a room while Do Not Disturb is active.');
 if(['assignDispatcherTask','reassignDispatcherTask'].includes(action)){const worker=s.staffAccounts.find(st=>st.id===args[1]);if(!worker||worker.status!=='active'||worker.availability==='off_duty'||worker.availability==='break')error('Choose an active available staff member.');if(worker!.roleId!=='task_fulfiller')error('Assign service work to a fulfiller.');const dept:Record<string,string>={housekeeping:'Housekeeping',maintenance:'Maintenance & Engineering',spa:'Spa & Wellness',room_service:'Food & Beverage'};if(target?.category&&dept[target.category]&&worker!.department!==dept[target.category])error('Staff department does not match this service.');const active=s.items.task_fulfiller.filter(i=>i.assignee===worker!.name&&!['Completed','Cancelled','Resolved','Linked'].includes(i.status)&&i.ref!==target?.ref).length;if(active>=(worker!.maxWorkload||8))error('Staff workload capacity has been reached.');}
 if(action==='linkDuplicateTask'){const parent=allVisible.find(i=>i.ref===args[1]||i.id===args[1]);if(!parent||parent.id===target!.id||parent.room!==target!.room)throw Error('Link another task in the same room.');if(parent.linkedToRef===target!.ref)error('Duplicate links cannot form a cycle.');}
 if(action==='approveInspection'){const inspection=s.inspections?.find(i=>i.id===args[0]),room=s.frontDesk.rooms.find(r=>r.no===inspection?.roomNumber);if(!inspection||inspection.status!=='pending')error('Inspection is no longer pending.');if(room?.readiness==='out_of_order')error('Unsafe/out-of-order rooms cannot be released.');}
 if(action==='acknowledgeShiftHandover'){const h=s.shiftHandovers?.find(h=>h.id===args[0]);if(!h||h.status==='acknowledged')throw Error('Handover is unavailable or already acknowledged.');if(h.outgoingManager===actor.person||h.incomingManager!==actor.person)error('The receiving owner must acknowledge the handover.');}
 if(['recordInvoicePayment','createInvoice','reviewRefundRequest','updateTransactionStatus','reconcileTransaction'].includes(action)&&s.integrations.pay==='down')error('Sandbox payment provider is offline. Verify its outcome before retrying.');
 if(action==='recordInvoicePayment'){const inv=s.invoices?.find(i=>i.id===args[0]),amount=Number(args[1]);if(!inv||!Number.isFinite(amount)||amount<=0||amount>inv.outstandingBalance||Math.abs(amount*100-Math.round(amount*100))>0.00001)error('Enter a valid exact amount within the outstanding balance.');if(s.transactions?.some(t=>t.referenceNumber===args[3]&&t.status!=='Failed'))error('This payment reference has already been recorded.');}
 if(action==='reconcileTransaction'){const txn=s.transactions?.find(t=>t.id===args[0]) as any;if(!txn||txn.isReconciled||txn.status==='Failed'||txn.status==='Pending')error('Only a confirmed unreconciled transaction can be reviewed.');if(txn.executor===actor.username)error('An independent reviewer must reconcile this transaction.');}
 if(action==='updateTransactionStatus'){const txn=s.transactions?.find(t=>t.id===args[0]);if(!txn||!['Pending','Failed'].includes(txn.status)||args[1]!=='Successful')error('Only pending/failed sandbox outcomes may be verified once.');}
 if(action==='reviewRefundRequest'){
  const refund=s.refundRequests?.find(r=>r.id===args[0]) as any;if(!refund)error('Refund unavailable.');
  if(args[1]==='approve'){
   if(actor.role==='finance'){if(refund.status!=='Pending Review')error('Refund is no longer pending review.');const id='refund-approval-'+refund.id;if(!s.items.executive_viewer.some(i=>i.id===id))s.items.executive_viewer.unshift({id,title:'Refund approval · '+refund.guestName,meta:'Requested by '+actor.person,status:'Needs approval',amount:refund.amount,room:refund.roomNumber,ref:refund.id,owner:actor.username});return {state:s,result:undefined,message:'Refund sent to Executive for independent approval.'};}
   if(actor.role!=='executive'||refund.requestedBy===actor.person||refund.requester===actor.username)error('Independent Executive approval is required.');
  }else if(args[1]==='execute'){if(actor.role!=='finance'||refund.status!=='Approved'||refund.approver===actor.username)error('Separate approved execution is required.');}
  else if(args[1]!=='reject')error('Choose a valid refund decision.');
 }
 if(action==='reviewExecutiveItem'&&target?.owner===actor.username)error('Sensitive self-approval is not permitted.');
 if(action==='attachTaskPhoto'||action==='addLostFoundItem'){
  const image=action==='attachTaskPhoto'?args[2]:args[0]?.photo;if(image&&(!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image)||image.length>350000))error('Use a PNG, JPEG or WebP image under 250 KB.');
 }
 if(action==='markNotificationRead'&&!view.notifications?.some(n=>n.id===args[0]))error('Notification unavailable in scope.');
 if(action==='clearAllNotifications')args[0]=role;
 if(action==='toggleStaffStatus'){const own=s.staffAccounts.find(st=>st.name===actor.person);if(own?.id===args[0])error('Another administrator must change your own access.');}
 if(action==='recordAuditEvent'){args[0]={...args[0],actor:actor.person,actorRole:role};}
 const engine=createExperienceEngine(s,commandId),fn=(engine as any)[action];if(typeof fn!=='function')error('Unknown workflow command.');
 const result=fn(...args);if(action==='fdAction'&&typeof result==='string')error(result);
 const next=engine.state;
 // Approval authorizes; it never silently executes a credit or refund.
 if(action==='reviewExecutiveItem'){
  next.folios=before.folios;next.frontDesk.complaints=before.frontDesk.complaints;
  if(target?.id.startsWith('refund-approval-')){const f=next.refundRequests?.find(f=>f.id===target.ref) as any;if(f){f.status=args[1]==='approve'?'Approved':args[1]==='reject'?'Rejected':f.status;f.approver=actor.username;f.reviewedBy=actor.person;}}
 }
 if(action==='reviewRefundRequest'){const f=next.refundRequests?.find(f=>f.id===args[0]) as any;if(f){if(args[1]==='approve')f.approver=actor.username;if(args[1]==='execute')f.executor=actor.username;f.reviewedBy=actor.person;}}
 if(['recordInvoicePayment','reviewRefundRequest'].includes(action))for(const transaction of next.transactions||[])if(!before.transactions?.some(t=>t.id===transaction.id)){(transaction as any).executor=actor.username;transaction.isReconciled=false;}
 if(action==='reconcileTransaction'){const txn=next.transactions?.find(t=>t.id===args[0]) as any;if(txn)txn.reconciler=actor.username;}
 for(const audit of next.auditTrail)if(!before.auditTrail.some(a=>a.id===audit.id)){audit.actor=actor.person;audit.actorRole=role;}
 reconcileWorkflow(before,next,actor,action,args,commandId);
 next.auditTrail.unshift({id:crypto.randomUUID(),timestamp:new Date().toISOString(),actor:actor.person,actorRole:role,action:requested,category:'Workflow',resource:String(args[0]||'workspace').slice(0,100),outcome:'success'});
 return {state:next,result,message:engine.messages.at(-1)||'Changes saved.'};
}

export function syncExperienceRooms(hotel:HotelState,state:DemoState):string[]{
 const revoke=new Set(state.revokedRooms);for(const r of state.frontDesk.rooms){const stay=state.frontDesk.stays.find(st=>st.room===r.no&&st.status==='in_house');let room=hotel.rooms.find(x=>x.id===r.no);if(!room){room={id:r.no,type:'Atelier room',guest:stay?.guest||'',email:'',arrival:new Date().toISOString(),departure:new Date(Date.now()+86400000).toISOString(),status:r.occupied?'Occupied':'Available',floor:r.floor,rate:0,verified:false,property:'Main',outlet:'Rooms',shift:'Day'};hotel.rooms.push(room);}if(revoke.has(r.no)||!r.occupied&&room.status==='Occupied'){revoke.add(r.no);room.verified=false;room.email='';}room.status=r.occupied?'Occupied':r.readiness==='ready'?'Available':'Cleaning';if(stay&&!room.verified)room.guest=stay.guest;}
 return [...revoke];
}

function validateWorkflow(s:DemoState,view:DemoState,a:ExperienceActor,action:string,args:any[]){
 const text=(v:unknown,label='A reason',min=3,max=1500)=>{if(typeof v!=='string'||v.trim().length<min||v.length>max)error(label+' is required.');};
 const amount=(v:unknown,max=10000000)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>max||Math.abs(v*100-Math.round(v*100))>.00001)error('Enter a valid amount in rupees and paise.');};
 const room=(r:unknown)=>{if(typeof r!=='string'||!s.frontDesk.rooms.some(x=>x.no===r)||a.allowedRooms&&!a.allowedRooms.includes(r))error('Room unavailable in your property, floor, outlet or shift scope.');};
 const all=Object.values(s.items).flat(),records:any[]=[...all,...s.frontDesk.stays,...s.frontDesk.complaints,...(s.inspections||[]),...(s.invoices||[]),...(s.transactions||[]),...(s.refundRequests||[]),...(s.incidents||[])];
 const walk=(v:any)=>{if(typeof v==='string'){const rec=records.find(r=>r.id===v);if(rec&&(rec.room||rec.roomNumber))room(rec.room||rec.roomNumber);}else if(v&&typeof v==='object'){for(const [k,x]of Object.entries(v)){if(['room','roomNo','roomNumber'].includes(k)&&x)room(x);else walk(x);}}};if(!a.public)walk(args);
 if(a.scoped&&['autoAssignAllPending','redistributeUnstartedTasks','updateWorkflowConfig','cycleIntegration','setIntegrationState','toggleStaffStatus','updateStaffRole','addStaffAccount','simulateTestTask','systemDiagnostic'].includes(action))error('Property-wide entitlement is required for this operation.');
 const worker=()=>{const w=s.staffAccounts.find(x=>x.id===args[0]);if(!w)error('Staff record unavailable.');return w!;};
 if(['toggleStaffStatus','updateStaffRole','updateStaffAvailability','updateStaffCapacity'].includes(action))worker();
 if(action==='updateStaffRole'){if(worker().name===a.person)error('Another administrator must change your own role.');if(!Object.values(EXPERIENCE_ROLES).includes(args[1]))error('Choose a valid operational role.');text(args[2],'Department',2,80);text(args[3],'Floor zone',1,80);if(!['Day','Evening','Night','Rotating','Duty'].includes(args[4]))error('Choose a valid shift.');}
 if(action==='addStaffAccount'){const b=args[0];text(b?.name,'Staff name',2,100);text(b?.employeeId,'Employee ID',2,40);if(s.staffAccounts.some(st=>st.employeeId===b.employeeId||st.email===b.email))error('Employee ID or email already exists.');if(!Object.values(EXPERIENCE_ROLES).includes(b.roleId))error('Choose an operational role.');amount(b.financialLimit);}
 if(action==='updateStaffAvailability'&&!['on_duty','break','off_duty'].includes(args[1]))error('Choose a valid availability.');
 if(action==='updateStaffCapacity'&&(!Number.isInteger(args[1])||args[1]<1||args[1]>20))error('Workload capacity must be between 1 and 20.');
 if(['cycleIntegration','setIntegrationState','testConnector'].includes(action)&&!s.integrations[args[0]])error('Unknown connector.');
 if(action==='setIntegrationState'&&!['healthy','degraded','down'].includes(args[1]))error('Choose a valid connector state.');
 if(action==='toggleRoutingRule'&&!s.routingRules?.some(r=>r.id===args[0]))error('Routing rule unavailable.');
 if(action==='updateWorkflowConfig'){for(const [key,val]of Object.entries(args[0]||{})){if(!Object.hasOwn(s.workflowConfig,key))error('Unknown workflow setting.');if(typeof s.workflowConfig[key as keyof typeof s.workflowConfig]==='boolean'){if(typeof val!=='boolean')error('Invalid toggle.');}else if(typeof val!=='number'||!Number.isFinite(val)||val<0||val>1000000)error('Workflow values must be finite positive numbers.');}if(args[0].ackSlaMinutes===0||args[0].resolutionSlaMinutes===0)error('SLA targets must be greater than zero.');}
 if(['requestTaskReassignment','requestEmergencyShiftChange','escalateTaskToManager','addManagerNote','addExecutiveComment','addSecurityNote','requestSecurityBackup'].includes(action))text(args[1]||args[0],'Details');
 if(action==='submitGuestFeedback'&&(!Number.isInteger(args[2])||args[2]<1||args[2]>5))error('Choose a rating between 1 and 5.');
 if(action==='disputeFolioCharge'){const line=s.folios[args[0]]?.find(l=>l.id===args[1]);if(!line||line.disputed||line.amount<=0)error('Charge unavailable or already disputed.');text(args[2]);}
 if(action==='claimLostItem'){const found=s.lostFound.find(i=>i.id===args[1]);if(!found||found.claimed||found.sensitive)error('Contact Front Desk about this item.');}
 if(action==='cancelGuestItem'){const item=all.find(i=>i.id===args[1]);if(!item||!['Received','Unassigned','Assigned','Quoted','Received by Front Desk'].includes(item.status))error('Work has started; contact Front Desk to cancel.');}
 if(action==='expressCheckout'){room(args[0]);if(s.integrations.pay==='down')error('Payment simulator is offline.');const stay=s.frontDesk.stays.find(st=>st.room===args[0]&&st.status==='in_house');if(!stay)error('Active stay unavailable.');const blockers=checkoutBlockers(s,{...stay!,paid:stay!.paid+Math.max(0,stayBalance(s,stay!))});if(blockers.length)error(blockers[0]);args[1]=a.person;}
 if(action==='fdAction'){const cmd=args[0],p=args[1];if(['revokeRoomSession','restoreRoomSession'].includes(cmd))room(p[0]);if(cmd==='moveRoom')room(p[1]);if(cmd==='settleBalance'&&s.integrations.pay==='down')error('Payment simulator is offline.');if(cmd==='applyApprovedComp'){const c=s.frontDesk.complaints.find(x=>x.id===p[0]);if(c&&(c as any).approvedBy===a.username)error('Independent credit execution is required.');}}
 if(['revokeRoomSession','restoreRoomSession'].includes(action))room(args[0]);
 if(action==='reviewExecutiveItem'){const item=s.items.executive_viewer.find(i=>i.id===args[0]);if(!item||!['Needs approval','Info Requested','Pending'].includes(item.status))error('Approval is no longer pending.');if(!['approve','reject','info_requested'].includes(args[1]))error('Choose a valid decision.');if(args[1]==='approve'&&item!.amount&&item!.amount>(s.staffAccounts.find(st=>st.name===a.person)?.financialLimit??200000))error('Amount exceeds this Executive approval limit.');if(item!.selfRequested&&args[1]==='approve')error('Independent approval is required.');if(args[1]!=='approve')text(args[2]||args[3]);}
 if(action==='reviewResourceRequest'){const r=s.resourceRequests?.find(r=>r.id===args[0]);if(!r||r.status!=='pending')error('Resource request is no longer pending.');if(!['approve','reject'].includes(args[1]))error('Choose approve or reject.');if(r!.requestedBy.includes(a.person))error('An independent manager must review this request.');}
 if(action==='createResourceRequest'){text(args[0]?.title,'Resource title');text(args[0]?.details,'Resource details');args[0].requestedBy=a.person;}
 if(action==='submitShiftHandover'){text(args[0]?.notes,'Handover notes');args[0].outgoingManager=a.person;}
 if(action==='resolveComplaintCase'){const c=s.frontDesk.complaints.find(c=>c.id===args[0]);if(!c||c.compApplied)error('Complaint unavailable or already credited.');text(args[1],'Resolution notes');amount(args[2]??c!.comp);if((args[2]??c!.comp)>s.workflowConfig.dutyManagerCompLimit)error('Amount exceeds Duty Manager limit. Request Executive approval.');}
 if(action==='createInvoice'){const i=args[0];text(i?.guestName,'Guest name',2,100);room(i?.roomNumber);for(const field of ['roomCharges','serviceCharges','taxAmount','discountAmount','totalAmount','paidAmount'])amount(i[field]);const total=Math.round((i.roomCharges+i.serviceCharges+i.taxAmount-i.discountAmount)*100)/100;if(total<=0||total!==i.totalAmount||i.paidAmount!==0)error('Invoice totals must match; record payments separately.');i.status='Unpaid';}
 if(action==='recordInvoicePayment'){if(!['UPI','Credit Card','Debit Card','Net Banking','Cash','Direct Bill'].includes(args[2]))error('Choose a supported payment method.');text(args[3],'Payment reference',3,80);}
 if(action==='reviewRefundRequest'){const r=s.refundRequests?.find(r=>r.id===args[0]),inv=s.invoices?.find(i=>i.id===r?.invoiceId);if(!r||!inv)error('Refund invoice unavailable.');if(['Executed','Rejected'].includes(r!.status))error('Refund is already final.');if(args[1]==='execute'&&(r as any).kind!=='credit'&&r!.amount>inv!.paidAmount)error('Refund exceeds the paid balance.');if(args[1]==='reject')text(args[3]||args[2]);}
 if(action==='reopenInspection'){const i=s.inspections?.find(i=>i.id===args[0]);if(!i||!['pending','passed'].includes(i.status))error('Inspection is unavailable for reopening.');text(args[1]);text(args[2],'Corrective action');}
 if(action==='approveInspection'){const i=s.inspections?.find(i=>i.id===args[0]);if(!i?.items.every(x=>x.passed))error('All inspection checks must pass before release.');}
 if(action==='resolveSecurityItem'){const i=s.items.security_responder.find(i=>i.id===args[0]);if(!i||!['On scene','On site','Arrived','Responding','In progress'].includes(i.status))error('Arrive on site before filing the final report.');for(const key of ['summary','observations','actionsTaken','outcome'])text(args[1]?.[key],key);}
 if(action==='acknowledgeSecurityItem'&&!['Dispatched','Assigned','New','Open','Escalated','Alert'].includes(s.items.security_responder.find(i=>i.id===args[0])?.status||''))error('Alert is already acknowledged.');
 if(action==='arriveSecurityItem'&&!['Acknowledged','Accepted','En route','Responding'].includes(s.items.security_responder.find(i=>i.id===args[0])?.status||''))error('Acknowledge the alert before arrival.');
 if(action==='createSecurityIncident'){for(const key of ['title','location','description'])text(args[0]?.[key],key);if(!['minor','moderate','major','critical'].includes(args[0]?.severity))error('Choose a valid severity.');}
 if(action==='updateIncidentStatus'){if(!view.incidents?.some(i=>i.id===args[0]))error('Incident unavailable in scope.');if(!['open','investigating','contained','resolved','closed'].includes(args[1]))error('Choose a valid incident state.');}
}
function reconcileWorkflow(before:DemoState,next:DemoState,a:ExperienceActor,action:string,args:any[],id:string){
 const now=new Date().toISOString(),oldIds=new Set(Object.values(before.items).flat().map(i=>i.id));
 for(const items of Object.values(next.items))for(const i of items)if(!oldIds.has(i.id)){(i as any).capturedAt=now;(i as any).ackDeadline=new Date(Date.now()+next.workflowConfig.ackSlaMinutes*60000).toISOString();(i as any).resolutionDeadline=new Date(Date.now()+next.workflowConfig.resolutionSlaMinutes*60000).toISOString();}
 if(action==='submitGuestRequest'&&args[0]?.category==='housekeeping'){const task=next.items.department_dispatcher.find(i=>!oldIds.has(i.id));if(task)task.status='Assigned';}
 next.notifications=(next.notifications||[]).map(n=>({...n,roleId:n.roleId||(n.targetRole as RoleId),message:n.message||n.summary||n.title}));
 if(action==='setFulfillerAvailability'){const staff=next.staffAccounts.find(st=>st.name===a.person);if(staff)staff.availability=args[0];}
 if(action==='resolveComplaintCase'){next.folios=before.folios;const c=next.frontDesk.complaints.find(c=>c.id===args[0]);if(c){c.compApplied=false;(c as any).approvedBy=a.username;}}
 if(action==='resolveReassignment'&&args[2]){const t=next.items.task_fulfiller.find(i=>i.id===args[1]);if(t){t.status='Unassigned';t.assignee=undefined;t.assigneeId=undefined;t.reassignPending=false;const mirror=next.items.department_dispatcher.find(i=>i.ref===t.ref);if(mirror)Object.assign(mirror,t);else next.items.department_dispatcher.unshift({...t});}}
 if(action==='updateTransactionStatus'){const t=next.transactions?.find(t=>t.id===args[0]);if(t){t.isReconciled=false;(t as any).executor=a.username;const inv=next.invoices?.find(i=>i.id===t.invoiceId);if(inv){inv.paidAmount=Math.min(inv.totalAmount,inv.paidAmount+t.amount);inv.outstandingBalance=Math.max(0,inv.totalAmount-inv.paidAmount);inv.status=inv.outstandingBalance?'Partially Paid':'Paid';}}}
 if(action==='disputeFolioCharge'){const line=next.folios[args[0]].find(l=>l.id===args[1])!;const inv=next.invoices?.find(i=>i.roomNumber===args[0]);if(inv){next.refundRequests??=[];next.refundRequests.unshift({id:'REF-'+id.slice(0,8),invoiceId:inv.id,guestName:a.person,roomNumber:args[0],amount:line.amount,reason:args[2],requestedAt:now,requestedBy:a.person,status:'Pending Review',...{folioLineId:line.id,kind:inv.paidAmount<line.amount?'credit':'refund',workItemId:next.items.financial_operator.find(i=>!before.items.financial_operator.some(p=>p.id===i.id))?.id}});}}
 if(action==='fdAction'&&['cancelBooking','modifyBooking','syncAction'].includes(args[0])){
  for(const item of next.items.financial_operator.filter(i=>!before.items.financial_operator.some(x=>x.id===i.id)&&i.amount&&i.amount>0)){
   const booking=next.bookings.find(b=>b.room===item.room),st=next.frontDesk.stays.find(st=>st.id===booking?.stayId),invoiceId=st?'STAY-'+st.id:next.invoices?.find(i=>i.roomNumber===item.room)?.id;
   if(invoiceId){next.refundRequests??=[];next.refundRequests.unshift({id:'REF-'+item.id,invoiceId,guestName:st?.guest||'Booking guest',roomNumber:item.room!,amount:item.amount!,reason:item.title,requestedAt:now,requestedBy:a.person,status:'Pending Review',...{workItemId:item.id}});}
  }
 }
 if(action==='reviewRefundRequest'){
  const refund=next.refundRequests?.find(r=>r.id===args[0]) as any;
  if(refund?.workItemId){const wi=next.items.financial_operator.find(i=>i.id===refund.workItemId);if(wi)wi.status=args[1]==='execute'?'Executed':args[1]==='reject'?'Rejected':wi.status;}
  if(refund?.folioLineId&&args[1]==='execute'){if(refund.kind==='credit'){next.transactions=before.transactions;next.invoices=before.invoices;}next.folios[refund.roomNumber].push({id:'credit-'+refund.id,label:'Approved dispute credit · '+refund.id,amount:-refund.amount,date:now});if(refund.kind!=='credit'){const st=next.frontDesk.stays.find(st=>st.room===refund.roomNumber&&st.status==='in_house');if(st)st.paid=Math.max(0,st.paid-refund.amount);}}
 }
 if(action==='cancelGuestItem'){
  const cancelled=Object.values(next.items).flat().find(i=>i.id===args[1]);if(cancelled){const charge=next.folios[cancelled.room||'']?.find(l=>l.id==='fo-'+cancelled.id);if(charge&&charge.amount>0)next.folios[cancelled.room!].push({id:'cancel-'+cancelled.id,label:'Cancelled service credit · '+cancelled.ref,amount:-charge.amount,date:now});}
 }
 if(action==='submitGuestRequest'&&args[0]?.priority==='safety'){
  const task=next.items.department_dispatcher.find(i=>!oldIds.has(i.id));if(task){task.status='New';next.items.security_responder.unshift({...task,id:'sec-'+task.id,department:'Safety & Security',priority:'critical',guest:false});next.notifications.unshift({id:'alert-'+id,roleId:'security_responder',title:'Guest safety assistance',message:'Room '+task.room+' · '+task.title,timestamp:now,read:false,type:'alert'});}
 }
 if(['cancelGuestItem','submitGuestFeedback','acknowledgeSecurityItem','arriveSecurityItem','resolveSecurityItem','requestTaskReassignment','reviewFulfillerReassignment'].includes(action)){
  const key=['cancelGuestItem','submitGuestFeedback'].includes(action)?args[1]:args[0],changed=Object.values(next.items).flat().find(i=>i.id===key);if(changed?.ref)for(const mirror of Object.values(next.items).flat().filter(i=>i.ref===changed.ref&&i.id!==changed.id)){mirror.status=changed.status;if(action==='submitGuestFeedback')mirror.feedback=changed.feedback;}
 }
 if(action==='expressCheckout'||action==='fdAction'&&args[0]==='settleBalance'){
  const st=before.frontDesk.stays.find(st=>action==='expressCheckout'?st.room===args[0]:st.id===args[1][0]);if(st){const due=Math.max(0,stayBalance(before,st)),updated=next.frontDesk.stays.find(x=>x.id===st.id)!;updated.paid=st.paid+due;if(due>0){next.transactions??=[];next.transactions.unshift({id:'TXN-'+id.slice(0,8),invoiceId:'STAY-'+st.id,guestName:st.guest,bookingRef:st.id,roomNumber:st.room,amount:due,paymentMethod:'Credit Card',date:now,time:now,status:'Successful',referenceNumber:'SIM-'+id,gateway:'Sandbox · no money moved',isReconciled:false,...{executor:a.username}});}}}
 if(action==='recordInvoicePayment'){const inv=next.invoices?.find(i=>i.id===args[0]),st=next.frontDesk.stays.find(st=>'STAY-'+st.id===inv?.id);if(st)st.paid+=args[1];}
 if(action==='advance'&&args[0]==='task_fulfiller'&&args[2].next==='Completed'){
  const task=next.items.task_fulfiller.find(i=>i.id===args[1])!;if(task.category==='housekeeping'||task.category==='maintenance'||task.title.toLowerCase().includes('turnover')){const inspectionId='INSP-'+task.id;if(!next.inspections?.some(i=>i.id===inspectionId)){next.inspections??=[];next.inspections.unshift({id:inspectionId,taskId:task.id,roomNumber:task.room!,roomType:'Atelier room',floor:Number(task.room?.[0]||1),attendantName:a.person,attendantId:task.assigneeId||a.username,type:task.category==='maintenance'?'maintenance_check':'turnover',status:'pending',priority:'normal',completedAt:now,photoUrl:task.photoUrl,items:[{id:'verify',category:'Safety & Keycard',label:'Verify completed work and room safety',passed:true}]});}const rm=next.frontDesk.rooms.find(r=>r.no===task.room);if(rm&&!rm.occupied&&rm.readiness!=='out_of_order')rm.readiness='inspection_pending';}}
 // One ledger per active stay. Seeded historic invoices remain separate demonstration examples.
 next.invoices??=[];for(const st of next.frontDesk.stays.filter(st=>st.status==='in_house'||st.status==='checked_out')){const total=Math.max(0,Math.round((stayBalance(next,st)+st.paid)*100)/100),paid=Math.min(total,st.paid),invoice={id:'STAY-'+st.id,guestName:st.guest,roomNumber:st.room,bookingId:st.id,checkInDate:st.arrival,checkOutDate:st.departure,createdAt:now,dueDate:st.departure,roomCharges:total,serviceCharges:0,taxAmount:0,discountAmount:0,totalAmount:total,paidAmount:paid,outstandingBalance:Math.max(0,total-paid),status:(total-paid>0?(paid?'Partially Paid':'Unpaid'):'Paid') as any};const ix=next.invoices.findIndex(i=>i.id===invoice.id);if(ix>=0)next.invoices[ix]={...next.invoices[ix],...invoice,createdAt:next.invoices[ix].createdAt};else next.invoices.unshift(invoice);}
}

/** Poll-driven SLA evaluation; never completes a task or resets captured deadlines. */
export function scanExperienceSla(s:DemoState,now=Date.now()):boolean{
 let changed=false;
 for(const task of s.items.department_dispatcher){
  if(['Completed','Cancelled','Resolved','Linked','Executed'].includes(task.status))continue;
  const ack=Date.parse((task as any).ackDeadline),due=Date.parse((task as any).resolutionDeadline);
  if(Number.isFinite(ack)&&ack<now&&!task.assignee&&task.ackStatus!=='overdue'){task.ackStatus='overdue';task.chip='Acknowledgement overdue';changed=true;}
  if(Number.isFinite(due)&&due<now&&s.workflowConfig.autoEscalateOnOverdue){const id='sla-'+task.id;if(s.items.department_supervisor.some(i=>i.id===id)||s.items.department_manager.some(i=>i.id===id))continue;const queue=task.priority==='critical'||task.priority==='safety'?'department_manager':'department_supervisor';s.items[queue].unshift({...task,id,status:'Overdue',guest:false,linkedRef:task.ref,ref:undefined,chip:'Resolution SLA breached',owner:'SLA monitor',...{capturedAt:(task as any).capturedAt,resolutionDeadline:(task as any).resolutionDeadline}});(s.notifications??=[]).unshift({id,roleId:queue,title:'Overdue service escalation',message:(task.ref||task.id)+' · Room '+task.room,timestamp:new Date(now).toISOString(),read:false,type:'alert'});task.slaDue='Overdue';changed=true;}
 }return changed;
}
