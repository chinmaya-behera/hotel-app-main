import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:3000',origin=new URL(base).origin;
const accounts=JSON.parse(await readFile(new URL('../.demo-credentials.json',import.meta.url),'utf8'));
function client(){const jar=new Map();return {jar,async call(path,body){const headers={Cookie:[...jar].map(([k,v])=>k+'='+v).join(';')};if(body){headers.Origin=origin;headers['Content-Type']='application/json';}const r=await fetch(base+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined});for(const cookie of r.headers.getSetCookie()){const [name,...value]=cookie.split(';')[0].split('=');jar.set(name,value.join('='));}return {status:r.status,data:await r.json()};}};}
const a=client(),b=client();
assert.equal((await a.call('/api/hotel')).status,401);
assert.equal((await a.call('/api/demo-auth',{action:'login',username:'frontdesk.demo',password:'incorrect'})).status,401);
const login=async(c,role)=>{const account=accounts.find(a=>a.role===role),r=await c.call('/api/demo-auth',{action:'login',username:account.username,password:account.password});assert.equal(r.status,200,role+': sign-in failed');assert.equal(r.data.account.role,role);};
let workspace;
const samples={
 executive:{action:'approve',id:'FIN-104'},
 frontdesk:{action:'createTask',title:'Client demo login test',room:'101',department:'Housekeeping',category:'Amenities',priority:'Normal'},
 dispatcher:{action:'assign',id:'REQ-2405',assignee:'Sofia Rivera'},
 fulfiller:{action:'transition',id:'REQ-2401',status:'On the way'},
 supervisor:{action:'inspect',id:'REQ-2406',status:'Inspected',notes:'Synthetic inspection test'},
 manager:{action:'policy',category:'Housekeeping',acknowledgement:5,completion:35},
 finance:{action:'execute',id:'FIN-103'},
 security:{action:'incident',id:'INC-021',operation:'backup'},
 admin:{action:'staff',id:'runner',approval:'Approved access request'}
};
for(const account of accounts.filter(a=>a.username!=="finance-review.demo")){
 await login(a,account.role);const current=await a.call('/api/hotel');assert.equal(current.status,200);assert.equal(current.data.role,account.role);
 if(workspace)assert.equal(current.data.demoId,workspace);workspace=current.data.demoId;
 if(account.role==='fulfiller'){assert.ok(current.data.state.tasks.every(t=>t.assignee==='Sofia Rivera'));assert.equal(current.data.state.rooms.length,0);assert.equal(current.data.state.financials.length,0);}
 if(account.role!=='security')assert.equal(current.data.state.incidents.length,0);
 if(account.role!=='admin')assert.equal(current.data.state.connectors.length,0);
 const other=account.role==='admin'?'executive':'admin';assert.equal((await a.call('/api/hotel?role='+other)).status,403);
 assert.equal((await a.call('/api/hotel',{role:other,action:'retry',id:'pms',version:current.data.version})).status,403);
 const action=await a.call('/api/hotel',{...samples[account.role],role:account.role,version:current.data.version});assert.equal(action.status,200,account.role+': '+action.data.error);
 console.log('PASS: '+account.role+' login, scoped data, role-spoof rejection and permitted action.');
}
await login(b,'frontdesk');const independent=await b.call('/api/hotel');assert.notEqual(independent.data.demoId,workspace);assert.equal(independent.data.state.tasks.some(t=>t.title==='Client demo login test'),false);
const guest=await b.call('/api/guest?demo='+workspace);assert.equal(guest.data.room,null);assert.equal(guest.data.tasks.length,0);
const guestWrite=await b.call('/api/guest',{demo:workspace,action:'request',service:'Room cleaning'});assert.equal(guestWrite.status,401);
const before=await b.call('/api/hotel'),common={...samples.frontdesk,version:before.data.version,role:'frontdesk'};
const concurrent=await Promise.all([b.call('/api/hotel',{...common,title:'Concurrent A'}),b.call('/api/hotel',{...common,title:'Concurrent B'})]);assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
const stolen=new Map(a.jar);assert.equal((await a.call('/api/demo-auth',{action:'logout'})).status,200);assert.equal((await a.call('/api/hotel')).status,401);
a.jar.clear();for(const [k,v] of stolen)a.jar.set(k,v);assert.equal((await a.call('/api/hotel')).status,401);
console.log('PASS: visitor isolation, protected guest access, update conflicts and server-side logout revocation.');
console.log('All nine demo account checks passed.');
