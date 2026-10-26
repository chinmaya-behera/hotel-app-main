import {spawn} from 'node:child_process';
import http from 'node:http';
import https from 'node:https';
// A fresh HTTP/1 connection avoids test-runner keep-alive/TLS resets on Windows.
// Commands are never automatically retried: a failed write can have an uncertain outcome.
export function request(url,options={}){
 if(process.env.TEST_TRANSPORT==='curl')return curlRequest(url,options);
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

function curlRequest(url,options){
 return new Promise((resolve,reject)=>{
  const quoted=v=>JSON.stringify(String(v)),config=['url = '+quoted(url),'request = '+quoted(options.method||'GET'),...Object.entries(options.headers||{}).map(([k,v])=>'header = '+quoted(k+': '+v)),...(options.body?['data = '+quoted(options.body)]:[])].join('\n');
  const child=spawn('curl.exe',['--silent','--show-error','--include','--http1.1','--no-keepalive','--max-time','45','--config','-'],{windowsHide:true,stdio:['pipe','pipe','pipe']});
  const chunks=[],errors=[];child.stdout.on('data',b=>chunks.push(b));child.stderr.on('data',b=>errors.push(b));child.on('error',reject);child.on('exit',code=>{if(code!==0)return reject(Error('curl test transport failed ('+code+'); review saved state before retrying.'));let raw=Buffer.concat(chunks).toString('utf8'),split=raw.indexOf('\r\n\r\n'),headers=raw.slice(0,split),body=raw.slice(split+4);if(/^HTTP\/1\.1 100/.test(headers)){raw=body;split=raw.indexOf('\r\n\r\n');headers=raw.slice(0,split);body=raw.slice(split+4);}const status=Number(/^HTTP\/\S+ (\d+)/.exec(headers)?.[1]),cookies=headers.split('\r\n').filter(l=>/^set-cookie:/i.test(l)).map(l=>l.slice(l.indexOf(':')+1).trim());resolve({status,headers:{getSetCookie:()=>cookies},text:async()=>body,json:async()=>JSON.parse(body)});});child.stdin.end(config);
 });
}
