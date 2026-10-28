/* Offline opening repertoire and interactive endgame drills. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const opening=[
 {id:"it",title:"Italienisch · Weiß",side:1,moves:["e2e4","e7e5","g1f3","b8c6","f1c4","g8f6","c2c3"],notes:["Besetze das Zentrum mit e4.","Schwarz antwortet symmetrisch.","Entwickle den Springer und greife e5 an.","Schwarz verteidigt e5.","Der Läufer blickt auf f7.","Schwarz entwickelt eine Figur.","c3 bereitet den Vorstoß d4 vor."]},
 {id:"rg",title:"Spanische Partie · Weiß",side:1,moves:["e2e4","e7e5","g1f3","b8c6","f1b5","a7a6","b5a4"],notes:["Kontrolliere das Zentrum.","Schwarz hält dagegen.","Greife e5 an.","Schwarz deckt e5.","Bb5 übt indirekt Druck auf e5 aus.","Schwarz fragt den Läufer.","Erhalte den Läufer und bleibe flexibel."]},
 {id:"qg",title:"Damengambit · Weiß",side:1,moves:["d2d4","d7d5","c2c4","e7e6","b1c3","g8f6","g1f3"],notes:["Besetze d4.","Schwarz hält das Zentrum.","c4 greift den d5-Bauern an.","Schwarz stabilisiert d5.","Entwickle und erhöhe den Druck auf d5.","Schwarz entwickelt sich.","Entwickle den Königsflügel."]},
 {id:"caro",title:"Caro-Kann · Schwarz",side:-1,moves:["e2e4","c7c6","d2d4","d7d5","b1c3","d5e4","c3e4","c8f5"],notes:["Weiß beansprucht Raum.","c6 bereitet d5 vor.","Weiß verstärkt das Zentrum.","Schwarz greift e4 an.","Weiß verteidigt.","Tausche im Zentrum.","Weiß schlägt zurück.","Entwickle den Läufer vor e6."]},
 {id:"sic",title:"Sizilianisch · Schwarz",side:-1,moves:["e2e4","c7c5","g1f3","d7d6","d2d4","c5d4","f3d4","g8f6"],notes:["Weiß eröffnet.","c5 greift d4 von der Seite an.","Weiß entwickelt.","Sichere e5 und kontrolliere das Zentrum.","Weiß öffnet das Zentrum.","Schwarz tauscht den c-Bauern.","Weiß zentralisiert.","Greife e4 mit dem Springer an."]},
 {id:"qgd",title:"Damengambit abgelehnt · Schwarz",side:-1,moves:["d2d4","d7d5","c2c4","e7e6","b1c3","g8f6","g1f3","f8e7","c1g5","e8g8"],notes:["Weiß eröffnet.","Besetze d5.","Weiß greift d5 an.","e6 stützt d5.","Weiß entwickelt.","Entwickle den Springer.","Weiß entwickelt.","Bereite die Rochade vor.","Weiß fesselt den Springer.","Rochiere früh für Königssicherheit."]}
];
const additionalOpenings=[["Aljechin-Verteidigung","e4",-1,"e2e4 g8f6 e4e5 f6d5 d2d4 d7d6"],["Französische Verteidigung","e4",-1,"e2e4 e7e6 d2d4 d7d5 b1c3 g8f6"],["Königsgambit","e4",1,"e2e4 e7e5 f2f4 e5f4 g1f3"],["Königsindischer Angriff","e4",1,"g1f3 d7d5 g2g3 g8f6 f1g2"],["Pirc-Verteidigung","e4",-1,"e2e4 d7d6 d2d4 g8f6 b1c3 g7g6"],["Skandinavische Verteidigung","e4",-1,"e2e4 d7d5 e4d5 d8d5 b1c3"],["Schottische Partie","e4",1,"e2e4 e7e5 g1f3 b8c6 d2d4 e5d4 f3d4"],["Sizilianisch · Alapin","e4",1,"e2e4 c7c5 c2c3 d7d5 e4d5 d8d5"],["Sizilianisch · Geschlossen","e4",1,"e2e4 c7c5 b1c3 b8c6 g2g3 g7g6"],["Wiener Partie","e4",1,"e2e4 e7e5 b1c3 g8f6 f2f4"],["Benko-Gambit","d4",-1,"d2d4 g8f6 c2c4 c7c5 d4d5 b7b5"],["Benoni-Verteidigung","d4",-1,"d2d4 g8f6 c2c4 c7c5 d4d5 e7e6"],["Bogo-Indisch","d4",-1,"d2d4 g8f6 c2c4 e7e6 g1f3 f8b4"],["Katalanische Eröffnung","d4",1,"d2d4 g8f6 c2c4 e7e6 g2g3 d7d5 f1g2"],["Holländische Verteidigung","d4",-1,"d2d4 f7f5 g2g3 g8f6 f1g2"],["Grünfeld-Verteidigung","d4",-1,"d2d4 g8f6 c2c4 g7g6 b1c3 d7d5"],["Königsindische Verteidigung","d4",-1,"d2d4 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6"],["Londoner System","d4",1,"d2d4 d7d5 c1f4 g8f6 e2e3"],["Nimzo-Indisch","d4",-1,"d2d4 g8f6 c2c4 e7e6 b1c3 f8b4"],["Damenindische Verteidigung","d4",-1,"d2d4 g8f6 c2c4 e7e6 g1f3 b7b6"],["Slawische Verteidigung","d4",-1,"d2d4 d7d5 c2c4 c7c6 b1c3 g8f6"],["Trompowsky-Angriff","d4",1,"d2d4 g8f6 c1g5 d7d5"],["Bird-Eröffnung","other",1,"f2f4 d7d5 g1f3 g8f6"],["Englische Eröffnung","other",1,"c2c4 e7e5 b1c3 g8f6"],["Nimzo-Larsen-Angriff","other",1,"b2b3 e7e5 c1b2 b8c6"],["Réti-Eröffnung","other",1,"g1f3 d7d5 c2c4"]];
for(const [title,group,side,line] of additionalOpenings){opening.push({title,group,side,moves:line.split(' '),description:'Lerne die charakteristische Zugfolge und die wichtigsten Entwicklungszüge.',notes:line.split(' ').map(()=>'Achte auf Entwicklung, Zentrum und Königssicherheit.')});}
for(const o of opening){if(!o.group)o.group=o.moves[0]==='e2e4'?'e4':o.moves[0]==='d2d4'?'d4':'other';if(!o.description)o.description='Übe die Hauptzüge und verstehe den Aufbau.';}
const ends=[
 {title:"Dame mattsetzen",group:"Schachmatt",fen:"7k/8/5K2/8/4Q3/8/8/8 w - - 0 1",goal:"Setze Schwarz matt. Vermeide Patt.",kind:"mate"},
 {title:"Turm mattsetzen",group:"Schachmatt",fen:"7k/8/5K2/8/4R3/8/8/8 w - - 0 1",goal:"Dränge den König mit dem Turm an den Rand und setze matt.",kind:"mate"},
 {title:"Zwei Türme mattsetzen",group:"Schachmatt",fen:"7k/8/5K2/8/4R3/8/3R4/8 w - - 0 1",goal:"Nutze beide Türme zum Treppenmatt.",kind:"mate"},
 {title:"Bauer umwandeln",group:"Bauernendspiele",fen:"7k/8/4K3/4P3/8/8/8/8 w - - 0 1",goal:"Bringe den Freibauern sicher zur Umwandlung.",kind:"promotion"},
 {title:"König und Bauer · Opposition",group:"Bauernendspiele",fen:"8/8/4k3/8/4K3/4P3/8/8 w - - 0 1",goal:"Übe Opposition und verhindere, dass der Bauer verloren geht.",kind:"promotion"},
 {title:"Turm und Freibauer",group:"Turmendspiele",fen:"6k1/8/8/4P3/8/8/5R2/6K1 w - - 0 1",goal:"Unterstütze den Freibauern mit König und Turm.",kind:"promotion"},
 {title:"Dame gegen Turm",group:"Materialungleichgewicht",fen:"7k/8/5K2/8/4Q3/8/8/7r w - - 0 1",goal:"Finde einen Weg, die gegnerische Verteidigung zu überwinden.",kind:"mate"}
];
let active=null,state=null,selected=-1,ply=0,errors=0,worker=null,busy=false;
let previousVariantMode=null,trainingFinished=false;
function sq(n){return (8-Number(n[1]))*16+"abcdefgh".indexOf(n[0]);}
function fenState(f){const [board,turn,castling,ep,half,full]=f.split(" ");const b=Array(128).fill(".");board.split("/").forEach((row,r)=>{let c=0;for(const ch of row){if(/[1-8]/.test(ch))c+=Number(ch);else b[r*16+c++]=ch;}});return {b,t:turn==="w"?1:-1,c:(castling.includes("K")?1:0)|(castling.includes("Q")?2:0)|(castling.includes("k")?4:0)|(castling.includes("q")?8:0),ep:ep==="-"?-1:sq(ep),half:Number(half),full:Number(full)};}
function posFen(s){let rows=[];for(let r=0;r<8;r++){let row="",n=0;for(let c=0;c<8;c++){const p=s.b[r*16+c];if(p===".")n++;else{if(n)row+=n;n=0;row+=p;}}if(n)row+=n;rows.push(row);}return rows.join("/")+" "+(s.t===1?"w":"b")+" - - "+s.half+" "+s.full;}
function label(t){$("trainingMessage").textContent=t;}
function stopWorker(){if(worker){worker.terminate();worker=null;}busy=false;}
function showMenu(group){
 trainingFinished=false;stopWorker();active=null;$("trainingBoardArea").hidden=true;$("trainingList").hidden=false;
 const names={home:"🎯 Schachtraining",openings:"📚 Eröffnungen",e4:"1. e4 · Eröffnungen",d4:"1. d4 · Eröffnungen",other:"Andere Eröffnungen",endgames:"♟ Endspiele"};
 $("trainingTitle").textContent=names[group]||"Schachtraining";
 const root=$("trainingList");root.replaceChildren();
 const choices=group==="home"?[{title:"📚 Eröffnungen · Weiß und Schwarz",group:"openings"},{title:"♟ Endspiele",group:"endgames"}]:group==="openings"?[{title:"1. e4 · Eröffnungen",group:"e4"},{title:"1. d4 · Eröffnungen",group:"d4"},{title:"Andere Eröffnungen",group:"other"}]:group==="endgames"?ends:opening.filter(o=>o.group===group);
 for(const item of choices){
  const b=document.createElement("button");b.className="training-card";
  if(item.group&&["openings","endgames","e4","d4","other"].includes(item.group)&&!item.moves){b.textContent=item.title;b.onclick=()=>showMenu(item.group);}
  else {
   b.classList.add("training-opening-card");
   const icon=document.createElement("span");icon.className="training-thumb";icon.textContent="♟";
   const info=document.createElement("span");info.className="training-card-copy";
   const title=document.createElement("strong");title.textContent=item.title;
   const description=document.createElement("small");description.textContent=item.description||item.goal||"Interaktive Übung auf dem Schachbrett.";
   info.append(title,description);b.append(icon,info);
   b.onclick=()=>start(item,group!=="endgames");
  }
  root.append(b);
 }
 $("trainingBack").onclick=()=>group==="home"?exit():showMenu(["e4","d4","other"].includes(group)?"openings":"home");
}
function exit(){trainingFinished=false;stopWorker();$("trainingScreen").hidden=true;$("homeScreen").hidden=false;active=null;if(previousVariantMode!==null){variantMode=previousVariantMode;previousVariantMode=null;}}
let hintStep=0,hintFrom=-1,hintTo=-1;
function resetHint(){hintStep=0;hintFrom=-1;hintTo=-1;}
function renderTraining(){
 const board=$("trainingBoard");board.replaceChildren();const flipped=active.opening&&active.data.side===-1;
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){
  const i=flipped?(7-r)*16+(7-c):r*16+c,p=state.b[i],btn=document.createElement("button");
  btn.className="sq "+((r+c)%2?"dark":"light")+(selected===i?" selected":"")+(selected>=0&&legal(state).some(m=>m[0]===selected&&m[1]===i)?" target":"")+(hintFrom===i?" hint-origin":"")+(hintTo===i?" hint-destination":"");
  if(p!==".")btn.innerHTML='<img class="piece-img" draggable="false" alt="" src="pieces/'+(side(p)===1?"w":"b")+p.toUpperCase()+'.svg">';
  btn.onclick=()=>click(i);board.append(btn);
 }
 if(hintStep===2&&hintFrom>=0&&hintTo>=0){
  const flipped=active.opening&&active.data.side===-1;
  const xy=i=>({x:(flipped?7-(i&7):(i&7))*12.5+6.25,y:(flipped?7-(i>>4):(i>>4))*12.5+6.25});
  const from=xy(hintFrom),to=xy(hintTo);
  const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");
  svg.setAttribute("viewBox","0 0 100 100");svg.setAttribute("aria-hidden","true");svg.classList.add("training-hint-arrow");
  const defs=document.createElementNS(ns,"defs"),marker=document.createElementNS(ns,"marker");
  marker.setAttribute("id","trainingArrowHead");marker.setAttribute("markerWidth","4");marker.setAttribute("markerHeight","4");marker.setAttribute("refX","2.8");marker.setAttribute("refY","2");marker.setAttribute("orient","auto");
  const head=document.createElementNS(ns,"path");head.setAttribute("d","M0,0 L4,2 L0,4 Z");head.setAttribute("fill","#a6df59");marker.append(head);defs.append(marker);svg.append(defs);
  const line=document.createElementNS(ns,"line");line.setAttribute("x1",from.x);line.setAttribute("y1",from.y);line.setAttribute("x2",to.x);line.setAttribute("y2",to.y);
  line.setAttribute("stroke","#a6df59");line.setAttribute("stroke-width","2.6");line.setAttribute("stroke-linecap","round");line.setAttribute("marker-end","url(#trainingArrowHead)");svg.append(line);board.append(svg);
 }
}
let activeTrainingAnimation=null;
function animateTrainingMove(m,piece){
 const board=$("trainingBoard");if(!board||!m||!piece)return Promise.resolve();
 const flipped=active.opening&&active.data.side===-1;
 const cell=i=>board.children[(flipped?7-(i>>4):(i>>4))*8+(flipped?7-(i&7):(i&7))];
 const from=cell(m[0]),to=cell(m[1]);
 const target=to?.querySelector(".piece-img");
 if(!from||!to||!target||!target.animate)return Promise.resolve();
 if(activeTrainingAnimation){activeTrainingAnimation.finish();activeTrainingAnimation=null;}
 const br=board.getBoundingClientRect(),fr=from.getBoundingClientRect(),tr=to.getBoundingClientRect();
 const overlay=document.createElement("div");
 overlay.className="piece-motion-overlay";
 overlay.style.cssText="position:absolute;inset:0;pointer-events:none;z-index:50;overflow:visible;";
 const sprite=document.createElement("div");
 sprite.style.cssText="position:absolute;display:flex;align-items:center;justify-content:center;pointer-events:none;will-change:transform;";
 sprite.style.left=(fr.left-br.left)+"px";sprite.style.top=(fr.top-br.top)+"px";
 sprite.style.width=fr.width+"px";sprite.style.height=fr.height+"px";
 const image=target.cloneNode(true);
 image.style.cssText="display:block!important;width:96%!important;height:96%!important;max-width:96%!important;max-height:96%!important;object-fit:contain!important;";
 sprite.append(image);overlay.append(sprite);
 board.style.position="relative";board.append(overlay);target.style.visibility="hidden";
 const dx=tr.left-fr.left,dy=tr.top-fr.top;
 const duration=Math.min(430,Math.max(190,165+Math.hypot((m[1]&7)-(m[0]&7),(m[1]>>4)-(m[0]>>4))*32));
 return new Promise(resolve=>{
  let done=false,animation;
  const cleanup=()=>{if(done)return;done=true;overlay.remove();target.style.visibility="";if(activeTrainingAnimation===animation)activeTrainingAnimation=null;resolve();};
  animation=sprite.animate([{transform:"translate3d(0,0,0)"},{transform:"translate3d("+dx+"px,"+dy+"px,0)"}],{duration,easing:"cubic-bezier(.32,.05,.24,1)",fill:"forwards"});
  activeTrainingAnimation=animation;animation.onfinish=cleanup;animation.oncancel=cleanup;
 });
}
function applyTrainingMove(m){const piece=state.b[m[0]];state=apply(state,m);renderTraining();return animateTrainingMove(m,piece);}
function endgameResult(){
 if(!active||active.opening)return "";
 const moves=legal(state);
 if(!moves.length)return checked(state)?(state.t===-1?"Übung geschafft: Schwarz ist schachmatt.":"Übung verloren: Weiß ist schachmatt."):"Übung beendet: Patt – kein Sieg möglich.";
 if(insufficient(state))return "Übung beendet: Remis wegen unzureichenden Materials – das Trainingsziel ist nicht mehr erreichbar.";
 if(state.half>=150)return "Übung beendet: Remis nach der 75-Züge-Regel.";
 if(active?.data.kind==="promotion"&&!state.b.includes("P")&&!state.b.includes("Q"))return "Übung verloren: Der Freibauer ist nicht mehr vorhanden.";
 if(active?.data.kind==="promotion"&&state.b.includes("Q"))return "Geschafft: Der Bauer wurde umgewandelt!";
 return "";
}
function finishTraining(message){trainingFinished=true;selected=-1;resetHint();stopWorker();label(message);renderTraining();}
function animateHint(){
 const board=$("trainingBoard");if(!board||hintFrom<0)return;
 const flipped=active.opening&&active.data.side===-1;
 for(const index of [hintFrom,hintTo]){
  if(index<0)continue;
  const cell=board.children[(flipped?7-(index>>4):(index>>4))*8+(flipped?7-(index&7):(index&7))];
  if(cell&&cell.animate)cell.animate([{filter:"brightness(1)"},{filter:"brightness(1.55)"},{filter:"brightness(1)"}],{duration:650,iterations:2});
 }
}
function requestEndgameHint(){
 if(!active||active.opening||busy||trainingFinished||state.t!==1)return;
 const result=endgameResult();if(result){finishTraining(result);return;}
 const snapshot=state;busy=true;label("Stockfish analysiert die Endspielstellung …");
 try{
  stopWorker();busy=true;
  worker=new Worker("stockfish-19-lite-single.js");const w=worker;
  w.onmessage=e=>{
   if(w!==worker)return;
   const line=String(e.data).trim();
   if(line==="uciok"){w.postMessage("isready");return;}
   if(line==="readyok"){w.postMessage("position fen "+posFen(snapshot));w.postMessage("go depth 12");return;}
   if(line.startsWith("bestmove ")){
    const moveText=line.split(/\s+/)[1],m=legal(snapshot).find(x=>uci(x)===moveText);
    stopWorker();if(!active||active.opening||trainingFinished||state!==snapshot)return;
    if(!m){label("Kein gültiger Hinweis verfügbar.");return;}
    hintStep=Math.min(2,hintStep+1);hintFrom=m[0];hintTo=hintStep===2?m[1]:-1;
    label(hintStep===1?"Hinweis 1/2: Die empfohlene Figur ist markiert.":"Hinweis 2/2: Der empfohlene Zug ist mit einem Pfeil markiert.");renderTraining();animateHint();
   }
  };
  w.onerror=()=>{stopWorker();label("Stockfish-Hinweis derzeit nicht verfügbar.");};
  w.postMessage("uci");
 }catch(_){stopWorker();label("Stockfish-Hinweis derzeit nicht verfügbar.");}
}
function start(data,isOpening){
 stopWorker();if(previousVariantMode===null)previousVariantMode=variantMode;variantMode="standard";active={data,opening:isOpening};trainingFinished=false;ply=0;errors=0;selected=-1;resetHint();state=isOpening?initial():fenState(data.fen);
 $("trainingTitle").textContent=data.title;$("trainingList").hidden=true;$("trainingBoardArea").hidden=false;
 $("trainingBack").onclick=()=>showMenu(isOpening?data.group:"endgames");
 $("trainingReset").onclick=()=>start(data,isOpening);
 $("trainingHint").onclick=()=>{if(!active)return;let moveText=null;if(isOpening){moveText=data.moves[ply];}else{requestEndgameHint();return;}if(!moveText){label("Keine weiteren Züge verfügbar.");return;}const square=v=>(8-Number(v[1]))*16+"abcdefgh".indexOf(v[0]);hintStep=Math.min(2,hintStep+1);hintFrom=square(moveText.slice(0,2));hintTo=hintStep===2?square(moveText.slice(2,4)):-1;label(hintStep===1?"Hinweis 1/2: Die richtige Figur ist markiert.":"Hinweis 2/2: Das Zielfeld ist zusätzlich markiert.");renderTraining();animateHint();};
 label(isOpening?"Übe die Eröffnung mit "+(data.side===1?"Weiß":"Schwarz")+". Ziehe die richtige Figur.":"Ziel: "+data.goal);
 renderTraining();if(isOpening)autoOpening();else{const outcome=endgameResult();if(outcome)finishTraining(outcome);}
}
async function autoOpening(){
 if(!active||!active.opening)return;
 const data=active.data;
 while(ply<data.moves.length&&state.t!==data.side){
  const moveText=data.moves[ply],m=legal(state).find(m=>uci(m)===moveText);
  if(!m){label("Trainingslinie enthält einen ungültigen Zug: "+moveText);return;}
  resetHint();await applyTrainingMove(m);ply++;
 }
 renderTraining();
 if(ply>=data.moves.length)finishTraining("Sehr gut! Eröffnung abgeschlossen. Fehler: "+errors+". Du kannst die Übung wiederholen.");
}
function uci(m){return "abcdefgh"[m[0]&7]+(8-(m[0]>>4))+"abcdefgh"[m[1]&7]+(8-(m[1]>>4))+(m[2]||"");}
function click(i){
 if(!active||busy||trainingFinished)return;
 if(side(state.b[i])===state.t){selected=selected===i?-1:i;renderTraining();return;}
 const m=legal(state).find(m=>m[0]===selected&&m[1]===i&&(m[2]===""||m[2]==="q"));selected=-1;
 if(!m){renderTraining();return;}
 if(active.opening){
  const expected=active.data.moves[ply];
  if(uci(m)!==expected){errors++;label("Nicht die gesuchte Fortsetzung. Überlege, wie du das Zentrum kontrollierst und deine Figuren entwickelst. Tipp zeigt den erwarteten Zug.");renderTraining();return;}
  resetHint();busy=true;applyTrainingMove(m).then(()=>{if(!active||trainingFinished)return;ply++;label("Richtig! "+active.data.notes[ply-1]);return autoOpening();}).finally(()=>{busy=false;});return;
 }
 resetHint();busy=true;applyTrainingMove(m).then(()=>{if(!active||trainingFinished)return;const outcome=endgameResult();if(outcome){finishTraining(outcome);return;}engineReply();}).catch(e=>{console.error("Endspielanimation:",e);label("Der Zug konnte nicht vollständig dargestellt werden.");}).finally(()=>{if(!worker)busy=false;});
}
function engineReply(){
 if(!active||active.opening||trainingFinished||state.t!==-1)return;
 stopWorker();busy=true;const snapshot=state;const exercise=active;label("Stockfish sucht die Verteidigung …");
 try{
  worker=new Worker("stockfish-19-lite-single.js");const w=worker;
  w.onmessage=e=>{
   if(w!==worker||active!==exercise||state!==snapshot||trainingFinished)return;const line=String(e.data).trim();
   if(line==="uciok"){w.postMessage("isready");return;}
   if(line==="readyok"){w.postMessage("position fen "+posFen(state));w.postMessage("go depth 8");return;}
   if(line.startsWith("bestmove ")){const moveText=line.split(/\s+/)[1],m=legal(state).find(m=>uci(m)===moveText);stopWorker();if(m){busy=true;applyTrainingMove(m).then(()=>{if(!active||trainingFinished)return;const outcome=endgameResult();if(outcome)finishTraining(outcome);else label("Schwarz hat "+moveText+" gespielt. "+active.data.goal);}).catch(e=>{console.error("Engine-Zuganimation:",e);label("Der Computerzug konnte nicht dargestellt werden.");}).finally(()=>{busy=false;});}else {const outcome=endgameResult();if(outcome)finishTraining(outcome);else label("Kein gültiger Gegenzug gefunden.");}}
  };
  w.onerror=()=>{stopWorker();label("Offline-Engine nicht verfügbar. Die Übung kann zurückgesetzt werden.");};
  w.postMessage("uci");
 }catch(e){stopWorker();label("Stockfish konnte nicht geladen werden.");}
}
$("trainingExit").onclick=exit;
window.openSchachTraining=()=>{$("homeScreen").hidden=true;$("gameScreen").hidden=true;$("trainingScreen").hidden=false;showMenu("home");};
})();
