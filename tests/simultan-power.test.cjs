"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const engineSrc=fs.readFileSync("app/src/main/assets/simultan-engine.js","utf8");
const uiSrc=fs.readFileSync("app/src/main/assets/simultan.js","utf8");
const html=fs.readFileSync("app/src/main/assets/index.html","utf8");
for(const id of ["simultanPowerMode","simultanPause"])
 assert.ok(html.includes('id="'+id+'"'),"Missing Simultan control "+id);
assert.match(uiSrc,/if\(panel\.hidden\|\|document\.hidden\|\|botsPaused\)return/);
assert.match(uiSrc,/if\(g\.thinking\|\|g\.finished\|\|panel\.hidden\|\|document\.hidden\|\|botsPaused\)return/);
assert.match(uiSrc,/function updatePauseControl\(\)/);
assert.match(uiSrc,/powerMode\}/);
assert.match(engineSrc,/setoption name Hash value 16/);
async function main(){
 const sent=[],workers=[];
 class WorkerMock{
  constructor(){workers.push(this);this.terminated=false;this.thinking=false;}
  postMessage(command){
   sent.push(command);
   if(command==="uci")setImmediate(()=>!this.terminated&&this.onmessage({data:"uciok"}));
   if(command==="isready")setImmediate(()=>!this.terminated&&this.onmessage({data:"readyok"}));
   if(command.startsWith("go ")){
    assert.equal(this.thinking,false,"Overlapping searches");
    this.thinking=true;
    setImmediate(()=>{if(this.terminated)return;this.thinking=false;this.onmessage({data:"bestmove e7e5"});});
   }
  }
  terminate(){this.terminated=true;}
 }
 const context={window:{},Worker:WorkerMock,console:{warn(){}},setTimeout,clearTimeout};
 vm.runInNewContext(engineSrc,context);
 const engine=context.window.SchachNovaSimultanEngine;
 const results=await Promise.all([
  engine.request(["e2e4"],3,{powerMode:"eco",boardId:0}),
  engine.request(["d2d4"],3,{powerMode:"balanced",boardId:1}),
  engine.request(["c2c4"],3,{powerMode:"strong",boardId:2}),
  engine.request(["g1f3"],20,{powerMode:"eco",boardId:3}),
  engine.request(["b1c3"],20,{powerMode:"unrecognized",boardId:4})
 ]);
 assert.deepEqual(results,Array(5).fill("e7e5"));
 const budgets=sent.filter(s=>s.startsWith("go movetime ")).map(s=>Number(s.slice(12)));
 assert.deepEqual(budgets,[144,282,504,280,520],"Search budget depends on mode and skill but stays bounded");
 assert.ok(sent.includes("setoption name Hash value 16"),"Hash memory should be capped");
 assert.equal(workers.length,1);
 engine.reset();
 assert.ok(workers[0].terminated);
 console.log("Five power-profile requests, 1 worker, 16 MiB hash and persisted pause controls passed");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
