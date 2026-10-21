import { getChatGPTUser } from "../../chatgpt-auth";
import { database,guestRoom,hash,loadState,rateLimit,saveState } from "../../../lib/hotel-store";
import { sendRoomPassword, emailConfigured } from "../../../lib/email";
export const dynamic="force-dynamic";
const json=(v:unknown,status=200,headers:Record<string,string>={})=>Response.json(v,{status,headers:{"Cache-Control":"no-store",...headers}});
export async function GET(request:Request){try{if(!await getChatGPTUser())return json({error:"Sign in to view this private wireframe.",signIn:true},401);const {state}=await loadState(),room=await guestRoom(request,state);return json({rooms:state.rooms.map(r=>({id:r.id,type:r.type})),room:room?{id:room.id,type:room.type,guest:room.guest,arrival:room.arrival,departure:room.departure}:null,tasks:room?state.tasks.filter(t=>t.room===room.id).map(t=>({id:t.id,title:t.title,status:t.status,due:t.due,department:t.department})):[],messages:room?state.messages.filter(m=>m.room===room.id):[],emailReady:emailConfigured()});}catch(e){return json({error:e instanceof Error?e.message:"Could not load guest access."},500);}}
export async function POST(request:Request){try{
 if(!await getChatGPTUser())return json({error:"Sign-in required."},401);if(request.headers.get("origin")!==new URL(request.url).origin)return json({error:"Invalid request origin."},403);
 const b=await request.json() as Record<string,any>,{state,version}=await loadState(),db=database();
 if(b.action==="requestPassword"){
  await rateLimit("send:"+String(b.room),3,15*60000);
  const room=state.rooms.find(r=>r.id===b.room&&r.status==="Occupied"&&r.verified&&r.email);
  if(!room)return json({error:"Front Desk must verify the stay and register the room's email before access can be sent."},422);
  const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);const password=Array.from(bytes,v=>(v%36).toString(36)).join("");const challenge=crypto.randomUUID();
  await sendRoomPassword(room.email,password,room.id);
  await db.batch([db.prepare("DELETE FROM guest_codes WHERE room = ?").bind(room.id),db.prepare("INSERT INTO guest_codes(id,room,digest,email,expires,attempts,sent) VALUES(?,?,?,?,?,0,1)").bind(challenge,room.id,await hash(password),room.email,Date.now()+10*60000)]);
  return json({challenge,message:"Access password accepted by the email provider. Check your registered inbox. It expires in 10 minutes."});
 }
 if(b.action==="verify"){
  await rateLimit("verify:"+String(b.room),10,15*60000);
  const code=await db.prepare("SELECT * FROM guest_codes WHERE id = ? AND room = ?").bind(String(b.challenge),String(b.room)).first<{id:string;room:string;digest:string;email:string;expires:number;attempts:number;sent:number}>();
  if(!code||!code.sent||code.expires<Date.now()||code.attempts>=5)return json({error:"Password expired or unavailable. Request a new one."},401);
  const updated=await db.prepare("UPDATE guest_codes SET attempts=attempts+1 WHERE id=? AND attempts < 5").bind(code.id).run();if(!updated.meta.changes)return json({error:"Too many attempts."},429);
  const room=state.rooms.find(r=>r.id===code.room&&r.email===code.email&&r.verified&&r.status==="Occupied");if(!room||await hash(String(b.password))!==code.digest)return json({error:"Invalid access password."},401);
  const token=crypto.randomUUID()+crypto.randomUUID();const consumed=await db.prepare("DELETE FROM guest_codes WHERE id = ?").bind(code.id).run();if(!consumed.meta.changes)return json({error:"Password was already used."},401);
  await db.prepare("INSERT INTO guest_sessions(digest,room,email,expires) VALUES(?,?,?,?)").bind(await hash(token),room.id,room.email,Date.now()+12*3600000).run();return json({ok:true},200,{"Set-Cookie":`atelier_guest=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${new URL(request.url).protocol==="https:"?"; Secure":""}`});
 }
 const room=await guestRoom(request,state);if(!room)return json({error:"Verify your room access first."},401);
 if(b.action==="logout")return json({ok:true},200,{"Set-Cookie":"atelier_guest=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"});
 if(b.action==="request"){
  const catalog:Record<string,string>={"Fresh towels":"Housekeeping","Room cleaning":"Housekeeping","Laundry collection":"Housekeeping","Room service":"Food & Beverage","Breakfast":"Food & Beverage","Maintenance help":"Maintenance","Airport transfer":"Front Office","Late checkout":"Front Office","Spa appointment":"Spa & Recreation","Security assistance":"Security"};
  const department=catalog[b.service];if(!department)return json({error:"Choose a valid service."},422);const at=new Date().toISOString();
  state.tasks.unshift({id:"REQ-"+crypto.randomUUID().slice(0,8).toUpperCase(),title:b.service,room:room.id,guest:room.guest,department,category:b.service,status:"Open",priority:department==="Security"?"High":"Normal",assignee:"",created:at,due:new Date(Date.now()+30*60000).toISOString(),notes:String(b.notes||"").slice(0,1000),caseId:"CASE-"+crypto.randomUUID().slice(0,8),history:[{at,text:"Requested through the room guest portal",actor:room.guest}]});await saveState(state,version);return json({ok:true});
 }
 return json({error:"Unknown guest action."},400);
 }catch(e){return json({error:e instanceof Error?e.message:"Guest action failed."},503);}}
