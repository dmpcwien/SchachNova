(function(){
"use strict";
const game=document.getElementById("gameScreen"),button=document.getElementById("localFullscreenToggle");
if(!game||!button)return;
function local(){return !game.hidden&&document.getElementById("botMode")?.value==="human";}
function sync(){
 const allowed=local();
 button.hidden=!allowed;
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