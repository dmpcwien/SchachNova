/* SchachNova: German live coach with independent Stockfish worker. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const panel=$("liveCoachPanel"),message=$("liveCoachMessage"),toggle=$("coachButton");
let enabled=false,worker=null,task=null,phase=0,cp=null,best=null,serial=0,timeoutId=null;
const coord=i=>"abcdefgh"[i&7]+(8-(i>>4));
const uci=m=>coord(m[0])+coord(m[1])+(m[2]||"");
function fen(s){
 let rows=[];for(let r=0;r<8;r++){let row="",n=0;for(let c=0;c<8;c++){const p=s.b[r*16+c];if(p===".")n++;else{if(n)row+=n;n=0;row+=p;}}if(n)row+=n;rows.push(row);}
 return rows.join("/")+" "+(s.t===1?"w":"b")+" "+((s.c&1?"K":"")+(s.c&2?"Q":"")+(s.c&4?"k":"")+(s.c&8?"q":"")||"-")+" "+(s.ep>=0?coord(s.ep):"-")+" "+s.half+" "+s.full;
}
function say(t){message.textContent=t;}
function shutdown(){serial++;task=null;if(timeoutId)clearTimeout(timeoutId);timeoutId=null;if(worker){worker.terminate();worker=null;}}
function evaluate(){
 if(!enabled||!task||!worker)return;
 cp=null;best=null;
 worker.postMessage("position fen "+fen(task.states[phase]));
 worker.postMessage("go depth 10");
}
function explain(){
 const a=task.before,b=task.after,move=task.move,loss=Math.max(0,Math.round((a.cp-b.cp)*task.color));
 let quality,detail;
 if(loss<20){quality="Ausgezeichneter Zug!";detail="Du hältst deine Stellung stabil und gibst kaum Bewertung ab.";}
 else if(loss<55){quality="Guter Zug.";detail="Deine Idee ist spielbar. Es gibt aber eine etwas präzisere Fortsetzung.";}
 else if(loss<110){quality="Leichte Ungenauigkeit.";detail="Dieser Zug lässt dem Gegner mehr Möglichkeiten. Prüfe vor dem Zug Schachs, Schlagzüge und direkte Drohungen.";}
 else if(loss<220){quality="Das war ein Fehler.";detail="Die Stellung verschlechtert sich deutlich. Prüfe ungedeckte Figuren, taktische Motive und gegnerische Drohungen.";}
 else{quality="Achtung, grober Fehler!";detail="Der Zug kostet viel Stellungswert. Suche nach Mattdrohungen, Fesselungen, Gabeln und Figurenverlust.";}
 const suggested=a.best&&a.best!=="(none)"&&a.best!==move?" Stockfish empfiehlt stattdessen "+a.best+".":"";
 say(quality+" "+detail+suggested+" Bewertungsverlust: ungefähr "+(loss/100).toFixed(2)+" Bauerneinheiten.");
}
function startTask(){
 if(!enabled||!task)return;
 if(worker)worker.terminate();
 const id=++serial;phase=0;task.before=null;task.after=null;
 try{worker=new Worker("stockfish-19-lite-single.js");
  worker.onmessage=e=>{
   if(id!==serial||!enabled||!task)return;
   const line=String(e.data);
   if(line==="uciok"){worker.postMessage("isready");return;}
   if(line==="readyok"){evaluate();return;}
   if(line.startsWith("info ")&&line.includes(" score ")){
    const m=line.match(/score (cp|mate) (-?\d+)/);
    if(m){const n=Number(m[2]);cp=(m[1]==="cp"?n:Math.sign(n)*10000)*task.states[phase].t;}
   }
   if(line.startsWith("bestmove ")){
    const entry={cp:cp===null?0:cp,best:line.split(" ")[1]};
    if(phase===0){task.before=entry;phase=1;evaluate();}
    else{task.after=entry;explain();worker.terminate();worker=null;task=null;if(timeoutId)clearTimeout(timeoutId);timeoutId=null;}
   }
  };
  worker.onerror=()=>{say("Die Offline-Engine konnte nicht gestartet werden.");shutdown();};
  worker.postMessage("uci");
  timeoutId=setTimeout(()=>{if(id===serial&&task){say("Die Analyse dauert zu lange. Bitte versuche den nächsten Zug.");shutdown();}},18000);
 }catch(e){say("Coach nicht verfügbar: "+e.message);shutdown();}
}
function enable(value){
 enabled=value;toggle.textContent=enabled?"🟢 Coach an":"💡 Coach";
 panel.hidden=!enabled;
 if(!enabled){shutdown();return;}
 if(variantMode!=="standard"){say("Der Live-Coach unterstützt derzeit klassisches Schach.");return;}
 say("Coach aktiv. Prüfe vor jedem Zug Schachgebote, ungedeckte Figuren und Drohungen. Nach deinem Zug analysiere ich die Stellung.");
}
toggle.onclick=()=>enable(!enabled);
window.SchachNovaLiveCoach={enable,isEnabled:()=>enabled};
const baseMove=move;
move=function(m){
 const before=current(),previous=movesPlayed.length;
 baseMove(m);
 if(!enabled||variantMode!=="standard"||movesPlayed.length!==previous+1)return;
 shutdown();
 task={states:[before,current()],move:uci(m),color:before.t,before:null,after:null};
 say("Zug "+uci(m)+" – Stockfish prüft deine Entscheidung …");
 startTask();
};
const baseNew=$("newGame").onclick;
$("newGame").onclick=()=>{shutdown();baseNew();if(enabled)say("Neue Partie. Ich analysiere wieder jeden Zug.");};
$("backHome").addEventListener("click",()=>{shutdown();});
})();
