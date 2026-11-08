"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const src=fs.readFileSync("app/src/main/assets/simultan.js","utf8");
const html=fs.readFileSync("app/src/main/assets/index.html","utf8");
const css=fs.readFileSync("app/src/main/assets/schachnova-theme.css","utf8");
for(const id of ["simultanSummary","simultanAutoSwitch","simultanPromotionDialog","simultanClaimDraw","simultanResumeNotice"])
 assert.ok(html.includes('id="'+id+'"'),"Missing control "+id);
assert.match(css,/\.simultan-promotion\[hidden\]/);
assert.match(src,/button\.onclick=\(\)=>showBoard\(i,true\)/,"Finished boards must remain selectable");
assert.match(src,/simultan\.v1/);
assert.match(src,/function standardKey\(s\)/);
assert.match(src,/repeatCount\(g\)>=5/);
assert.match(src,/function drawClaimReason\(g\)/);
assert.match(src,/g\.finished="Remis \("\+reason\+"\)"/);
assert.match(src,/if\(shouldSwitch&&autoSwitch\)/);
assert.match(src,/function hidePromotion\(\)/);
assert.doesNotMatch(src,/window\.prompt\("Bauernumwandlung/);
function extract(name){
 const at=src.indexOf("function "+name+"(");
 assert.ok(at>=0,name+" function missing");
 const open=src.indexOf("{",at);let depth=0;
 for(let i=open;i<src.length;i++){
  if(src[i]==="{")depth++;
  else if(src[i]==="}"&&!--depth)return src.slice(at,i+1);
 }
 throw Error("Unbalanced "+name);
}
const code=[extract("saveSession"),extract("loadSession")].join("\n");
const data=[1,2,3,4,5].map((n)=>({humanColor:n%2?1:-1,strength:n,moves:[["e2e4"]],finished:""}));
const mem={};
const context={
 localStorage:{getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=v;}},
 storageKey:"schachnova.simultan.v1",
 console:{warn(){}}
};
vm.createContext(context);
const setup=[
 "let games="+JSON.stringify(data)+";",
 "let active=2;let autoSwitch=false;let botsPaused=true;let powerMode=\"eco\";",
 "const notation=m=>m[0];",
 'const autoToggle={checked:true},count={value:""},resumeNotice={textContent:""},powerSelect={value:""},pauseButton={textContent:"",setAttribute(){}};',
 'function updatePauseControl(){pauseButton.textContent=botsPaused?"pausiert":"läuft";}',
 'const fresh=()=>({history:[{}],moves:[],humanColor:1,strength:0,finished:""});',
 "const state=g=>g.history[g.history.length-1];",
 'const legalStandard=s=>[["e2e4"]];',
 "const applyStandard=(s,m)=>({});",
 'const status=g=>"";',
 'const drawClaimReason=g=>"";',
 code,
 "saveSession();",
 "games=[];active=0;autoSwitch=true;botsPaused=false;powerMode=\"balanced\";",
 'if(!loadSession())throw Error("Valid save was rejected");',
 'if(games.length!==5||active!==2||autoSwitch!==false||games[0].moves.length!==1||count.value!=="5"||botsPaused!==true||powerMode!=="eco"||powerSelect.value!=="eco")throw Error("Restoration incorrect");'
].join("\n");
vm.runInContext(setup,context);
assert.equal(JSON.parse(mem[context.storageKey]).games.length,5);
assert.equal(JSON.parse(mem[context.storageKey]).autoSwitch,false);
assert.equal(JSON.parse(mem[context.storageKey]).botsPaused,true);
assert.equal(JSON.parse(mem[context.storageKey]).powerMode,"eco");
const bad=JSON.parse(mem[context.storageKey]);bad.games[1].moves=["a1a8"];
mem[context.storageKey]=JSON.stringify(bad);
vm.runInContext('if(loadSession())throw Error("Illegal persisted move was accepted")',context);
const huge=JSON.parse(mem[context.storageKey]);huge.games[1].moves=Array(501).fill("e2e4");
mem[context.storageKey]=JSON.stringify(huge);
vm.runInContext('if(loadSession())throw Error("Unbounded game was accepted")',context);
console.log("Simultan saving, legal replay, corrupt-session rejection, rules and UI controls verified");
