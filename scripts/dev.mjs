import http from 'node:http';
import {readFile} from 'node:fs/promises';
const page=new URL('../index.html',import.meta.url);
http.createServer(async(req,res)=>{
  if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
  res.end(req.method==='HEAD'?'':await readFile(page));
}).listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Tank Wars at http://localhost:'+(process.env.PORT||3000)));
