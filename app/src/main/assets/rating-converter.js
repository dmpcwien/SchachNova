/* Offline Lichess to Chess.com estimates (source: theophile-wallez, CC BY 4.0, October 2026). */
(function(){
"use strict";
function convert(data,speed,rating){
 const values=data&&data.speeds&&data.speeds[speed];
 const number=Number(rating);
 if(!Array.isArray(values)||!Number.isFinite(number)||rating===""||number<values[0][0]||number>values[values.length-1][0])return null;
 for(let i=0;i<values.length;i++){
  const row=values[i];
  if(number===row[0])return {rating:Math.round(row[1]),spread:Math.round(row[2])};
  if(i&&number<row[0]){
   const prev=values[i-1],factor=(number-prev[0])/(row[0]-prev[0]);
   return {rating:Math.round(prev[1]+factor*(row[1]-prev[1])),spread:Math.round(prev[2]+factor*(row[2]-prev[2]))};
  }
 }
 return null;
}
if(typeof module!=="undefined"&&module.exports)module.exports={convert};
if(typeof document==="undefined")return;
const open=document.getElementById("ratingConverterOpen"),close=document.getElementById("ratingConverterClose"),panel=document.getElementById("ratingConverterPanel"),speed=document.getElementById("ratingConverterSpeed"),rating=document.getElementById("ratingConverterInput"),out=document.getElementById("ratingConverterResult");
if(!open||!close||!panel||!speed||!rating||!out)return;
let data=null,loading=null;
async function load(){
 if(data)return data;
 if(!loading)loading=fetch("neo-rating-conversion.json").then(r=>{if(!r.ok)throw Error("Daten nicht verfügbar");return r.json()}).then(result=>{data=result;return result}).catch(e=>{loading=null;throw e});
 return loading;
}
async function show(){
 out.textContent="Berechne …";
 try{
  const table=await load();
  if(panel.hidden)return;
  const answer=convert(table,speed.value,rating.value);
  if(!answer){out.textContent="Außerhalb des untersuchten Wertebereichs. Bitte andere Wertung eingeben.";return;}
  out.textContent="Geschätzte Chess.com-Wertung: "+answer.rating+" Punkte (mittlere 50 % der Vergleichsspieler ungefähr ±"+answer.spread+").";
 }catch(_){out.textContent="Die lokale Vergleichstabelle konnte nicht geladen werden.";}
}
open.addEventListener("click",()=>{panel.hidden=false;panel.scrollTop=0;show();});
close.addEventListener("click",()=>{panel.hidden=true;});
speed.addEventListener("change",show);
rating.addEventListener("input",show);
})();