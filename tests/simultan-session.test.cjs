"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const src=fs.readFileSync("app/src/main/assets/simultan.js","utf8");
const html=fs.readFileSync("app/src/main/assets/index.html","utf8");
const css=fs.readFileSync("app/src/main/assets/schachnova-theme.css","utf8");
const t=require("../app/src/main/assets/simultan-tools.js");
for(const id of ["simultanSummary","simultanAutoSwitch","simultanPromotionDialog","simultanClaimDraw","simultanResumeNotice",
 "simultanClockMinutes","simultanClockIncrement","simultanStrengthMode","simultanExport","simultanImport","simultanPgn","simultanPgnAll","simultanAnalyze"])
 assert.ok(html.includes('id="'+id+'"'),"Missing control "+id);
assert.match(css,/\.simultan-promotion\[hidden\]/);
assert.match(src,/button\.onclick=\(\)=>showBoard\(i,true\)/);
assert.match(src,/function standardKey\(s\)/);
assert.match(src,/repeatCount\(g\)>=5/);
assert.match(src,/function drawClaimReason\(g\)/);
assert.match(src,/function hidePromotion\(\)/);
assert.match(src,/function buildSnapshot\(json\)/);
assert.doesNotMatch(src,/window\.prompt\("Bauernumwandlung/);
const games=Array.from({length:20},(_,i)=>({
 humanColor:i%2?1:-1,strength:i,moves:i===0?["e2e4","e7e5"]:[],finished:"",turn:1,clock:null
}));
const opts={active:10,autoSwitch:false,botsPaused:true,powerMode:"eco",
 strengthMode:"same",fixedStrength:10,startedAt:1762000000000};
const exported=t.serialize(games,opts);
const recovered=t.parse(JSON.stringify(exported));
assert.equal(recovered.games.length,20);
assert.deepEqual(recovered.games[0].moves,["e2e4","e7e5"]);
assert.equal(recovered.active,10);
assert.equal(recovered.powerMode,"eco");
assert.equal(recovered.strengthMode,"same");
assert.equal(recovered.fixedStrength,10);
assert.equal(recovered.botsPaused,true);
const legacy=t.parse(JSON.stringify({version:1,active:3,autoSwitch:false,
 games:games.map(g=>({humanColor:g.humanColor,strength:g.strength,moves:g.moves,finished:""}))}));
assert.equal(legacy.games.length,20);
assert.equal(legacy.strengthMode,"random");
assert.equal(legacy.games[0].clock,null);
for(const bad of [
 {...exported,games:exported.games.slice(0,4)},
 {...exported,games:exported.games.map((g,i)=>i===0?{...g,moves:["a1a8","NOT_A_MOVE"]}:g)},
 {...exported,games:exported.games.map((g,i)=>i===1?{...g,moves:Array(501).fill("e2e4")}:g)},
 {...exported,games:exported.games.map((g,i)=>i===2?{...g,strength:999}:g)},
 {...exported,games:exported.games.map((g,i)=>i===3?{...g,finished:"Weiß gewinnt durch Trick"}:g)}
])assert.throws(()=>t.parse(JSON.stringify(bad)));
assert.throws(()=>t.parse("x".repeat(800001)));
function extract(name){
 const at=src.indexOf("function "+name+"(");
 assert.ok(at>=0,"Missing "+name);
 const open=src.indexOf("{",at);let depth=0;
 for(let i=open;i<src.length;i++){
  if(src[i]==="{")depth++;
  else if(src[i]==="}"&&!--depth)return src.slice(at,i+1);
 }
 throw Error("Unbalanced "+name);
}
const ctx={
 sessionTools:t,
 fresh:()=>({history:[{t:1}],moves:[],humanColor:1,strength:0,finished:"",clock:null}),
 state:g=>g.history[g.history.length-1],
 legalStandard:s=>s.t===1?[["e2e4"]]:[["e7e5"]],
 notation:m=>m[0],applyStandard:s=>({t:-s.t}),
 status:g=>"",drawClaimReason:g=>""
};
vm.createContext(ctx);
vm.runInContext(extract("buildSnapshot"),ctx);
const ok=vm.runInContext('buildSnapshot('+JSON.stringify(JSON.stringify(exported))+')',ctx);
assert.equal(ok.games[0].moves.length,2);
const invalid=JSON.parse(JSON.stringify(exported));invalid.games[0].moves=["a1a8"];
assert.throws(()=>vm.runInContext('buildSnapshot('+JSON.stringify(JSON.stringify(invalid))+')',ctx),/Ungültiger Zug/);
console.log("Legacy backups, 20-board portable JSON, legal replay and corrupt import rejection passed");
