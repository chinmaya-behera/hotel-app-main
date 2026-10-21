import { getChatGPTUser } from "../../chatgpt-auth";
import { applyAction, isRole } from "../../../lib/hotel-domain";
import { filterState,loadState,saveState } from "../../../lib/hotel-store";
export const dynamic="force-dynamic";
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{"Cache-Control":"no-store"}});
async function identity(){return getChatGPTUser();}
export async function GET(request:Request){
 try{if(!await identity())return json({error:"Sign in to open the private wireframe.",signIn:true},401);const role=new URL(request.url).searchParams.get("role")||"executive";if(!isRole(role))return json({error:"Unknown role."},400);const {state,version}=await loadState();return json({state:filterState(state,role),version});}catch(e){return json({error:e instanceof Error?e.message:"Could not load the property."},500);}
}
export async function POST(request:Request){
 try{if(!await identity())return json({error:"Sign-in required."},401);if(request.headers.get("origin")!==new URL(request.url).origin)return json({error:"Invalid request origin."},403);const b=await request.json() as Record<string,any>;if(!isRole(b.role))return json({error:"Unknown role."},400);const {state,version}=await loadState();if(b.version!==version)return json({error:"The property changed. Refresh and try again."},409);
 // Role selection is an explicit owner-only persona preview, not production staff authentication.
 if(!state.staff.some(s=>s.id===b.role&&s.active))return json({error:"This staff profile has been deactivated."},403);
 const revoked=["room","registerRoom","revoke"].includes(b.action)?[String(b.id)]:[];
 if(b.action!=="revoke")applyAction(state,b.role,b.action,b);
 else if(!["frontdesk","admin"].includes(b.role))return json({error:"Not authorized."},403);
 const next=await saveState(state,version,revoked);return json({state:filterState(state,b.role),version:next});
 }catch(e){const error=e instanceof Error?e.message:"Could not save this action.";return json({error},error.includes("changed")?409:422);}
}
