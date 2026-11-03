/* SchachNova offline post-game review: Stockfish evaluates every recorded position. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const coord=i=>"abcdefgh"[i&7]+(8-(i>>4));
const notation=m=>coord(m[0])+coord(m[1])+(m[2]||"");
const review=$("reviewPanel"),launch=$("openReview"),close=$("closeReview"),progress=$("reviewProgress"),summary=$("reviewSummary"),items=$("reviewMoves"),headline=$("reviewHeadline");
let worker=null,positions=[],results=[],index=0,score=null,best="",active=false,token=0,reviewAt=0,playTimer=null,analysisKey="",engineDepth=0,principal=[],training=null,previewState=null,previewMove=null,lineTimer=null;
function fen(s){
 const rows=[];for(let r=0;r<8;r++){let row="",empty=0;for(let c=0;c<8;c++){const p=s.b[r*16+c];if(p===".")empty++;else{if(empty)row+=empty;empty=0;row+=p;}}if(empty)row+=empty;rows.push(row);}
 const castle=(s.c&1?"K":"")+(s.c&2?"Q":"")+(s.c&4?"k":"")+(s.c&8?"q":"");
 return rows.join("/")+" "+(s.t===1?"w":"b")+" "+(castle||"-")+" "+(s.ep>=0?coord(s.ep):"-")+" "+s.half+" "+s.full;
}
// Estimated move accuracy uses change in win probability, reducing excessive
// penalties in already decided positions. This is not a Chess.com accuracy score.
function winChance(cp,side){
 const value=Math.max(-1600,Math.min(1600,cp*side));
 return 1/(1+Math.exp(-value/260));
}
function moveAccuracy(before,after,side){
 if(!Number.isFinite(before)||!Number.isFinite(after))return null;
 const lost=Math.max(0,winChance(before,side)-winChance(after,side));
 return Math.max(0,Math.min(100,Math.round(100*Math.exp(-3.5*lost))));
}
function accuracyAverage(values){
 return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null;
}
function label(loss,book){
 if(book)return ["Eröffnungszug","#b8b8b8"];
 if(loss<15)return ["Bester Zug","#88c85a"];
 if(loss<45)return ["Sehr gut","#82bd67"];
 if(loss<95)return ["Gut","#a5c677"];
 if(loss<170)return ["Ungenauigkeit","#eac34b"];
 if(loss<320)return ["Fehler","#f19a4e"];
 return ["Grober Fehler","#ed6660"];
}
const openingLines=[
 ["e2e4 e7e5 g1f3 b8c6 f1c4","Italienische Partie"],
 ["e2e4 e7e5 g1f3 b8c6 f1b5","Spanische Partie"],
 ["e2e4 c7c5","Sizilianische Verteidigung"],
 ["e2e4 e7e6","Französische Verteidigung"],
 ["e2e4 c7c6","Caro-Kann-Verteidigung"],
 ["e2e4 e7e5 g1f3 g8f6","Russische Verteidigung"],
 ["e2e4 e7e5 g1f3 b8c6 f1c4 f8c5","Italienische Partie · Giuoco Piano"],
 ["d2d4 d7d5 c2c4 e7e6","Abgelehntes Damengambit"],
 ["d2d4 d7d5 c2c4 d5c4","Angenommenes Damengambit"],
 ["d2d4 g8f6 c2c4 e7e6 b1c3 f8b4","Nimzo-Indische Verteidigung"],
 ["d2d4 g8f6 c2c4 g7g6","Königsindischer Aufbau"],
 ["d2d4 d7d5 c1f4","Londoner System"],
 ["e2e4 e7e5 g1f3 b8c6 d2d4","Schottische Partie"],
 ["e2e4 d7d5","Skandinavische Verteidigung"],
 ["e2e4 d7d6","Pirc-Verteidigung"],
 ["c2c4","Englische Eröffnung"],
 ["g1f3","Réti-Eröffnung"]
];
function openingName(){
 const moves=movesPlayed.map(notation).join(" ");let found=null;
 for(const [seq,name] of openingLines){if(moves===seq||moves.startsWith(seq+" ")){if(!found||seq.length>found[0].length)found=[seq,name];}}
 return found?found[1]:"Unbekannte Eröffnung";
}
function tacticalExplanation(i,loss,bestMove){
 const before=positions[i],after=positions[i+1],move=movesPlayed[i],piece=before.b[move[0]],target=before.b[move[1]];
 const parts=[];if(move[3]==="ep")parts.push("Du schlägst en passant.");else if(target!==".")parts.push("Du schlägst eine gegnerische "+({p:"Bauer",n:"Springer",b:"Läufer",r:"Turm",q:"Dame"}[target.toLowerCase()]||"Figur")+".");
 if(checked(after))parts.push(legal(after).length?"Der Zug setzt den gegnerischen König ins Schach.":"Das ist Schachmatt.");
 if(loss>=95&&bestMove&&bestMove!=="(none)"&&bestMove!==notation(move)){
  const m=uciLegal(before,bestMove);
  if(m){const targetPiece=before.b[m[1]];if(targetPiece!==".")parts.push("Die bessere Fortsetzung "+bestMove+" schlägt eine "+({p:"Bauer",n:"Springer",b:"Läufer",r:"Turm",q:"Dame"}[targetPiece.toLowerCase()]||"Figur")+".");
  else if(checked(apply(before,m)))parts.push("Die bessere Fortsetzung "+bestMove+" bietet Schach.");
  else parts.push("Vergleiche "+notation(move)+" mit dem empfohlenen Zug "+bestMove+" und achte auf Drohungen und ungedeckte Figuren.");}
 }
 return parts.join(" ");
}
function describe(i,loss,bestMove){
 const tactical=tacticalExplanation(i,loss,bestMove);const actual=notation(movesPlayed[i]),better=bestMove&&bestMove!=="(none)"?bestMove:"";
 if(loss<45)return (tactical?tactical+" ":"")+"Dieser Zug hält die Stellung weitgehend stabil. "+(better&&better!==actual?"Stockfish bevorzugt "+better+"; der Unterschied ist aber klein.":"");
 if(loss<95)return (tactical?tactical+" ":"")+"Es gibt eine etwas genauere Fortsetzung."+(better?" Stockfish empfiehlt "+better+".":"");
 if(loss<170)return (tactical?tactical+" ":"")+"Dieser Zug verschlechtert deine Stellung messbar. Prüfe vor dem Ziehen Drohungen, ungedeckte Figuren und mögliche Schachs."+(better?" Besser war "+better+".":"");
 if(loss<320)return (tactical?tactical+" ":"")+"Hier verliert deine Stellung deutlich an Wert. Suche zuerst nach gegnerischen taktischen Möglichkeiten und prüfe Kandidatenzüge."+(better?" Die Engine bevorzugt "+better+".":"");
 return (tactical?tactical+" ":"")+"Dieser Zug führt zu einem großen Bewertungsverlust. Überprüfe, ob eine Figur hängt, ein Mattangriff entsteht oder eine taktische Kombination möglich ist."+(better?" Stärker war "+better+".":"");
}
function drawReviewBoard(previous=-1,explicitMove=null){
 const board=$("reviewBoard");if(!board||!positions.length)return;
 const state=previewState||positions[reviewAt];if(!state)return;
 const api=window.SchachNovaMoveAnimator,cell=i=>board.children[(i>>4)*8+(i&7)]||null;
 let spec=null;
 if(explicitMove)spec=api?.standardMoves(explicitMove,null);
 else if(previous>=0&&reviewAt===previous+1)spec=api?.standardMoves(movesPlayed[previous],positions[previous]);
 else if(previous>=0&&reviewAt===previous-1){
  const m=movesPlayed[reviewAt];if(m)spec=[{from:m[1],to:m[0]}];
 }
 const motion=spec?.length?api?.capture(board,spec,cell):null;
 board.replaceChildren();
 const move=previewMove||(reviewAt>0?movesPlayed[reviewAt-1]:null);
 for(let j=0;j<64;j++){
  const i=(j>>3)*16+(j&7),p=state.b[i],cell=document.createElement("div");
  cell.className="review-square "+(((j>>3)+(j&7))%2?"review-dark":"review-light");
  if(move&&(i===move[0]||i===move[1]))cell.classList.add("review-highlight");
  if(p!=="."){const img=document.createElement("img");img.src="pieces/"+(p===p.toUpperCase()?"w":"b")+p.toUpperCase()+".svg";img.alt="";img.className="review-piece";cell.append(img);}
  if(training&&training.square===i){cell.style.outline="3px solid #ffda65";cell.style.outlineOffset="-3px";}
  cell.onclick=()=>trainingClick(i);board.append(cell);
 }
 // Chess-review overlay: move arrow and category badge, without adding a grid cell.
 const oldOverlay=board.querySelector(".review-arrow-overlay");if(oldOverlay)oldOverlay.remove();
 const oldBadges=board.querySelectorAll(".review-move-badge");oldBadges.forEach(el=>el.remove());
 if(move&&reviewAt>0){
  const index=reviewAt-1,pre=results[index],post=results[index+1];
  const loss=pre&&post&&Number.isFinite(pre.cp)&&Number.isFinite(post.cp)
   ?Math.max(0,Math.round((pre.cp-post.cp)*positions[index].t)):null;
  const grade=loss===null?null:label(loss,false)[0];
  const gradeInfo={"Bester Zug":["★","#44b874"],"Sehr gut":["✓","#36bca7"],"Gut":["✓","#5ca7e5"],"Ungenauigkeit":["?!","#e6b84e"],"Fehler":["?","#e99348"],"Grober Fehler":["??","#e65a67"]};
  const badgeData=gradeInfo[grade];
  const from=(move[0]>>4)*8+(move[0]&7),to=(move[1]>>4)+(move[1]&7);
  const end=board.children[(move[1]>>4)*8+(move[1]&7)];
  if(end&&badgeData){const badge=document.createElement("span");badge.className="review-move-badge";badge.textContent=badgeData[0];badge.style.background=badgeData[1];badge.title=grade;end.append(badge);}
  const arrow=document.createElementNS("http://www.w3.org/2000/svg","svg");
  arrow.setAttribute("viewBox","0 0 800 800");arrow.setAttribute("preserveAspectRatio","none");arrow.classList.add("review-arrow-overlay");
  const line=document.createElementNS("http://www.w3.org/2000/svg","line");
  const center=n=>[50+(n&7)*100,50+(n>>4)*100];
  const a=center(move[0]),b=center(move[1]);
  for(const [k,v] of Object.entries({x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:badgeData?.[1]||"#4ea8e9","stroke-width":18,"stroke-linecap":"round",opacity:.73}))line.setAttribute(k,v);
  const defs=document.createElementNS("http://www.w3.org/2000/svg","defs");
  const marker=document.createElementNS("http://www.w3.org/2000/svg","marker");
  for(const [k,v] of Object.entries({id:"review-arrowhead",markerWidth:5,markerHeight:5,refX:3,refY:2.5,orient:"auto",markerUnits:"strokeWidth"}))marker.setAttribute(k,v);
  const head=document.createElementNS("http://www.w3.org/2000/svg","path");head.setAttribute("d","M0 0 L5 2.5 L0 5 Z");head.setAttribute("fill",badgeData?.[1]||"#4ea8e9");
  marker.append(head);defs.append(marker);arrow.append(defs);line.setAttribute("marker-end","url(#review-arrowhead)");arrow.append(line);board.append(arrow);
 }
 $("reviewStep").textContent=reviewAt+" / "+movesPlayed.length;
 const i=reviewAt-1, before=results[i],after=results[i+1];
 let message="Wähle einen Zug oder starte die animierte Wiedergabe.";
 if(i>=0){const loss=before&&after&&Number.isFinite(before.cp)&&Number.isFinite(after.cp)?Math.max(0,Math.round((before.cp-after.cp)*positions[i].t)):null;
 message=loss===null?"Zug "+notation(movesPlayed[i])+" – Engine-Auswertung läuft.":label(loss,false)[0]+": "+notation(movesPlayed[i])+". "+describe(i,loss,before.best);}
 const level=$("coachDetail")?.value||"normal";
 if(level==="basic"&&i>=0&&before&&after&&Number.isFinite(before.cp)&&Number.isFinite(after.cp)){const loss=Math.max(0,Math.round((before.cp-after.cp)*positions[i].t));message=loss<95?"Gut gespielt. Achte weiter auf sichere Figuren.":"Hier lohnt es sich, nach einem besseren Zug zu suchen.";}
 if(level==="advanced"&&i>=0&&before){message+=" Engine-Empfehlung (UCI): "+(before.best||"nicht verfügbar")+".";}
 $("reviewCoachText").textContent=message;
 $("reviewPrevious").disabled=reviewAt===0;
 $("reviewNext").disabled=reviewAt>=movesPlayed.length;
 api?.play(motion);
}
function selectReview(n){stopLine();const previous=reviewAt;reviewAt=Math.max(0,Math.min(movesPlayed.length,n));previewState=null;previewMove=null;training=null;drawReviewBoard(previous);}
function uciLegal(s,u){if(!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(u))return null;return legal(s).find(m=>notation(m)===u)||null;}
function stopLine(){if(lineTimer){clearTimeout(lineTimer);lineTimer=null;}}
function trainingClick(i){
 if(!training)return;
 if(training.square===null){if(training.state.b[i]!=="."&&((training.state.b[i]===training.state.b[i].toUpperCase())===(training.state.t===1))){training.square=i;drawReviewBoard();}return;}
 const attempt=coord(training.square)+coord(i),expected=training.expected;
 const valid=legal(training.state).some(m=>notation(m).slice(0,4)===attempt);if(!valid){$("reviewExerciseStatus").textContent="Dieser Zug ist nicht erlaubt.";training.square=null;drawReviewBoard();return;}
 if(attempt===expected.slice(0,4)){ $("reviewExerciseStatus").textContent="✓ Richtig! "+expected+" ist die Engine-Empfehlung.";training=null;previewState=null;previewMove=null;drawReviewBoard();return;}
 $("reviewExerciseStatus").textContent="Noch nicht richtig. Suche den stärksten Zug.";training.square=null;drawReviewBoard();
}
function beginTraining(){
 stopReplay();const i=reviewAt-1;
 if(i<0||!results[i]?.best||results[i].best==="(none)"){ $("reviewExerciseStatus").textContent="Wähle zuerst einen ausgewerteten Zug.";return;}
 training={state:positions[i],expected:results[i].best,square:null};previewState=positions[i];previewMove=null;drawReviewBoard();
 $("reviewExerciseStatus").textContent="Trainingsaufgabe: Du bist "+(positions[i].t===1?"Weiß":"Schwarz")+". Finde einen besseren Zug. Tippe zuerst auf eine Figur, dann auf ihr Zielfeld.";
}
function playBestLine(){
 stopReplay();stopLine();const i=reviewAt-1;
 if(i<0||!results[i]?.best||results[i].best==="(none)"){$("reviewExerciseStatus").textContent="Für diesen Zug liegt keine Engine-Empfehlung vor.";return;}
 const sequence=results[i].pv?.length?results[i].pv:[results[i].best];
 let state=positions[i],step=0;training=null;previewState=state;previewMove=null;drawReviewBoard();
 function advance(){
  if(step>=sequence.length){lineTimer=null;$("reviewExerciseStatus").textContent="Stockfish-Variante beendet ("+step+" Halbzüge).";return;}
  const u=sequence[step],m=uciLegal(state,u);
  if(!m){lineTimer=null;$("reviewExerciseStatus").textContent="Variante nach "+step+" Zügen beendet: nicht legaler Engine-Zug.";return;}
  state=apply(state,m);previewState=state;previewMove=m;drawReviewBoard(-1,m);
  // Shared motion already moved the visible sprite before the new image appeared.
  step++;$("reviewExerciseStatus").textContent="Stockfish-Variante: "+step+" / "+sequence.length+" · "+u;
  lineTimer=setTimeout(advance,Math.max(450,Number($("reviewSpeed")?.value||900)));
 }
 advance();
}
function stopReplay(){stopLine();if(playTimer){clearInterval(playTimer);playTimer=null;}const b=$("reviewPlay");if(b)b.textContent="▶ Abspielen";}
function renderReview(){ $("reviewOpening").textContent="Eröffnung: "+openingName();
 items.replaceChildren();let counts={best:0,good:0,inaccurate:0,mistake:0,blunder:0},losses=0;
 for(let i=0;i<movesPlayed.length;i++){
  const before=results[i],after=results[i+1];if(!before||!after||!Number.isFinite(before.cp)||!Number.isFinite(after.cp))continue;
  const turn=positions[i].t;
  const delta=Math.max(0,Math.round((before.cp-after.cp)*turn));losses+=delta;
  const [name,color]=label(delta,false);
  if(delta<45)counts.best++;else if(delta<95)counts.good++;else if(delta<170)counts.inaccurate++;else if(delta<320)counts.mistake++;else counts.blunder++;
  const row=document.createElement("button");row.className="review-move";row.style.borderLeftColor=color;
  const num=Math.floor(i/2)+1+(i%2?"…":".");
  row.innerHTML="<strong>"+num+" "+notation(movesPlayed[i])+"</strong><span style='color:"+color+"'>"+name+"</span><small>−"+(delta/100).toFixed(2)+" Bauerneinheiten</small>";
  const explanation=document.createElement("p");explanation.textContent=describe(i,delta,before.best);explanation.hidden=true;
  row.append(explanation);row.onclick=()=>{explanation.hidden=!explanation.hidden;selectReview(i+1);/* Keep the board fixed: do not scroll the entire analysis panel on move selection. */};
  items.append(row);
 }
 const analyzed=items.children.length;
 const avg=analyzed?losses/analyzed:0;
 const accuracies=[];for(let i=0;i<movesPlayed.length;i++){const score=moveAccuracy(results[i]?.cp,results[i+1]?.cp,positions[i].t);if(score!==null)accuracies.push(score);}const accuracy=accuracyAverage(accuracies);
 summary.textContent="Geschätzte Analysequalität: "+(accuracy===null?"–":accuracy+"/100")+" · Beste Züge: "+counts.best+" · Gut: "+counts.good+" · Ungenauigkeiten: "+counts.inaccurate+" · Fehler: "+counts.mistake+" · Grobe Fehler: "+counts.blunder;
 headline.textContent="Partieanalyse abgeschlossen";
}

