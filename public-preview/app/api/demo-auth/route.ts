import { input, limit, safeOrigin, sandbox } from "../../../lib/store";
import { loginStaff, logoutStaff, staffSession } from "../../../lib/demo-auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(){try{const w=await sandbox();return json({account:await staffSession(w)});}catch{return json({error:"Demo login is temporarily unavailable."},503);}}
export async function POST(request:Request){try{
 safeOrigin(request);const b=await input(request);
 if(b.action==="logout"){await logoutStaff();return json({ok:true});}
 if(b.action!=="login"||typeof b.username!=="string"||typeof b.password!=="string"||b.username.length>100||b.password.length>200)return json({error:"Enter your demo username and password."},400);
 const username=b.username.trim().toLowerCase(),ip=request.headers.get("x-vercel-forwarded-for")||request.headers.get("x-forwarded-for")||"local";
 await limit("staff-login-ip:"+ip,60,900000);await limit("staff-login-user:"+username,30,900000);
 const w=await sandbox();await limit("staff-login-workspace:"+w.id,30,900000);
 const account=await loginStaff(username,b.password,w);
 return account?json({account}):json({error:"Invalid demo credentials or inactive profile."},401);
 }catch(e){const msg=e instanceof Error?e.message:"";return json({error:msg.startsWith("Too many")?msg:"Could not complete demo sign-in."},msg.startsWith("Too many")?429:400);}}
