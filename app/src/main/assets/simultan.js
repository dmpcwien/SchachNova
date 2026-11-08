/* SchachNova Simultan: 5–20 independent standard-chess boards against configurable bots. */
(function(){
"use strict";
const $=id=>document.getElementById(id),panel=$("simultanPanel"),count=$("simultanCount"),strength=$("simultanStrength"),grid=$("simultanGrid"),board=$("simultanBoard"),info=$("simultanInfo");
if(!panel||!count||!strength||!grid||!board)return;
let games=[],active=0,selected=-1,epoch=0,timers=new Set(),switchTimer=null,viewGeneration=0,autoSwitch=true,promotionPending=null;
const storageKey="schachnova.simultan.v1";
const summary=$("simultanSummary"),resumeNotice=$("simultanResumeNotice"),autoToggle=$("simultanAutoSwitch"),claimButton=$("simultanClaimDraw"),promotionDialog=$("simultanPromotionDialog");
function cancelSwitch(){viewGeneration++;if(switchTimer!==null){clearTimeout(switchTimer);switchTimer=null;}}
function nextPlayable(i,direction=1){if(!games.length)return -1;for(let step=0;step<games.length;step++){const n=(i+step*direction+games.length*2)%games.length;if(!games[n].finished)return n;}return -1;}
function showBoard(i,includeFinished=false){dragStart=-1;dragPointer=null;dragBoard=-1;if(!games.length)return;const next=includeFinished?(i+games.length)%games.length:nextPlayable((i+games.length)%games.length,1);if(next<0){draw();return;}const previous=games[active];cancelSwitch();if(previous)previous.awaitingSwitch=false;stopMotion();active=next;games[active].awaitingSwitch=false;selected=-1;hidePromotion();saveSession();draw();}
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
const fresh=()=>({history:[initial()],moves:[],awaitingSwitch:false,strength:Math.floor(Math.random()*21),humanColor:Math.random()<.5?1:-1,finished:"",thinking:false});
const state=g=>g.history[g.history.length-1];
/* Versioned, bounded snapshots store moves rather than trusting arbitrary restored boards. */
function saveSession(){
 try{
  if(!games.length)return;
  const data={version:1,active,autoSwitch,games:games.map(g=>({
   humanColor:g.humanColor,strength:g.strength,moves:g.moves.map(notation),finished:g.finished
  }))};
  localStorage.setItem(storageKey,JSON.stringify(data));
 }catch(e){console.warn("Simultan-Sicherung fehlgeschlagen",e);}
}
function loadSession(){
 try{
  const raw=localStorage.getItem(storageKey);if(!raw)return false;
  const data=JSON.parse(raw);
  if(data?.version!==1||!Array.isArray(data.games)||data.games.length<5||data.games.length>20)throw Error("Ungültige Anzahl an Brettern");
  const restored=data.games.map(item=>{
   if(![-1,1].includes(item.humanColor)||!Number.isInteger(item.strength)||item.strength<0||item.strength>20||
      !Array.isArray(item.moves)||item.moves.length>500)throw Error("Ungültige Simultan-Daten");
   const g=fresh();g.humanColor=item.humanColor;g.strength=item.strength;
   for(const uci of item.moves){
    if(typeof uci!=="string"||!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci))throw Error("Ungültiges Zugformat");
    const move=legalStandard(state(g)).find(m=>notation(m)===uci);
    if(!move)throw Error("Ungültiger gespeicherter Zug");
    g.moves.push(move);g.history.push(applyStandard(state(g),move));
   }
   g.finished=status(g);if(!g.finished&&typeof item.finished==="string"&&item.finished==="Remis ("+drawClaimReason(g)+")"&&drawClaimReason(g))g.finished=item.finished;return g;
  });
  games=restored;active=Number.isInteger(data.active)?Math.min(games.length-1,Math.max(0,data.active)):0;
  autoSwitch=data.autoSwitch!==false;if(autoToggle)autoToggle.checked=autoSwitch;
  if(count)count.value=String(games.length);
  if(resumeNotice)resumeNotice.textContent="Gesicherte Simultanpartie wiederhergestellt · "+games.length+" Bretter.";
  return true;
 }catch(e){console.warn("Gespeicherte Simultanpartie ungültig",e);if(resumeNotice)resumeNotice.textContent="Die letzte Simultanpartie konnte nicht sicher wiederhergestellt werden.";return false;}
}
function hidePromotion(){promotionPending=null;if(promotionDialog)promotionDialog.hidden=true;}

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
function drawCards(){
 grid.replaceChildren();
 let won=0,lost=0,drawn=0,done=0;
 games.forEach((g,i)=>{
  if(g.finished){done++;if(g.finished.startsWith("Remis")||g.finished==="Patt")drawn++;
   else if(g.finished==="Schachmatt"){const winner=-state(g).t;if(winner===g.humanColor)won++;else lost++;}
  }
  const b=document.createElement("button");b.type="button";
  b.className="simultan-card"+(i===active?" active":"")+(g.finished?" finished":"");
  b.textContent="Brett "+(i+1)+" · "+(g.finished|| (g.awaitingSwitch?"Wechsel folgt":state(g).t===g.humanColor?"Du bist dran":"Bot denkt"))+" · Stärke "+g.strength;
  b.setAttribute("aria-current",i===active?"true":"false");b.setAttribute("aria-label",b.textContent);
  b.onclick=()=>showBoard(i,true);grid.append(b);
 });
 if(summary)summary.textContent="Abgeschlossen "+done+"/"+games.length+" · Siege "+won+" · Niederlagen "+lost+" · Remis "+drawn;
}
function draw(preserveMotion=false){
 if(!preserveMotion)stopMotion();drawCards();
 board.replaceChildren();const g=games[active];if(!g)return;
 const s=state(g),inCheck=checkStandard(s),kingSquare=inCheck?s.b.indexOf(s.t===1?"K":"k"):-1,moves=s.t===g.humanColor&&!g.finished&&!g.awaitingSwitch?legalStandard(s):[],targets=moves.filter(m=>m[0]===selected).map(m=>m[1]),last=g.moves[g.moves.length-1];
 for(let j=0;j<64;j++){const i=g.humanColor===1?(j>>3)*16+(j&7):(7-(j>>3))*16+(7-(j&7)),p=s.b[i],cell=document.createElement("button");cell.type="button";cell.className="simultan-square "+(((j>>3)+(j&7))%2?"dark":"light")+(selected===i?" selected":"")+(targets.includes(i)?" target":"")+(last&&(last[0]===i||last[1]===i)?" last-move":"")+(i===kingSquare?" in-check":"");if(i===kingSquare){cell.style.setProperty("background-color","#d93030","important");cell.style.boxShadow="inset 0 0 0 4px #ffb4b4";}if(p!=="."){const img=document.createElement("img");img.className="simultan-piece";img.src="pieces/"+(p===p.toUpperCase()?"w":"b")+p.toUpperCase()+".svg";img.alt=glyph[p];img.draggable=false;cell.append(img);}cell.dataset.square=String(i);cell.setAttribute("aria-label",files[i&7]+(8-(i>>4)));cell.setAttribute("aria-pressed",selected===i?"true":"false");cell.onclick=()=>choose(i);board.append(cell);}
 window.SchachNovaMaterial?.render(board,s,g.humanColor===-1);strength.value=String(g.strength);if(claimButton){const claim=!g.finished&&s.t===g.humanColor?drawClaimReason(g):"";claimButton.hidden=!claim;claimButton.textContent=claim?"Remis beanspruchen: "+claim:"Remis beanspruchen";}info.textContent="Brett "+(active+1)+" von "+games.length+" · "+(g.finished||(g.awaitingSwitch?"Wechsel folgt":s.t===g.humanColor?"Du bist am Zug":"Computer überlegt"))+" · Deine Farbe: "+(g.humanColor===1?"Weiß":"Schwarz")+" · Bot-Stärke "+g.strength;
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
 if(event.pointerType==="mouse"&&event.button!==0)return;
 const cell=event.target.closest(".simultan-square");
 const g=games[active];if(panel.hidden||panel.classList.contains("simultan-closing")||!cell||!g||g.finished||g.awaitingSwitch||state(g).t!==g.humanColor)return;
 const i=Number(cell.dataset.square);
 if(side(state(g).b[i])!==g.humanColor)return;
 dragStart=i;dragPointer=event.pointerId;dragX=event.clientX;dragY=event.clientY;dragBoard=active;
});
board.addEventListener("pointerup",event=>{
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
function choose(i){if(suppressTap)return;if(promotionPending)return;const g=games[active];if(!g||g.finished||g.awaitingSwitch||state(g).t!==g.humanColor)return;const s=state(g);if(side(s.b[i])===g.humanColor){selected=selected===i?-1:i;draw();return;}const candidates=legalStandard(s).filter(m=>m[0]===selected&&m[1]===i);if(!candidates.length){selected=-1;draw();return;}choosePromotion(g,candidates);}
function shouldSwitchAfterMove(g,isBot){return Boolean(g.finished)||(g.humanColor===1&&isBot)||(g.humanColor===-1&&!isBot);}
function commit(g,m){if(g.finished)return;const s=state(g),valid=legalStandard(s).find(x=>notation(x)===notation(m));if(!valid)return;const isBot=s.t!==g.humanColor;if(games[active]===g&&!g.awaitingSwitch)cancelSwitch();const animation=games[active]===g?captureMove(g,valid,s):null;const nextState=applyStandard(s,valid);g.history.push(nextState);g.moves.push(valid);feedbackForMove(s,nextState,valid);g.finished=status(g);selected=-1;saveSession();if(games[active]===g){draw(true);window.SchachNovaMoveAnimator?.play(animation);}else{drawCards();}if(g.finished&&games[active]===g&&nextPlayable((active+1)%games.length)<0){info.textContent="Alle Bretter beendet · "+g.finished;}if(games[active]===g){const shouldSwitch=shouldSwitchAfterMove(g,isBot);if(shouldSwitch&&autoSwitch){g.awaitingSwitch=true;drawCards();autoNext(g,isBot?2000:450);}}if(!g.finished&&state(g).t!==g.humanColor)botMove(g);}
function botMove(g){if(g.thinking)return;g.thinking=true;const stamp=epoch,expected=state(g),delay=1100+g.strength*115;const timer=setTimeout(()=>{timers.delete(timer);g.thinking=false;if(stamp!==epoch||state(g)!==expected||g.finished)return;const options=legalStandard(expected);if(!options.length){g.finished=status(g);if(games[active]===g){draw();autoNext(g,1200);}else drawCards();return;}const values={p:100,n:320,b:330,r:500,q:900,k:0};const ranked=options.map(m=>{const next=applyStandard(expected,m),capture=expected.b[m[1]];const reply=legalStandard(next),danger=reply.some(x=>x[1]===m[1]);const gain=capture==="."?0:values[capture.toLowerCase()]||0;const center=3.5-Math.abs((m[1]&7)-3.5);const mate=reply.length===0&&checkStandard(next)?100000:0;return {m,score:mate+gain-danger*(values[expected.b[m[0]].toLowerCase()]||0)*.6+center*8+Math.random()*Math.max(5,(21-g.strength)*35)};});ranked.sort((a,b)=>b.score-a.score);commit(g,ranked[0].m);},delay);timers.add(timer);}
function start(){if(games.length&&games.some(g=>!g.finished)&&!window.confirm("Laufende Simultanpartie ersetzen? Der bisherige Spielstand geht verloren."))return;cancelSwitch();stopMotion();hidePromotion();epoch++;for(const t of timers)clearTimeout(t);timers.clear();games=Array.from({length:Math.min(20,Math.max(5,Number(count.value)||5))},fresh);active=0;selected=-1;panel.hidden=false;panel.classList.remove("simultan-closing");panel.classList.add("simultan-opening");saveSession();draw();for(const g of games)if(g.humanColor===-1)botMove(g);}
$("simultanOpen").addEventListener("click",()=>{panel.hidden=false;panel.classList.remove("simultan-closing");panel.classList.add("simultan-opening");if(!games.length)start();else{draw();for(const g of games)if(!g.finished&&state(g).t!==g.humanColor)botMove(g);}});
$("simultanStart").addEventListener("click",start);strength.addEventListener("change",()=>{if(games[active]){games[active].strength=Number(strength.value);saveSession();draw();}});
$("simultanClose").addEventListener("click",()=>{cancelSwitch();hidePromotion();if(games[active])games[active].awaitingSwitch=false;saveSession();panel.classList.remove("simultan-opening");panel.classList.add("simultan-closing");setTimeout(()=>{if(panel.classList.contains("simultan-closing")){panel.hidden=true;panel.classList.remove("simultan-closing");}},220);});
$("simultanPrev").addEventListener("click",()=>{const n=nextPlayable((active-1+games.length)%games.length,-1);if(n>=0)showBoard(n);});
$("simultanNext").addEventListener("click",()=>{const n=nextPlayable((active+1)%games.length);if(n>=0)showBoard(n);});
if(autoToggle)autoToggle.addEventListener("change",()=>{autoSwitch=autoToggle.checked;if(!autoSwitch){cancelSwitch();if(games[active])games[active].awaitingSwitch=false;draw();}saveSession();});
if(claimButton)claimButton.addEventListener("click",()=>{const g=games[active];if(!g||g.finished||state(g).t!==g.humanColor)return;const reason=drawClaimReason(g);if(!reason)return;g.finished="Remis ("+reason+")";cancelSwitch();saveSession();draw();const next=nextPlayable((active+1)%games.length);if(autoSwitch&&next>=0)autoNext(g,1200);});
loadSession();
})();