function renderOverview(){ $("overviewOpening").textContent="Eröffnung: "+openingName();
 const stats=[{},{}],losses=[[],[]],accuracies=[[],[]],labels=["Bester Zug","Sehr gut","Gut","Ungenauigkeit","Fehler","Grober Fehler"];
 for(let i=0;i<movesPlayed.length;i++){if(!results[i]||!results[i+1]||!Number.isFinite(results[i].cp)||!Number.isFinite(results[i+1].cp))continue;
  const who=i%2,loss=Math.max(0,Math.round((results[i].cp-results[i+1].cp)*positions[i].t));
  const name=label(loss,false)[0];stats[who][name]=(stats[who][name]||0)+1;losses[who].push(loss);const value=moveAccuracy(results[i].cp,results[i+1].cp,positions[i].t);if(value!==null)accuracies[who].push(value);
 }
 const accuracy=accuracies.map(accuracyAverage);
 // Preserve a meaningful accuracy display when one side has no valid evaluations.
 const accuracyElement=$("overviewAccuracy");accuracyElement.setAttribute("aria-label","Geschätzte Zuggenauigkeit, getrennt nach Weiß und Schwarz");
 $("overviewAccuracy").innerHTML=accuracy.map((v,i)=>"<div>"+(i?"Schwarz":"Weiß")+"<strong style='display:block'>"+(v===null?"–":v+"/100")+"</strong></div>").join("");
 const table=$("overviewStats");table.replaceChildren();
 for(const title of ["Zugbewertung","Weiß","Schwarz"]){const heading=document.createElement("strong");heading.textContent=title;heading.className="overview-stat-heading";table.append(heading);}
 const colors={"Bester Zug":"#42bba3","Sehr gut":"#72c8a6","Gut":"#81b9ec","Ungenauigkeit":"#e7c35d","Fehler":"#f2a15e","Grober Fehler":"#f07581"};
 for(const labelName of labels){
  const name=document.createElement("span");name.textContent=labelName;name.className="overview-grade-name";name.style.setProperty("--grade-color",colors[labelName]);table.append(name);
  for(let k=0;k<2;k++){const v=document.createElement("span");v.className="stat-value";v.textContent=String(stats[k][labelName]||0);v.style.color=colors[labelName];v.setAttribute("aria-label",(k?"Schwarz: ":"Weiß: ")+v.textContent+" "+labelName);table.append(v);}
 }
 const chart=$("overviewChart");chart.replaceChildren();
 const values=results.map(r=>Number.isFinite(r?.cp)?Math.max(-1000,Math.min(1000,r.cp)):null),w=600,h=110;
 if(values.length>1&&values.some(Number.isFinite)){const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");
 const poly=document.createElementNS(ns,"polyline");poly.setAttribute("fill","none");poly.setAttribute("stroke","#d7edcb");poly.setAttribute("stroke-width","3");
 const segments=[];let segment=[];for(let i=0;i<values.length;i++){const v=values[i];if(!Number.isFinite(v)){if(segment.length>1)segments.push(segment);segment=[];continue;}segment.push((i/(values.length-1)*w).toFixed(1)+","+(h/2-v/1000*(h/2-8)).toFixed(1));}if(segment.length>1)segments.push(segment);poly.setAttribute("points",segments.length===1?segments[0].join(" "):"");svg.setAttribute("viewBox","0 0 600 110");svg.append(poly);if(segments.length>1){for(const points of segments){const part=document.createElementNS(ns,"polyline");part.setAttribute("fill","none");part.setAttribute("stroke","#d7edcb");part.setAttribute("stroke-width","3");part.setAttribute("points",points.join(" "));svg.append(part);}}
 // Interactive evaluation chart: open the corresponding half-move in the review.
 svg.setAttribute("role","slider");svg.setAttribute("tabindex","0");
 svg.setAttribute("aria-label","Bewertungsverlauf: Zug auswählen");
 svg.setAttribute("aria-valuemin","0");svg.setAttribute("aria-valuemax",String(movesPlayed.length));
 svg.setAttribute("aria-valuenow","0");
 const choose=(n)=>{
  const move=Math.max(0,Math.min(movesPlayed.length,n));
  $("reviewOverview").hidden=true;review.hidden=false;selectReview(move);
  const board=$("reviewBoard");if(board)requestAnimationFrame(()=>board.scrollIntoView({block:"center",behavior:"instant"}));
 };
 svg.addEventListener("click",e=>{const rect=svg.getBoundingClientRect();if(rect.width>0)choose(Math.round((e.clientX-rect.left)/rect.width*movesPlayed.length));});
 svg.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","Home","End","Enter"].includes(e.key))return;e.preventDefault();let v=Number(svg.getAttribute("aria-valuenow"))||0;v=e.key==="Home"?0:e.key==="End"?movesPlayed.length:v+(e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0);v=Math.max(0,Math.min(movesPlayed.length,v));svg.setAttribute("aria-valuenow",String(v));if(e.key==="Enter")choose(v);});
 chart.title="Tippe auf die Kurve, um einen Zug auf dem Brett anzusehen.";chart.append(svg);
 const legend=document.createElement("div");legend.className="overview-chart-legend";legend.textContent="↖ Vorteil Weiß  ·  Mitte ausgeglichen  ·  Vorteil Schwarz ↘";chart.append(legend);}
 const evaluated=accuracies[0].length+accuracies[1].length;
 $("overviewProgress").textContent=evaluated+" von "+movesPlayed.length+" Halbzügen bewertet · Genauigkeit geschätzt (Gewinnwahrscheinlichkeit).";
 const errors=[];
 for(let i=0;i<movesPlayed.length;i++){
  const before=results[i],after=results[i+1];
  if(!Number.isFinite(before?.cp)||!Number.isFinite(after?.cp))continue;
  const loss=Math.max(0,Math.round((before.cp-after.cp)*positions[i].t));
  if(loss>=170)errors.push({i,loss,best:before.best});
 }
 errors.sort((a,b)=>b.loss-a.loss);
 const top=errors.slice(0,3).map(e=>(Math.floor(e.i/2)+1)+(e.i%2?"…":".")+" "+notation(movesPlayed[e.i])+(e.best?" (besser: "+e.best+")":""));
 $("overviewCoach").textContent=top.length
  ?"Deine wichtigsten Trainingsstellen: "+top.join(" · ")+". Tippe auf die Bewertungskurve oder öffne die Analyse, um die Züge zu prüfen."
  :"Die Analyse ist bereit. Keine größeren Fehler in den auswertbaren Zügen gefunden.";
 $("overviewStart").disabled=false;$("overviewStart").textContent="▶ Analyse öffnen";
 if(typeof window.schachnovaRecordReview==="function"){const errors=losses.flat().filter(v=>v>=170).length;window.schachnovaRecordReview({id:analysisKey,white:accuracy[0],black:accuracy[1],errors,opening:openingName()});}
}
function finish(){try{localStorage.setItem("schachnova.review.v3."+analysisKey,JSON.stringify({results,version:3}));}catch(e){console.warn("Analyse-Cache nicht gespeichert",e);}active=false;if(worker){worker.terminate();worker=null;}progress.textContent="Alle "+movesPlayed.length+" Züge analysiert. Tippe auf einen Zug für die Erklärung.";renderReview();drawReviewBoard();renderOverview();}
function next(t){
 const variant=variantMode!=="standard";
 if(t!==token||!active)return;
 if(index>=positions.length){finish();return;}
 score=null;best="";principal=[];engineDepth=0;progress.textContent="Analysiere Stellung "+(index+1)+" von "+positions.length+" …";$("overviewProgress").textContent=progress.textContent;
 worker.postMessage(variant?"position startpos"+(index?" moves "+movesPlayed.slice(0,index).map(notation).join(" "):""):"position fen "+fen(positions[index]));
 worker.postMessage("go depth 10");
}
function start(){
 if(!history||history.length<2){const msg="Noch keine Züge vorhanden.";progress.textContent=msg;$("overviewProgress").textContent=msg;$("overviewStart").disabled=true;return;}
 const variant=variantMode!=="standard";
 if(variant&&!window.SchachNovaVariantStatus?.(variantMode)?.analysisEligible){
  const status=window.SchachNovaVariantStatus?.(variantMode);
  const msg=(status?.label||variantMode)+": "+(status?.reason||"Die Variantenregeln sind noch nicht implementiert.");
  progress.textContent=msg;$("overviewProgress").textContent=msg;
  $("overviewCoach").textContent="Die Variante ist im SchachNova-Katalog dokumentiert, aber eine regelkonforme Partieanalyse ist erst nach vollständiger Integration möglich.";
  $("overviewStart").disabled=true;return;
 }
 if(worker)worker.terminate();token++;const t=token;
 positions=history.slice();results=[];index=0;reviewAt=0;active=true;drawReviewBoard();items.replaceChildren();summary.textContent="";headline.textContent="Stockfish analysiert deine Partie";
 analysisKey=variantMode+"_"+movesPlayed.map(notation).join("_");
 try{const cached=JSON.parse(localStorage.getItem("schachnova.review.v3."+analysisKey)||"null");
 if(cached?.version===3&&Array.isArray(cached.results)&&cached.results.length===positions.length&&cached.results.every(r=>r.cp===null||Number.isFinite(r.cp))){results=cached.results;active=false;progress.textContent="Gespeicherte Analyse geladen.";renderReview();drawReviewBoard();renderOverview();return;}}catch(e){console.warn("Analyse-Cache beschädigt",e);}
 
 try{worker=new Worker(variant?"fairy-stockfish.js":"stockfish-19-lite-single.js");worker.onmessage=e=>{
  if(t!==token||!active)return;const line=String(e.data);
  if(line.startsWith("info string Fairy-Stockfish init error:")||line.startsWith("info string Fairy-Stockfish initialization failed")){
   active=false;const msg="Varianten-Engine konnte nicht geladen werden. Bitte die Fairy-Stockfish-Dateien in der APK prüfen.";
   progress.textContent=msg;$("overviewProgress").textContent=msg;$("overviewStart").disabled=true;
   try{worker.terminate();}catch(e){}worker=null;return;
  }
  if(line==="uciok"){if(variant){for(const cmd of window.schachNovaVariantUciOptions(variantMode))worker.postMessage(cmd);}worker.postMessage("isready");return;}
  if(line==="readyok"){next(t);return;}
  if(line.startsWith("info ")&&line.includes(" score ")){
   const m=line.match(/score (cp|mate) (-?\d+)/);
   if(m){const depth=Number(line.match(/\bdepth (\d+)/)?.[1]||0);if(depth>=engineDepth&&!/\bmultipv [2-9]/.test(line)){engineDepth=depth;principal=(line.match(/\bpv ([a-h][1-8][a-h][1-8][qrbn]?(?:\s+[a-h][1-8][a-h][1-8][qrbn]?)*)/)?.[1]||"").split(/\s+/).filter(Boolean);const v=Number(m[2]);score=(m[1]==="cp"?v:Math.sign(v)*10000)*positions[index].t;}}
  }
  if(line.startsWith("bestmove ")){best=line.split(" ")[1];results.push({cp:score===null?null:score,best,pv:principal.slice(),depth:engineDepth});index++;next(t);}
 };worker.onerror=()=>{if(t!==token)return;active=false;const msg=(variant?"Fairy-Stockfish":"Stockfish")+" konnte nicht gestartet werden. Bitte die Offline-Engine prüfen.";progress.textContent=msg;$("overviewProgress").textContent=msg;$("overviewStart").disabled=true;try{worker.terminate();}catch(e){}worker=null;};worker.postMessage("uci");}
 catch(e){active=false;progress.textContent="Analyse nicht verfügbar: "+e.message;}
}
launch.onclick=()=>{stopReplay();review.hidden=true;$("reviewOverview").hidden=false;$("overviewStart").disabled=false;$("overviewStart").textContent="▶ Analyse öffnen";$("overviewProgress").textContent="Stockfish analysiert deine Partie im Hintergrund …";$("overviewResult").textContent=ended||"Partierückblick";start();};
$("overviewStart").onclick=()=>{
 $("reviewOverview").hidden=true;
 review.hidden=false;
 if(!positions.length)positions=history.slice();
 selectReview(0);
 // Start with the summary at the top, like the compact reference view.
 // Do this once when opening, never on individual moves or during replay.
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  const card=$("reviewSummary");
  if(card&&review&&!review.hidden){
   const top=card.getBoundingClientRect().top-review.getBoundingClientRect().top+review.scrollTop-12;
   review.scrollTop=Math.max(0,top);
  }
 }));
};
$("overviewClose").onclick=()=>{$("reviewOverview").hidden=true;active=false;token++;if(worker){worker.terminate();worker=null;}};
close.onclick=()=>{stopReplay();review.hidden=true;active=false;token++;if(worker){worker.terminate();worker=null;}};
$("reviewAgain").onclick=start;
$("reviewBack").onclick=()=>{stopReplay();review.hidden=true;active=false;token++;if(worker){worker.terminate();worker=null;}};
const arrowsButton=$("reviewToggleArrows");
if(arrowsButton)arrowsButton.onclick=()=>{
 const board=$("reviewBoard"),hidden=board.classList.toggle("hide-review-arrows");
 arrowsButton.setAttribute("aria-pressed",String(!hidden));
 arrowsButton.textContent=hidden?"↗ Pfeile: Aus":"↗ Pfeile: An";
};
const mistakeButton=$("reviewNextMistake");
if(mistakeButton)mistakeButton.onclick=()=>{
 stopReplay();
 const mistakes=[];
 for(let i=0;i<movesPlayed.length;i++){
  const before=results[i],after=results[i+1];
  if(!Number.isFinite(before?.cp)||!Number.isFinite(after?.cp))continue;
  const loss=(before.cp-after.cp)*positions[i].t;
  if(loss>=170)mistakes.push(i+1);
 }
 if(!mistakes.length){$("reviewExerciseStatus").textContent="Keine größeren Fehler in der analysierten Partie gefunden.";return;}
 selectReview(mistakes.find(n=>n>reviewAt)||mistakes[0]);
 $("reviewExerciseStatus").textContent="Fehlerstelle "+reviewAt+" von "+movesPlayed.length+" Halbzügen.";
};
const detailControl=$("coachDetail");
if(detailControl){
 try{const saved=localStorage.getItem("schachnova.review.coachDetail");if(["basic","normal","advanced"].includes(saved))detailControl.value=saved;}catch(e){}
 detailControl.addEventListener("change",()=>{try{localStorage.setItem("schachnova.review.coachDetail",detailControl.value);}catch(e){};drawReviewBoard();});
}
const speedControl=$("reviewSpeed");
if(speedControl){
 try{const saved=localStorage.getItem("schachnova.review.speed");if(["450","900","1500"].includes(saved))speedControl.value=saved;}catch(e){}
 speedControl.addEventListener("change",()=>{try{localStorage.setItem("schachnova.review.speed",speedControl.value);}catch(e){}});
}
$("reviewPrevious").onclick=()=>{stopReplay();selectReview(reviewAt-1)};
$("reviewNext").onclick=()=>{stopReplay();selectReview(reviewAt+1)};
$("reviewPlay").onclick=()=>{if(playTimer){stopReplay();return;}if(reviewAt>=movesPlayed.length)selectReview(0);$("reviewPlay").textContent="⏸ Pause";playTimer=setInterval(()=>{if(reviewAt>=movesPlayed.length){stopReplay();return;}selectReview(reviewAt+1);},Number($("reviewSpeed")?.value||900));};
$("reviewBestLine")?.addEventListener("click",playBestLine);
$("reviewRetry")?.addEventListener("click",beginTraining);
$("reviewTraining")?.addEventListener("click",()=>{const i=results.findIndex((r,j)=>j<movesPlayed.length&&results[j+1]&&Number.isFinite(r.cp)&&Number.isFinite(results[j+1].cp)&&((r.cp-results[j+1].cp)*positions[j].t)>170&&r.best&&r.best!=="(none)");if(i<0){$("reviewExerciseStatus").textContent="Keine geeignete Fehleraufgabe gefunden.";return;}selectReview(i+1);beginTraining();});
$("reviewSpeed")?.addEventListener("change",()=>{if(playTimer){stopReplay();$("reviewPlay").click();}});
$("coachDetail")?.addEventListener("change",()=>drawReviewBoard());
$("coachSpeak")?.addEventListener("click",()=>{if(!("speechSynthesis" in window))return;window.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance($("reviewCoachText").textContent);speech.lang="de-DE";speech.rate=.95;window.speechSynthesis.speak(speech);});
$("overviewChart")?.addEventListener("click",e=>{if(!results.length)return;const rect=e.currentTarget.getBoundingClientRect(),fraction=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));$("overviewStart").click();selectReview(Math.round(fraction*movesPlayed.length));});
})();
