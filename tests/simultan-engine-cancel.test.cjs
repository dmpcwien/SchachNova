"use strict";
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const source=fs.readFileSync("app/src/main/assets/simultan-engine.js","utf8");
async function main(){
 const commands=[];
 let worker;
 class MockWorker{
  constructor(){this.dead=false;this.busy=false;worker=this;}
  postMessage(cmd){
   commands.push(cmd);
   if(cmd==="uci")setImmediate(()=>!this.dead&&this.onmessage({data:"uciok"}));
   else if(cmd==="isready")setImmediate(()=>!this.dead&&this.onmessage({data:"readyok"}));
   else if(cmd.startsWith("go ")){assert.equal(this.busy,false,"One search at a time");this.busy=true;}
   else if(cmd==="stop")setImmediate(()=>this.respond());
  }
  respond(){
   if(this.dead||!this.busy)return;
   this.busy=false;
   this.onmessage({data:"bestmove e7e5"});
  }
  terminate(){this.dead=true;}
 }
 const context={window:{},Worker:MockWorker,setTimeout,clearTimeout,console:{warn(){}}};
 vm.runInNewContext(source,context);
 const engine=context.window.SchachNovaSimultanEngine;
 const requests=Array.from({length:4},(_,i)=>engine.request([i===0?"e2e4":i===1?"d2d4":i===2?"c2c4":"g1f3"],8,{boardId:i}));
 await new Promise(resolve=>setImmediate(resolve));
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(engine.state.thinking,true);
 assert.equal(engine.state.queue,3);
 assert.equal(engine.cancelBoard(99),0,"Unknown board should be ignored");
 assert.equal(engine.cancelBoard(2),1,"One queued board should be dropped");
 assert.equal(engine.cancelBoard(0),1,"Active board should be stopped");
 assert.equal(engine.cancelBoard(0),0,"Repeated cancellation should be idempotent");
 await new Promise(resolve=>setImmediate(resolve));
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(engine.state.queue,1);
 worker.respond(); // board 1
 worker.respond(); // board 3
 assert.deepEqual(await Promise.all(requests),[null,"e7e5",null,"e7e5"]);
 assert.equal(commands.filter(cmd=>cmd==="stop").length,1);
 assert.ok(!commands.includes("position startpos moves c2c4"),"Cancelled queued position must not be searched");
 assert.equal(engine.state.queue,0);
 assert.equal(engine.state.thinking,false);
 engine.reset();assert.equal(worker.dead,true);
 console.log("Cancelled active and queued Stockfish jobs release resources without cancelling other Simultan boards");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
