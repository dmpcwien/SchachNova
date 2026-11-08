"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const chess=fs.readFileSync("app/src/main/assets/chess.js","utf8");
const html=fs.readFileSync("app/src/main/assets/index.html","utf8");
const nav=fs.readFileSync("app/src/main/assets/game-mode-navigation.js","utf8");
function extract(source,name){
 const start=source.indexOf("function "+name+"(");assert.ok(start>=0,"Missing "+name);
 const open=source.indexOf("{",start);let depth=0;
 for(let i=open;i<source.length;i++){
  if(source[i]==="{")depth++;
  else if(source[i]==="}"&&!--depth)return source.slice(start,i+1);
 }
 throw Error("Unbalanced "+name);
}
assert.match(html,/id="coachColorChooser"/);
assert.match(html,/id="coachPlayerColor"/);
assert.match(html,/value="white">Weiß/);
assert.match(html,/value="black">Schwarz/);
assert.match(html,/data-seconds="0">Unbegrenzt/);
assert.match(nav,/coachPicker\.hidden=value!=='coach'/);
assert.match(nav,/window\.schachNovaBotColor=\(mode==='coach'&&document\.getElementById\('coachPlayerColor'\)\.value==='black'\)/);
assert.match(nav,/flipped=\(mode==='coach'/);
assert.match(nav,/if\(value==='coach'\)\{seconds=0;increment=0;\}/);
assert.match(nav,/window\.schachNovaUnlimitedClock=seconds===0/);
const white={textContent:"",classList:{toggle(){}}};
const black={textContent:"",classList:{toggle(){}}};
const status={textContent:""};
const claim={disabled:false,textContent:""};
const all={whiteClock:white,blackClock:black,status,claimDraw:claim};
const ctx={
 window:{schachNovaUnlimitedClock:true},clock:[0,0],clockHistory:[[0,0]],
 running:true,ended:"",lastEndShown:"",history:[{t:1}],viewIndex:0,
 last:0,performance:{now:()=>2200},document:{getElementById:id=>all[id]},
 current:()=>({t:1}),format:()=>{throw Error("Unlimited time must not be formatted as countdown");},
 status:()=>"Weiß am Zug",drawClaimReason:()=>"",showGameResult:()=>{throw Error("No timeout ending");},
 renderClocks:()=>{},Math
};
vm.createContext(ctx);
vm.runInContext(extract(chess,"tick"),ctx);
vm.runInContext("tick()",ctx);
assert.deepEqual(ctx.clock,[0,0],"Unlimited clock must not expire");
assert.equal(ctx.ended,"");
assert.equal(ctx.running,true,"An unlimited chess game may be active without a clock");
vm.runInContext(extract(chess,"renderClocks"),ctx);
vm.runInContext("renderClocks()",ctx);
assert.equal(white.textContent,"∞");
assert.equal(black.textContent,"∞");
assert.equal(status.textContent,"Weiß am Zug");
function bar(){
 const icon={textContent:""},name={innerHTML:""};
 const obj={attrs:{},kids:[],querySelector:q=>q===".local-player-icon"?icon:name,
  setAttribute(k,v){this.attrs[k]=v;},appendChild(n){this.kids.push(n);return n;}};
 return {bar:obj,icon,name};
}
const top=bar(),bottom=bar();
const doc={querySelector:s=>s.endsWith(".local-player-top")?top.bar:bottom.bar,
 getElementById:id=>id==="botMode"?{value:"bot"}:all[id]};
const bctx={document:doc,flipped:true,playerBarLayout:"",Math};
vm.createContext(bctx);
vm.runInContext(extract(chess,"syncPlayerBars"),bctx);
vm.runInContext("syncPlayerBars()",bctx);
assert.equal(top.bar.attrs["aria-label"],"Spieler Weiß");
assert.equal(bottom.bar.attrs["aria-label"],"Spieler Schwarz");
assert.equal(top.bar.kids.at(-1),white);
assert.equal(bottom.bar.kids.at(-1),black);
assert.match(bottom.name.innerHTML,/Du/);
bctx.flipped=false;
vm.runInContext("syncPlayerBars()",bctx);
assert.equal(top.bar.attrs["aria-label"],"Spieler Schwarz");
assert.equal(bottom.bar.attrs["aria-label"],"Spieler Weiß");
assert.equal(top.bar.kids.at(-1),black);
assert.equal(bottom.bar.kids.at(-1),white);
console.log("Coach white/black UI, board orientation, player labels, and unlimited clock verified");
