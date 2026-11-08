/* SchachNova: one shared, bounded Stockfish worker for all simultaneous boards. */
(function(){
"use strict";
let worker=null,ready=false,pending=null,queue=[],watchdog=null,disabled=false;
const validMove=m=>typeof m==="string"&&/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m);
const clearWatch=()=>{if(watchdog!==null){clearTimeout(watchdog);watchdog=null;}};
function stop(retry){
 clearWatch();
 const old=worker;worker=null;ready=false;
 if(old){try{old.terminate();}catch(_){}}
 if(pending){pending.resolve(null);pending=null;}
 for(const request of queue.splice(0))request.resolve(null);
 disabled=!retry;
}
function fail(reason){console.warn("Simultan Stockfish: "+reason+" · lokaler Ersatzgegner");stop(false);}
function watch(stage,ms=12000){clearWatch();watchdog=setTimeout(()=>fail(stage+" reagiert nicht"),ms);}
function next(){
 if(!ready||pending||!queue.length||!worker)return;
 const request=queue.shift();pending=request;
 try{
  worker.postMessage("setoption name Skill Level value "+request.strength);
  worker.postMessage("position startpos"+(request.moves.length?" moves "+request.moves.join(" "):""));
  worker.postMessage("go movetime "+(240+request.strength*14));
  watch("Zugberechnung");
 }catch(e){fail(e.message);}
}
function onLine(line){
 if(line==="uciok"){worker?.postMessage("isready");return;}
 if(line==="readyok"){if(!ready){ready=true;clearWatch();next();}return;}
 if(!line.startsWith("bestmove ")||!pending)return;
 const choice=line.split(/\s+/)[1];
 const request=pending;pending=null;clearWatch();
 request.resolve(validMove(choice)?choice:null);
 next();
}
function boot(){
 if(disabled||worker)return;
 try{
  const current=new Worker("stockfish-19-lite-single.js");
  worker=current;ready=false;
  current.onmessage=event=>{
   if(worker!==current)return;
   String(event.data??"").split(/\r?\n/).forEach(line=>{if(line)onLine(line.trim());});
  };
  current.onerror=()=>{if(worker===current)fail("Worker-Fehler");};
  current.postMessage("uci");watch("Initialisierung");
 }catch(e){fail("Startfehler: "+e.message);}
}
function request(moves,strength){
 if(disabled||!Array.isArray(moves)||moves.length>500||!moves.every(validMove))return Promise.resolve(null);
 const level=Math.max(0,Math.min(20,Math.trunc(Number(strength)||0)));
 return new Promise(resolve=>{
  queue.push({moves:moves.slice(),strength:level,resolve});
  boot();next();
 });
}
window.SchachNovaSimultanEngine=Object.freeze({
 request,
 reset(){stop(true);},
 get state(){return {available:!disabled,ready,queue:queue.length,thinking:!!pending};}
});
})();