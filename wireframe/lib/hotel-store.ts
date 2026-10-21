import { env } from "cloudflare:workers";
import { seedState, visibleTasks, type HotelState, type Role } from "./hotel-domain";

export function database() { if(!env.DB) throw new Error("The operational database is not available.");return env.DB; }
export async function loadState(){
 const db=database();let row=await db.prepare("SELECT data,version FROM workspaces WHERE id = ?").bind("atelier").first<{data:string;version:number}>();
 if(!row){const seed=seedState();await db.prepare("INSERT OR IGNORE INTO workspaces(id,data,version) VALUES(?,?,1)").bind("atelier",JSON.stringify(seed)).run();row=await db.prepare("SELECT data,version FROM workspaces WHERE id = ?").bind("atelier").first<{data:string;version:number}>();}
 if(!row)throw new Error("Could not initialize the property.");return {state:JSON.parse(row.data) as HotelState,version:row.version};
}
export function filterState(s:HotelState,role:Role):HotelState{
 const tasks=visibleTasks(s,role),roomAccess=["frontdesk","executive","admin"].includes(role),money=["frontdesk","executive","finance","manager"].includes(role);
 const rooms=roomAccess?s.rooms:[];
 return {...s,tasks,rooms,financials:money?(role==="manager"?s.financials.filter(f=>tasks.some(t=>t.room===f.room)):s.financials):[],incidents:role==="security"?s.incidents:[],audit:role==="admin"?s.audit:[],staff:["fulfiller","finance","security"].includes(role)?[]:s.staff,connectors:role==="admin"?s.connectors:[],policies:["manager","admin"].includes(role)?s.policies:[],messages:["frontdesk","dispatcher"].includes(role)?s.messages.filter(m=>role==="frontdesk"||tasks.some(t=>t.room===m.room)):[],handovers:s.handovers.filter(h=>["executive","frontdesk"].includes(role)||h.department===(role==="security"?"Security":"Housekeeping"))};
}
export async function saveState(s:HotelState,version:number,revokedRooms:string[]=[]){
 const db=database();
 // Serialize state changes; lifecycle revocation additionally revalidates room/email on every guest request.
 const result=await db.prepare("UPDATE workspaces SET data = ?, version = version + 1 WHERE id = ? AND version = ?").bind(JSON.stringify(s),"atelier",version).run();
 if(!result.meta.changes)throw new Error("This record changed. Refresh and try again.");
 for(const room of revokedRooms){await db.batch([db.prepare("DELETE FROM guest_sessions WHERE room = ?").bind(room),db.prepare("DELETE FROM guest_codes WHERE room = ?").bind(room)]);}
 return version+1;
}
export async function hash(value:string){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,"0")).join("");}
export async function guestRoom(request:Request,state:HotelState){
 const token=request.headers.get("cookie")?.match(/(?:^|;\s*)atelier_guest=([^;]+)/)?.[1];if(!token)return null;
 const session=await database().prepare("SELECT room,email,expires FROM guest_sessions WHERE digest = ?").bind(await hash(token)).first<{room:string;email:string;expires:number}>();
 if(!session||session.expires<Date.now())return null;
 return state.rooms.find(r=>r.id===session.room&&r.verified&&r.status==="Occupied"&&r.email===session.email)||null;
}
export async function rateLimit(key:string,max:number,windowMs:number){
 const db=database(),now=Date.now();
 await db.prepare("INSERT INTO login_limits(key,window,attempts) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET window=CASE WHEN window < ? THEN ? ELSE window END, attempts=CASE WHEN window < ? THEN 1 ELSE attempts+1 END").bind(key,now,now-windowMs,now,now-windowMs).run();
 const row=await db.prepare("SELECT attempts FROM login_limits WHERE key = ?").bind(key).first<{attempts:number}>();if((row?.attempts||0)>max)throw new Error("Too many attempts. Please wait before trying again.");
}
