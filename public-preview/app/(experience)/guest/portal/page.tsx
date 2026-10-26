import {GuestGate} from '../../../../experience/components/shared/GuestGate';
export default async function Page({searchParams}:{searchParams:Promise<{room?:string}>}){const {room=''}=await searchParams;return <GuestGate requestedRoom={room}/>;}
