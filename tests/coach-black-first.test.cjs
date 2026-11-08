"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const bridge=fs.readFileSync("app/src/main/assets/stockfish-bridge.js","utf8");
const coach=fs.readFileSync("app/src/main/assets/live-coach.js","utf8");
function notation(m){return "abcdefgh"[m[0]&7]+(8-(m[0]>>4))+"abcdefgh"[m[1]&7]+(8-(m[1]>>4))+(m[2]||"");}
async function scenario(stalled){
 const events={},els={};
 const el=id=>els[id]??(els[id]={id,value:id==="botMode"?"bot":"8",textContent:"",hidden:false,
  options:[{value:"8"}],selectedOptions:[{textContent:"Mittel"}],onclick(){},
  addEventListener(type,cb){(events[id+":"+type]??=[]).push(cb);},
  dispatchEvent(e){(events[id+":"+e.type]||[]).forEach(fn=>fn(e));}});
 const document={getElementById:el};
 const initial=()=>{const b=Array(128).fill(".");b[116]="K";b[4]="k";b[100]="P";b[20]="p";return{t:1,b,c:15,ep:-1,half:0,full:1};};
 const history=[initial()],movesPlayed=[];
 const current=()=>history[history.length-1];
 const legal=s=>s.t===1?[[100,68,"",""]]:[[20,52,"",""]];
 const ctx={window:{schachNovaBotColor:1,schachNovaCoachMatch:true},document,
   history,movesPlayed,viewIndex:0,variantMode:"standard",ended:"",
   localStorage:{getItem:()=>null,setItem(){}},Math,Date,console:{warn(){}},
   Event:class{constructor(type){this.type=type;}},current,legal,
   move(m){
    if(!legal(current()).some(v=>notation(v)===notation(m)))return;
    const next={...current(),b:current().b.slice(),t:-current().t};
    next.b[m[1]]=next.b[m[0]];next.b[m[0]]=".";
    history.push(next);movesPlayed.push(m);ctx.viewIndex=history.length-1;
   }};
 let count=0;const messages=[],timers=new Set();
 class FakeWorker{
  constructor(){this.id=++count;this.dead=false;}
  postMessage(cmd){
   messages.push(cmd);
   if(stalled)return;
   const fire=text=>setImmediate(()=>{if(!this.dead)this.onmessage({data:text});});
   if(cmd==="uci")fire("id name Stockfish 19\nuciok\n");
   else if(cmd==="isready")fire("readyok");
   else if(cmd==="go movetime 450")fire("info depth 7 score cp 10\nbestmove e2e4");
  }
  terminate(){this.dead=true;}
 }
 ctx.Worker=FakeWorker;
 ctx.setTimeout=(cb,ms)=>{const n=setTimeout(()=>{timers.delete(n);cb();},ms>=3000?45:10);timers.add(n);return n;};
 ctx.clearTimeout=id=>{clearTimeout(id);timers.delete(id);};
 vm.createContext(ctx);
 vm.runInContext(bridge,ctx);
 vm.runInContext(coach,ctx);
 ctx.window.SchachNovaLiveCoach.enable(true);
 assert.match(el("liveCoachMessage").textContent,/Schwarz, der Computer Weiß/);
 ctx.window.schachNovaBotKickoff();
 await new Promise(r=>setTimeout(r,180));
 assert.equal(movesPlayed.length,1,stalled?"Stalled opponent must use local legal fallback":"Stockfish must open as White");
 assert.equal(notation(movesPlayed[0]),"e2e4");
 assert.equal(current().t,-1,"Human Black must move next");
 assert.equal(ctx.window.schachNovaBotColor,1);
 if(stalled)assert.match(el("engineInfo").textContent,/Notfallmodus|Ersatzgegner/);
 else assert.ok(messages.includes("go movetime 450"));
 for(const t of timers)clearTimeout(t);
}
(async()=>{
 await scenario(false);
 await scenario(true);
 console.log("PASS Black Coach opens with White engine, falls back safely on stalled Worker, then hands turn to human Black");
})().catch(e=>{console.error(e);process.exitCode=1;});
