/* Offline UCI bridge for Stockfish 19 Lite. The bundled engine is GPL-3.0. */
(function(){
"use strict";
const botSide=()=>window.schachNovaBotColor===1?1:-1;
let worker=null,ready=false,busy=false,mode="human",strength=12,pending=null,lastScore=null,botPosition=null,standardFaulted=false;
const info=document.getElementById("engineInfo"),bot=document.getElementById("botMode"),level=document.getElementById("botLevel"),analysis=document.getElementById("analyzeButton");
const homeLevel=document.getElementById("homeBotLevel");
const notation=m=>"abcdefgh"[m[0]&7]+(8-(m[0]>>4))+"abcdefgh"[m[1]&7]+(8-(m[1]>>4))+(m[2]||"");
const setInfo=t=>{if(info)info.textContent=t;};
/* Deliberate, strength-dependent thinking time. Skill controls playing strength;
   this delay controls how quickly a computed move becomes visible. */
const botThinkMs=()=>Math.round(1100+Math.max(0,Math.min(20,strength))*115);
let botDelayTimer=null,botDelayGeneration=0;
function cancelBotDelay(){botDelayGeneration++;if(botDelayTimer!==null)clearTimeout(botDelayTimer);botDelayTimer=null;}
function deliverBotMove(chosen,position,expected,started){
 cancelBotDelay();
 const generation=botDelayGeneration;
 const wait=Math.max(0,botThinkMs()-(Date.now()-started));
 botDelayTimer=setTimeout(()=>{
  botDelayTimer=null;
  if(generation!==botDelayGeneration||mode!=="bot"||ended||current()!==position||
     current().t!==botSide()||viewIndex!==history.length-1||
     movesPlayed.map(notation).join(" ")!==expected)return;
  const valid=legal(current()).find(m=>notation(m)===notation(chosen));
  if(valid)move(valid);
 },wait);
}
let botStartedAt=0;

let standardWatchdog=null;
function clearStandardWatchdog(){if(standardWatchdog!==null){clearTimeout(standardWatchdog);standardWatchdog=null;}}
function resetStandardEngine(){
 clearStandardWatchdog();
 const old=worker;worker=null;ready=false;busy=false;pending=null;botPosition=null;
 if(old){try{old.terminate();}catch(_){}}
}
function standardFailure(reason){
 resetStandardEngine();standardFaulted=true;
 setInfo("⚠ Stockfish 19 ausgefallen ("+reason+"). Notfallmodus: lokaler Ersatzgegner.");
 if(mode==="bot"&&variantMode==="standard")playVariantFallback();
}
function watchStandard(stage){
 clearStandardWatchdog();
 standardWatchdog=setTimeout(()=>{
  standardWatchdog=null;
  if(worker)standardFailure(stage+" · Zeitüberschreitung");
 },14000);
}
function startEngine(){
 if(worker||standardFaulted)return;
 try{
   const engine=new Worker("stockfish-19-lite-single.js");
   worker=engine;
   engine.onmessage=e=>{
     if(worker!==engine)return;
     for(const raw of String(e.data??"").split(/\r?\n/)){
      const line=raw.trim();
      if(!line)continue;
     if(line==="uciok")engine.postMessage("isready");
     if(line==="readyok"){clearStandardWatchdog();ready=true;setInfo("Stockfish 19 bereit · offline");maybePlay();}
     if(line.startsWith("info depth")&&line.includes(" score ")){const m=line.match(/score (cp|mate) (-?\d+)/);if(m){lastScore=m[1]==="cp"?(Number(m[2])/100).toFixed(2):"Matt in "+m[2];if(pending==="analysis")setInfo("Analyse · "+lastScore);}}
     if(line.startsWith("bestmove ")){
      clearStandardWatchdog();busy=false;
      const u=line.split(" ")[1],action=pending;pending=null;
      if(action==="bot"){
       const expected=botPosition;botPosition=null;
       if(expected!==movesPlayed.map(notation).join(" "))return;
       if(mode!=="bot"||variantMode!=="standard"||ended||viewIndex!==history.length-1||current().t!==botSide())return;
       const match=legal(current()).find(m=>notation(m)===u);
       if(match)deliverBotMove(match,current(),expected,botStartedAt);
       else standardFailure("unzulässiger Engine-Zug "+u);
      }else if(action==="analysis")setInfo("Stockfish empfiehlt: "+u+(lastScore!==null?" · Bewertung "+lastScore:""));
     }
     }
   };
   engine.onerror=()=>{if(worker===engine)standardFailure("Worker-Fehler");};
   engine.postMessage("uci");watchStandard("Start");
 }catch(e){standardFailure("Start: "+e.message);}
}
function sendPosition(){worker.postMessage("position startpos moves "+movesPlayed.slice(0,viewIndex).map(notation).join(" "));}
let fairyReady=false,fairyVariant=null,fairyRequested=false,fairyFaulted=false;
let fairyWatchdog=null;
function clearFairyWatchdog(){if(fairyWatchdog!==null){clearTimeout(fairyWatchdog);fairyWatchdog=null;}}
function watchFairy(stage){clearFairyWatchdog();const position=current(),variant=variantMode;fairyWatchdog=setTimeout(()=>{fairyWatchdog=null;if(mode==="bot"&&variantMode===variant&&current()===position&&current().t===botSide()&&!ended){setInfo("⚠ Fairy-Stockfish reagiert nicht ("+stage+"). Notfallmodus: lokaler Ersatzgegner.");fairyFaulted=true;fairyReady=false;fairyRequested=false;fairyVariant=null;try{fairy?.close();}catch(_){}playVariantFallback();}},14000);}
const fairy=window.SchachNovaFairy;
if(fairy)fairy.subscribe(event=>{
 if(event.type==="ready"){clearFairyWatchdog();fairyReady=true;setInfo("Fairy-Stockfish bereit · offline");maybePlay();}
 if(event.type==="error"){clearFairyWatchdog();fairyReady=false;fairyVariant=null;fairyRequested=false;fairyFaulted=true;setInfo("⚠ Fairy-Stockfish ausgefallen. Notfallmodus: lokaler Ersatzgegner. "+event.message);playVariantFallback();}
 if(event.type==="bestmove"){
  clearFairyWatchdog();const req=event.request;
  if(!req||mode!=="bot"||variantMode!==req.variant||current().t!==botSide()||ended||viewIndex!==history.length-1)return;
  if(req.moves.join(" ")!==movesPlayed.map(notation).join(" "))return;
  const match=legal(current()).find(m=>notation(m)===event.move);
  if(match)deliverBotMove(match,current(),req.moves.join(" "),req.startedAt||Date.now());else{setInfo("⚠ Engine-Zug ungültig. Notfallmodus: lokaler Ersatzgegner.");playVariantFallback();}
 }
});
// Local rules-aware bot for Torpedo chess. Never uses standard Stockfish moves.
let torpedoPending=false;
function playTorpedoBot(){
 if(torpedoPending)return;
 torpedoPending=true;
 const position=current(),snapshot=movesPlayed.map(notation).join(" "),sideToMove=position.t,torpedoStartedAt=Date.now();
 setInfo("Torpedo-Bot berechnet einen legalen Zug …");
 setTimeout(()=>{
  torpedoPending=false;
  if(mode!=="bot"||variantMode!=="torpedo"||ended||current()!==position||current().t!==sideToMove||sideToMove!==botSide()||movesPlayed.map(notation).join(" ")!==snapshot)return;
  const options=legal(position);
  if(!options.length)return;
  const values={p:100,n:320,b:330,r:500,q:900,k:0};
  const scored=options.map(m=>{
   const captured=position.b[m[1]],enPassant=m[3]==="ep";
   const next=apply(position,m);
   const replies=legal(next);
   const immediate=(captured!=="."?values[captured.toLowerCase()]||0:0)+(enPassant?100:0)+(m[2]?values[m[2]]-100:0);
   const threatened=replies.filter(x=>x[1]===m[1]).reduce((max,x)=>Math.max(max,values[next.b[m[1]].toLowerCase()]||0),0);
   const center=3.5-Math.abs((m[1]&7)-3.5);
   const mobility=Math.min(20,replies.length);
   const mate=replies.length===0&&checked(next)?100000:0;
   return {m,score:mate+immediate*1.2-threatened*.65+center*5-mobility*.2+Math.random()*Math.max(1,22-strength)};
  });
  scored.sort((a,b)=>b.score-a.score);
  const chosen=legal(current()).find(m=>notation(m)===notation(scored[0].m));
  if(chosen)deliverBotMove(chosen,current(),snapshot,torpedoStartedAt);
 },100);
}
let fallbackTimer=null;
function playVariantFallback(localMode=false){
 clearFairyWatchdog();
 if(fallbackTimer!==null||mode!=="bot"||ended)return;
 const position=current(),snapshot=movesPlayed.map(notation).join(" "),variant=variantMode;
 fallbackTimer=setTimeout(()=>{
  fallbackTimer=null;
  if(mode!=="bot"||variantMode!==variant||current()!==position||current().t!==botSide()||ended||viewIndex!==history.length-1||movesPlayed.map(notation).join(" ")!==snapshot)return;
  const options=legal(position);
  if(!options.length)return;
  setInfo(localMode?"Lokaler Computergegner · ohne Stockfish-Engine":"⚠ Notfallmodus aktiv: lokaler Ersatzgegner (nicht Stockfish).");
  const value={p:100,n:320,b:330,r:500,q:900,k:0};
  const sorted=options.map(m=>({m,score:(position.b[m[1]]!=="."?(value[position.b[m[1]].toLowerCase()]||0):0)+(m[2]?700:0)+Math.random()*45})).sort((a,b)=>b.score-a.score);
  deliverBotMove(sorted[0].m,position,snapshot,Date.now()-botThinkMs());
 },350);
}
function maybePlay(){
 if(mode!=="bot"||current().t!==botSide()||ended||viewIndex!==history.length-1||botDelayTimer!==null)return;
 if(variantMode!=="standard"){
  if(variantMode==="torpedo"){playTorpedoBot();return;}
  if(window.SchachNovaVariants?.[variantMode]?.bot===false){setInfo("Für diese Variante ist nur das lokale Spiel zu zweit freigegeben");return;}
  if(window.SchachNovaVariants?.[variantMode]?.botEngine==="local"){playVariantFallback(true);return;}
  if(fairyFaulted){setInfo("⚠ Fairy-Stockfish derzeit ausgefallen. Notfallmodus: lokaler Ersatzgegner.");playVariantFallback();return;}
  if(!fairy){setInfo("Fairy-Stockfish nicht verfügbar – lokaler Ersatzgegner");playVariantFallback();return;}
  if(!fairyRequested){fairyRequested=true;try{fairy.start();watchFairy("Start");}catch(e){fairyRequested=false;fairyFaulted=true;setInfo("⚠ Engine-Start fehlgeschlagen. Notfallmodus: lokaler Ersatzgegner.");playVariantFallback();}return;}
  if(!fairyReady)return;
  try{
   if(fairyVariant!==variantMode){fairy.configure(variantMode);fairyVariant=variantMode;watchFairy("Konfiguration");return;}
   if(!fairy.state.ready||fairy.state.thinking)return;
   fairy.search(movesPlayed.map(notation),Math.max(1,Math.min(16,Math.round(strength*.7)+2)));watchFairy("Zugberechnung");
   setInfo("Fairy-Stockfish denkt · "+(window.SchachNovaVariants[variantMode]?.label||variantMode));
  }catch(e){fairyFaulted=true;setInfo("⚠ Fairy-Stockfish-Fehler: "+e.message+". Notfallmodus: lokaler Ersatzgegner.");try{fairy.close();}catch(_){}playVariantFallback();}
  return;
 }
 if(standardFaulted){playVariantFallback();return;}
 if(!ready){startEngine();return;}
 if(busy)return;
 busy=true;pending="bot";botStartedAt=Date.now();botPosition=movesPlayed.map(notation).join(" ");
 try{worker.postMessage("setoption name Skill Level value "+strength);sendPosition();worker.postMessage("go movetime 450");watchStandard("Zugberechnung");}
 catch(e){standardFailure("Zugberechnung: "+e.message);}
}
bot.addEventListener("change",()=>{mode=bot.value;if(mode!=="bot"){clearFairyWatchdog();cancelBotDelay();if(fallbackTimer!==null){clearTimeout(fallbackTimer);fallbackTimer=null;}if(fairy)fairy.stop();if(worker&&busy)resetStandardEngine();botPosition=null;}if(mode!=="human"&&variantMode==="standard")startEngine();setInfo(mode==="human"?"Zwei Spieler · lokal":"Stockfish wird vorbereitet …");maybePlay();});
try{const saved=localStorage.getItem("schachnova.botStrength");if(saved!==null&&[...level.options].some(o=>o.value===saved))level.value=saved;}catch(e){}strength=Number(level.value);if(homeLevel)homeLevel.value=level.value;
level.addEventListener("change",()=>{strength=Number(level.value);if(homeLevel)homeLevel.value=level.value;try{localStorage.setItem("schachnova.botStrength",level.value);}catch(e){}setInfo("Bot-Stärke eingestellt: "+level.selectedOptions[0].textContent);if(worker&&ready&&!busy)worker.postMessage("setoption name Skill Level value "+strength);});
homeLevel?.addEventListener("change",()=>{level.value=homeLevel.value;level.dispatchEvent(new Event("change"));});
analysis.addEventListener("click",()=>{if(variantMode!=="standard"){setInfo("Stockfish-Analyse für diese Variante noch nicht freigegeben");return;}startEngine();if(!ready||busy){setInfo("Engine lädt oder ist beschäftigt");return;}busy=true;pending="analysis";sendPosition();worker.postMessage("go movetime 1100");watchStandard("Analyse");setInfo("Stockfish analysiert …");});
window.schachNovaBotKickoff=()=>{
 if(window.schachNovaCoachMatch===true&&bot.value!=="bot"){
  bot.value="bot";
  bot.dispatchEvent(new Event("change"));
 }
 mode=bot.value;
 if(mode==="bot"){
  if(variantMode==="standard")startEngine();
  maybePlay();
 }
};
// The dedicated live-coach.js owns the Coach button and its separate analysis worker.
// Do not attach a second Coach handler or run duplicate analyses here.
const baseMove=move;move=function(m){const count=movesPlayed.length;baseMove(m);if(movesPlayed.length!==count)maybePlay();};
const baseNew=document.getElementById("newGame").onclick;document.getElementById("newGame").onclick=()=>{clearFairyWatchdog();if(fallbackTimer!==null){clearTimeout(fallbackTimer);fallbackTimer=null;}cancelBotDelay();resetStandardEngine();standardFaulted=false;if(fairy)fairy.close();fairyVariant=null;fairyReady=false;fairyRequested=false;fairyFaulted=false;busy=false;pending=null;botPosition=null;baseNew();maybePlay();};
})();
