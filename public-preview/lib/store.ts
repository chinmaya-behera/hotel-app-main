import { neon,neonConfig } from "@neondatabase/serverless";
import { randomBytes,randomUUID,createHash } from "node:crypto";
import { cookies } from "next/headers";
import { seedState,type HotelState } from "./hotel-domain";
export { filterState } from "./filter-state";

// Bound each network request independently, including multi-statement guest flows.
neonConfig.fetchFunction=(url:Parameters<typeof fetch>[0],options?:Parameters<typeof fetch>[1])=>fetch(url,{...options,signal:options?.signal?AbortSignal.any([options.signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)});

export const digest=(v:string)=>createHash("sha256").update(v).digest("hex");
export function db(){if(!process.env.DATABASE_URL)throw new Error("The preview database is not configured.");return neon(process.env.DATABASE_URL);}
export type Workspace={id:string;data:HotelState;version:number;expires:string};
const cookieOptions={httpOnly:true,sameSite:"lax" as const,secure:process.env.NODE_ENV==="production",path:"/",maxAge:43200};
export async function sandbox(create=true):Promise<Workspace>{
 const jar=await cookies(),token=jar.get("atelier_demo")?.value;
 if(token&&token.length<200){const rows=await db().query("SELECT id,data,version,expires FROM demo_workspaces WHERE session_digest=$1 AND expires>now()",[digest(token)]);if(rows[0])return rows[0] as Workspace;}
 if(!create)throw new Error("Your preview session expired. Reload the workspace.");
 const secret=randomBytes(32).toString("base64url"),id=randomUUID(),expires=new Date(Date.now()+43200000).toISOString(),data=seedState();
 await db().query("INSERT INTO demo_workspaces(id,session_digest,data,expires) VALUES($1,$2,$3::jsonb,$4)",[id,digest(secret),JSON.stringify(data),expires]);
 jar.set("atelier_demo",secret,cookieOptions);
 return {id,data,version:1,expires};
}
export async function guestWorkspace(sharedId?:unknown):Promise<Workspace>{
 if(sharedId){if(typeof sharedId!=="string"||!/^[-0-9a-f]{36}$/i.test(sharedId))throw new Error("Room link is invalid.");const rows=await db().query("SELECT id,data,version,expires FROM demo_workspaces WHERE id=$1 AND expires>now()",[sharedId]);if(!rows[0])throw new Error("This room preview has expired. Ask for a fresh QR link.");return rows[0] as Workspace;}
 return sandbox();
}
export async function save(workspace:Workspace,state:HotelState,revokedRooms:string[]=[]){
 const results=await db().query("WITH changed AS (UPDATE demo_workspaces SET data=$1::jsonb,version=version+1 WHERE id=$2 AND version=$3 RETURNING id,version), revoked_sessions AS (DELETE FROM demo_guest_sessions USING changed WHERE workspace_id=changed.id AND room=ANY($4::text[]) RETURNING digest), revoked_codes AS (DELETE FROM demo_guest_codes USING changed WHERE workspace_id=changed.id AND room=ANY($4::text[]) RETURNING demo_guest_codes.id) SELECT version FROM changed",[JSON.stringify(state),workspace.id,workspace.version,revokedRooms]);
 if(!results[0])throw new Error("The record changed. Refresh and try again.");return Number(results[0].version);
}
export async function guestRoom(workspace:Workspace){
 const jar=await cookies(),token=jar.get("atelier_guest")?.value;if(!token)return null;
 const rows=await db().query("SELECT room,email FROM demo_guest_sessions WHERE digest=$1 AND workspace_id=$2 AND expires>now()",[digest(token),workspace.id]);
 const session=rows[0];if(!session)return null;
 return workspace.data.rooms.find(r=>r.id===session.room&&r.email===session.email&&r.verified&&r.status==="Occupied")||null;
}
export async function createGuestSession(workspace:Workspace,room:string,email:string){
 const token=randomBytes(32).toString("base64url");
 await db().query("INSERT INTO demo_guest_sessions(digest,workspace_id,room,email,expires) VALUES($1,$2,$3,$4,$5)",[digest(token),workspace.id,room,email,new Date(Date.now()+43200000).toISOString()]);
 (await cookies()).set("atelier_guest",token,cookieOptions);
}
export async function logoutGuest(){const jar=await cookies(),token=jar.get("atelier_guest")?.value;if(token)await db().query("DELETE FROM demo_guest_sessions WHERE digest=$1",[digest(token)]);jar.set("atelier_guest","",{...cookieOptions,maxAge:0});}
export async function limit(key:string,maximum:number,windowMs:number){
 const now=Date.now(),bucket=Math.floor(now/windowMs),end=new Date((bucket+1)*windowMs).toISOString();
 const rows=await db().query("INSERT INTO demo_rate_limits(key,count,expires) VALUES($1,1,$2) ON CONFLICT(key) DO UPDATE SET count=demo_rate_limits.count+1 RETURNING count",[digest(key+":"+bucket),end]);
 if(Number(rows[0].count)>maximum)throw new Error("Too many attempts. Please wait before trying again.");
}
export function safeOrigin(request:Request){const origin=request.headers.get("origin"),url=new URL(request.url),host=request.headers.get("host")||url.host,scheme=request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()||url.protocol.slice(0,-1);if(!origin)throw new Error("Invalid request origin.");const source=new URL(origin);if(source.host!==host||source.protocol!==scheme+":")throw new Error("Invalid request origin.");}
export async function input(request:Request){if(Number(request.headers.get("content-length")||0)>16000)throw new Error("Request is too large.");const data:unknown=await request.json();if(!data||typeof data!=="object"||Array.isArray(data))throw new Error("Invalid request data.");return data as Record<string,any>;}
