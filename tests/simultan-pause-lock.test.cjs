"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const src=fs.readFileSync("app/src/main/assets/simultan.js","utf8");
function sourceOf(name){
 const start=src.indexOf("function "+name+"(");
 assert.ok(start>=0,"Missing "+name);
 const open=src.indexOf("{",start);let depth=0;
 for(let i=open;i<src.length;i++){
  if(src[i]==="{")depth++;
  if(src[i]==="}"&&!--depth)return src.slice(start,i+1);
 }
 throw Error("Unclosed "+name);
}
assert.match(src,/board\.addEventListener\("pointerdown",event=>\{\s*if\(botsPaused\)return/);
assert.match(src,/board\.addEventListener\("pointerup",event=>\{\s*if\(botsPaused\)/);
assert.match(src,/const moves=s\.t===g\.humanColor&&!g\.finished&&!g\.awaitingSwitch&&!botsPaused/);
const g={humanColor:1,finished:"",awaitingSwitch:false,history:[{t:1,b:{3:"P"}}],moves:[]};
let redraws=0;
const ctx={g,suppressTap:false,botsPaused:true,promotionPending:null,games:[g],active:0,selected:-1,
 state:g=>g.history[g.history.length-1],side:()=>1,
 legalStandard:()=>{throw Error("No legality checks during pause");},
 draw:()=>{redraws++;}
};
vm.createContext(ctx);
vm.runInContext(sourceOf("choose")+"\n"+sourceOf("commit"),ctx);
vm.runInContext("choose(3);commit(g,[3,19,'','']);",ctx);
assert.equal(ctx.selected,-1,"Paused board should not select pieces");
assert.equal(g.moves.length,0,"Paused board must not commit a move");
assert.equal(redraws,0,"Pause must not mutate board display");
ctx.botsPaused=false;
vm.runInContext("choose(3);",ctx);
assert.equal(ctx.selected,3,"Resume restores normal legal selection");
assert.equal(redraws,1);
console.log("Paused Simultan board prevents move input, lost increments, and move commits");
