/* SchachNova Simultan: 5–20 independent standard-chess boards against configurable bots. */
(function(){
"use strict";
const $=id=>document.getElementById(id),panel=$("simultanPanel"),count=$("simultanCount"),strength=$("simultanStrength"),grid=$("simultanGrid"),board=$("simultanBoard"),info=$("simultanInfo");
if(!panel||!count||!strength||!grid||!board)return;
let games=[],active=0,selected=-1,epoch=0,timers=new Set(),switchTimer=null,viewGeneration=0,autoSwitch=true,botsPaused=false,powerMode="balanced",promotionPending=null;
let strengthMode="random",fixedStrength=8,defaultClockMinutes=0,defaultIncrement=0,startedAt=Date.now();
const sessionTools=window.SchachNovaSimultanTools;
const storageKey="schachnova.simultan.v1";
let materialGame=null,materialState=null,materialFlipped=null;
const summary=$("simultanSummary"),resumeNotice=$("simultanResumeNotice"),autoToggle=$("simultanAutoSwitch"),claimButton=$("simultanClaimDraw"),promotionDialog=$("simultanPromotionDialog"),pauseButton=$("simultanPause"),powerSelect=$("simultanPowerMode"),strengthModeSelect=$("simultanStrengthMode"),clockMinutes=$("simultanClockMinutes"),clockIncrement=$("simultanClockIncrement"),clockApply=$("simultanClockApply"),clockView=$("simultanClockView"),analysisPanel=$("simultanAnalysisPanel"),analysisContent=$("simultanAnalysisContent"),importInput=$("simultanImportFile");
function cancelSwitch(){viewGeneration++;if(switchTimer!==null){clearTimeout(switchTimer);switchTimer=null;}}
function nextPlayable(i,direction=1){if(!games.length)return -1;for(let step=0;step<games.length;step++){const n=(i+step*direction+games.length*2)%games.length;if(!games[n].finished)return n;}return -1;}
function showBoard(i,includeFinished=false){dragStart=-1;dragPointer=null;dragBoard=-1;if(!games.length)return;const next=includeFinished?(i+games.length)%games.length:nextPlayable((i+games.length)%games.length,1);if(next<0){draw();return;}const previous=games[active];cancelSwitch();if(previous)previous.awaitingSwitch=false;stopMotion();active=next;window.SchachNovaSimultanEngine?.prioritize(active);games[active].awaitingSwitch=false;selected=-1;hidePromotion();saveSession();draw();}
function autoNext(g,delay=2000){if(!autoSwitch){g.awaitingSwitch=false;draw();return;}if(panel.hidden||games[active]!==g){g.awaitingSwitch=false;saveSession();return;}const generation=viewGeneration;switchTimer=setTimeout(()=>{switchTimer=null;if(generation!==viewGeneration||panel.hidden||games[active]!==g)return;g.awaitingSwitch=false;const next=nextPlayable((active+1)%games.length);if(next>=0&&next!==active)showBoard(next);else draw();},delay);}
/* Shared sprite animation; no fixed piece set or duplicated overlay code. */
function stopMotion(){window.SchachNovaMoveAnimator?.cancel(board);}
const simulCell=i=>board.querySelector('[data-square="'+i+'"]');
function captureMove(g,m,s){
 if(panel.hidden||games[active]!==g)return null;
 const api=window.SchachNovaMoveAnimator;
 return api?.capture(board,api.standardMoves(m,s),simulCell)||null;
}
const files="abcdefgh",notation=m=>files[m[0]&7]+(8-(m[0]>>4))+files[m[1]&7]+(8-(m[1]>>4))+(m[2]||"");
const fresh=()=>({history:[initial()],moves:[],awaitingSwitch:false,strength:strengthMode==="same"?fixedStrength:Math.floor(Math.random()*21),humanColor:Math.random()<.5?1:-1,finished:"",thinking:false,clock:sessionTools.makeClock(defaultClockMinutes,defaultIncrement)});
const state=g=>g.history[g.history.length-1];
/* Versioned, bounded snapshots store moves rather than trusting arbitrary restored boards. */
function snapshot(){
 return sessionTools.serialize(games.map(g=>({
  humanColor:g.humanColor,strength:g.strength,moves:g.moves.map(notation),
  finished:g.finished,clock:g.clock,turn:state(g).t
 })),{active,autoSwitch,botsPaused,powerMode,strengthMode,fixedStrength,startedAt});
}
function saveSession(){
 try{if(games.length)localStorage.setItem(storageKey,JSON.stringify(snapshot()));}
 catch(e){console.warn("Simultan-Sicherung fehlgeschlagen",e);}
}
function buildSnapshot(json){
 const data=sessionTools.parse(json);
 const restored=data.games.map(item=>{
  const g=fresh();g.humanColor=item.humanColor;g.strength=item.strength;g.clock=item.clock;
  for(const uci of item.moves){
   const move=legalStandard(state(g)).find(m=>notation(m)===uci);
   if(!move||status(g))throw Error("Ungültiger Zug in gesicherter Partie");
   g.moves.push(move);g.history.push(applyStandard(state(g),move));
  }
  g.finished=status(g);
  if(!g.finished&&item.finished){
   if(item.finished.startsWith("Zeitüberschreitung (")||
     (item.finished==="Remis ("+drawClaimReason(g)+")"&&drawClaimReason(g)))g.finished=item.finished;
   else throw Error("Nicht nachvollziehbares Partieende");
  }
  if(g.clock&&g.finished)g.clock.startedAt=null;
  return g;
 });
 return {...data,games:restored};
}
function useSnapshot(data){
 pauseBots();
 games=data.games;active=data.active;autoSwitch=data.autoSwitch;botsPaused=data.botsPaused;
 powerMode=data.powerMode;strengthMode=data.strengthMode;fixedStrength=data.fixedStrength;startedAt=data.startedAt;
 if(autoToggle)autoToggle.checked=autoSwitch;
 if(powerSelect)powerSelect.value=powerMode;
 if(strengthModeSelect)strengthModeSelect.value=strengthMode;
 if(count)count.value=String(games.length);
 updatePauseControl();selected=-1;hidePromotion();materialGame=null;
 draw();saveSession();if(!botsPaused)resumeBots();
}
function loadSession(){
 try{
  const raw=localStorage.getItem(storageKey);if(!raw)return false;
  const data=buildSnapshot(raw);useSnapshot(data);
  if(resumeNotice)resumeNotice.textContent="Gesicherte Simultanpartie wiederhergestellt · "+games.length+" Bretter.";
  return true;
 }catch(e){
  console.warn("Gespeicherte Simultanpartie ungültig",e);
  if(resumeNotice)resumeNotice.textContent="Die letzte Simultanpartie konnte nicht sicher wiederhergestellt werden.";
  return false;
 }
}
function hidePromotion(){promotionPending=null;if(promotionDialog)promotionDialog.hidden=true;}
function updatePauseControl(){
 if(!pauseButton)return;
 pauseButton.textContent=botsPaused?"▶ Computer fortsetzen":"⏸ Computer pausieren";
 pauseButton.setAttribute("aria-pressed",botsPaused?"true":"false");
}
function freezeClocks(){
 const now=Date.now();
 for(const g of games)if(!g.finished&&g.clock){
  const side=state(g).t;
  if(sessionTools.freezeClock(g.clock,side,now)||g.clock.remaining[side===1?0:1]<=0)markFlag(g,side);
 }
}
function markFlag(g,side){
 if(g.finished)return;
 g.finished="Zeitüberschreitung ("+(side===1?"Schwarz":"Weiß")+" gewinnt)";
 if(g.clock)g.clock.startedAt=null;
 g.thinking=false;
 window.SchachNovaSimultanEngine?.cancelBoard?.(games.indexOf(g));
 saveSession();
}
function resumeClocks(){
 if(panel.hidden||document.hidden||botsPaused)return;
 const now=Date.now();
 for(const g of games)if(!g.finished){
  const side=state(g).t;
  if(g.clock&&g.clock.remaining[side===1?0:1]<=0)markFlag(g,side);
  else sessionTools.startClock(g.clock,now);
 }
}
function formatClock(seconds){
 const s=Math.ceil(Math.max(0,seconds));
 return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
}
function updateClockView(){
 if(!clockView)return;
 const g=games[active];if(!g||!g.clock){clockView.textContent="Ohne Schachuhr";return;}
 const times=sessionTools.currentClock(g.clock,state(g).t,Date.now());
 clockView.textContent="Weiß "+formatClock(times[0])+" · Schwarz "+formatClock(times[1])+
 (botsPaused?" · pausiert":"");
}
function tickClocks(){
 if(panel.hidden||document.hidden||botsPaused||!games.length)return;
 const now=Date.now();let expired=false;
 for(const g of games)if(!g.finished&&g.clock&&g.clock.startedAt!==null){
  const s=state(g),times=sessionTools.currentClock(g.clock,s.t,now);
  if(times[s.t===1?0:1]<=0){
   sessionTools.freezeClock(g.clock,s.t,now);markFlag(g,s.t);expired=true;
  }
 }
 if(expired){
  draw();saveSession();
  const current=games[active];
  if(current?.finished&&autoSwitch&&nextPlayable((active+1)%games.length)>=0)autoNext(current,1200);
 }else updateClockView();
}

/* The snapshot already contains every committed move: CPU work can be safely paused. */
function pauseBots(){
 freezeClocks();
 if(!games.length)return;
 cancelSwitch();stopMotion();epoch++;
 window.SchachNovaSimultanEngine?.reset();
 for(const timer of timers)clearTimeout(timer);
 timers.clear();
 for(const g of games){g.thinking=false;g.awaitingSwitch=false;}
 saveSession();
}
function resumeBots(){
 if(panel.hidden||document.hidden||botsPaused)return;
 resumeClocks();
 for(const g of games)if(!g.finished&&state(g).t!==g.humanColor)botMove(g);
}

function vibrateMove(pattern){
 const setting=document.getElementById("vibrationToggle");
 if(setting&&!setting.checked)return;
 try{
  if(window.AndroidHaptics&&typeof window.AndroidHaptics.vibrate==="function"){
   window.AndroidHaptics.vibrate(pattern.join(","));return;
  }
  if(typeof navigator.vibrate==="function")navigator.vibrate(pattern);
 }catch(_){}
}
function feedbackForMove(before,after,m){
 const capture=before.b[m[1]]!=="."||m[3]==="ep"||m[3]==="berolinaEp";
 const isCheck=checkStandard(after);
 const isMate=isCheck&&legalStandard(after).length===0;
 vibrateMove(isMate?[65,85,65]:isCheck?[160,65,80]:capture?[110]:[35]);
}

function legalStandard(s){const saved=variantMode;try{variantMode="standard";return legal(s);}finally{variantMode=saved;}}
function applyStandard(s,m){const saved=variantMode;try{variantMode="standard";return apply(s,m);}finally{variantMode=saved;}}
function checkStandard(s){const saved=variantMode;try{variantMode="standard";return checked(s);}finally{variantMode=saved;}}
function standardKey(s){const saved=variantMode;try{variantMode="standard";return key(s);}finally{variantMode=saved;}}
function repeatCount(g){const k=standardKey(state(g));return g.history.reduce((n,s)=>n+(standardKey(s)===k?1:0),0);}
function drawClaimReason(g){const s=state(g);return repeatCount(g)>=3?"dreifache Stellungswiederholung":s.half>=100?"50-Züge-Regel":"";}
function status(g){
 const s=state(g),moves=legalStandard(s);
 if(!moves.length)return checkStandard(s)?"Schachmatt":"Patt";
 if(insufficient(s))return "Remis (unzureichendes Material)";
 if(s.half>=150)return "Remis (75-Züge-Regel)";
 if(repeatCount(g)>=5)return "Remis (fünffache Stellungswiederholung)";
 return "";
}
/* Reuse the board's 64 squares and existing cards to avoid DOM churn during a 20-board session. */
function drawCards(){
 if(grid.children.length!==games.length){
  grid.replaceChildren();
  games.forEach((g,i)=>{const button=document.createElement("button");button.type="button";button.className="simultan-card";button.onclick=()=>showBoard(i,true);grid.append(button);});
 }
 let won=0,lost=0,drawn=0,done=0;
 games.forEach((g,i)=>{
  const outcome=sessionTools.result({...g,turn:state(g).t});
  if(g.finished)done++;
  if(outcome==="Remis")drawn++;
  else if(outcome==="Sieg")won++;
  else if(outcome==="Niederlage")lost++;
  const button=grid.children[i],label="Brett "+(i+1)+" · "+(g.finished||
   (botsPaused?"Pausiert":g.awaitingSwitch?"Wechsel folgt":state(g).t===g.humanColor?"Du bist dran":"Bot denkt"))+" · Stärke "+g.strength;
  const className="simultan-card"+(i===active?" active":"")+(g.finished?" finished":"");
  if(button.textContent!==label)button.textContent=label;
  if(button.className!==className)button.className=className;
  button.setAttribute("aria-current",i===active?"true":"false");
  button.setAttribute("aria-label",label);
 });
 const text="Abgeschlossen "+done+"/"+games.length+" · Siege "+won+" · Niederlagen "+lost+" · Remis "+drawn;
 if(summary&&summary.textContent!==text)summary.textContent=text;
}
function ensureSquares(){
 if(board.children.length===64)return;
 board.replaceChildren();
 for(let j=0;j<64;j++){
  const cell=document.createElement("button");
  cell.type="button";cell.className="simultan-square";
  board.append(cell);
 }
}
function draw(preserveMotion=false){
 if(!preserveMotion)stopMotion();
 drawCards();ensureSquares();
 const g=games[active];if(!g)return;
 const s=state(g),inCheck=checkStandard(s),kingSquare=inCheck?s.b.indexOf(s.t===1?"K":"k"):-1;
 const moves=s.t===g.humanColor&&!g.finished&&!g.awaitingSwitch&&!botsPaused?legalStandard(s):[];
 const targets=new Set(moves.filter(m=>m[0]===selected).map(m=>m[1]));
 const last=g.moves[g.moves.length-1];
 for(let j=0;j<64;j++){
  const i=g.humanColor===1?(j>>3)*16+(j&7):(7-(j>>3))*16+(7-(j&7));
  const p=s.b[i],cell=board.children[j],isCheck=i===kingSquare;
  const className="simultan-square "+(((j>>3)+(j&7))%2?"dark":"light")+
   (selected===i?" selected":"")+(targets.has(i)?" target":"")+
   (last&&(last[0]===i||last[1]===i)?" last-move":"")+(isCheck?" in-check":"");
  if(cell.className!==className)cell.className=className;
  if(isCheck){cell.style.setProperty("background-color","#d93030","important");cell.style.boxShadow="inset 0 0 0 4px #ffb4b4";}
  else{cell.style.removeProperty("background-color");cell.style.boxShadow="";}
  const piece=cell.querySelector(".simultan-piece");
  if(p==="."){if(piece)piece.remove();}
  else if(!piece||piece.dataset.piece!==p){
   if(piece)piece.remove();
   const img=document.createElement("img");
   img.className="simultan-piece";img.src="pieces/"+(p===p.toUpperCase()?"w":"b")+p.toUpperCase()+".svg";
   img.dataset.piece=p;img.alt=glyph[p];img.draggable=false;cell.append(img);
  }
  cell.dataset.square=String(i);
  cell.setAttribute("aria-label",files[i&7]+(8-(i>>4)));
  cell.setAttribute("aria-pressed",selected===i?"true":"false");
  cell.onclick=()=>choose(i);
 }
 if(materialGame!==g||materialState!==s||materialFlipped!==(g.humanColor===-1)){
  window.SchachNovaMaterial?.render(board,s,g.humanColor===-1);
  materialGame=g;materialState=s;materialFlipped=g.humanColor===-1;
 }
 strength.value=String(g.strength);
 if(clockMinutes)clockMinutes.value=String(g.clock?g.clock.initialSeconds/60:0);
 if(clockIncrement)clockIncrement.value=String(g.clock?.increment||0);
 if(clockApply)clockApply.disabled=g.moves.length>0||!!g.finished;
 updateClockView();
 if(claimButton){const claim=!g.finished&&s.t===g.humanColor?drawClaimReason(g):"";
  claimButton.hidden=!claim;claimButton.textContent=claim?"Remis beanspruchen: "+claim:"Remis beanspruchen";}
 info.textContent="Brett "+(active+1)+" von "+games.length+" · "+(g.finished||
  (g.awaitingSwitch?"Wechsel folgt":s.t===g.humanColor?"Du bist am Zug":"Computer überlegt"))+
  " · Deine Farbe: "+(g.humanColor===1?"Weiß":"Schwarz")+" · Bot-Stärke "+g.strength+
  (g.engineMode==="fallback"?" · Ersatzgegner":g.engineMode==="stockfish"?" · Stockfish":"")+(botsPaused?" · Computer pausiert":"");
}
/* Pointer-based move entry mirrors the main board without altering its geometry. */
let dragStart=-1,dragPointer=null,dragX=0,dragY=0,suppressTap=false,dragBoard=-1;
function choosePromotion(g,candidates){
 if(candidates.length===1){commit(g,candidates[0]);return;}
 promotionPending={g,candidates};
 if(promotionDialog){promotionDialog.hidden=false;promotionDialog.querySelector('[data-simultan-promotion="q"]')?.focus();}
 else hidePromotion();
}
if(promotionDialog){
 promotionDialog.querySelectorAll("[data-simultan-promotion]").forEach(button=>button.addEventListener("click",()=>{
  const pending=promotionPending,choice=button.dataset.simultanPromotion;
  hidePromotion();if(pending&&games.includes(pending.g)&&!pending.g.finished){
   const move=pending.candidates.find(m=>m[2]===choice);if(move)commit(pending.g,move);
  }
 }));
 $("simultanPromotionCancel")?.addEventListener("click",hidePromotion);
}
board.addEventListener("pointerdown",event=>{
 if(botsPaused)return;
 if(event.pointerType==="mouse"&&event.button!==0)return;
 const cell=event.target.closest(".simultan-square");
 const g=games[active];if(panel.hidden||panel.classList.contains("simultan-closing")||!cell||!g||g.finished||g.awaitingSwitch||state(g).t!==g.humanColor)return;
 const i=Number(cell.dataset.square);
 if(side(state(g).b[i])!==g.humanColor)return;
 dragStart=i;dragPointer=event.pointerId;dragX=event.clientX;dragY=event.clientY;dragBoard=active;
});
board.addEventListener("pointerup",event=>{
 if(botsPaused){dragStart=-1;dragPointer=null;dragBoard=-1;return;}
 if(dragPointer!==event.pointerId||dragStart<0)return;
 const from=dragStart,sourceBoard=dragBoard;dragStart=-1;dragPointer=null;dragBoard=-1;
 if(Math.hypot(event.clientX-dragX,event.clientY-dragY)<14)return;
 suppressTap=true;setTimeout(()=>{suppressTap=false;},300);
 if(sourceBoard!==active||panel.hidden||panel.classList.contains("simultan-closing"))return;
 const hit=document.elementFromPoint(event.clientX,event.clientY)?.closest(".simultan-square");
 if(!hit||!board.contains(hit)||panel.classList.contains("simultan-closing"))return;
 const g=games[active],target=Number(hit.dataset.square);
 if(!g||g.finished||g.awaitingSwitch||state(g).t!==g.humanColor)return;
 const candidates=legalStandard(state(g)).filter(m=>m[0]===from&&m[1]===target);
 if(candidates.length)choosePromotion(g,candidates);
});
board.addEventListener("pointercancel",()=>{dragStart=-1;dragPointer=null;dragBoard=-1;});
function choose(i){if(suppressTap)return;if(botsPaused)return;if(promotionPending)return;const g=games[active];if(!g||g.finished||g.awaitingSwitch||state(g).t!==g.humanColor)return;const s=state(g);if(side(s.b[i])===g.humanColor){selected=selected===i?-1:i;draw();return;}const candidates=legalStandard(s).filter(m=>m[0]===selected&&m[1]===i);if(!candidates.length){selected=-1;draw();return;}choosePromotion(g,candidates);}
function shouldSwitchAfterMove(g,isBot){return Boolean(g.finished)||(g.humanColor===1&&isBot)||(g.humanColor===-1&&!isBot);}
function commit(g,m){if(g.finished||botsPaused)return;const s=state(g),valid=legalStandard(s).find(x=>notation(x)===notation(m));if(!valid)return;const isBot=s.t!==g.humanColor;
 if(g.clock){
  if(sessionTools.freezeClock(g.clock,s.t,Date.now())){markFlag(g,s.t);draw();return;}
  g.clock.remaining[s.t===1?0:1]+=g.clock.increment;
 }
 if(games[active]===g&&!g.awaitingSwitch)cancelSwitch();const animation=games[active]===g?captureMove(g,valid,s):null;const nextState=applyStandard(s,valid);g.history.push(nextState);g.moves.push(valid);if(games[active]===g&&!panel.hidden&&!document.hidden)feedbackForMove(s,nextState,valid);g.finished=status(g);if(!g.finished&&!botsPaused&&!panel.hidden&&!document.hidden)sessionTools.startClock(g.clock,Date.now());selected=-1;saveSession();if(games[active]===g){draw(true);window.SchachNovaMoveAnimator?.play(animation);}else{drawCards();}if(g.finished&&games[active]===g&&nextPlayable((active+1)%games.length)<0){info.textContent="Alle Bretter beendet · "+g.finished;}if(games[active]===g){const shouldSwitch=shouldSwitchAfterMove(g,isBot);if(shouldSwitch&&autoSwitch){g.awaitingSwitch=true;drawCards();autoNext(g,isBot?2000:450);}}if(!g.finished&&state(g).t!==g.humanColor)botMove(g);}
function botMove(g){
 if(g.thinking||g.finished||panel.hidden||document.hidden||botsPaused)return;
 g.thinking=true;
 const stamp=epoch,expected=state(g),delay=1100+g.strength*115;
 const fallback=()=>{
  if(stamp!==epoch||state(g)!==expected||g.finished){if(stamp===epoch)g.thinking=false;return;}
  g.engineMode="fallback";
  const timer=setTimeout(()=>{timers.delete(timer);if(stamp!==epoch)return;g.thinking=false;if(state(g)!==expected||g.finished)return;const options=legalStandard(expected);if(!options.length){g.finished=status(g);saveSession();if(games[active]===g){draw();autoNext(g,1200);}else drawCards();return;}const values={p:100,n:320,b:330,r:500,q:900,k:0};const ranked=options.map(m=>{const next=applyStandard(expected,m),capture=expected.b[m[1]];const reply=legalStandard(next),danger=reply.some(x=>x[1]===m[1]);const gain=capture==="."?0:values[capture.toLowerCase()]||0;const center=3.5-Math.abs((m[1]&7)-3.5);const mate=reply.length===0&&checkStandard(next)?100000:0;return {m,score:mate+gain-danger*(values[expected.b[m[0]].toLowerCase()]||0)*.6+center*8+Math.random()*Math.max(5,(21-g.strength)*35)};});ranked.sort((a,b)=>b.score-a.score);commit(g,ranked[0].m);},delay);timers.add(timer);
 };
 const engine=window.SchachNovaSimultanEngine;
 if(!engine){fallback();return;}
 const started=Date.now();
 engine.request(g.moves.map(notation),g.strength,{boardId:games.indexOf(g),priority:games[active]===g,powerMode}).then(uci=>{
  if(stamp!==epoch||state(g)!==expected||g.finished){if(stamp===epoch)g.thinking=false;return;}
  const move=uci?legalStandard(expected).find(m=>notation(m)===uci):null;
  if(!move){fallback();return;}
  const timer=setTimeout(()=>{
   timers.delete(timer);if(stamp!==epoch)return;g.thinking=false;
   if(state(g)!==expected||g.finished)return;
   g.engineMode="stockfish";commit(g,move);
  },Math.max(0,delay-(Date.now()-started)));
  timers.add(timer);
 }).catch(()=>fallback());
}
function start(){if(games.length&&games.some(g=>!g.finished)&&!window.confirm("Laufende Simultanpartie ersetzen? Der bisherige Spielstand geht verloren."))return;try{const previous=localStorage.getItem(storageKey);if(previous)localStorage.setItem(storageKey+".previous",previous);}catch(_){}cancelSwitch();stopMotion();hidePromotion();epoch++;window.SchachNovaSimultanEngine?.reset();for(const t of timers)clearTimeout(t);timers.clear();fixedStrength=Math.max(0,Math.min(20,Number(strength.value)||0));strengthMode=strengthModeSelect?.value==="same"?"same":"random";defaultClockMinutes=Number(clockMinutes?.value)||0;defaultIncrement=Number(clockIncrement?.value)||0;startedAt=Date.now();games=Array.from({length:Math.min(20,Math.max(5,Number(count.value)||5))},fresh);botsPaused=false;updatePauseControl();active=0;selected=-1;panel.hidden=false;panel.classList.remove("simultan-closing");panel.classList.add("simultan-opening");saveSession();draw();resumeClocks();for(const g of games)if(g.humanColor===-1)botMove(g);}
$("simultanOpen").addEventListener("click",()=>{panel.hidden=false;panel.classList.remove("simultan-closing");panel.classList.add("simultan-opening");if(!games.length)start();else{draw();resumeBots();}});
$("simultanStart").addEventListener("click",start);strength.addEventListener("change",()=>{if(games[active]){games[active].strength=Number(strength.value);saveSession();draw();}});
$("simultanClose").addEventListener("click",()=>{cancelSwitch();hidePromotion();if(games[active])games[active].awaitingSwitch=false;pauseBots();saveSession();panel.classList.remove("simultan-opening");panel.classList.add("simultan-closing");setTimeout(()=>{if(panel.classList.contains("simultan-closing")){panel.hidden=true;panel.classList.remove("simultan-closing");}},220);});
$("simultanPrev").addEventListener("click",()=>{const n=nextPlayable((active-1+games.length)%games.length,-1);if(n>=0)showBoard(n);});
$("simultanNext").addEventListener("click",()=>{const n=nextPlayable((active+1)%games.length);if(n>=0)showBoard(n);});
if(autoToggle)autoToggle.addEventListener("change",()=>{autoSwitch=autoToggle.checked;if(!autoSwitch){cancelSwitch();if(games[active])games[active].awaitingSwitch=false;draw();}saveSession();});
if(strengthModeSelect)strengthModeSelect.addEventListener("change",()=>{
 strengthMode=strengthModeSelect.value==="same"?"same":"random";
 fixedStrength=Math.max(0,Math.min(20,Number(strength.value)||0));
 saveSession();
});
if(clockApply)clockApply.addEventListener("click",()=>{
 const g=games[active];if(!g||g.moves.length||g.finished)return;
 freezeClocks();
 try{g.clock=sessionTools.makeClock(Number(clockMinutes.value),Number(clockIncrement.value));}
 catch(e){if(resumeNotice)resumeNotice.textContent=e.message;return;}
 resumeClocks();saveSession();draw();
});

if(powerSelect)powerSelect.addEventListener("change",()=>{
 powerMode=["eco","balanced","strong"].includes(powerSelect.value)?powerSelect.value:"balanced";
 pauseBots();resumeBots();saveSession();draw();
});
if(pauseButton)pauseButton.addEventListener("click",()=>{
 botsPaused=!botsPaused;
 if(botsPaused)pauseBots();
 else{saveSession();resumeBots();}
 updatePauseControl();draw();
});
if(claimButton)claimButton.addEventListener("click",()=>{const g=games[active];if(!g||g.finished||state(g).t!==g.humanColor)return;const reason=drawClaimReason(g);if(!reason)return;g.finished="Remis ("+reason+")";cancelSwitch();saveSession();draw();const next=nextPlayable((active+1)%games.length);if(autoSwitch&&next>=0)autoNext(g,1200);});
function saveText(filename,mime,text){
 if(window.AndroidFiles?.saveFile)window.AndroidFiles.saveFile(filename,mime,text);
 else window.SchachNovaNotation.download({filename,mime,text});
}
function exportSession(){
 if(!games.length)return;
 saveText("SchachNova-Simultan-"+new Date().toISOString().slice(0,10)+".json",
  "application/json",JSON.stringify(snapshot(),null,2));
}
function importSessionText(text){
 try{
  const data=buildSnapshot(text);
  if(games.length&&games.some(g=>!g.finished)&&!window.confirm("Laufende Simultanpartie durch importierte Sicherung ersetzen?"))return;
  try{const old=localStorage.getItem(storageKey);if(old)localStorage.setItem(storageKey+".previous",old);}catch(_){}
  useSnapshot(data);
  if(resumeNotice)resumeNotice.textContent="Simultan-Sicherung erfolgreich importiert ("+games.length+" Bretter).";
 }catch(e){if(resumeNotice)resumeNotice.textContent="Import abgelehnt: "+e.message;}
}
window.schachnovaReceiveSimultanImport=importSessionText;
$("simultanExport")?.addEventListener("click",exportSession);
$("simultanRestorePrevious")?.addEventListener("click",()=>{
 try{
  const old=localStorage.getItem(storageKey+".previous");
  if(!old){if(resumeNotice)resumeNotice.textContent="Keine vorherige Sicherung vorhanden.";return;}
  const data=buildSnapshot(old);
  if(!window.confirm("Die vorherige Simultan-Sicherung wiederherstellen? Die aktuelle wird dadurch ersetzt."))return;
  const current=localStorage.getItem(storageKey);
  useSnapshot(data);
  if(current)localStorage.setItem(storageKey+".previous",current);
  if(resumeNotice)resumeNotice.textContent="Vorherige Simultan-Sicherung wiederhergestellt.";
 }catch(e){if(resumeNotice)resumeNotice.textContent="Wiederherstellung fehlgeschlagen: "+e.message;}
});
$("simultanImport")?.addEventListener("click",()=>{
 if(window.AndroidFiles?.openJson)window.AndroidFiles.openJson();else importInput?.click();
});
importInput?.addEventListener("change",async()=>{
 const f=importInput.files?.[0];if(!f)return;importInput.value="";
 if(f.size>800000){if(resumeNotice)resumeNotice.textContent="Datei ist zu groß.";return;}
 try{importSessionText(await f.text());}catch(e){if(resumeNotice)resumeNotice.textContent="Import fehlgeschlagen: "+e.message;}
});
function pgnGame(g,index){
 const message=g.finished==="Schachmatt"?"":g.finished;
 const game={variant:"standard",moves:g.moves,positions:g.history,timestamp:startedAt,message,
  event:"SchachNova Simultanschach",round:String(index+1),
  white:g.humanColor===1?"Spieler":"Computer",black:g.humanColor===-1?"Spieler":"Computer",
  timeControl:g.clock?String(g.clock.initialSeconds)+"+"+String(g.clock.increment):null
 };
 const file=window.SchachNovaNotation.generate(game,{legal:legalStandard,checked:checkStandard});
 return {...file,filename:"SchachNova-Simultan-Brett-"+(index+1)+".pgn"};
}
$("simultanPgn")?.addEventListener("click",()=>{
 const g=games[active];if(!g)return;
 try{const f=pgnGame(g,active);saveText(f.filename,f.mime,f.text);}
 catch(e){if(resumeNotice)resumeNotice.textContent="PGN-Export fehlgeschlagen: "+e.message;}
});
$("simultanPgnAll")?.addEventListener("click",()=>{
 if(!games.length)return;
 try{
  const text=games.map((g,i)=>pgnGame(g,i).text).join("\n");
  saveText("SchachNova-Simultan-Alle.pgn","application/x-chess-pgn",text);
 }catch(e){if(resumeNotice)resumeNotice.textContent="PGN-Gesamtexport fehlgeschlagen: "+e.message;}
});
$("simultanAnalyze")?.addEventListener("click",()=>{
 if(!games.length||!analysisPanel||!analysisContent)return;
 const stats=sessionTools.analyze(games.map(g=>({...g,turn:state(g).t})));
 const plan=sessionTools.training(games.map(g=>({...g,moves:g.moves,turn:state(g).t})));
 analysisContent.replaceChildren();
 function row(text){const el=document.createElement("p");el.textContent=text;analysisContent.append(el);}
 row(stats.finished+"/"+stats.total+" beendet · "+stats.wins+" Siege · "+stats.losses+" Niederlagen · "+stats.draws+" Remis");
 row(stats.plies+" Halbzüge · Ø "+stats.averagePlies+" Halbzüge je Brett");
 for(const b of stats.boards)row("Brett "+b.number+": "+b.outcome+" · Stärke "+b.strength+" · "+b.plies+" Halbzüge");
 const title=document.createElement("h3");title.textContent="Training auf Grundlage deiner Partien";analysisContent.append(title);
 row("Regelbasierte Hinweise aus Partielänge und Ergebnissen; keine Stockfish-Fehleranalyse.");
 if(!plan.length)row("Für konkrete Übungen fehlen noch ausreichend abgeschlossene oder längere Partien.");
 else for(const p of plan)row(p.label+" ("+p.n+" Hinweise): "+p.task+". Grund: "+p.why+".");
 analysisPanel.hidden=false;
});
$("simultanAnalysisClose")?.addEventListener("click",()=>{if(analysisPanel)analysisPanel.hidden=true;});
loadSession();updatePauseControl();
setInterval(tickClocks,1000);
document.addEventListener("visibilitychange",()=>{if(document.hidden)pauseBots();else resumeBots();});
window.addEventListener("pagehide",pauseBots);
})();
