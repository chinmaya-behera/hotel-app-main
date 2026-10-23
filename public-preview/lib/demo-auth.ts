import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { db, digest, type Workspace } from "./store";
import { isRole, roleInfo, type Role } from "./hotel-domain";
import {effectiveProfile,lab} from "./feature-lab";
const derive=promisify(scrypt);
const options={httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax" as const,path:"/",maxAge:28800};
export async function verifyPassword(password:string,hash:string){
 const [salt,key]=hash.split(":");if(!salt||!key)return false;
 const expected=Buffer.from(key,"hex"),actual=await derive(password,salt,64) as Buffer;
 return expected.length===actual.length&&timingSafeEqual(expected,actual);
}
export async function staffSession(workspace:Workspace):Promise<{role:Role;username:string;person:string;baseRole:Role}|null>{
 const token=(await cookies()).get("atelier_staff")?.value;if(!token||token.length>200)return null;
 const rows=await db().query("SELECT a.role,a.username FROM demo_staff_sessions s JOIN demo_staff_accounts a ON a.username=s.username WHERE s.digest=$1 AND s.workspace_id=$2 AND s.expires>now() AND a.active=true",[digest(token),workspace.id]);
 const account=rows[0];if(!account||!isRole(account.role)||!workspace.data.staff.some(s=>s.id===(account.username==="finance-review.demo"&&workspace.data.staff.some(x=>x.id==="finance-review")?"finance-review":account.role)&&s.active))return null;
 const baseRole=account.role as Role;return {role:effectiveProfile(workspace.data,{role:baseRole,baseRole,username:account.username,person:roleInfo(baseRole).person}).role,baseRole,username:account.username,person:account.username==="finance-review.demo"?"Avery Shah":roleInfo(baseRole).person};
}
export async function logoutStaff(){const jar=await cookies(),old=jar.get("atelier_staff")?.value;if(old)await db().query("DELETE FROM demo_staff_sessions WHERE digest=$1",[digest(old)]);jar.set("atelier_staff","",{...options,maxAge:0});}
export async function loginStaff(username:string,password:string,workspace:Workspace){
 const rows=await db().query("SELECT username,role,password_hash FROM demo_staff_accounts WHERE username=$1 AND active=true",[username]),account=rows[0];
 const hash=account?.password_hash||"00000000000000000000000000000000:"+"00".repeat(64);
 const valid=await verifyPassword(password,hash);
 if(!account||!valid||!isRole(account.role)||!workspace.data.staff.some(s=>s.id===(account.username==="finance-review.demo"&&workspace.data.staff.some(x=>x.id==="finance-review")?"finance-review":account.role)&&s.active))return null;
 await logoutStaff();const token=randomBytes(32).toString("base64url");
 await db().query("INSERT INTO demo_staff_sessions(digest,workspace_id,username,expires) VALUES($1,$2,$3,$4)",[digest(token),workspace.id,account.username,new Date(Date.now()+lab(workspace.data).settings.sessionMinutes*60000).toISOString()]);
 (await cookies()).set("atelier_staff",token,options);return {role:account.role,username:account.username,person:account.username==="finance-review.demo"?"Avery Shah":roleInfo(account.role).person};
}
