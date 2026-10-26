import {redirect,notFound} from 'next/navigation';
import {sandbox} from '../../../../lib/store';
import {staffSession} from '../../../../lib/demo-auth';
import {EXPERIENCE_PATHS,EXPERIENCE_ROLES} from '../../../../lib/experience-domain';
import {RoleDashboard} from '../../../../experience/components/staff/RoleDashboard';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{role:string}>}){const {role}=await params;if(!Object.values(EXPERIENCE_PATHS).includes(role))notFound();const w=await sandbox(false).catch(()=>null),account=w?await staffSession(w):null;if(!account)redirect('/login');if(EXPERIENCE_PATHS[account.role]!==role)redirect('/staff/'+EXPERIENCE_PATHS[account.role]);return <RoleDashboard roleId={EXPERIENCE_ROLES[account.role]}/>;}
