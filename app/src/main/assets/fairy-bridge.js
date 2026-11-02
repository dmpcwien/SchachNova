"use strict";
/* Fairy-Stockfish UCI transport. Requires bundled fairy-stockfish.js worker and its WASM assets. */
(function(){
 let worker=null,ready=false,thinking=false,request=null,variant=null,awaitingReady=false;
 const listeners=new Set();
 const notify=(type,extra={})=>listeners.forEach(fn=>{try{fn({type,...extra});}catch(e){console.error(e);}});
 const post=cmd=>{if(!worker)throw Error("Fairy-Stockfish nicht geladen");worker.postMessage(cmd);};
 const uciMove=m=>typeof m==="string"&&/^(?:[a-z][0-9]+[a-z][0-9]+[qrbnk]?|[A-Za-z]@[a-z][0-9]+)$/.test(m);
 const api={
  subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
  get state(){return {ready,thinking,variant};},
  start(){if(worker)return;ready=false;try{worker=new Worker("fairy-stockfish.js");worker.onerror=e=>{if(!worker)return;const failed=worker;worker=null;try{failed.terminate();}catch(_){}ready=false;thinking=false;awaitingReady=false;variant=null;request=null;notify("error",{message:"Fairy-Stockfish-Dateien fehlen oder konnten nicht geladen werden"});};worker.onmessage=e=>{const line=String(e.data||"");if(line.startsWith("info string Fairy-Stockfish init error")){const failed=worker;worker=null;try{failed?.terminate();}catch(_){}ready=false;thinking=false;awaitingReady=false;variant=null;request=null;notify("error",{message:line});return;}if(line==="uciok"){awaitingReady=true;post("isready");}else if(line==="readyok"){if(awaitingReady){awaitingReady=false;ready=true;notify("ready");}}else if(line.startsWith("bestmove ")){thinking=false;const move=line.split(/\s+/)[1];const completed=request;request=null;if(completed&&uciMove(move))notify("bestmove",{move,request:completed});}else if(line.startsWith("info "))notify("info",{line});};post("uci");}catch(e){if(worker){try{worker.terminate();}catch(_){}}worker=null;ready=false;thinking=false;awaitingReady=false;variant=null;request=null;notify("error",{message:String(e.message||e)});throw e;}},
  configure(name){const cfg=window.SchachNovaVariants?.[name];if(!cfg)throw Error("Unbekannte Variante");if(!ready)throw Error("Fairy-Stockfish ist nicht bereit");post("stop");thinking=false;request=null;variant=name;ready=false;awaitingReady=true;for(const cmd of window.schachNovaVariantUciOptions(name))post(cmd);post("isready");},
  search(moves,depth=10){if(!ready||!variant||thinking)throw Error("Fairy-Stockfish nicht bereit");if(!Array.isArray(moves)||!moves.every(uciMove))throw Error("Ungültige Zugliste");request={variant,moves:moves.slice(),startedAt:Date.now()};post("position startpos"+(moves.length?" moves "+moves.join(" "):""));thinking=true;post("go depth "+Math.max(1,Math.min(20,Math.floor(depth))));},
  stop(){if(worker)post("stop");thinking=false;request=null;},
  close(){if(worker)worker.terminate();worker=null;ready=false;thinking=false;variant=null;request=null;awaitingReady=false;}
 };
 window.SchachNovaFairy=Object.freeze(api);
})();
