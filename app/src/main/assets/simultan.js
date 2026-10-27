/* SchachNova Simultan: 5–20 independent standard-chess boards against configurable bots. */
(function(){
"use strict";
const $=id=>document.getElementById(id),panel=$("simultanPanel"),count=$("simultanCount"),strength=$("simultanStrength"),grid=$("simultanGrid"),board=$("simultanBoard"),info=$("simultanInfo");
if(!panel||!count||!strength||!grid||!board)return;
let games=[],active=0,selected=-1,epoch=0,timers=new Set(),switchTimer=null,viewGeneration=0;
function cancelSwitch(){viewGeneration++;if(switchTimer!==null){clearTimeout(switchTimer);switchTimer=null;}}
function showBoard(i){dragStart=-1;dragPointer=null;dragBoard=-1;if(!games.length)return;const previous=games[active];cancelSwitch();if(previous)previous.awaitingSwitch=false;stopMotion();active=(i+games.length)%games.length;games[active].awaitingSwitch=false;selected=-1;draw();}
function autoNext(g,delay=2000){if(panel.hidden||games[active]!==g)return;const generation=viewGeneration;switchTimer=setTimeout(()=>{switchTimer=null;if(generation!==viewGeneration||panel.hidden||games[active]!==g)return;g.awaitingSwitch=false;const next=(active+1)%games.length;if(next!==active)showBoard(next);},delay);}
let activeMotionCleanup=null;
function stopMotion(){if(activeMotionCleanup){activeMotionCleanup();activeMotionCleanup=null;}}
function animateMove(g,m){
 if(panel.hidden||games[active]!==g)return;
 const from=board.querySelector('[data-square="'+m[0]+'"]'),to=board.querySelector('[data-square="'+m[1]+'"]');
 const target=to?.querySelector(".simultan-piece");
 if(!from||!to||!target||!target.animate)return;
 stopMotion();
 const br=board.getBoundingClientRect(),fr=from.getBoundingClientRect(),tr=to.getBoundingClientRect();
 const overlay=document.createElement("div");
 overlay.className="simultan-motion-overlay";
 overlay.style.cssText="position:absolute;inset:0;pointer-events:none;z-index:40;overflow:visible;";
 const sprite=document.createElement("div");
 sprite.style.cssText="position:absolute;display:flex;align-items:center;justify-content:center;pointer-events:none;will-change:transform;";
 sprite.style.left=(tr.left-br.left)+"px";sprite.style.top=(tr.top-br.top)+"px";
 sprite.style.width=tr.width+"px";sprite.style.height=tr.height+"px";
 const clone=target.cloneNode(true),style=getComputedStyle(target),rect=target.getBoundingClientRect();
 clone.style.setProperty("width",rect.width+"px","important");
 clone.style.setProperty("height",rect.height+"px","important");
 clone.style.setProperty("filter",style.filter,"important");
 clone.style.setProperty("transition","none","important");
 clone.style.setProperty("animation","none","important");
 sprite.append(clone);overlay.append(sprite);
 board.style.position="relative";board.append(overlay);target.style.visibility="hidden";
 const dx=tr.left-fr.left,dy=tr.top-fr.top;
 const distance=Math.hypot((m[1]&7)-(m[0]&7),(m[1]>>4)-(m[0]>>4));
 const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
 const duration=reduced?0:Math.min(410,Math.max(190,175+distance*29));
 let done=false,animation;
 const cleanup=()=>{if(done)return;done=true;overlay.remove();target.style.visibility="";if(activeMotionCleanup===cleanup)activeMotionCleanup=null;};
 activeMotionCleanup=cleanup;
 if(reduced){cleanup();return;}
 animation=sprite.animate([
  {transform:"translate3d("+(-dx)+"px,"+(-dy)+"px,0) scale(1)",offset:0},
  {transform:"translate3d("+(-dx*.42)+"px,"+(-dy*.42)+"px,0) scale(1.025)",offset:.58},
  {transform:"translate3d(0,0,0) scale(1)",offset:1}
 ],{duration,easing:"cubic-bezier(.25,.72,.22,1)",fill:"forwards"});
 animation.onfinish=cleanup;animation.oncancel=cleanup;
 setTimeout(cleanup,duration+180);
}

const files="abcdefgh",notation=m=>files[m[0]&7]+(8-(m[0]>>4))+files[m[1]&7]+(8-(m[1]>>4))+(m[2]||"");
const fresh=()=>({history:[initial()],moves:[],awaitingSwitch:false,strength:Math.floor(Math.random()*21),humanColor:Math.random()<.5?1:-1,finished:"",thinking:false});
const state=g=>g.history[g.history.length-1];
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
function status(g){const s=state(g),moves=legalStandard(s);if(!moves.length)return checkStandard(s)?"Schachmatt":"Patt";if(s.half>=150)return "Remis (75 Züge)";return "";}
function drawCards(){
 grid.replaceChildren();games.forEach((g,i)=>{const b=document.createElement("button");b.type="button";b.className="simultan-card"+(i===active?" active":"");b.textContent="Brett "+(i+1)+" · "+(g.finished|| (g.awaitingSwitch?"Wechsel folgt":state(g).t===g.humanColor?"Du bist dran":"Bot denkt"))+" · Stärke "+g.strength;b.setAttribute("aria-current",i===active?"true":"false");b.onclick=()=>showBoard(i);grid.append(b);});
}
function draw(){
 stopMotion();drawCards();
 board.replaceChildren();const g=games[active];if(!g)return;
 const s=state(g),moves=s.t===g.humanColor&&!g.finished&&!g.awaitingSwitch?legalStandard(s):[],targets=moves.filter(m=>m[0]===selected).map(m=>m[1]),last=g.moves[g.moves.length-1];
 for(let j=0;j<64;j++){const i=g.humanColor===1?(j>>3)*16+(j&7):(7-(j>>3))*16+(7-(j&7)),p=s.b[i],cell=document.createElement("button");cell.type="button";cell.className="simultan-square "+(((j>>3)+(j&7))%2?"dark":"light")+(selected===i?" selected":"")+(targets.includes(i)?" target":"")+(last&&(last[0]===i||last[1]===i)?" last-move":"");if(p!=="."){const img=document.createElement("img");img.className="simultan-piece";img.src="pieces/"+(p===p.toUpperCase()?"w":"b")+p.toUpperCase()+".svg";img.alt=glyph[p];img.draggable=false;cell.append(img);}cell.dataset.square=String(i);cell.setAttribute("aria-label",files[i&7]+(8-(i>>4)));cell.setAttribute("aria-pressed",selected===i?"true":"false");cell.onclick=()=>choose(i);board.append(cell);}
 window.SchachNovaMaterial?.render(board,s,g.humanColor===-1);strength.value=String(g.strength);info.textContent="Brett "+(active+1)+" von "+games.length+" · "+(g.finished||(g.awaitingSwitch?"Wechsel folgt":s.t===g.humanColor?"Du bist am Zug":"Computer überlegt"))+" · Deine Farbe: "+(g.humanColor===1?"Weiß":"Schwarz")+" · Bot-Stärke "+g.strength;
}
/* Pointer-based move entry mirrors the main board without altering its geometry. */
let dragStart=-1,dragPointer=null,dragX=0,dragY=0,suppressTap=false,dragBoard=-1;
board.addEventListener("pointerdown",event=>{
 if(event.pointerType==="mouse"&&event.button!==0)return;
 const cell=event.target.closest(".simultan-square");
 const g=games[active];if(!cell||!g||g.finished||g.awaitingSwitch||state(g).t!==g.humanColor)return;
 const i=Number(cell.dataset.square);
 if(side(state(g).b[i])!==g.humanColor)return;
 dragStart=i;dragPointer=event.pointerId;dragX=event.clientX;dragY=event.clientY;dragBoard=active;
});
board.addEventListener("pointerup",event=>{
 if(dragPointer!==event.pointerId||dragStart<0)return;
 const from=dragStart,sourceBoard=dragBoard;dragStart=-1;dragPointer=null;dragBoard=-1;
 if(Math.hypot(event.clientX-dragX,event.clientY-dragY)<14)return;
 suppressTap=true;setTimeout(()=>{suppressTap=false;},300);
 if(sourceBoard!==active)return;
 const hit=document.elementFromPoint(event.clientX,event.clientY)?.closest(".simultan-square");
 if(!hit||!board.contains(hit))return;
 const g=games[active],target=Number(hit.dataset.square);
 if(!g||g.finished||g.awaitingSwitch||state(g).t!==g.humanColor)return;
 const move=legalStandard(state(g)).find(m=>m[0]===from&&m[1]===target&&(!m[2]||m[2]==="q"));
 if(move)commit(g,move);
});
board.addEventListener("pointercancel",()=>{dragStart=-1;dragPointer=null;dragBoard=-1;});
function choose(i){if(suppressTap)return;const g=games[active];if(!g||g.finished||g.awaitingSwitch||state(g).t!==g.humanColor)return;const s=state(g);if(side(s.b[i])===g.humanColor){selected=selected===i?-1:i;draw();return;}const candidates=legalStandard(s).filter(m=>m[0]===selected&&m[1]===i);if(!candidates.length){selected=-1;draw();return;}const m=candidates.find(m=>m[2]==="q")||candidates[0];commit(g,m);}
function commit(g,m){if(g.finished)return;const s=state(g),valid=legalStandard(s).find(x=>notation(x)===notation(m));if(!valid)return;const isBot=s.t!==g.humanColor;if(games[active]===g&&!g.awaitingSwitch)cancelSwitch();const nextState=applyStandard(s,valid);g.history.push(nextState);g.moves.push(valid);feedbackForMove(s,nextState,valid);g.finished=status(g);selected=-1;if(games[active]===g){draw();requestAnimationFrame(()=>animateMove(g,valid));}else{drawCards();}if(games[active]===g){const shouldSwitch=!isBot||g.finished||(isBot&&g.humanColor===1);if(shouldSwitch){g.awaitingSwitch=true;autoNext(g,isBot?2000:450);}}if(!g.finished&&state(g).t!==g.humanColor)botMove(g);}
function botMove(g){if(g.thinking)return;g.thinking=true;const stamp=epoch,expected=state(g),delay=1100+g.strength*115;const timer=setTimeout(()=>{timers.delete(timer);g.thinking=false;if(stamp!==epoch||state(g)!==expected||g.finished)return;const options=legalStandard(expected);if(!options.length){g.finished=status(g);if(games[active]===g){draw();autoNext(g,1200);}else drawCards();return;}const values={p:100,n:320,b:330,r:500,q:900,k:0};const ranked=options.map(m=>{const next=applyStandard(expected,m),capture=expected.b[m[1]];const reply=legalStandard(next),danger=reply.some(x=>x[1]===m[1]);const gain=capture==="."?0:values[capture.toLowerCase()]||0;const center=3.5-Math.abs((m[1]&7)-3.5);const mate=reply.length===0&&checkStandard(next)?100000:0;return {m,score:mate+gain-danger*(values[expected.b[m[0]].toLowerCase()]||0)*.6+center*8+Math.random()*Math.max(5,(21-g.strength)*35)};});ranked.sort((a,b)=>b.score-a.score);commit(g,ranked[0].m);},delay);timers.add(timer);}
function start(){cancelSwitch();stopMotion();epoch++;for(const t of timers)clearTimeout(t);timers.clear();games=Array.from({length:Math.min(20,Math.max(5,Number(count.value)||5))},fresh);active=0;selected=-1;panel.hidden=false;panel.classList.remove("simultan-closing");panel.classList.add("simultan-opening");draw();for(const g of games)if(g.humanColor===-1)botMove(g);}
$("simultanOpen").addEventListener("click",()=>{panel.hidden=false;panel.classList.remove("simultan-closing");panel.classList.add("simultan-opening");if(!games.length)start();else draw();});
$("simultanStart").addEventListener("click",start);strength.addEventListener("change",()=>{if(games[active]){games[active].strength=Number(strength.value);draw();}});
$("simultanClose").addEventListener("click",()=>{cancelSwitch();panel.classList.remove("simultan-opening");panel.classList.add("simultan-closing");setTimeout(()=>{if(panel.classList.contains("simultan-closing")){panel.hidden=true;panel.classList.remove("simultan-closing");}},220);});
$("simultanPrev").addEventListener("click",()=>{showBoard(active-1);});
$("simultanNext").addEventListener("click",()=>{showBoard(active+1);});
})();
