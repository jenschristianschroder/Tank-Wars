import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
function rules(){const c=vm.createContext({structuredClone,btoa,atob});vm.runInContext(scripts[0],c);return c.TankRules;}
const plain=x=>JSON.parse(JSON.stringify(x));
test('deterministic shots, no mutation, bounded health and crater destruction',()=>{
 const r=rules(),m=r.newMatch(()=>.5),original=JSON.stringify(m);assert.equal(r.validSnapshot(m),true);
 assert.deepEqual(plain(r.fire(m.game,45,55)),plain(r.fire(m.game,45,55)));assert.equal(JSON.stringify(m),original);
 let craters=0;for(let a=10;a<85;a+=5)for(let p=10;p<=100;p+=5){const g=r.fire(m.game,a,p);assert.ok(g.tanks.every(t=>t.hp>=0&&t.hp<=100));assert.ok(g.terrain.every(y=>y<=424));if(g.terrain.some((y,i)=>y!==m.game.terrain[i]))craters++;}assert.ok(craters>0);
});
test('turns wait for BOTH animations; duplicate, stale and invalid shots rejected',()=>{
 const r=rules();let m=r.newMatch(()=>.5);assert.throws(()=>r.applyShot(m,1,{revision:0,angle:45,power:55}));
 m=r.applyShot(m,0,{revision:0,angle:45,power:55});assert.throws(()=>r.applyShot(m,1,{revision:1,angle:45,power:55}));
 m=r.markReady(m,0,1);assert.throws(()=>r.applyShot(m,1,{revision:1,angle:45,power:55}));
 assert.equal(r.markReady(m,1,0),m);m=r.markReady(m,1,1);
 for(const action of [{revision:0,angle:45,power:55},{revision:1,angle:NaN,power:55},{revision:1,angle:45,power:101}])assert.throws(()=>r.applyShot(m,1,action));
 m=r.applyShot(m,1,{revision:1,angle:45,power:55});assert.equal(m.game.turn,0);assert.equal(m.revision,2);assert.equal(r.validSnapshot(m),true);
});
test('rematches need both votes and connection codes reject damaged or wrong-role input',()=>{
 const r=rules();let m=r.newMatch();assert.throws(()=>r.voteRematch(m,0));m.game.winner=0;m=r.voteRematch(m,0);assert.equal(m.game.winner,0);m=r.voteRematch(m,1);assert.equal(m.game.winner,null);assert.equal(m.revision,1);
 const code=r.encodeSignal({type:'offer',sdp:'v=0\r\n'},'12345678-1234-1234-1234-123456789012',false);assert.equal(r.decodeSignal(code,'offer').assist,false);assert.throws(()=>r.decodeSignal(code,'answer'));assert.throws(()=>r.decodeSignal('TW1.bad','offer'));assert.throws(()=>r.decodeSignal('x'.repeat(70000),'offer'));
 const bad=r.newMatch();bad.game.terrain[0]=Infinity;assert.equal(r.validSnapshot(bad),false);
});
function harness(RTC,{reduced=false}={}){
 const elements={};for(const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)){const tag=match[0];elements[match[1]]={hidden:/\shidden(?:\s|>)/.test(tag),disabled:false,value:tag.match(/\bvalue="([^"]*)"/)?.[1]||'',checked:false,textContent:'',style:{},classList:{toggle(){}},setAttribute(){},focus(){},select(){},getBoundingClientRect(){return {width:390,height:250}}};}
 const drawing=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(obj,key)=>obj[key]||(()=>{})});elements.arena.getContext=()=>drawing;elements.lobbyArena.getContext=()=>drawing;
 const raf=[],listeners={},timers=new Map();let clock=1000,id=0;const c=vm.createContext({structuredClone,btoa,atob,URL,JSON,Math,RTCPeerConnection:RTC,crypto:{randomUUID:()=>crypto.randomUUID()},performance:{now:()=>clock},matchMedia:()=>({matches:reduced}),devicePixelRatio:1,navigator:{},console,document:{hidden:false,getElementById:id=>elements[id],addEventListener:(name,fn)=>listeners[name]=fn},window:{addEventListener(){}},ResizeObserver:class{observe(){}},requestAnimationFrame:fn=>raf.push(fn),setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)});
 scripts.forEach(s=>vm.runInContext(s,c));return {c,e:elements,listeners,run:s=>vm.runInContext(s,c),get:()=>plain(vm.runInContext('({mode,me,match,connected,animating:!!animation})',c)),tick(ms=50){clock+=ms;const batch=raf.splice(0);batch.forEach(fn=>fn(clock));},hide(){c.document.hidden=true;listeners.visibilitychange();},show(){c.document.hidden=false;listeners.visibilitychange();},advance(ms){clock+=ms;},timers};
}
function fakeRTC(){
 const peers=new Map();let id=0;
 class Channel{constructor(){this.readyState='connecting'}send(data){if(this.readyState!=='open')throw Error('closed');queueMicrotask(()=>this.other?.onmessage?.({data}));}close(){this.readyState='closed';this.onclose?.();if(this.other&&this.other.readyState!=='closed'){this.other.readyState='closed';this.other.onclose?.();}}}
 return class Peer{constructor(config){this.config=config;this.id=++id;peers.set(this.id,this);this.iceGatheringState='complete';this.connectionState='new';this.signalingState='stable';}addEventListener(){}removeEventListener(){}createDataChannel(){return this.channel=new Channel();}async createOffer(){return {type:'offer',sdp:'v=0\r\npeer:'+this.id};}async createAnswer(){return {type:'answer',sdp:'v=0\r\npeer:'+this.id};}async setLocalDescription(d){this.localDescription=d;this.signalingState=d.type==='offer'?'have-local-offer':'stable';}async setRemoteDescription(d){const other=peers.get(+d.sdp.split('peer:')[1]);if(d.type==='offer'){this.host=other;}else{this.signalingState='stable';const incoming=new Channel();this.channel.other=incoming;incoming.other=this.channel;other.channel=incoming;other.ondatachannel?.({channel:incoming});this.connectionState=other.connectionState='connected';this.channel.readyState=incoming.readyState='open';this.channel.onopen?.();incoming.onopen?.();}}close(){this.connectionState='closed';this.channel?.close();this.onconnectionstatechange?.();}};
}
async function flush(){for(let i=0;i<8;i++)await Promise.resolve();}
test('actual UI pairs two peers, synchronizes shots, pauses until both animations end, handles disconnect',async()=>{
 const RTC=fakeRTC(),host=harness(RTC),guest=harness(RTC);
 await host.e.host.onclick();guest.e.guest.onclick();guest.e.inCode.value=host.e.outCode.value;await guest.e.connect.onclick();host.e.inCode.value=guest.e.outCode.value;await host.e.connect.onclick();await flush();
 assert.equal(host.get().connected,true);assert.equal(guest.get().me,1);assert.deepEqual(host.get().match,guest.get().match);
 assert.equal(host.e.fire.disabled,false);assert.equal(guest.e.fire.disabled,true);host.e.fire.onclick();await flush();
 assert.equal(host.get().animating,true);assert.equal(guest.get().animating,true);assert.deepEqual(host.get().match,guest.get().match);
 for(let i=0;i<75;i++)host.tick();await flush();assert.equal(host.e.fire.disabled,true);assert.equal(guest.e.fire.disabled,true);
 guest.hide();guest.advance(20000);guest.show();guest.tick();assert.equal(guest.get().animating,true,'returning from another app must not skip the volley');
 for(let i=0;i<75;i++)guest.tick();await flush();assert.equal(guest.get().animating,false);assert.equal(guest.e.fire.disabled,false);
 guest.e.fire.onclick();await flush();assert.deepEqual(host.get().match,guest.get().match);assert.equal(host.get().match.revision,2);
 for(let i=0;i<75;i++){host.tick();guest.tick();await flush();}assert.equal(host.e.fire.disabled,false);
 guest.e.leave.onclick();guest.e.confirmLeave.onclick();await flush();assert.equal(host.get().connected,false);assert.equal(host.e.fire.disabled,true);
});
test('local pass-and-play gates handoff and static output contains no backend or external assets',()=>{
 const h=harness(fakeRTC());h.e.local.onclick();assert.equal(h.e.fire.disabled,false);h.e.fire.onclick();for(let i=0;i<75;i++)h.tick();assert.equal(h.e.handoff.hidden,false);assert.equal(h.e.fire.disabled,true);h.e.takeTurn.onclick();assert.equal(h.e.fire.disabled,false);assert.equal(h.get().match.game.turn,1);
 assert.ok(!/<script[^>]+src=|<link[^>]+href=|fetch\(|chatgpt\.site|\/api\//.test(html));
});
test('cinematic presentation preserves shared rules and reduced motion avoids ambient animation',()=>{
 const h=harness(fakeRTC(),{reduced:true});h.e.local.onclick();const initial=JSON.stringify(h.get().match);h.tick();assert.equal(JSON.stringify(h.get().match),initial);assert.match(h.e.sceneTitle.textContent,/CINDER VALLEY|MOONLIT PASS|HIGHLAND DAWN/);assert.equal(h.run('soundEnabled'),false);assert.equal(h.run('sceneTimer'),null);h.e.expand.onclick();assert.equal(h.run('focusView'),true);h.e.expand.onclick();assert.equal(h.run('focusView'),false);
});
test('optional audio is silent by default, synthesizes effects after consent and can be muted',async()=>{
 const h=harness(fakeRTC());let contexts=0,tones=0;const parameter=()=>({value:0,setTargetAtTime(){},setValueAtTime(){},exponentialRampToValueAtTime(){}});
 h.c.AudioContext=class{constructor(){contexts++;this.sampleRate=8000;this.currentTime=0;this.state='running';this.destination={};}async resume(){}createGain(){return {gain:parameter(),connect(){}}}createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)}}createBufferSource(){return {connect(){},start(){}}}createBiquadFilter(){return {frequency:parameter(),connect(){}}}createOscillator(){tones++;return {frequency:parameter(),connect(){},start(){},stop(){}}}};
 h.e.local.onclick();assert.equal(contexts,0);await h.e.sound.onclick();assert.equal(h.run('soundEnabled'),true);assert.equal(contexts,1);h.e.fire.onclick();assert.ok(tones>0);await h.e.battleSound.onclick();assert.equal(h.run('soundEnabled'),false);const mutedTones=tones;for(let i=0;i<75;i++)h.tick();assert.equal(tones,mutedTones);
});
