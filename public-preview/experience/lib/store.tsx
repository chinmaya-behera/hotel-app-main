'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {createExperienceEngine,seedExperience} from './engine';
import type {DemoApi} from './contracts';
import type {DemoState,RoleId} from '../types/demo';
import names from './action-names.json';
type Session={role:string;person:string;username:string;referenceRole:RoleId}|null;
type Api=DemoApi&{account:Session;demoId:string;guestRoom:{id:string;guest:string}|null;refresh:()=>Promise<void>;flush:()=>Promise<void>;pending:number};
const Context=createContext<Api|null>(null);
export function DemoProvider({children}:{children:ReactNode}){
 const pathname=usePathname(),surface=pathname.startsWith('/staff/')?'staff':pathname.startsWith('/guest/')?'guest':'public';
 const [state,setState]=useState<DemoState>(seedExperience),[hydrated,setHydrated]=useState(false),[account,setAccount]=useState<Session>(null),[demoId,setDemoId]=useState(''),[guestRoom,setGuestRoom]=useState<Api['guestRoom']>(null),[pending,setPending]=useState(0),[message,setMessage]=useState(''),[error,setError]=useState(''),[newLogin,setNewLogin]=useState<{username:string;password:string}|null>(null);
 const current=useRef(state),version=useRef(0),demo=useRef(''),chain=useRef<Promise<void>>(Promise.resolve()),mounted=useRef(true),pendingRef=useRef(0),epoch=useRef(0),surfaceRef=useRef(surface);surfaceRef.current=surface;
 const notify=useCallback((text:string)=>setMessage(text),[]);
 const install=useCallback((j:any)=>{current.current=j.state;version.current=j.version;demo.current=j.demoId;setState(j.state);setDemoId(j.demoId);if('account'in j)setAccount(j.account);if('guestRoom'in j)setGuestRoom(j.guestRoom);setHydrated(true);},[]);
 const refresh=useCallback(async()=>{try{const shared=new URLSearchParams(location.search).get('demo')||demo.current;const stamp=epoch.current;const r=await fetch('/api/experience?surface='+surfaceRef.current+(shared?'&demo='+encodeURIComponent(shared):''),{cache:'no-store',signal:AbortSignal.timeout(30000)}),j=await r.json();if(!r.ok){if(r.status===401&&surfaceRef.current==='staff'){location.assign('/login');return;}throw Error(j.error);}if(mounted.current&&stamp===epoch.current)install(j);}catch(e){if(mounted.current){setError(e instanceof Error?e.message:'Could not load the workspace.');setHydrated(true);}}},[install]);
 useEffect(()=>{mounted.current=true;setHydrated(false);void refresh();const timer=setInterval(()=>{if(document.visibilityState==='visible'&&version.current&&pendingRef.current===0)void refresh();},15000);return()=>{mounted.current=false;clearInterval(timer);};},[pathname,refresh]);
 useEffect(()=>{if(!message)return;const id=setTimeout(()=>setMessage(''),6000);return()=>clearTimeout(id);},[message]);
 const invoke=useCallback((action:string,args:unknown[])=>{
  epoch.current++;const commandId=crypto.randomUUID();let result:unknown;
  try{const prediction=createExperienceEngine(current.current,commandId),fn=(prediction as any)[action];if(typeof fn==='function'){result=fn(...structuredClone(args));if(action==='fdAction'&&typeof result==='string'){setError(result);return result;}current.current=prediction.state;setState(prediction.state);}}
  catch(e){setError(e instanceof Error?e.message:'Check the form values.');return action==='fdAction'?'Check the form values.':undefined;}
  pendingRef.current++;setPending(pendingRef.current);setError('');
  chain.current=chain.current.then(async()=>{try{const r=await fetch('/api/experience',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),body:JSON.stringify({surface:surfaceRef.current,demo:demo.current,action,args,version:version.current,commandId})}),j=await r.json();if(!r.ok)throw Error(j.error);if(mounted.current){install(j);if(j.credentials)setNewLogin(j.credentials);setMessage(j.message);}}catch(e){await refresh();if(mounted.current)setError((e instanceof Error?e.message:'Could not save.')+' Review the saved state before retrying.');}finally{pendingRef.current=Math.max(0,pendingRef.current-1);if(mounted.current)setPending(pendingRef.current);}});
  return result;
 },[install,refresh]);
 const api:any={state,hydrated,account,demoId,guestRoom,pending,refresh,flush:()=>chain.current,notify,setPersona:()=>{},setTheme:()=>notify('Atelier uses a quiet beige theme across every workspace.'),reset:()=>invoke('resetWorkspace',[])};
 for(const name of names)api[name]=(...args:unknown[])=>invoke(name,args);
 return <Context.Provider value={api}><div className="experience-app">{surface==='staff'&&hydrated&&<div className="experience-demo-caption">Client demonstration · synthetic hotel records · seeded trends are illustrative · payments and external operations are simulations</div>}{!hydrated?<div className="mx-auto max-w-xl px-6 py-24"><p className="eyebrow">ATELIER HOTEL</p><h1 className="font-display text-3xl">Preparing your workspace…</h1></div>:<div inert={pending>0}>{children}</div>}{newLogin&&<div className="experience-status" role="status"><strong>New staff login — copy now:</strong> {newLogin.username} / {newLogin.password}<button className="ml-3 underline" onClick={()=>setNewLogin(null)}>Dismiss</button></div>}{error&&<div className="experience-status experience-error" role="alert">{error}<button type="button" className="ml-3 underline" onClick={()=>{setError('');void refresh();}}>Refresh</button><button aria-label="Dismiss error" className="ml-3" onClick={()=>setError('')}>×</button></div>}{!error&&(pending>0||message)&&<div className="experience-status" role="status">{pending>0?'Saving changes…':message}</div>}</div></Context.Provider>;
}
export function useDemo():Api{const api=useContext(Context);if(!api)throw Error('Workspace provider is required.');return api;}
