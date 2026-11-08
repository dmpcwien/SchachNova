"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const source=fs.readFileSync("app/src/main/assets/simultan-engine.js","utf8");
let current=null,workers=0,maxConcurrent=0,concurrent=0;
const positions=[];
class TestWorker{
 constructor(){workers++;current=this;this.terminated=false;this.waiting=false;}
 postMessage(cmd){
  if(cmd==="uci")setImmediate(()=>!this.terminated&&this.onmessage({data:"uciok"}));
  else if(cmd==="isready")setImmediate(()=>!this.terminated&&this.onmessage({data:"readyok"}));
  else if(cmd.startsWith("position ")){positions.push(cmd);}
  else if(cmd.startsWith("go ")){
   if(this.waiting)throw Error("Overlapping Stockfish search");
   this.waiting=true;concurrent++;maxConcurrent=Math.max(maxConcurrent,concurrent);
  }
 }
 respond(){
  assert.ok(this.waiting,"Expected a pending search");
  this.waiting=false;concurrent--;
  this.onmessage({data:"bestmove e7e5"});
 }
 terminate(){this.terminated=true;if(this.waiting){this.waiting=false;concurrent--;}}
}
async function main(){
 const window={};
 vm.runInNewContext(source,{window,Worker:TestWorker,console:{warn(){}},setTimeout,clearTimeout});
 const engine=window.SchachNovaSimultanEngine;
 const requests=Array.from({length:20},(_,i)=>engine.request([i===19?"d2d4":"e2e4"],i,{boardId:i}));
 await new Promise(resolve=>setImmediate(resolve));
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(engine.state.thinking,true);
 assert.equal(engine.state.queue,19);
 assert.equal(engine.prioritize(19),true);
 assert.equal(engine.prioritize(99),false);
 for(let i=0;i<20;i++)current.respond();
 assert.deepEqual(await Promise.all(requests),Array(20).fill("e7e5"));
 assert.equal(workers,1,"Each board must not create its own worker");
 assert.equal(maxConcurrent,1,"Only one engine search may be active");
 assert.equal(positions.length,20);
 assert.equal(positions[0],"position startpos moves e2e4");
 assert.equal(positions[1],"position startpos moves d2d4","Selected board must jump ahead in the queued searches");
 // Priority is verified by giving each queued board a distinct move list.
 engine.reset();
 positions.length=0;
 const pending=engine.request(["e2e4"],5,{boardId:1});
 const queued=engine.request(["d2d4"],9,{boardId:2});
 await new Promise(resolve=>setImmediate(resolve));
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(engine.state.thinking,true);
 assert.equal(engine.state.queue,1);
 engine.reset();
 assert.equal(await pending,null);
 assert.equal(await queued,null);
 assert.equal(engine.state.queue,0);
 assert.equal(engine.state.thinking,false);
 assert.equal(engine.state.available,true);
 assert.ok(workers>=2);
 const afterReset=engine.request(["c2c4"],13,{boardId:3,priority:true});
 await new Promise(resolve=>setImmediate(resolve));
 await new Promise(resolve=>setImmediate(resolve));
 current.respond();
 assert.equal(await afterReset,"e7e5");
 engine.reset();
 assert.match(source,/setTimeout\(\(\)=>\{[\s\S]*?\},15000\)/);
 console.log("20 simultaneous requests: single worker, serialized searches, priority API and restart recovery passed");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
