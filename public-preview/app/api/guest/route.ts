import {randomBytes,randomUUID} from "node:crypto";
import {guestWorkspace,guestRoom,save,db,digest,limit,input,safeOrigin,createGuestSession,logoutGuest} from "../../../lib/store";
import {sendPassword,emailReady} from "../../../lib/email";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:Request){try{const w=await guestWorkspace(new URL(request.url).searchParams.get("demo")),room=await guestRoom(w);return json({demoId:w.id,rooms:w.data.rooms.map(r=>({id:r.id,type:r.type})),room:room?{id:room.id,type:room.type,guest:room.guest,arrival:room.arrival,departure:room.departure}:null,tasks:room?w.data.tasks.filter(t=>t.room===room.id).map(t=>({id:t.id,title:t.title,status:t.status,due:t.due,department:t.department})):[],messages:room?w.data.messages.filter(m=>m.room===room.id):[],emailReady:emailReady()});}catch(e){return json({error:e instanceof Error?e.message:"Guest preview unavailable."},422);}}
export async function POST(request:Request){try{
 safeOrigin(request);const b=await input(request),w=await guestWorkspace(b.demo),sql=db();
 if(b.action==="requestPassword"){
  const room=w.data.rooms.find(r=>r.id===b.room&&r.status==="Occupied"&&r.verified&&r.email);if(!room)return json({error:"Register and verify the guest's email in Front Desk first."},422);
  await limit("email-workspace:"+w.id,3,3600000);await limit("email-recipient:"+room.email.toLowerCase(),5,3600000);await limit("email-global",30,86400000);
  const password=randomBytes(12).toString("base64url"),challenge=randomUUID();
  await sendPassword(room.email,password,room.id);
  await sql.transaction([sql.query("DELETE FROM demo_guest_codes WHERE workspace_id=$1 AND room=$2",[w.id,room.id]),sql.query("INSERT INTO demo_guest_codes(id,workspace_id,room,email,digest,expires,sent) VALUES($1,$2,$3,$4,$5,$6,true)",[challenge,w.id,room.id,room.email,digest(password),new Date(Date.now()+600000).toISOString()])]);
  return json({challenge,message:"The email provider accepted your access password email. Check the registered inbox."});
 }
 if(b.action==="verify"){
  if(typeof b.challenge!=="string"||!/^[-a-f0-9]{36}$/i.test(b.challenge))return json({error:"Request a fresh password."},401);
  await limit("verify:"+w.id+":"+String(b.room),15,900000);
  const rows=await sql.query("UPDATE demo_guest_codes SET attempts=attempts+1 WHERE id=$1 AND workspace_id=$2 AND room=$3 AND sent=true AND expires>now() AND attempts<5 RETURNING email,digest",[b.challenge,w.id,String(b.room)]),code=rows[0];
  if(!code||digest(String(b.password))!==code.digest)return json({error:"Invalid or expired access password."},401);
  const room=w.data.rooms.find(r=>r.id===b.room&&r.email===code.email&&r.verified&&r.status==="Occupied");if(!room)return json({error:"Room access was revoked."},401);
  const consumed=await sql.query("DELETE FROM demo_guest_codes WHERE id=$1 AND workspace_id=$2 RETURNING id",[b.challenge,w.id]);if(!consumed.length)return json({error:"Password already used."},401);
  await createGuestSession(w,room.id,room.email);return json({ok:true});
 }
 if(b.action==="logout"){await logoutGuest();return json({ok:true});}
 const room=await guestRoom(w);if(!room)return json({error:"Verify your room access first."},401);
 if(b.action==="request"){
  await limit("guest-write:"+w.id+":"+room.id,20,3600000);
  const catalog:Record<string,string>={"Fresh towels":"Housekeeping","Room cleaning":"Housekeeping","Laundry collection":"Housekeeping","Room service":"Food & Beverage","Breakfast":"Food & Beverage","Maintenance help":"Maintenance","Airport transfer":"Front Office","Late checkout":"Front Office","Spa appointment":"Spa & Recreation","Security assistance":"Security"};const department=catalog[b.service];if(!department)return json({error:"Choose a valid service."},422);const at=new Date().toISOString();
  w.data.tasks.unshift({id:"REQ-"+randomUUID().slice(0,8).toUpperCase(),title:b.service,room:room.id,guest:room.guest,department,category:b.service,status:"Open",priority:department==="Security"?"High":"Normal",assignee:"",created:at,due:new Date(Date.now()+1800000).toISOString(),notes:String(b.notes||"").slice(0,1000),caseId:"CASE-"+randomUUID().slice(0,8),history:[{at,text:"Requested through the public preview guest portal",actor:room.guest}]});if(department==="Security"){const task=w.data.tasks[0];w.data.incidents.unshift({id:"INC-"+randomUUID().slice(0,8).toUpperCase(),title:"Guest security assistance",room:room.id,severity:"High",status:"Open",notes:task.notes||"Guest requested assistance through the room portal. Follow the hotel emergency plan.",responder:"Lucas Martin",evidence:[],taskId:task.id});}await save(w,w.data);return json({ok:true});
 }
 return json({error:"Unknown guest action."},400);
 }catch(e){return json({error:e instanceof Error?e.message:"Guest action could not complete."},422);}}
