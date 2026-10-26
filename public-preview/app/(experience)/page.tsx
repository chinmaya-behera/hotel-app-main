import {redirect} from 'next/navigation';
import {HotelPreview} from '../../experience/components/shared/HotelPreview';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const q=await searchParams;if(q.guest)redirect('/guest/portal?'+new URLSearchParams(Object.entries(q).filter(([,v])=>v!==undefined) as [string,string][]).toString());return <HotelPreview/>;}
