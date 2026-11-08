"use strict";
const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const src=fs.readFileSync("app/src/main/assets/simultan-engine.js","utf8");
const page=fs.readFileSync("app/src/main/assets/index.html","utf8");
assert.match(page,/<script src="simultan-engine\.js"><\/script><script src="simultan-tools\.js"><\/script><script src="simultan\.js"><\/script>/);
assert.match(src,/new Worker\("stockfish-19-lite-single\.js"\)/);
async function main(){
 const commands=[],workers=[];
 class MockWorker{
  constructor(){this.terminated=false;this.busy=false;workers.push(this);}
  postMessage(command){
   commands.push(command);
   if(command==="uci")setImmediate(()=>!this.terminated&&this.onmessage({data:"uciok"}));
   if(command==="isready")setImmediate(()=>!this.terminated&&this.onmessage({data:"readyok"}));
   if(command.startsWith("go ")){
    assert.equal(this.busy,false,"Searches must be serialized");
    this.busy=true;
    setImmediate(()=>{if(this.terminated)return;this.busy=false;this.onmessage({data:"bestmove e7e5"});});
   }
  }
  terminate(){this.terminated=true;}
 }
 const context={window:{},Worker:MockWorker,console:{warn(){}},setTimeout,clearTimeout};
 vm.runInNewContext(src,context);
 const engine=context.window.SchachNovaSimultanEngine;
 const results=await Promise.all([
  engine.request(["e2e4"],5),
  engine.request(["d2d4"],17),
  engine.request(["c2c4"],0)
 ]);
 assert.deepEqual(results,["e7e5","e7e5","e7e5"]);
 assert.equal(workers.length,1,"20 boards must share one worker");
 assert.equal(commands.filter(x=>x.startsWith("go ")).length,3);
 assert.ok(commands.includes("setoption name Skill Level value 5"));
 assert.ok(commands.includes("setoption name Skill Level value 17"));
 assert.ok(commands.includes("position startpos moves d2d4"));
 assert.equal(engine.state.thinking,false);
 assert.equal(await engine.request(["bad"],8),null);
 engine.reset();assert.equal(workers[0].terminated,true);
 assert.equal(engine.state.available,true);
 let failed=0;
 class ErrorWorker{constructor(){failed++;throw Error("Engine unavailable");}}
 const failureContext={window:{},Worker:ErrorWorker,console:{warn(){}},setTimeout,clearTimeout};
 vm.runInNewContext(src,failureContext);
 assert.equal(await failureContext.window.SchachNovaSimultanEngine.request(["e2e4"],10),null);
 assert.equal(failed,1);
 assert.equal(failureContext.window.SchachNovaSimultanEngine.state.available,false);
 console.log("Single-worker UCI queue, legal move input, bounded thinking and fallback verified");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
