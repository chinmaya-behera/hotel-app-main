import http from 'node:http';
import https from 'node:https';
// A fresh HTTP/1 connection avoids test-runner keep-alive/TLS resets on Windows.
// Commands are never automatically retried: a failed write can have an uncertain outcome.
export function request(url,options={}){
 return new Promise((resolve,reject)=>{
  const target=new URL(url),transport=target.protocol==='https:'?https:http;
  const req=transport.request(target,{method:options.method||'GET',headers:options.headers,agent:false},res=>{
   const chunks=[];let size=0;
   res.on('data',chunk=>{size+=chunk.length;if(size>4*1024*1024){req.destroy(Error('Test response exceeded limit.'));return;}chunks.push(chunk);});
   res.on('error',reject);res.on('end',()=>{const body=Buffer.concat(chunks).toString('utf8'),cookies=res.headers['set-cookie']||[];resolve({status:res.statusCode,headers:{getSetCookie:()=>cookies},text:async()=>body,json:async()=>{try{return JSON.parse(body);}catch{throw Error('Expected JSON, received HTTP '+res.statusCode);}}});});
  });
  req.setTimeout(45000,()=>req.destroy(Error('Test request timed out; inspect saved state before retrying.')));req.on('error',reject);if(options.body)req.write(options.body);req.end();
 });
}
