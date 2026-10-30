import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../worker/index.js';
const db=new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('../drizzle/0000_rooms.sql',import.meta.url),'utf8'));
const env={DB:{prepare(sql){let args=[];return {bind(...values){args=values;return this},async first(){return db.prepare(sql).get(...args)},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:r.changes}}}}}};
http.createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});const result=await worker.fetch(request,env);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()))}catch(e){console.error(e);res.writeHead(500);res.end('Preview error')}}).listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Tank Wars preview ready'));
