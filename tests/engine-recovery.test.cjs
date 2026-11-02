"use strict";
/* No Android SDK is needed to verify the UCI transport's error recovery. */
const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");

{
 const instances=[],events=[];
 class WorkerStub{
  constructor(file){this.file=file;this.commands=[];this.terminated=false;instances.push(this);}
  postMessage(line){this.commands.push(line);}
  terminate(){this.terminated=true;}
  reply(line){this.onmessage({data:line});}
 }
 const context={window:{SchachNovaVariants:{threecheck:{uci:"3check"}},schachNovaVariantUciOptions:()=>["setoption name UCI_Variant value 3check","ucinewgame"]},Worker:WorkerStub,Date};
 vm.runInNewContext(fs.readFileSync("app/src/main/assets/fairy-bridge.js","utf8"),context);
 const fairy=context.window.SchachNovaFairy;
 fairy.subscribe(ev=>events.push(ev));
 fairy.start();
 assert.equal(instances.length,1);
 instances[0].reply("info string Fairy-Stockfish init error: binary missing");
 assert.equal(instances[0].terminated,true,"Failed WASM worker must terminate immediately");
 assert.equal(events.at(-1).type,"error","Missing WASM must be visible as an error event");
 // Android may dispatch an additional onerror after the explicit initialization failure.
 instances[0].onerror(new Error("worker died"));
 assert.equal(events.filter(e=>e.type==="error").length,1,"Worker startup error must not emit duplicates");
 fairy.start();
 instances[1].reply("uciok");
 instances[1].reply("readyok");
 assert.equal(fairy.state.ready,true,"A failed worker must be restartable");
 fairy.configure("threecheck");
 assert.equal(fairy.state.ready,false,"Variant configure must wait for readyok");
 instances[1].reply("readyok");
 fairy.search(["e2e4"],4);
 assert.equal(fairy.state.thinking,true);
 instances[1].reply("bestmove e7e5");
 const best=events.at(-1);
 assert.equal(best.type,"bestmove");
 assert.equal(best.request.variant,"threecheck");
 assert.ok(best.request.startedAt>0,"Think-time starts when the search is dispatched");
 fairy.close();
 assert.equal(fairy.state.ready,false);
}

{
 const instances=[],timers=new Map(),els={};let nextTimer=0,moved=0;
 const el=id=>els[id]??=(id==="botMode"?{value:"human",addEventListener(name,fn){this.change=fn}}:id==="botLevel"?{value:"12",options:[{value:"12"}],addEventListener(){},selectedOptions:[{textContent:"12"}]}:{value:"12",addEventListener(){},textContent:"",onclick:null});
 class WorkerStub{
  constructor(file){this.file=file;this.terminated=false;instances.push(this);}
  postMessage(command){this.commands??=[];this.commands.push(command);}
  terminate(){this.terminated=true;}
 }
 const position={t:-1,b:Array(128).fill(".")},sampleMove=[20,52];
 const context={
  window:{schachNovaBotColor:-1,SchachNovaVariants:{standard:{local:true}}},
  document:{getElementById:el},localStorage:{getItem(){return null;},setItem(){}},
  Worker:WorkerStub,Date,Math,
  setTimeout(fn,delay){const id=++nextTimer;timers.set(id,{fn,delay});return id;},clearTimeout(id){timers.delete(id);},
  variantMode:"standard",current:()=>position,history:[position],viewIndex:0,movesPlayed:[],ended:false,
  legal:()=>[sampleMove],move:()=>{moved++;context.movesPlayed.push(sampleMove);position.t=1;},
 };
 el("newGame").onclick=()=>{};
 vm.runInNewContext(fs.readFileSync("app/src/main/assets/stockfish-bridge.js","utf8"),context);
 el("botMode").value="bot";el("botMode").change();
 assert.equal(instances.length,1);
 assert.equal(instances[0].file,"stockfish-19-lite-single.js");
 instances[0].onerror(new Error("failed"));
 assert.ok(instances[0].terminated,"Faulty Stockfish worker must terminate");
 assert.match(el("engineInfo").textContent,/Notfallmodus/);
 assert.ok([...timers.values()].some(t=>t.delay===350),"After worker failure local fallback must be queued");
 const one=[...timers.entries()].find(([id,t])=>t.delay===350);
 timers.delete(one[0]);one[1].fn();
 const botTimer=[...timers.entries()].find(([id,t])=>t.delay!==14000);
 assert.ok(botTimer,"Fallback move must be delayed and revalidated");
 timers.delete(botTimer[0]);botTimer[1].fn();
 assert.equal(moved,1,"Fallback must make one legal move, not freeze the board");
 // A new game must attempt the primary engine again, rather than permanently
 // trapping later games in the emergency opponent.
 position.t=-1;context.movesPlayed.length=0;
 el("newGame").onclick();
 assert.equal(instances.length,2,"New game must retry the primary Stockfish engine");
}
const coach=fs.readFileSync("app/src/main/assets/live-coach.js","utf8");
assert.match(coach,/before\.t===botColor\)return;/,"Live Coach must never critique bot moves instead of the human move");
assert.match(coach,/const baseMove=move;/,"Live Coach remains the sole analysis controller");
console.log("Fairy and classical Stockfish errors recover; live Coach only critiques human moves");
