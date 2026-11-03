/* Optional offline sound pack from Lichess Neo Warm Wood (CC0 1.0). */
(function(){
"use strict";
const source=document.getElementById("novaSoundSkin");
if(!source)return;
const key="schachnova_sound_skin",base="neo-assets/warmwood/sounds/";
const names=new Set(["move-self","move-opponent","move-check","capture","castle","promote","premove","illegal","notify","tenseconds","game-start","game-end"]);
const cache=new Map();
function update(){
 const selected=source.value==="warmwood"?"warmwood":"off";
 document.body.dataset.soundSkin=selected;
 try{localStorage.setItem(key,selected);}catch(_){}
}
try{source.value=localStorage.getItem(key)==="warmwood"?"warmwood":"off";}catch(_){source.value="off";}
update();
source.addEventListener("change",()=>{update();if(source.value==="warmwood")play("notify");});
function play(name){
 if(source.value!=="warmwood"||!names.has(name))return;
 try{
  let audio=cache.get(name);
  if(!audio){audio=new Audio(base+name+".wav");audio.preload="auto";audio.volume=.65;cache.set(name,audio);}
  audio.pause();audio.currentTime=0;
  const result=audio.play();if(result&&typeof result.catch==="function")result.catch(()=>{});
 }catch(_){}
}
window.SchachNovaSounds={
 play,
 playMove({capture=false,check=false,mate=false,castle=false,promote=false}={}){
  play(promote?"promote":castle?"castle":capture?"capture":check?"move-check":"move-self");
  if(mate)setTimeout(()=>play("game-end"),210);
 }
};
})();