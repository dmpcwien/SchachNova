"use strict";
const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const src=fs.readFileSync("app/src/main/assets/simultan.js","utf8");
const tools=require("../app/src/main/assets/simultan-tools.js");
function extract(name){
 const i=src.indexOf("function "+name+"(");assert.ok(i>=0,"Missing "+name);
 const start=src.indexOf("{",i);let depth=0;
 for(let p=start;p<src.length;p++){
  if(src[p]==="{")depth++;
  else if(src[p]==="}"&&!--depth)return src.slice(i,p+1);
 }
 throw Error("Unbalanced "+name);
}
const now=62000;
function game(side,clock){
 return {history:[{t:side}],humanColor:1,strength:3,moves:[],finished:"",clock,thinking:true};
}
const a=tools.makeClock(1,0);a.startedAt=1000;
const b=tools.makeClock(1,0);b.remaining[1]=0;
const c=tools.makeClock(1,0);c.remaining[0]=35;
const games=[game(1,a),game(-1,b),game(1,c)];
const cancelled=[],ctx={
 games,sessionTools:tools,Date:{now:()=>now},window:{SchachNovaSimultanEngine:{cancelBoard:i=>cancelled.push(i)}},
 state:g=>g.history[g.history.length-1],saveSession(){ctx.saved++;},saved:0,
 panel:{hidden:false},document:{hidden:false},botsPaused:false
};
vm.createContext(ctx);
vm.runInContext([extract("markFlag"),extract("freezeClocks"),extract("resumeClocks")].join("\n"),ctx);
vm.runInContext("freezeClocks()",ctx);
assert.equal(games[0].finished,"Zeitüberschreitung (Schwarz gewinnt)","White flag must be recorded when pausing late");
assert.equal(games[1].finished,"Zeitüberschreitung (Weiß gewinnt)","Previously exhausted clock must not be reopened");
assert.equal(games[2].finished,"");
assert.equal(a.startedAt,null);
assert.equal(games[0].thinking,false);
assert.equal(games[1].thinking,false);
assert.deepEqual(cancelled,[0,1]);
vm.runInContext("resumeClocks()",ctx);
assert.equal(c.startedAt,now,"Live board clock should resume");
assert.equal(a.startedAt,null,"Expired clock must stay stopped");
assert.equal(b.startedAt,null,"Expired clock must stay stopped");
vm.runInContext("freezeClocks()",ctx);
assert.deepEqual(cancelled,[0,1],"Repeated pause must not duplicate expired board handling");
assert.equal(ctx.saved,2,"Only newly flagged games should save a result");
console.log("Clock exhaustion on pause, background resume, engine cancellation and idempotent timeout results passed");
