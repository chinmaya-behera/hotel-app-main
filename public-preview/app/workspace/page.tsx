import {redirect} from 'next/navigation';
import {sandbox} from '../../lib/store';
import {staffSession} from '../../lib/demo-auth';
import {EXPERIENCE_PATHS} from '../../lib/experience-domain';
export const dynamic='force-dynamic';
export default async function Page(){const w=await sandbox(false).catch(()=>null),account=w?await staffSession(w):null;redirect(account?'/staff/'+EXPERIENCE_PATHS[account.role]:'/login');}
