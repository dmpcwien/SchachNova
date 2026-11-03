/* SchachNova: searchable local finished-game archive with portable exports. */
(function(){
"use strict";
const key="schachnova.completed.v1",$=id=>document.getElementById(id);
let pending=null;
function read(){try{const v=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(v)?v:[]}catch(_){return []}}
function save(v){try{localStorage.setItem(key,JSON.stringify(v.slice(0,300)))}catch(e){console.warn("Archiv voll",e)}}
function normalize(s){return String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("de").trim();}
function searchable(g){
 const date=new Date(g.timestamp);
 return [Number.isNaN(date.getTime())?"":date.toLocaleString("de-AT"),g.variant==="standard"?"Klassisch":g.variant,g.message,g.moves?.length+" Halbzüge"].join(" ");
}
function find(games,query){const q=normalize(query);return q?games.filter(g=>normalize(searchable(g)).includes(q)):games;}
function exportArchiveGame(g){
 try{let file;const old=variantMode;try{if((g.variant||"standard")==="standard")variantMode="standard";file=window.SchachNovaNotation.generate(g,{legal,checked});}finally{variantMode=old;}window.SchachNovaNotation.download(file);}
 catch(e){alert("Export nicht möglich: "+e.message);}
}
function showArchive(){
 const panel=$("archivePanel"),list=$("archiveList");if(!panel||!list)return;
 list.replaceChildren();const all=read(),games=find(all,$("archiveSearch")?.value||"");
 if(!games.length){list.textContent=all.length?"Keine Partien für diese Suche gefunden.":"Noch keine abgeschlossenen Partien gespeichert.";panel.hidden=false;return;}
 games.forEach(g=>{
  const row=document.createElement("button");row.type="button";row.className="archive-entry";
  row.textContent=searchable(g);
  row.onclick=()=>{try{
   if(!Array.isArray(g.positions)||!g.positions.length)throw Error("Zugdaten fehlen");
   history=g.positions;movesPlayed=g.moves;viewIndex=history.length-1;variantMode=g.variant||"standard";running=false;ended=g.message;
   $("archivePanel").hidden=true;$("homeScreen").hidden=true;$("gameScreen").hidden=false;
   render();$("openReview").click();
  }catch(e){alert("Partie kann nicht geöffnet werden: "+e.message)}};
  const wrap=document.createElement("div");wrap.style.cssText="display:flex;gap:8px;align-items:center";row.style.flex="1";
  const exportButton=document.createElement("button");exportButton.type="button";exportButton.textContent="↓ PGN";exportButton.title="Partie exportieren";exportButton.setAttribute("aria-label","Partie exportieren");exportButton.style.cssText="padding:12px;border-radius:10px";
  if(g.variant&&g.variant!=="standard")exportButton.textContent="↓ TXT";
  exportButton.onclick=()=>exportArchiveGame(g);
  const remove=document.createElement("button");remove.type="button";remove.textContent="🗑";remove.title="Partie löschen";remove.setAttribute("aria-label","Partie löschen");remove.style.cssText="padding:12px;border-radius:10px;color:#fca5a5;background:#3b2424";
  remove.onclick=()=>{if(!confirm("Diese gespeicherte Partie wirklich löschen?"))return;save(read().filter(x=>x.id!==g.id));showArchive();};
  wrap.append(row,exportButton,remove);list.append(wrap);
 });
 panel.hidden=false;
}
window.addEventListener("schachnova:finished",e=>{
 const g=e.detail;if(!g||!g.moves?.length)return;
 const games=read(),id=JSON.stringify(g.moves)+"|"+g.timestamp;
 if(!games.some(x=>x.id===id)){games.unshift({...g,id});save(games);}
 clearTimeout(pending);
 pending=setTimeout(()=>{if(!$("gameScreen").hidden&&$("resultDialog").hidden){$("resultMessage").textContent=g.message;$("resultDialog").hidden=false;}},4000);
});
document.addEventListener("DOMContentLoaded",()=>{
 const btn=$("archiveOpen"),back=$("archiveClose");
 if(btn)btn.onclick=showArchive;
 if(back)back.onclick=()=>{$("archivePanel").hidden=true;};
 $("archiveSearch")?.addEventListener("input",showArchive);
 $("newGame")?.addEventListener("click",()=>clearTimeout(pending));
 $("backHome")?.addEventListener("click",()=>clearTimeout(pending));
});
})();
