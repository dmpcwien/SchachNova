"use strict";
const start="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
const glyph={K:"♔",Q:"♕",R:"♖",B:"♗",N:"♘",P:"♙",k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟",".":""};
const dirs={n:[-33,-31,-18,-14,14,18,31,33],b:[-17,-15,15,17],r:[-16,-1,1,16],k:[-17,-16,-15,-1,1,15,16,17]};
const on=i=>i>=0&&i<128&&!(i&136), side=p=>p==="."?0:p===p.toUpperCase()?1:-1;
function initial(){const b=Array(128).fill(".");start.split("/").forEach((row,r)=>{let c=0;for(const p of row){if(/[1-8]/.test(p))c+=Number(p);else b[r*16+c++]=p;}});return {b,t:1,c:15,ep:-1,half:0,full:1};}
function attacked(s,target,by){for(let f=0;f<128;f++){if(!on(f)||side(s.b[f])!==by)continue;const p=s.b[f].toLowerCase();if(p==="p"){if(variantMode==="berolina"){if(target===f-16*by)return true;}else if(target===f-16*by-1||target===f-16*by+1)return true;continue;}const ds=p==="q"?[...dirs.b,...dirs.r]:variantMode==="hoppelpoppel"&&p==="b"?dirs.n:variantMode==="hoppelpoppel"&&p==="n"?dirs.b:dirs[p];for(const d of (ds||(()=>{throw Error("Unknown piece "+JSON.stringify(s.b[f])+" at index "+f)})()))for(let t=f+d;on(t);t+=d){if(t===target)return true;if(s.b[t]!=="."||(variantMode==="hoppelpoppel"?p==="b":p==="n")||p==="k")break;}}return false;}
function checked(s,color=s.t){return attacked(s,s.b.indexOf(color===1?"K":"k"),-color);}
function apply(s,m){const [f,t,promo,flag]=m,b=s.b.slice(),p=b[f],cap=b[t];let c=s.c;b[f]=".";b[t]=promo?(s.t===1?promo.toUpperCase():promo):p;if(flag==="ep")b[t+16*s.t]=".";if(flag==="berolinaEp")b[t+16*s.t]=".";if(flag==="castle"){const rf=t>f?f+3:f-4,rt=t>f?f+1:f-1;b[rt]=b[rf];b[rf]=".";}if(p==="K")c&=~3;if(p==="k")c&=~12;const bits={119:1,112:2,7:4,0:8};if(p.toLowerCase()==="r")c&=~(bits[f]||0);if(cap.toLowerCase()==="r")c&=~(bits[t]||0);const result={b,t:-s.t,c,ep:p.toLowerCase()==="p"&&Math.abs((t>>4)-(f>>4))===2?(t+f)/2:-1,half:p.toLowerCase()==="p"||cap!=="."||flag==="ep"||flag==="berolinaEp"?0:s.half+1,full:s.full+(s.t===-1?1:0)};return variantMode==="atomic"?atomicExplosion(result,m,cap!=="."||flag==="ep"):result;}
function atomicExplosion(s,m,capture){
 const b=s.b.slice(),to=m[1];
 if(!capture)return s;
 b[to]=".";
 for(const d of dirs.k){const i=to+d;if(on(i)&&b[i]!=="."&&b[i].toLowerCase()!=="p")b[i]=".";}
 let rights=s.c;
 if(b[116]!=="K")rights&=~3;if(b[4]!=="k")rights&=~12;
 if(b[119]!=="R")rights&=~1;if(b[112]!=="R")rights&=~2;
 if(b[7]!=="r")rights&=~4;if(b[0]!=="r")rights&=~8;
 return {...s,b,c:rights};
}
function pseudo(s){const out=[];for(let f=0;f<128;f++){if(!on(f)||side(s.b[f])!==s.t)continue;const p=s.b[f].toLowerCase();const add=(t,flag="")=>{if(s.b[t].toLowerCase()==="k"&&variantMode!=="antichess"&&variantMode!=="atomic")return;if(p==="p"&&((t>>4)===0||(t>>4)===7))for(const q of (variantMode==="antichess"?["q","r","b","n","k"]:["q","r","b","n"]))out.push([f,t,q,flag]);else out.push([f,t,"",flag]);};if(p==="p"){const t=f-16*s.t;
 if(variantMode==="berolina"){
  for(const d of [-1,1]){const u=t+d;if(on(u)&&s.b[u]==="."){add(u);const v=u-16*s.t+d;if((f>>4)===(s.t===1?6:1)&&on(v)&&s.b[v]===".")add(v,"berolinaDouble");}}
  if(on(t)){if(side(s.b[t])===-s.t)add(t);else if(t===s.ep&&s.b[t]==="."&&on(t+16*s.t)&&side(s.b[t+16*s.t])===-s.t)add(t,"berolinaEp");}
 }else{
  if(on(t)&&s.b[t]==="."){add(t);const u=t-16*s.t;if(on(u)&&s.b[u]==="."&&(variantMode==="torpedo"||(f>>4)===(s.t===1?6:1)))add(u,"double");}
  for(const d of [-1,1]){const u=t+d;if(!on(u))continue;if(side(s.b[u])===-s.t)add(u);else if(u===s.ep&&s.b[u]==="."&&s.b[u+16*s.t]===(s.t===1?"p":"P"))add(u,"ep");}
 }
}else{const ds=p==="q"?[...dirs.b,...dirs.r]:variantMode==="hoppelpoppel"&&p==="b"?dirs.n:variantMode==="hoppelpoppel"&&p==="n"?dirs.b:dirs[p];for(const d of (ds||(()=>{throw Error("Unknown piece "+JSON.stringify(s.b[f])+" at index "+f)})()))for(let t=f+d;on(t);t+=d){if(side(s.b[t])===s.t)break;add(t);if(s.b[t]!=="."||(variantMode==="hoppelpoppel"?p==="b":p==="n")||p==="k")break;}const home=s.t===1?116:4,rook=s.t===1?"R":"r",bits=s.t===1?[1,2]:[4,8];if(p==="k"&&variantMode!=="antichess"&&variantMode!=="nocastling"&&f===home&&!(variantMode==="atomic"?atomicKingThreat(s,s.t):checked(s))){if((s.c&bits[0])&&s.b[f+3]===rook&&s.b[f+1]==="."&&s.b[f+2]==="."&&!(variantMode==="atomic"?atomicKingThreat({...s,b:s.b.map((p,i)=>i===f?".":i===f+1?s.b[f]:p)},s.t):attacked(s,f+1,-s.t))&&!(variantMode==="atomic"?atomicKingThreat({...s,b:s.b.map((p,i)=>i===f?".":i===f+2?s.b[f]:p)},s.t):attacked(s,f+2,-s.t)))add(f+2,"castle");if((s.c&bits[1])&&s.b[f-4]===rook&&s.b[f-1]==="."&&s.b[f-2]==="."&&s.b[f-3]==="."&&!(variantMode==="atomic"?atomicKingThreat({...s,b:s.b.map((p,i)=>i===f?".":i===f-1?s.b[f]:p)},s.t):attacked(s,f-1,-s.t))&&!(variantMode==="atomic"?atomicKingThreat({...s,b:s.b.map((p,i)=>i===f?".":i===f-2?s.b[f]:p)},s.t):attacked(s,f-2,-s.t)))add(f-2,"castle");}}}return out;}
function atomicKingThreat(s,color){
 const king=s.b.indexOf(color===1?"K":"k");
 if(king<0)return true;
 const enemyKing=s.b.indexOf(color===1?"k":"K");
 // A capture that also explodes the attacking king is illegal.
 const threatSquares=[king,...dirs.k.map(d=>king+d).filter(on)];
 // En passant: the captured pawn disappears, while the explosion is
 // centred on the empty landing square rather than the captured pawn.
 if(s.t===-color&&s.ep>=0&&on(s.ep)&&s.b[s.ep]==="."){
  const attackingColor=-color,landing=s.ep;
  const capturedPawn=landing+16*attackingColor;
  const ownPawn=color===1?"P":"p";
  const enemyPawn=attackingColor===1?"P":"p";
  if(on(capturedPawn)&&s.b[capturedPawn]===ownPawn&&
     (landing===king||dirs.k.some(d=>landing+d===king))&&
     !(enemyKing===landing||dirs.k.some(d=>landing+d===enemyKing))){
   for(const d of [-1,1]){
    const from=landing+16*attackingColor+d;
    if(on(from)&&s.b[from]===enemyPawn)return true;
   }
  }
 }
 for(let from=0;from<128;from++){
  if(!on(from)||side(s.b[from])!==-color||s.b[from].toLowerCase()==="k")continue;
  const p=s.b[from].toLowerCase();
  for(const target of threatSquares){
   if(side(s.b[target])!==color)continue;
   if(enemyKing>=0&&(target===enemyKing||dirs.k.some(d=>target+d===enemyKing)))continue;
   const delta=target-from;
   if(p==="p"){if(delta===16*color-1||delta===16*color+1)return true;continue;}
   const ds=p==="n"?dirs.n:p==="b"?dirs.b:p==="r"?dirs.r:[...dirs.b,...dirs.r];
   if(ds.includes(delta)&&p==="n")return true;
   if(p==="n")continue;
   for(const d of ds){
    let t=from+d;
    while(on(t)){if(t===target)return true;if(s.b[t]!==".")break;t+=d;}
   }
  }
 }
 return false;
}
function legal(s){
 if(variantMode==="atomic"){
  if(s.b.indexOf(s.t===1?"K":"k")<0)return [];
  return pseudo(s).filter(m=>{
   if(s.b[m[0]].toLowerCase()==="k"&&(s.b[m[1]]!=="."||m[3]==="ep"))return false;
   const next=apply(s,m);
   if(next.b.indexOf(s.t===1?"K":"k")<0)return false;
   if(next.b.indexOf(s.t===1?"k":"K")<0)return true;
   return !atomicKingThreat(next,s.t);
  });
 }
 if(variantMode==="antichess"){
  const moves=pseudo(s).filter(m=>m[3]!=="castle");
  const captures=moves.filter(m=>s.b[m[1]]!=="."||m[3]==="ep");
  return captures.length?captures:moves;
 }
 return pseudo(s).filter(m=>!checked(apply(s,m),s.t));
}
function key(s){const epLegal=s.ep>=0&&legal(s).some(m=>m[3]==="ep"||m[3]==="berolinaEp");return s.b.join("")+":"+s.t+":"+s.c+":"+(epLegal?s.ep:-1);}
function insufficient(s){const p=[];for(let i=0;i<128;i++)if(on(i)&&s.b[i]!=="."&&!/[kK]/.test(s.b[i]))p.push([s.b[i].toLowerCase(),((i>>4)+(i&7))%2]);if(!p.length)return true;if(p.length===1)return ["n","b"].includes(p[0][0]);if(p.every(x=>x[0]==="b")&&new Set(p.map(x=>x[1])).size===1)return true;return false;}
let premove=null,premoveFrom=-1,premoveQueue=[];let variantMode="standard",blindLevel=0,checksGiven=[0,0];let lastEndShown="";
let history=[initial()],movesPlayed=[],clockHistory=[[600,600]],viewIndex=0,flipped=false,selected=-1,clock=[600,600],running=false,ended="",rated=false,vibrationOn=true,last=performance.now(),timer;
const current=()=>history[history.length-1];
const vibrate=pattern=>{if(!vibrationOn)return;try{if(window.AndroidHaptics){window.AndroidHaptics.vibrate(pattern.join(","));return;}if(navigator.vibrate)navigator.vibrate(pattern);}catch(_){}};
const format=s=>String(Math.floor(Math.max(0,s)/60)).padStart(2,"0")+":"+String(Math.max(0,s)%60).padStart(2,"0");
function status(){const s=current();if(variantMode==="atomic"){if(!s.b.includes("K"))return "Atomschach – Schwarz gewinnt";if(!s.b.includes("k"))return "Atomschach – Weiß gewinnt";const moves=legal(s);if(!moves.length)return atomicKingThreat(s,s.t)?"Atomschach – "+(s.t===1?"Schwarz":"Weiß")+" gewinnt":"Atomschach – Patt · Remis";if(s.half>=150)return "Atomschach – Remis · 75-Züge-Regel";if(history.filter(x=>key(x)===key(s)).length>=5)return "Atomschach – Remis · fünffache Stellungswiederholung";return (s.t===1?"Weiß":"Schwarz")+" am Zug · Atomschach"+(atomicKingThreat(s,s.t)?" · Explosionsgefahr":"");}if(variantMode==="antichess"){const own=s.b.some((p,i)=>on(i)&&side(p)===s.t);const moves=legal(s);if(!own||!moves.length)return "Räuberschach – "+(s.t===1?"Weiß":"Schwarz")+" gewinnt";return (s.t===1?"Weiß":"Schwarz")+" am Zug · Räuberschach"+(moves.some(m=>s.b[m[1]]!=="."||m[3]==="ep")?" · Schlagpflicht":"");}if(variantMode==="hill"){for(const i of [51,52,67,68]){if(s.b[i]==="K")return "King of the Hill – Weiß gewinnt";if(s.b[i]==="k")return "King of the Hill – Schwarz gewinnt";}}if(variantMode==="threecheck"||variantMode==="fivecheck"){const target=variantMode==="fivecheck"?5:3,name=variantMode==="fivecheck"?"Fünf-Schach":"Drei-Schach";if(checksGiven[0]>=target)return name+" – Weiß gewinnt";if(checksGiven[1]>=target)return name+" – Schwarz gewinnt";}const moves=legal(s),repeat=history.filter(x=>key(x)===key(s)).length;if(!moves.length)return checked(s)?"Schachmatt – "+(s.t===1?"Schwarz":"Weiß")+" gewinnt":"Patt – Remis";if(!["antichess","atomic","hill","threecheck","fivecheck"].includes(variantMode)&&insufficient(s))return "Remis – unzureichendes Material";if(s.half>=150)return "Remis – 75-Züge-Regel";if(repeat>=5)return "Remis – fünffache Stellungswiederholung";return (s.t===1?"Weiß":"Schwarz")+" am Zug"+(checked(s)?" – Schach":"");}
let warnedClock=false;
function drawClaimReason(){if(ended||variantMode==="antichess"||variantMode==="atomic")return "";const s=current(),repeat=history.filter(x=>key(x)===key(s)).length;return repeat>=3?"dreifache Wiederholung":s.half>=100?"50-Züge-Regel":"";}
let clockAlertSecond=[null,null];
function clockWarning(index,second){if(clockAlertSecond[index]===second)return;clockAlertSecond[index]=second;try{const C=window.AudioContext||window.webkitAudioContext;if(C){const ctx=new C(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.type="sine";osc.frequency.value=second===1?1150:second<=3?1000:780;gain.gain.setValueAtTime(.055,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.14);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.15);osc.onended=()=>ctx.close();}}catch(_){}vibrate([second<=3?95:40]);}
function tick(){const now=performance.now(),dt=(now-last)/1000;last=now;if(running&&!ended&&viewIndex===history.length-1){const i=current().t===1?0:1;const before=Math.ceil(clock[i]);clock[i]=Math.max(0,clock[i]-dt);const after=Math.ceil(clock[i]);for(let threshold=10;threshold>=1;threshold--){if(before>threshold&&after<=threshold&&clock[i]>0)clockWarning(i,threshold);}if(clock[i]<=0){clock[i]=0;ended="Zeit abgelaufen – "+(i===0?"Schwarz":"Weiß")+" gewinnt";running=false;}}renderClocks();}
function renderClocks(){document.getElementById("whiteClock").textContent=format(Math.ceil(clock[0]));document.getElementById("blackClock").textContent=format(Math.ceil(clock[1]));document.getElementById("status").textContent=ended||status();if(ended&&ended!==lastEndShown){lastEndShown=ended;showGameResult(ended);}document.getElementById("whiteClock").classList.toggle("active-clock",running&&current().t===1);document.getElementById("blackClock").classList.toggle("active-clock",running&&current().t===-1);const claim=document.getElementById("claimDraw");if(claim){const reason=drawClaimReason();claim.disabled=!!ended||!reason;claim.textContent=reason?"½ Remis beanspruchen ("+reason+")":"½ Remis beanspruchen";}}
function move(m){if(ended)return;const permitted=legal(current()).find(x=>Array.isArray(m)&&x[0]===m[0]&&x[1]===m[1]&&x[2]===m[2]&&x[3]===m[3]);if(!permitted)return;tick();if(ended)return;m=permitted;const old=current(),capture=old.b[m[1]]!=="."||m[3]==="ep"||m[3]==="berolinaEp";history.push(apply(old,m));movesPlayed.push(m);if((variantMode==="threecheck"||variantMode==="fivecheck")&&checked(current()))checksGiven[old.t===1?0:1]++;if(movesPlayed.length===2&&!running){running=true;last=performance.now();}if(window.schachNovaIncrement){clock[old.t===1?0:1]+=window.schachNovaIncrement;}clockHistory.push(clock.slice());viewIndex=history.length-1;selected=-1;warnedClock=false;clockAlertSecond[old.t===1?0:1]=null;const normalKingRules=variantMode!=="antichess"&&variantMode!=="atomic";const isMate=normalKingRules&&!legal(current()).length&&checked(current());const isCheck=normalKingRules&&checked(current());vibrate(isMate?[65,85,65]:isCheck?[160,65,80]:capture?[110]:[35]);const stateText=status();ended=stateText.startsWith("Weiß am Zug")||stateText.startsWith("Schwarz am Zug")?"":stateText;if(ended){running=false;premove=null;premoveQueue=[];}last=performance.now();if(document.getElementById("botMode")?.value==="human"){flipped=current().t===-1;}render();animateMovedPiece(m);saveGame();
if(!premove&&premoveQueue.length&&current().t===(window.schachNovaBotColor===1?-1:1)&&!ended&&document.getElementById("botMode").value==="bot"){premove=premoveQueue.shift();}
if(premove&&current().t===(window.schachNovaBotColor===1?-1:1)&&!ended&&document.getElementById("botMode").value==="bot"){
 const queued=premove;premove=null;premoveFrom=-1;
 setTimeout(()=>{if(ended||current().t!==(window.schachNovaBotColor===1?-1:1))return;const legalPremove=legal(current()).find(x=>x[0]===queued[0]&&x[1]===queued[1]);if(legalPremove)move(legalPremove);else{premoveQueue=[];render();}},120);
}}
let activePieceAnimation=null;
let activePieceCleanup=null;
function stopPieceAnimation(){
 if(activePieceCleanup)activePieceCleanup();
 if(activePieceAnimation){activePieceAnimation.cancel();activePieceAnimation=null;}
}
function animateMovedPiece(m){
 const board=document.getElementById("board");if(!board)return;
 const fromRow=m[0]>>4,fromCol=m[0]&7,toRow=m[1]>>4,toCol=m[1]&7;
 const fromIndex=(flipped?7-fromRow:fromRow)*8+(flipped?7-fromCol:fromCol);
 const toIndex=(flipped?7-toRow:toRow)*8+(flipped?7-toCol:toCol);
 const fromCell=board.children[fromIndex],toCell=board.children[toIndex];
 const target=toCell?.querySelector(".piece-img, .blind-disk");
 if(!fromCell||!toCell||!target||!target.animate)return;
 stopPieceAnimation();
 const br=board.getBoundingClientRect(),fr=fromCell.getBoundingClientRect(),tr=toCell.getBoundingClientRect();
 // Use a dedicated square-sized overlay. Never append a raw piece image directly
 // to the grid: that creates an extra grid item and can enlarge it dramatically.
 const overlay=document.createElement("div");
 overlay.className="piece-motion-overlay";
 overlay.style.cssText="position:absolute;inset:0;pointer-events:none;z-index:50;overflow:visible;";
 const sprite=document.createElement("div");
 sprite.style.cssText="position:absolute;display:flex;align-items:center;justify-content:center;pointer-events:none;will-change:transform;";
 sprite.style.left=(tr.left-br.left)+"px";sprite.style.top=(tr.top-br.top)+"px";
 sprite.style.width=fr.width+"px";sprite.style.height=fr.height+"px";
 const piece=target.cloneNode(true);
 const isBlindDisk=target.classList.contains("blind-disk");
 if(isBlindDisk){
  // Percent sizing in the grid cell does not survive reliably in an overlay. Freeze the actual disc size.
  const discRect=target.getBoundingClientRect();
  piece.style.setProperty("width",discRect.width+"px","important");
  piece.style.setProperty("height",discRect.height+"px","important");
  piece.style.setProperty("flex","0 0 auto","important");
  piece.style.setProperty("transition","none","important");
  piece.style.setProperty("transform","none","important");
 }else{
  // The original piece's blue/silver filter depends on its square's CSS class.
  // Preserve the computed appearance before moving the clone into the overlay.
  const computed=getComputedStyle(target);
  piece.style.setProperty("display","block","important");
  piece.style.setProperty("width",computed.width,"important");
  piece.style.setProperty("height",computed.height,"important");
  piece.style.setProperty("max-width","100%","important");
  piece.style.setProperty("max-height","100%","important");
  piece.style.setProperty("object-fit","contain","important");
  piece.style.setProperty("filter",computed.filter,"important");
  piece.style.setProperty("-webkit-filter",computed.filter,"important");
  piece.style.setProperty("transition","none","important");
  piece.style.setProperty("animation","none","important");
 }
 sprite.append(piece);overlay.append(sprite);
 board.style.position="relative";board.append(overlay);target.style.visibility="hidden";
 const dx=tr.left-fr.left,dy=tr.top-fr.top;
 const distance=Math.hypot(toCol-fromCol,toRow-fromRow);
 const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
 const duration=reducedMotion?0:isBlindDisk?Math.min(420,Math.max(200,175+distance*30)):Math.min(410,Math.max(190,175+distance*29));
 if(reducedMotion){overlay.remove();target.style.visibility="";return;}
 let done=false,animation;
 const cleanup=()=>{if(done)return;done=true;overlay.remove();target.style.visibility="";if(activePieceAnimation===animation)activePieceAnimation=null;if(activePieceCleanup===cleanup)activePieceCleanup=null;};
 animation=sprite.animate([{transform:"translate3d("+(-dx)+"px,"+(-dy)+"px,0) scale(1)",offset:0},{transform:"translate3d("+(-dx*.42)+"px,"+(-dy*.42)+"px,0) scale(1.025)",offset:.58},{transform:"translate3d(0,0,0) scale(1)",offset:1}],{duration,easing:"cubic-bezier(.25,.72,.22,1)",fill:"forwards"});
 activePieceAnimation=animation;activePieceCleanup=cleanup;animation.onfinish=cleanup;animation.oncancel=cleanup;
 setTimeout(cleanup,duration+180);
}
function choose(i){
 if(ended||viewIndex!==history.length-1)return;
 const s=current();
 const botPlaying=document.getElementById("botMode").value==="bot";
 const botColor=window.schachNovaBotColor===1?1:-1;
 const humanColor=-botColor;
 if(botPlaying&&s.t===botColor){
  // Premove input belongs to the human side, even though it is the bot's turn.
  if(side(s.b[i])===humanColor){
   premoveFrom=premoveFrom===i?-1:i;
   render();return;
  }
  if(premoveFrom>=0&&on(i)&&side(s.b[i])!==humanColor){
   const from=premoveFrom;
   premoveFrom=-1;
   // Only geometrically plausible premoves; legality is checked after the bot moves.
   const hypothetical={...s,b:s.b.slice(),t:humanColor,ep:-1};
   const candidates=legal(hypothetical).filter(m=>m[0]===from&&m[1]===i);
   if(candidates.length){
    const queued=candidates.find(m=>m[2]==="q")||candidates[0];
    if(premove)premoveQueue.push(queued);else premove=queued;
   }
   render();return;
  }
  premoveFrom=-1;render();return;
 }
 const moves=legal(s);
 if(side(s.b[i])===s.t){selected=selected===i?-1:i;render();return;}
 const choices=moves.filter(m=>m[0]===selected&&m[1]===i);
 if(choices.length){
  const m=choices[0];
  if(choices.length>1){
   showPromotion(q=>{const promotion=choices.find(x=>x[2]===q)||m;move(promotion);});
   return;
  }
  move(m);
 }else{selected=-1;render();}
}
function render(){const b=document.getElementById("board");const s=history[viewIndex];window.SchachNovaMaterial?.render(b,s,flipped);const checkKing=(variantMode==="atomic"?atomicKingThreat(s,s.t):variantMode==="antichess"?false:checked(s))?s.b.indexOf(s.t===1?"K":"k"):-1,lastMove=movesPlayed[viewIndex-1],targets=viewIndex===history.length-1?legal(s).filter(m=>m[0]===selected).map(m=>m[1]):[];for(let r=0;r<8;r++)for(let c=0;c<8;c++){const i=flipped?(7-r)*16+(7-c):r*16+c,el=b.children[r*8+c]||document.createElement("button");el.style.removeProperty("background-color");el.style.removeProperty("box-shadow");el.className="sq "+((r+c)%2?"dark":"light")+(lastMove&&(lastMove[0]===i||lastMove[1]===i)?" lastmove":"")+(selected===i||premoveFrom===i?" selected":"")+(targets.includes(i)?" target":"")+(((premove&&(premove[0]===i||premove[1]===i))||premoveQueue.some(q=>q[0]===i||q[1]===i))?" premove":"");if(i===checkKing){el.style.setProperty("background-color","#ef3340","important");el.style.setProperty("box-shadow","inset 0 0 0 4px #ffd0d0, inset 0 0 24px #970000","important");}const piece=s.b[i];const hiddenPiece=blindLevel>0&&piece!=="."&&(blindLevel===1?/[nN]/.test(piece):blindLevel===2?/[nNbB]/.test(piece):blindLevel===3?/[rRnNbBqQ]/.test(piece):blindLevel===4?/[rRnNbBqQkK]/.test(piece):true);const disk=hiddenPiece&&blindLevel<5;const nextPieceMarkup=piece==="."?"":disk?`<span class="blind-disk ${side(piece)===1?"blind-white":"blind-black"}" aria-hidden="true"></span>`:hiddenPiece?"":`<img class="piece-img" draggable="false" alt="" src="pieces/${side(piece)===1?"w":"b"}${piece.toUpperCase()}.svg">`;if(el.innerHTML!==nextPieceMarkup)el.innerHTML=nextPieceMarkup;el.classList.add(side(s.b[i])===1?"white-piece":"black-piece");el.setAttribute("aria-label",String.fromCharCode(97+(i&7))+(8-(i>>4)));el.onclick=()=>choose(i);el.draggable=side(s.b[i])!==0;el.ondragstart=e=>{e.dataTransfer.setData("text/plain",String(i));};el.ondragover=e=>e.preventDefault();el.ondrop=e=>{e.preventDefault();const from=Number(e.dataTransfer.getData("text/plain"));if(Number.isInteger(from)&&on(from)){selected=from;choose(i);}};if(!el.parentElement)b.append(el);}const ranks=(flipped?[1,2,3,4,5,6,7,8]:[8,7,6,5,4,3,2,1]).join("");const files=flipped?"hgfedcba":"abcdefgh";const rankEl=document.getElementById("rankLabels"),fileEl=document.getElementById("fileLabels");if(rankEl.dataset.order!==ranks){rankEl.dataset.order=ranks;rankEl.innerHTML=ranks.split("").map(n=>"<span>"+n+"</span>").join("");}if(fileEl.dataset.order!==files){fileEl.dataset.order=files;fileEl.innerHTML=files.split("").map(n=>"<span>"+n+"</span>").join("");}const mh=document.getElementById("moveHistory");if(mh)mh.textContent=movesPlayed.length?movesPlayed.map((m,j)=>`${Math.floor(j/2)+1}${j%2?"...":"."} ${"abcdefgh"[m[0]&7]}${8-(m[0]>>4)}–${"abcdefgh"[m[1]&7]}${8-(m[1]>>4)}`).join("  ·  "):"Noch keine Züge";renderClocks();}
document.getElementById("newGame").onclick=()=>{if(activePieceAnimation){activePieceAnimation.finish();activePieceAnimation=null;}history=[initial()];movesPlayed=[];viewIndex=0;selected=-1;premove=null;premoveFrom=-1;premoveQueue=[];lastEndShown="";warnedClock=false;clock=[Number(document.getElementById("timeSelect").value),Number(document.getElementById("timeSelect").value)];clockHistory=[clock.slice()];checksGiven=[0,0];running=false;ended="";last=performance.now();render();saveGame();};

document.getElementById("undo").onclick=()=>{if(history.length>1){if(activePieceAnimation){activePieceAnimation.finish();activePieceAnimation=null;}history.pop();movesPlayed.pop();clockHistory.pop();clock=clockHistory[clockHistory.length-1].slice();checksGiven=[0,0];if(variantMode==="threecheck"||variantMode==="fivecheck"){for(let j=1;j<history.length;j++)if(checked(history[j]))checksGiven[history[j-1].t===1?0:1]++;}viewIndex=history.length-1;selected=-1;premove=null;premoveFrom=-1;ended="";running=movesPlayed.length>=2;last=performance.now();render();saveGame();}};
document.getElementById("forward").onclick=()=>{viewIndex=Math.min(history.length-1,viewIndex+1);selected=-1;render();};
// Touch-Ziehen auf Android: Startfeld merken und Zielfeld über elementFromPoint bestimmen.
let touchOrigin=-1,touchStartX=0,touchStartY=0;
const boardElement=document.getElementById("board");
boardElement.addEventListener("touchstart",e=>{if(e.touches.length!==1)return;const sq=e.target.closest(".sq");if(!sq)return;touchOrigin=[...boardElement.children].indexOf(sq);touchStartX=e.touches[0].clientX;touchStartY=e.touches[0].clientY;const img=sq.querySelector("img");if(img&&side(current().b[flipped?(7-Math.floor(touchOrigin/8))*16+(7-touchOrigin%8):Math.floor(touchOrigin/8)*16+touchOrigin%8])===current().t){showDragGhost(img,touchStartX,touchStartY);}},{passive:true});
boardElement.addEventListener("touchmove",e=>{if(dragGhost&&e.touches.length===1){dragGhost.style.left=e.touches[0].clientX+"px";dragGhost.style.top=e.touches[0].clientY+"px";e.preventDefault();}},{passive:false});
boardElement.addEventListener("touchend",e=>{hideDragGhost();if(touchOrigin<0||!e.changedTouches.length)return;const t=e.changedTouches[0],origin=touchOrigin;touchOrigin=-1;if(Math.hypot(t.clientX-touchStartX,t.clientY-touchStartY)<18)return;const rect=boardElement.getBoundingClientRect();const x=Math.floor((t.clientX-rect.left)/rect.width*8),y=Math.floor((t.clientY-rect.top)/rect.height*8);if(x<0||x>7||y<0||y>7)return;const fromRow=Math.floor(origin/8),fromCol=origin%8;const from=flipped?(7-fromRow)*16+(7-fromCol):fromRow*16+fromCol;const to=flipped?(7-y)*16+(7-x):y*16+x;selected=from;choose(to);e.preventDefault();},{passive:false});
boardElement.addEventListener("touchcancel",()=>{touchOrigin=-1;hideDragGhost();},{passive:true});
document.getElementById("addTime").onclick=()=>{if(rated)return;const i=current().t===1?0:1;clock[i]+=15;clockHistory[clockHistory.length-1]=clock.slice();renderClocks();};
const originalUndo=document.getElementById("undo").onclick;
document.getElementById("undo").onclick=()=>{if(viewIndex>0){viewIndex--;selected=-1;render();}};
document.getElementById("takeback").onclick=()=>{if(!rated&&history.length>1)originalUndo();};
document.getElementById("flipBoard").onclick=()=>{flipped=!flipped;render();};
document.getElementById("settingsButton").onclick=()=>{const el=document.getElementById("settingsPanel");el.hidden=!el.hidden;};
document.getElementById("statsButton").onclick=()=>document.getElementById("historyPanel").scrollIntoView({behavior:"smooth",block:"nearest"});
document.getElementById("coachButton").onclick=()=>{document.getElementById("settingsPanel").hidden=false;document.getElementById("coachButton").textContent="🔇 Coach";};
document.getElementById("vibrationToggle").onchange=e=>{vibrationOn=e.target.checked;};
document.getElementById("testVibration").onclick=()=>vibrate([90,70,90]);
document.getElementById("ratedToggle").onchange=e=>{rated=e.target.checked;document.getElementById("addTime").disabled=rated;document.getElementById("takeback").disabled=rated;document.getElementById("modeLabel").textContent=rated?"Lokale Partie · Gewertet (ohne Online-Elo)":"Lokale Partie · Ungewertet";};
document.getElementById("timeSelect").onchange=()=>{if(history.length===1&&!running)document.getElementById("newGame").click();};
timer=setInterval(tick,250);render();

// Lokale automatische Sicherung; keine Server-Wertung wird vorgetäuscht.
function saveGame(){try{localStorage.setItem("schachnova-game-v2",JSON.stringify({history,movesPlayed,clockHistory,clock,viewIndex,flipped,ended,variantMode,blindLevel,checksGiven,time:Date.now()}));}catch(_){}}
function restoreGame(){try{const raw=localStorage.getItem("schachnova-game-v2");if(!raw)return;const d=JSON.parse(raw);if(!Array.isArray(d.history)||!d.history.length||!d.history.every(x=>Array.isArray(x.b)&&x.b.length===128))return;history=d.history;movesPlayed=Array.isArray(d.movesPlayed)?d.movesPlayed:[];clockHistory=Array.isArray(d.clockHistory)?d.clockHistory:[[600,600]];clock=Array.isArray(d.clock)?d.clock:[600,600];viewIndex=Math.min(history.length-1,Math.max(0,d.viewIndex||0));flipped=!!d.flipped;ended=d.ended||"";variantMode=["standard","hill","threecheck","fivecheck","hoppelpoppel","torpedo","berolina","nocastling","antichess","atomic"].includes(d.variantMode)?d.variantMode:"standard";blindLevel=Math.max(0,Math.min(5,Number(d.blindLevel)||0));checksGiven=[0,0];if(variantMode==="threecheck"||variantMode==="fivecheck"){for(let j=1;j<history.length;j++)if(checked(history[j]))checksGiven[history[j-1].t===1?0:1]++;const target=variantMode==="fivecheck"?5:3,name=variantMode==="fivecheck"?"Fünf-Schach":"Drei-Schach";if(checksGiven[0]>=target||checksGiven[1]>=target)ended=name+" – "+(checksGiven[0]>=target?"Weiß":"Schwarz")+" gewinnt";}if(variantMode==="antichess"){const outcome=status();if(outcome.startsWith("Räuberschach – ")&&outcome.endsWith(" gewinnt"))ended=outcome;}if(variantMode==="atomic"){const outcome=status();if(outcome.startsWith("Atomschach – "))ended=outcome;}running=false;render();}catch(_){}}
function exportPgn(){const lines=['[Event "SchachNova Offline"]','[Site "Android"]','[Result "*"]','','{ Zugfolge als Koordinaten, nicht SAN }',movesPlayed.map((m,j)=>(j%2===0?Math.floor(j/2)+1+'. ':'')+"abcdefgh"[m[0]&7]+(8-(m[0]>>4))+"abcdefgh"[m[1]&7]+(8-(m[1]>>4))+(m[2]||"")).join(' ')+' *'];const blob=new Blob([lines.join("\n")],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='SchachNova-Partie.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
restoreGame();

let dragGhost=null;
function showDragGhost(img,x,y){hideDragGhost();dragGhost=img.cloneNode(true);dragGhost.className="drag-ghost";dragGhost.style.left=x+"px";dragGhost.style.top=y+"px";document.body.appendChild(dragGhost);}
function hideDragGhost(){if(dragGhost){dragGhost.remove();dragGhost=null;}}
function showPromotion(callback){const dialog=document.getElementById("promotionDialog");if(!dialog){const answer=window.prompt("Bauernumwandlung: D Dame, T Turm, L Läufer, S Springer"+(variantMode==="antichess"?", K König":"") ,"D");if(answer===null)return;const piece=({d:"q",q:"q",t:"r",r:"r",l:"b",b:"b",s:"n",n:"n",k:"k"})[answer.trim().toLowerCase()];if(piece&&(piece!=="k"||variantMode==="antichess"))callback(piece);return;}dialog.hidden=false;const cancel=document.getElementById("promotionCancel");if(cancel)cancel.onclick=()=>{dialog.hidden=true;};dialog.querySelectorAll("[data-promotion]").forEach(b=>{b.hidden=b.dataset.promotion==="k"&&variantMode!=="antichess";b.onclick=()=>{dialog.hidden=true;callback(b.dataset.promotion);};});}
function showGameResult(message){running=false;const dialog=document.getElementById("resultDialog");if(!dialog)return;document.getElementById("resultMessage").textContent=message;dialog.hidden=true;try{window.dispatchEvent(new CustomEvent("schachnova:finished",{detail:{message,variant:variantMode,moves:movesPlayed.map(m=>[...m]),positions:history.map(p=>JSON.parse(JSON.stringify(p))),timestamp:Date.now()}}));}catch(e){console.warn("Archivierung:",e);}const notice=document.getElementById("gameEndNotice");if(notice){notice.textContent="";notice.hidden=true;}}
function clearPremoves(){premove=null;premoveFrom=-1;premoveQueue=[];render();}
function removeLastPremove(){if(premoveQueue.length)premoveQueue.pop();else premove=null;premoveFrom=-1;render();}

function setVariantMode(v){if(!["standard","hill","threecheck","fivecheck","hoppelpoppel","torpedo","berolina","nocastling","antichess","atomic"].includes(v))return false;variantMode=v;document.getElementById("newGame").click();return true;}
function setBlindLevel(v){blindLevel=Math.max(0,Math.min(5,Number(v)||0));render();saveGame();}

function claimDraw(){const reason=drawClaimReason();if(!reason||ended)return;ended="Remis – "+reason+" beansprucht";running=false;render();saveGame();}
function agreeDraw(){if(ended||document.getElementById("botMode").value!=="human")return;if(!confirm("Stimmen beide Spieler einem Remis zu?"))return;ended="Remis durch Vereinbarung";running=false;render();saveGame();}
