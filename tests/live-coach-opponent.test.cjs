"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm");
const bridge=fs.readFileSync("app/src/main/assets/stockfish-bridge.js","utf8");
const coach=fs.readFileSync("app/src/main/assets/live-coach.js","utf8");
const nav=fs.readFileSync("app/src/main/assets/game-mode-navigation.js","utf8");
new vm.Script(bridge);new vm.Script(coach);
assert.match(nav,/window\.schachNovaCoachMatch=mode==='coach'/);
assert.match(nav,/window\.schachNovaBotColor=\(mode==='coach'&&document\.getElementById\('coachPlayerColor'\)\.value==='black'\)/);
assert.ok(nav.indexOf("window.schachNovaCoachMatch=mode==='coach'")<nav.indexOf("document.getElementById('newGame').click()"));
const listeners={};
function element(name,extra={}){
 return Object.assign({
  value:"",hidden:false,textContent:"",checked:false,options:[],selectedOptions:[{textContent:"Mittel"}],
  addEventListener(evt,cb){(listeners[name+":"+evt]??=[]).push(cb);},
  dispatchEvent(event){for(const f of listeners[name+":"+event.type]||[])f(event);},
  onclick:()=>{},click(){this.onclick?.();}
 },extra);
}
const els={
 engineInfo:element("engineInfo"),botMode:element("botMode",{value:"bot"}),
 botLevel:element("botLevel",{value:"8",options:[{value:"8"}]}),
 homeBotLevel:element("homeBotLevel",{value:"8"}),
 analyzeButton:element("analyzeButton"),
 newGame:element("newGame",{onclick(){}}),
 liveCoachPanel:element("liveCoachPanel",{hidden:true}),
 liveCoachMessage:element("liveCoachMessage"),
 coachButton:element("coachButton"),
 backHome:element("backHome")
};
const document={
 getElementById:key=>els[key]||null,
};
let history=[{t:1,b:Array(128).fill("."),c:15,ep:-1,half:0,full:1}],
 movesPlayed=[],viewIndex=0,ended="",variantMode="standard";
history[0].b[116]="K";history[0].b[4]="k";history[0].b[100]="P";history[0].b[20]="p";
const human=[100,68,"",""],opponent=[20,52,"",""];
function notation(m){return "abcdefgh"[m[0]&7]+(8-(m[0]>>4))+"abcdefgh"[m[1]&7]+(8-(m[1]>>4))+(m[2]||"");}
function legal(s){return s.t===1?[human]:[opponent];}
function current(){return history[history.length-1];}
function move(m){
 if(!legal(current()).some(x=>notation(x)===notation(m)))return;
 const old=current();
 const next={...old,b:old.b.slice(),t:-old.t};
 next.b[m[1]]=next.b[m[0]];next.b[m[0]]=".";
 history.push(next);movesPlayed.push(m);viewIndex=history.length-1;if(typeof ctx!=="undefined")ctx.viewIndex=viewIndex;
}
let instance=0;
const allWorkerCommands=[];
class WorkerMock{
 constructor(){this.id=++instance;this.dead=false;this.commands=[];}
 postMessage(command){
  this.commands.push(command);allWorkerCommands.push({id:this.id,command});
  const fire=line=>setImmediate(()=>{if(!this.dead)this.onmessage({data:line});});
  if(command==="uci")fire("id name Stockfish 19\nuciok\n");
  else if(command==="isready")fire("readyok\n");
  else if(command==="go movetime 450")fire("info depth 10 score cp 30\nbestmove e7e5\n");
  else if(command==="go depth 10")fire("info depth 10 score cp 15\nbestmove g1f3\n");
 }
 terminate(){this.dead=true;}
}
const pendingTimers=new Set();
function fastTimeout(fn,ms){
 const timer=setTimeout(()=>{pendingTimers.delete(timer);fn();},ms>3000?ms:15);
 if(ms>3000)timer.unref();
 pendingTimers.add(timer);
 return timer;
}
function fastClearTimeout(id){clearTimeout(id);pendingTimers.delete(id);}
const win={schachNovaBotColor:-1,schachNovaCoachMatch:true};
const ctx={window:win,document,console:{warn(){}},localStorage:{getItem:()=>null,setItem(){}},
 Worker:WorkerMock,Event:class{constructor(type){this.type=type;}},setTimeout:fastTimeout,
 clearTimeout:fastClearTimeout,setImmediate,Date,Promise,Math,
 current,legal,move,movesPlayed,history,viewIndex,variantMode,ended};
vm.createContext(ctx);
vm.runInContext(bridge,ctx,{filename:"stockfish-bridge.js"});
vm.runInContext(coach,ctx,{filename:"live-coach.js"});
win.SchachNovaLiveCoach.enable(true);
assert.equal(els.liveCoachPanel.hidden,false);
assert.match(els.liveCoachMessage.textContent,/der Computer Schwarz/);
win.schachNovaBotKickoff();
assert.equal(ctx.movesPlayed.length,0,"Computer must not move when human has white to play");
vm.runInContext("move([100,68,'',''])",ctx);
async function main(){
 await new Promise(resolve=>setTimeout(resolve,100));
 assert.equal(ctx.movesPlayed.length,2,"Coach mode must autonomously play black move after white human move");
 assert.equal(notation(ctx.movesPlayed[0]),"e2e4");
 assert.equal(notation(ctx.movesPlayed[1]),"e7e5");
 assert.equal(ctx.current().t,1,"Human must have next turn");
 assert.ok(allWorkerCommands.some(x=>x.command==="go movetime 450"),"Dedicated opponent Stockfish must search");
 assert.ok(allWorkerCommands.filter(x=>x.command==="go depth 10").length>=1,"Live coach analyzes independently");
 assert.match(els.liveCoachMessage.textContent,/Ausgezeichneter Zug|Guter Zug|Ungenauigkeit|Fehler/);
 assert.ok(instance>=2,"Opponent and coach use distinct workers");
 for(const timer of pendingTimers)clearTimeout(timer);
 console.log("PASS Coach vs computer: automated black move, multi-line UCI, independent human-move feedback");
}
main().catch(error=>{for(const timer of pendingTimers)clearTimeout(timer);console.error(error);process.exitCode=1;});
