/* SchachNova: compact shortcuts and read-only last-game access. */
(function(){
"use strict";
const $=id=>document.getElementById(id),key="schachnova-game-v2";
function savedMatch(){
 try{const value=localStorage.getItem(key);if(!value)return null;const d=JSON.parse(value);
  if(!Array.isArray(d.movesPlayed)||!d.movesPlayed.length||!Array.isArray(d.history)||d.history.length<2)return null;
  return d.history.every(s=>Array.isArray(s.b)&&s.b.length===128)?d:null;
 }catch(_){return null;}
}
function refreshHome(){
 const progress=$("novaHeroProgress"),last=$("novaResumeGame"),practice=window.SchachNovaPractice;
 if(progress&&practice)progress.textContent="Heute: "+practice.dayCount()+" / "+practice.goal()+" Lernzüge";
 if(last)last.hidden=!savedMatch();
}
$("novaQuickBot")?.addEventListener("click",()=>document.querySelector('#novaPlaySection [data-mode="bot"]')?.click());
$("novaQuickTraining")?.addEventListener("click",()=>{
 if(typeof window.openSchachTraining==="function")window.openSchachTraining();
 else document.querySelector('.nova-nav[data-section="training"]')?.click();
});
$("novaResumeGame")?.addEventListener("click",()=>{
 if(!savedMatch()||typeof render!=="function"||typeof movesPlayed==="undefined"||!movesPlayed.length){refreshHome();return;}
 const home=$("homeScreen"),game=$("gameScreen");if(!home||!game)return;
 home.hidden=true;game.hidden=false;render();window.scrollTo({top:0,behavior:"instant"});
});
for(const id of ["backHome","trainingExit","novaBackHome"])$(id)?.addEventListener("click",refreshHome);
window.addEventListener("pageshow",refreshHome);
window.addEventListener("schachnova:finished",()=>setTimeout(refreshHome,0));
refreshHome();
})();