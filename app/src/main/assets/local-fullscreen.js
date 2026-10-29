(function(){
"use strict";
const game=document.getElementById("gameScreen"),button=document.getElementById("localFullscreenToggle");
if(!game||!button)return;
const rotationButton=document.getElementById("localPieceRotationToggle");
let rotationEnabled=true;
try{rotationEnabled=localStorage.getItem("schachnova.localPieceRotation")!=="off";}catch(_){}
window.SchachNovaLocalPieceRotationEnabled=rotationEnabled;
function syncRotation(){
 if(!rotationButton)return;
 rotationButton.hidden=!local();
 rotationButton.textContent=rotationEnabled?"↻ 180° AN":"↻ 180° AUS";
 rotationButton.setAttribute("aria-pressed",String(rotationEnabled));
 rotationButton.setAttribute("aria-label",rotationEnabled?"Figurendrehung ausschalten":"Figurendrehung einschalten");
 rotationButton.title="Automatische Figurendrehung nach jedem Zug "+(rotationEnabled?"ausschalten":"einschalten");
 game.classList.toggle("local-black-to-move",local()&&rotationEnabled&&game.classList.contains("local-face-to-face")&&game.dataset.localSideToMove==="black");
}
rotationButton?.addEventListener("click",()=>{
 rotationEnabled=!rotationEnabled;
 window.SchachNovaLocalPieceRotationEnabled=rotationEnabled;
 try{localStorage.setItem("schachnova.localPieceRotation",rotationEnabled?"on":"off");}catch(_){}
 game.classList.toggle("local-black-to-move",rotationEnabled&&game.classList.contains("local-black-to-move"));
 window.SchachNovaLocalPieceRotationRefresh?.();
 syncRotation();
});
function local(){return !game.hidden&&document.getElementById("botMode")?.value==="human";}
function sync(){
 const allowed=local();
 button.hidden=!allowed;
 syncRotation();
 if(!allowed)game.classList.remove("local-board-fullscreen");
 const on=allowed&&game.classList.contains("local-board-fullscreen");
 button.textContent=on?"⤢ Schließen":"⛶ Vollbild";
 button.setAttribute("aria-pressed",String(on));
 button.setAttribute("aria-label",on?"Vollbild schließen":"Schachbrett im Vollbild anzeigen");
}
button.addEventListener("click",()=>{
 if(!local())return;
 game.classList.toggle("local-board-fullscreen");
 sync();
 window.dispatchEvent(new Event("resize"));
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&game.classList.contains("local-board-fullscreen")){game.classList.remove("local-board-fullscreen");sync();}});
const observer=new MutationObserver(sync);
observer.observe(game,{attributes:true,attributeFilter:["hidden"]});
const mode=document.getElementById("botMode");
if(mode){mode.addEventListener("change",sync);new MutationObserver(sync).observe(mode,{attributes:true,attributeFilter:["value"]});}
document.getElementById("backHome")?.addEventListener("click",()=>{game.classList.remove("local-board-fullscreen");sync();});
sync();
window.SchachNovaLocalFullscreen={close(){game.classList.remove("local-board-fullscreen");sync();},sync};
})();