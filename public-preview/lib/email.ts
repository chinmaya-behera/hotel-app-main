export function emailReady(){return Boolean(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM);}
export async function sendPassword(email:string,password:string,room:string){
 if(!emailReady())throw new Error("Email delivery is waiting for sender configuration.");
 const sender=process.env.EMAIL_FROM!,testMode=sender.includes("@resend.dev");
 const allowed=(process.env.DEMO_EMAIL_ALLOWLIST||"").split(",").map(v=>v.trim().toLowerCase()).filter(Boolean);
 if(testMode&&!allowed.includes(email.toLowerCase()))throw new Error("Real-email testing is restricted to the configured test recipient until a sending domain is verified.");
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json","Idempotency-Key":"public-room-"+crypto.randomUUID()},body:JSON.stringify({from:sender,to:[email],subject:`Your Atelier preview room ${room} access password`,text:`Welcome to the Atelier Hotel public preview.\n\nYour single-use access password for room ${room} is:\n\n${password}\n\nIt expires in ten minutes. Return to the room sign-in screen opened by the QR code. This is an isolated demonstration, not a real hotel booking. If you did not request this email, you can ignore it.`}),signal:AbortSignal.timeout(15000)});
 if(!response.ok){if(response.status===403)throw new Error("Resend declined the recipient or sender. A verified sending domain is required to email arbitrary visitors.");throw new Error("The email provider did not accept this message. No access password was activated.");}
 const result=await response.json() as {id?:string};if(!result.id)throw new Error("The email provider did not confirm acceptance.");
}
