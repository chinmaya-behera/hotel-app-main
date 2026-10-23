import {createHash} from 'node:crypto';
import {staffSession} from '../../../lib/demo-auth';
import {sandbox,save,input,safeOrigin,limit} from '../../../lib/store';
import {applyFeature,featureView,lab,inScope} from '../../../lib/feature-lab';
import {visibleTasks} from '../../../lib/hotel-domain';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(request:Request){try{
 const w=await sandbox(false),actor=await staffSession(w);if(!actor)return json({error:'Staff sign-in required.'},401);
 const download=new URL(request.url).searchParams.get('download');
 if(download){const file=lab(w.data).attachments.find(f=>f.id===download);if(!file||!(file.incident?actor.role==='security':visibleTasks(w.data,actor.role,actor.person).some(t=>t.id===file.task&&inScope(w.data,actor,t.room,t.department))))return json({error:'Attachment unavailable in scope.'},404);
  return new Response(file.content,{headers:{'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="'+file.name+'"','X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store'}});
 }
 return json({data:featureView(w.data,actor),version:w.version});
}catch(e){const message=e instanceof Error?e.message:'Could not load features.';return json({error:message},message.includes('expired')?401:503);}}
export async function POST(request:Request){try{
 safeOrigin(request);const b=await input(request),w=await sandbox(false),actor=await staffSession(w);if(!actor)return json({error:'Staff sign-in required.'},401);
 await limit('feature-write:'+w.id,150,60000);if(b.version!==w.version)return json({error:'This record changed. Refresh before trying again.'},409);
 if(lab(w.data).settings.mfaRequired&&!['mfaChallenge','mfaVerify','switchProfile','scopeProbe'].includes(b.action)&&!(Date.parse(lab(w.data).mfa[actor.username]?.verifiedUntil||'')>Date.now()))return json({error:'Complete the labelled MFA exercise before changing demo features.'},403);
 if(b.action==='attachment')b.digest=createHash('sha256').update(typeof b.content==='string'?b.content:'').digest('hex');
 const result=applyFeature(w.data,actor,b.action,b),revoked=b.action==='pms'&&b.operation==='Checkout'?[String(b.room)]:['retryOperation','verifyOperation','callback'].includes(b.action)?lab(w.data).operations.filter(o=>o.id===b.id&&o.provider==='PMS'&&o.operation==='Checkout'&&o.status==='Confirmed').map(o=>o.room):[];
 const version=await save(w,w.data,revoked);return json({data:featureView(w.data,actor),version,result});
}catch(e){const message=e instanceof Error?e.message:'Could not save features.';return json({error:message},message.includes('expired')?401:message.includes('changed')?409:422);}}
