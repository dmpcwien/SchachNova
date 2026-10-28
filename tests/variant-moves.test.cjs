"use strict";
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const source=fs.readFileSync("app/src/main/assets/chess.js","utf8");
const engine=source.slice(0,source.indexOf("let premove=null"));
assert.ok(engine.length>7000,"Expected chess rules core");
function evaluate(mode,body){
 const context={console};
 vm.runInNewContext(engine+"\nconst variantMode="+JSON.stringify(mode)+";const checksGiven=[0,0];const history=[];\n"+body,context);
}
const empty=()=>Array(128).fill(".");
const base=(board,turn=1,ep=-1)=>({b:board,t:turn,c:0,ep,half:0,full:1});
for(const mode of ["torpedo","berolina","hoppelpoppel"]){
 const b=empty();b[116]="K";b[4]="k";
 if(mode==="torpedo"){
  b[68]="P";const moves=evaluate(mode,`const s=${JSON.stringify(base(b))};const ms=legal(s).filter(m=>m[0]===68);if(!ms.some(m=>m[1]===36))throw Error("Torpedo pawn must double-step from e4");`);
 }else if(mode==="berolina"){
  b[100]="P";b[84]="p";
  evaluate(mode,`const s=${JSON.stringify(base(b))};const ms=legal(s).filter(m=>m[0]===100);if(!ms.some(m=>m[1]===85))throw Error("Berolina pawn must move diagonally");if(!ms.some(m=>m[1]===84))throw Error("Berolina pawn must capture straight");`);
 }else{
  b[82]="B";b[83]="N";
  evaluate(mode,`const s=${JSON.stringify(base(b))};const bm=legal(s).filter(m=>m[0]===82);const nm=legal(s).filter(m=>m[0]===83);if(!bm.some(m=>m[1]===49))throw Error("Hoppel bishop must leap like knight");if(!nm.some(m=>m[1]===66))throw Error("Hoppel knight must slide diagonally");`);
 }
}
{
 const b=empty();b[116]="K";b[4]="k";b[16]="P";
 evaluate("antichess",`const s=${JSON.stringify(base(b))};const promotions=legal(s).filter(m=>m[0]===16&&m[1]===0).map(m=>m[2]);if(!["q","r","b","n","k"].every(p=>promotions.includes(p)))throw Error("Antichess must allow all five promotion pieces including king");`);
 evaluate("standard",`const s=${JSON.stringify(base(b))};const promotions=legal(s).filter(m=>m[0]===16&&m[1]===0).map(m=>m[2]);if(promotions.includes("k"))throw Error("Standard chess must prohibit king promotion");`);
}
console.log("SchachNova: variant moves and promotion tests passed");
