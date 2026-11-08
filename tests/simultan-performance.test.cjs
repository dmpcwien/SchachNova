"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const src=fs.readFileSync("app/src/main/assets/simultan.js","utf8");
const engineSrc=fs.readFileSync("app/src/main/assets/simultan-engine.js","utf8");
new vm.Script(src,{filename:"simultan.js"});
new vm.Script(engineSrc,{filename:"simultan-engine.js"});
function functionSource(name){
 const begin=src.indexOf("function "+name+"(");
 assert.ok(begin>=0,"Missing function: "+name);
 const brace=src.indexOf("{",begin);
 let depth=0;
 for(let i=brace;i<src.length;i++){
  if(src[i]==="{")depth++;
  else if(src[i]==="}"&&--depth===0)return src.slice(begin,i+1);
 }
 throw Error("Unbalanced function: "+name);
}
function element(){
 return {type:"",className:"",textContent:"",attributes:{},
  setAttribute(k,v){this.attributes[k]=v;}
 };
}
const grid={children:[],replaceChildren(){this.children=[];},append(n){this.children.push(n);}};
const board={children:[],replaceChildren(){this.children=[];},append(n){this.children.push(n);}};
const summary={textContent:""};
const games=Array.from({length:20},(_,i)=>({
 humanColor:i%2?1:-1,strength:i,finished:"",awaitingSwitch:false,thinking:false,
 history:[{t:1}]
}));
const view={grid,board,summary,games,active:0,botsPaused:false,sessionTools:require("../app/src/main/assets/simultan-tools.js"),document:{createElement:()=>element()},
 state:g=>g.history[g.history.length-1]
};
vm.createContext(view);
vm.runInContext(functionSource("drawCards")+"\n"+functionSource("ensureSquares")+
 "\ndrawCards();ensureSquares();",view);
assert.equal(grid.children.length,20);
assert.equal(board.children.length,64);
const firstCard=grid.children[0],firstSquare=board.children[0];
vm.runInContext("drawCards();ensureSquares();",view);
assert.strictEqual(grid.children[0],firstCard,"Card was rebuilt unnecessarily");
assert.strictEqual(board.children[0],firstSquare,"Board square was rebuilt unnecessarily");
games[0].finished="Remis (unzureichendes Material)";
vm.runInContext("drawCards();",view);
assert.strictEqual(grid.children[0],firstCard);
assert.match(grid.children[0].className,/finished/);
assert.match(summary.textContent,/Remis 1/);
games[1].finished="Zeitüberschreitung (Schwarz gewinnt)";
games[2].finished="Zeitüberschreitung (Schwarz gewinnt)";
games[3].finished="Schachmatt";
games[4].finished="Schachmatt";
vm.runInContext("drawCards();",view);
assert.match(summary.textContent,/Abgeschlossen 5\/20/);
assert.match(summary.textContent,/Siege 2/);
assert.match(summary.textContent,/Niederlagen 2/);
assert.match(summary.textContent,/Remis 1/);
assert.strictEqual(grid.children[0],firstCard,"Completed game cards must keep stable nodes");
const paused={
 games,epoch:0,timers:new Set([123]),autoSwitch:true,botsPaused:false,
 panel:{hidden:false},document:{hidden:true},
 window:{SchachNovaSimultanEngine:{reset(){paused.resets++;}}},
 resets:0,cancelSwitch(){paused.switchCancels++;},switchCancels:0,
 stopMotion(){},freezeClocks(){paused.frozen++;},frozen:0,resumeClocks(){paused.resumed++;},resumed:0,clearTimeout(){paused.timersCleared++;},timersCleared:0,
 saveSession(){paused.saved++;},saved:0,
 state:g=>g.history[g.history.length-1],botMove(){paused.started++;},started:0
};
vm.createContext(paused);
vm.runInContext(functionSource("pauseBots")+"\n"+functionSource("resumeBots")+
 "\npauseBots();resumeBots();",paused);
assert.equal(paused.resets,1);
assert.equal(paused.timers.size,0);
assert.equal(paused.epoch,1);
assert.equal(paused.saved,1);
assert.equal(paused.started,0,"Bots must not start while backgrounded");
paused.document.hidden=false;
vm.runInContext("resumeBots();",paused);
assert.equal(paused.started,7,"Resume seven available bot-turn boards after three black-human games end");
paused.panel.hidden=true;
vm.runInContext("resumeBots();",paused);
assert.equal(paused.started,7,"Hidden simultan screen must not calculate moves");
paused.panel.hidden=false;paused.botsPaused=true;
vm.runInContext("resumeBots();",paused);
assert.equal(paused.started,7,"Manually paused bots must remain idle while visible");
assert.match(src,/games\[active\]===g&&!panel\.hidden&&!document\.hidden\)feedbackForMove/);
assert.match(src,/prioritize\(active\)/);
assert.match(src,/function pauseBots\(\)/);
assert.match(src,/document\.addEventListener\("visibilitychange"/);
console.log("20-board DOM reuse, results, background pause and foreground resume passed");
