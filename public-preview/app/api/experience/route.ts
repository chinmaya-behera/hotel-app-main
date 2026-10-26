import {randomBytes,scryptSync} from 'node:crypto';
import {db} from '../../../lib/store';
import {referenceRoles} from '../../../lib/demo-identities';
import {effectiveProfile,inScope} from '../../../lib/feature-lab';
import {sandbox,guestWorkspace,guestRoom,save,safeOrigin,limit,digest} from '../../../lib/store';
import {staffSession} from '../../../lib/demo-auth';
import {experience,experienceView,scanExperienceSla,runExperience,syncExperienceRooms,EXPERIENCE_ROLES,type ExperienceActor} from '../../../lib/experience-domain';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function context(surface:string,demo?:string){
 const w=surface==='guest'?await guestWorkspace(demo):await sandbox(),account=surface==='staff'?await staffSession(w):null;
 if(surface==='staff'&&!account)throw Error('AUTH: Staff sign-in required.');
 const room=surface==='guest'?await guestRoom(w):null;
 const actor:ExperienceActor=account?{...account}:room?{role:'frontdesk',username:'guest:'+room.id,person:room.guest,room:room.id,guest:true}:{role:'frontdesk',username:surface==='guest'?'unverifiedguest':'website',person:'Website guest',public:true};
 if(account){const e=experience(w.data);syncExperienceRooms(w.data,e);const profile=effectiveProfile(w.data,account);const staff=e.staffAccounts.find(st=>st.name===account.person),zone=profile.grant==='base'&&staff?.department!=='Spa & Wellness'?/Floors?\s*(\d+)\s*(?:[–-]\s*(\d+))?/i.exec(staff?.floorZone||''):null;
 actor.allowedRooms=e.frontDesk.rooms.filter(r=>inScope(w.data,account,r.no)&&(!zone||r.floor>=Number(zone[1])&&r.floor<=Number(zone[2]||zone[1]))).map(r=>r.no);actor.scoped=profile.grant!=='base'||!!zone&&actor.allowedRooms.length<e.frontDesk.rooms.filter(r=>inScope(w.data,account,r.no)).length;}
 return {w,actor,account,room};
}
export async function GET(request:Request){try{
 const url=new URL(request.url),surface=url.searchParams.get('surface')||'public',c=await context(surface,url.searchParams.get('demo')||undefined),s=experience(c.w.data);
 let version=c.w.version;if(scanExperienceSla(s)||!(c.w.data as any).experienceInitialized){(c.w.data as any).experienceInitialized=true;syncExperienceRooms(c.w.data,s);version=await save(c.w,c.w.data);}
 return json({state:experienceView(s,c.actor),version,demoId:c.w.id,account:c.account?{...c.account,referenceRole:EXPERIENCE_ROLES[c.account.role]}:null,guestRoom:c.room?{id:c.room.id,guest:c.room.guest}:null});
}catch(e){const message=e instanceof Error?e.message:'Could not load the workspace.';return json({error:message.replace('AUTH: ','')},message.startsWith('AUTH:')||message.includes('expired')?401:503);}}
export async function POST(request:Request){try{
 safeOrigin(request);if(Number(request.headers.get('content-length')||0)>450000)return json({error:'Attachment or request is too large.'},413);
 const raw=await request.text();if(raw.length>450000)return json({error:'Attachment or request is too large.'},413);const b=JSON.parse(raw);
 if(!b||typeof b.action!=='string'||!Array.isArray(b.args)||typeof b.commandId!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(b.commandId))return json({error:'Invalid workflow command.'},400);
 const c=await context(b.surface,b.demo),box=c.w.data as any;
 if(b.surface==='guest'&&!c.room)return json({error:'Verify your room access first.'},401);
 const fingerprint=digest(JSON.stringify({action:b.action,args:b.args}));const prior=box.experienceCommands?.find((p:any)=>p.id===b.commandId&&p.username===c.actor.username);if(prior&&prior.fingerprint!==fingerprint)return json({error:'This command ID was already used for different input.'},409);if(prior)return json({state:experienceView(experience(c.w.data),c.actor),version:c.w.version,demoId:c.w.id,...prior.result});
 await limit('experience-write:'+c.w.id,180,60000);if(b.version!==c.w.version)return json({error:'The workspace changed. Refresh and retry this action.'},409);
 const oldStaffIds=new Set(experience(c.w.data).staffAccounts.map(st=>st.id));const result=runExperience(experience(c.w.data),c.actor,b.action,b.args,b.commandId);let credentials:undefined|{username:string;password:string};
 if(b.action==='addStaffAccount'){const staff=result.state.staffAccounts.find(st=>!oldStaffIds.has(st.id));if(!staff)throw Error('Staff creation did not produce an identity.');const password='Atelier-'+randomBytes(12).toString('base64url'),salt=randomBytes(16).toString('hex'),hash=salt+':'+scryptSync(password,salt,64).toString('hex'),username='staff-'+b.commandId.slice(0,12).toLowerCase();const rows=await db().query('INSERT INTO demo_staff_accounts(username,role,password_hash,display_name,reference_staff_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(username) DO NOTHING RETURNING username',[username,referenceRoles[staff.roleId],hash,staff.name,staff.id]);if(rows.length)credentials={username,password};}
box.experience=result.state;
 const revoked=syncExperienceRooms(c.w.data,result.state),response={result:result.result,message:result.message};box.experienceCommands=[{id:b.commandId,username:c.actor.username,fingerprint,result:response},...(box.experienceCommands||[])].slice(0,150);
 const version=await save(c.w,c.w.data,revoked);return json({state:experienceView(result.state,c.actor),version,demoId:c.w.id,...response,credentials});
}catch(e){const message=e instanceof Error?e.message:'Could not save the workspace.';return json({error:message.replace('AUTH: ','')},message.startsWith('AUTH:')?401:message.includes('changed')?409:422);}}
