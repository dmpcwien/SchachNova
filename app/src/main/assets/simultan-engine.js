/* SchachNova: one shared, bounded Stockfish worker for all simultaneous boards. */
(function(){
"use strict";
let worker=null,ready=false,pending=null,queue=[],watchdog=null,idleTimer=null,disabled=false;
const validMove=m=>typeof m==="string"&&/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m);
const powerModes=["eco","balanced","strong"];
const normalizePower=mode=>powerModes.includes(mode)?mode:"balanced";
const thinkMs=(strength,powerMode)=>powerMode==="eco"?120+strength*8:powerMode==="strong"?420+strength*28:240+strength*14;
const clearWatch=()=>{if(watchdog!==null){clearTimeout(watchdog);watchdog=null;}};
const clearIdle=()=>{if(idleTimer!==null){clearTimeout(idleTimer);idleTimer=null;}};
function releaseIdle(){
 clearIdle();
 if(worker&&!pending&&!queue.length)idleTimer=setTimeout(()=>{
  idleTimer=null;
  if(!pending&&!queue.length&&worker){const unused=worker;worker=null;ready=false;try{unused.terminate();}catch(_){}}
 },15000);
}
function stop(retry){
 clearWatch();clearIdle();
 const old=worker;worker=null;ready=false;
 if(old){try{old.terminate();}catch(_){}}
 if(pending){pending.resolve(null);pending=null;}
 for(const request of queue.splice(0))request.resolve(null);
 disabled=!retry;
}
function fail(reason){console.warn("Simultan Stockfish: "+reason+" · lokaler Ersatzgegner");stop(false);}
function watch(stage,ms=12000){clearWatch();watchdog=setTimeout(()=>fail(stage+" reagiert nicht"),ms);}
function next(){
 if(!ready||pending||!queue.length||!worker){if(ready&&!pending&&!queue.length)releaseIdle();return;}
 clearIdle();
 const request=queue.shift();pending=request;
 try{
  worker.postMessage("setoption name Skill Level value "+request.strength);
  worker.postMessage("position startpos"+(request.moves.length?" moves "+request.moves.join(" "):""));
  worker.postMessage("go movetime "+thinkMs(request.strength,request.powerMode));
  watch("Zugberechnung");
 }catch(e){fail(e.message);}
}
function onLine(line){
 if(line==="uciok"){worker?.postMessage("setoption name Hash value 16");worker?.postMessage("isready");return;}
 if(line==="readyok"){if(!ready){ready=true;clearWatch();next();}return;}
 if(!line.startsWith("bestmove ")||!pending)return;
 const choice=line.split(/\s+/)[1];
 const request=pending;pending=null;clearWatch();
 request.resolve(request.cancelled?null:validMove(choice)?choice:null);
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
function request(moves,strength,options={}){
 if(disabled||!Array.isArray(moves)||moves.length>500||!moves.every(validMove))return Promise.resolve(null);
 const level=Math.max(0,Math.min(20,Math.trunc(Number(strength)||0)));
 const boardId=Number.isInteger(options.boardId)?options.boardId:-1;
 return new Promise(resolve=>{
  const job={moves:moves.slice(),strength:level,boardId,powerMode:normalizePower(options.powerMode),resolve};
  if(options.priority)queue.unshift(job);else queue.push(job);
  boot();next();
 });
}
function cancelBoard(boardId){
 if(!Number.isInteger(boardId)||boardId<0)return 0;
 let cancelled=0;
 for(let i=queue.length-1;i>=0;i--)if(queue[i].boardId===boardId){
  const job=queue.splice(i,1)[0];job.cancelled=true;job.resolve(null);cancelled++;
 }
 if(pending?.boardId===boardId&&!pending.cancelled){
  pending.cancelled=true;cancelled++;
  try{worker?.postMessage("stop");}catch(_){}
 }
 if(!pending)next();
 return cancelled;
}
function prioritize(boardId){
 const index=queue.findIndex(job=>job.boardId===boardId);
 if(index<0)return false;
 if(index>0){queue.unshift(...queue.splice(index,1));}
 return true;
}
window.SchachNovaSimultanEngine=Object.freeze({
 request,prioritize,cancelBoard,
 reset(){stop(true);},
 get state(){return {available:!disabled,ready,queue:queue.length,thinking:!!pending};}
});
})();