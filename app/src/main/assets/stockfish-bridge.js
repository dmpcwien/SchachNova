/* Offline UCI bridge for Stockfish 19 Lite. The bundled engine is GPL-3.0. */
(function(){
"use strict";
const botSide=()=>window.schachNovaBotColor===1?1:-1;
let worker=null,ready=false,busy=false,mode="human",strength=12,pending=null,coachEnabled=false,lastScore=null,botPosition=null;
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

function startEngine(){
 if(worker)return;
 try{
   worker=new Worker("stockfish-19-lite-single.js");
   worker.onmessage=e=>{const line=String(e.data);if(line==="uciok"){worker.postMessage("isready");}
     if(line==="readyok"){ready=true;setInfo("Stockfish 19 bereit · offline");maybePlay();}
     if(line.startsWith("info depth")&&line.includes(" score ")){const m=line.match(/score (cp|mate) (-?\d+)/);if(m){lastScore=m[1]==="cp"?(Number(m[2])/100).toFixed(2):"Matt in "+m[2];if(pending==="analysis")setInfo("Analyse · "+lastScore); }}
     if(line.startsWith("bestmove ")){busy=false;const u=line.split(" ")[1];if(pending==="bot"){pending=null;const expected=botPosition;botPosition=null;if(expected!==movesPlayed.map(notation).join(" "))return;const match=legal(current()).find(m=>notation(m)===u);if(mode==="bot"&&variantMode==="standard"&&match&&current().t===botSide()&&!ended&&viewIndex===history.length-1)deliverBotMove(match,current(),expected,botStartedAt);}else{pending=null;setInfo("Stockfish empfiehlt: "+u+(lastScore!==null?" · Bewertung "+lastScore:""));} }
   };
   worker.onerror=()=>{const failed=worker;worker=null;try{failed.terminate();}catch(_){}ready=false;busy=false;pending=null;botPosition=null;setInfo("Engine konnte nicht geladen werden");};
   worker.postMessage("uci");
 }catch(e){setInfo("Engine-Start fehlgeschlagen: "+e.message);}
}
function sendPosition(){worker.postMessage("position startpos moves "+movesPlayed.slice(0,viewIndex).map(notation).join(" "));}
let fairyReady=false,fairyVariant=null,fairyRequested=false,fairyGeneration=0;
let fairyWatchdog=null;
function clearFairyWatchdog(){if(fairyWatchdog!==null){clearTimeout(fairyWatchdog);fairyWatchdog=null;}}
function watchFairy(stage){clearFairyWatchdog();const position=current(),variant=variantMode;fairyWatchdog=setTimeout(()=>{fairyWatchdog=null;if(mode==="bot"&&variantMode===variant&&current()===position&&current().t===botSide()&&!ended){setInfo("⚠ Fairy-Stockfish reagiert nicht ("+stage+"). Notfallmodus: lokaler Ersatzgegner.");try{fairy?.stop();}catch(_){}playVariantFallback();}},14000);}
const fairy=window.SchachNovaFairy;
if(fairy)fairy.subscribe(event=>{
 if(event.type==="ready"){clearFairyWatchdog();fairyReady=true;setInfo("Fairy-Stockfish bereit · offline");maybePlay();}
 if(event.type==="error"){clearFairyWatchdog();fairyReady=false;fairyVariant=null;fairyRequested=false;setInfo("⚠ Fairy-Stockfish ausgefallen. Notfallmodus: lokaler Ersatzgegner. "+event.message);playVariantFallback();}
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
function playVariantFallback(){
 clearFairyWatchdog();
 if(fallbackTimer!==null||mode!=="bot"||ended)return;
 const position=current(),snapshot=movesPlayed.map(notation).join(" "),variant=variantMode;
 fallbackTimer=setTimeout(()=>{
  fallbackTimer=null;
  if(mode!=="bot"||variantMode!==variant||current()!==position||current().t!==botSide()||ended||viewIndex!==history.length-1||movesPlayed.map(notation).join(" ")!==snapshot)return;
  const options=legal(position);
  if(!options.length)return;
  setInfo("⚠ Notfallmodus aktiv: lokaler Ersatzgegner (nicht Stockfish).");
  const value={p:100,n:320,b:330,r:500,q:900,k:0};
  const sorted=options.map(m=>({m,score:(position.b[m[1]]!=="."?(value[position.b[m[1]].toLowerCase()]||0):0)+(m[2]?700:0)+Math.random()*45})).sort((a,b)=>b.score-a.score);
  deliverBotMove(sorted[0].m,position,snapshot,Date.now()-botThinkMs());
 },350);
}
function maybePlay(){
 if(mode!=="bot"||current().t!==botSide()||ended||viewIndex!==history.length-1)return;
 if(variantMode!=="standard"){
  if(variantMode==="torpedo"){playTorpedoBot();return;}
  if(window.SchachNovaVariants?.[variantMode]?.botEngine==="local"){setInfo("⚠ Für "+(window.SchachNovaVariants[variantMode]?.label||variantMode)+" ist keine kompatible Fairy-Engine konfiguriert. Lokaler Ersatzgegner aktiv.");playVariantFallback();return;}
  if(window.SchachNovaVariants?.[variantMode]?.bot===false){setInfo("Für diese Variante ist nur das lokale Spiel zu zweit freigegeben");return;}
  if(!fairy){setInfo("Fairy-Stockfish nicht verfügbar – lokaler Ersatzgegner");playVariantFallback();return;}
  if(!fairyRequested){fairyRequested=true;try{fairy.start();watchFairy("Start");}catch(e){fairyRequested=false;setInfo("⚠ Engine-Start fehlgeschlagen. Notfallmodus: lokaler Ersatzgegner.");playVariantFallback();}return;}
  if(!fairyReady)return;
  try{
   if(fairyVariant!==variantMode){fairy.configure(variantMode);fairyVariant=variantMode;watchFairy("Konfiguration");return;}
   if(!fairy.state.ready||fairy.state.thinking)return;
   fairy.search(movesPlayed.map(notation),Math.max(1,Math.min(16,Math.round(strength*.7)+2)));watchFairy("Zugberechnung");
   setInfo("Fairy-Stockfish denkt · "+(window.SchachNovaVariants[variantMode]?.label||variantMode));
  }catch(e){setInfo("⚠ Fairy-Stockfish-Fehler: "+e.message+". Notfallmodus: lokaler Ersatzgegner.");playVariantFallback();}
  return;
 }
 if(!ready||busy)return;
 busy=true;pending="bot";botStartedAt=Date.now();botPosition=movesPlayed.map(notation).join(" ");worker.postMessage("setoption name Skill Level value "+strength);sendPosition();worker.postMessage("go movetime 450");
}
bot.addEventListener("change",()=>{mode=bot.value;if(mode!=="bot"){clearFairyWatchdog();cancelBotDelay();if(fallbackTimer!==null){clearTimeout(fallbackTimer);fallbackTimer=null;}if(fairy)fairy.stop();if(worker&&busy){worker.postMessage("stop");}botPosition=null;}if(mode!=="human"&&variantMode==="standard")startEngine();setInfo(mode==="human"?"Zwei Spieler · lokal":"Stockfish wird vorbereitet …");maybePlay();});
try{const saved=localStorage.getItem("schachnova.botStrength");if(saved!==null&&[...level.options].some(o=>o.value===saved))level.value=saved;}catch(e){}strength=Number(level.value);if(homeLevel)homeLevel.value=level.value;
level.addEventListener("change",()=>{strength=Number(level.value);if(homeLevel)homeLevel.value=level.value;try{localStorage.setItem("schachnova.botStrength",level.value);}catch(e){}setInfo("Bot-Stärke eingestellt: "+level.selectedOptions[0].textContent);if(worker&&ready&&!busy)worker.postMessage("setoption name Skill Level value "+strength);});
homeLevel?.addEventListener("change",()=>{level.value=homeLevel.value;level.dispatchEvent(new Event("change"));});
analysis.addEventListener("click",()=>{if(variantMode!=="standard"){setInfo("Stockfish-Analyse für diese Variante noch nicht freigegeben");return;}startEngine();if(!ready||busy){setInfo("Engine lädt oder ist beschäftigt");return;}busy=true;pending="analysis";sendPosition();worker.postMessage("go movetime 1100");setInfo("Stockfish analysiert …");});
window.schachNovaBotKickoff=()=>{mode=bot.value;if(mode==="bot"){startEngine();maybePlay();}};
const baseMove=move;move=function(m){baseMove(m);if(coachEnabled&&variantMode==="standard"&&mode==="human"&&ready&&!busy){busy=true;pending="analysis";lastScore=null;sendPosition();worker.postMessage("go movetime 800");}maybePlay();};
const coachButton=document.getElementById("coachButton");coachButton.onclick=()=>{coachEnabled=!coachEnabled;coachButton.textContent=coachEnabled?"🟢 Coach an":"🔇 Coach";if(coachEnabled){if(variantMode==="standard"){startEngine();setInfo("Coach aktiv: Stellung nach jedem Zug analysieren");}else setInfo("Coach für diese Variante noch nicht freigegeben");}else setInfo("Coach deaktiviert");};
const baseNew=document.getElementById("newGame").onclick;document.getElementById("newGame").onclick=()=>{clearFairyWatchdog();if(fallbackTimer!==null){clearTimeout(fallbackTimer);fallbackTimer=null;}cancelBotDelay();if(worker)worker.postMessage("stop");if(fairy)fairy.stop();fairyVariant=null;busy=false;pending=null;botPosition=null;baseNew();maybePlay();};
})();
