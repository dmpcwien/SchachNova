/* Portable game notation for locally saved classical games; no network calls. */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.SchachNovaNotation=api;
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 const FILES="abcdefgh";
 function square(index){return FILES[index&7]+(8-(index>>4));}
 function uci(m){return square(m[0])+square(m[1])+(m[2]||"");}
 function validMove(m){return Array.isArray(m)&&Number.isInteger(m[0])&&Number.isInteger(m[1])&&m[0]>=0&&m[0]<128&&m[1]>=0&&m[1]<128&&!(m[0]&136)&&!(m[1]&136);}
 function san(before,after,m,rules){
  if(!validMove(m)||!before?.b||!after?.b)throw Error("Zugdaten unvollständig");
  const piece=before.b[m[0]],kind=piece?.toUpperCase(),from=m[0],to=m[1],file=FILES[from&7],rank=String(8-(from>>4));
  if(!"KQRBNP".includes(kind))throw Error("Ungültige Figur in der Zugfolge");
  const castle=m[3]==="castle"||(kind==="K"&&Math.abs((from&7)-(to&7))===2);
  let out;
  if(castle)out=(to&7)>(from&7)?"O-O":"O-O-O";
  else{
   const capture=before.b[to]!=="."||m[3]==="ep"||m[3]==="berolinaEp";
   let disambig="";
   if(kind!=="P"){
    const others=rules.legal(before).filter(x=>x[1]===to&&x[0]!==from&&before.b[x[0]]===piece);
    if(others.length){
     const sameFile=others.some(x=>(x[0]&7)===(from&7));
     const sameRank=others.some(x=>(x[0]>>4)===(from>>4));
     disambig=!sameFile?file:!sameRank?rank:file+rank;
    }
   }else if(capture)disambig=file;
   out=(kind==="P"?"":kind)+disambig+(capture?"x":"")+square(to)+(m[2]?"="+String(m[2]).toUpperCase():"");
  }
  if(rules.checked(after))out+=rules.legal(after).length?"+" : "#";
  return out;
 }
 function resultOf(game,rules){
  const message=String(game.message||"").toLocaleLowerCase("de");
  if(/weiß gewinnt|weiss gewinnt|weiß hat gewonnen|weiss hat gewonnen/.test(message))return "1-0";
  if(/schwarz gewinnt|schwarz hat gewonnen/.test(message))return "0-1";
  if(/remis|patt|unentschieden/.test(message))return "1/2-1/2";
  const last=game.positions?.[game.positions.length-1];
  if(last&&rules&&rules.checked(last)&&rules.legal(last).length===0)return last.t===1?"0-1":"1-0";
  return "*";
 }
 function escapeTag(s){return String(s).replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/[\r\n]/g," ").slice(0,200);}
 function generate(game,rules){
  const moves=game?.moves,positions=game?.positions;
  if(!Array.isArray(moves)||!Array.isArray(positions)||positions.length!==moves.length+1||!moves.every(validMove))throw Error("Zugfolge oder Stellungen sind unvollständig");
  const classical=(game.variant||"standard")==="standard";
  const date=new Date(game.timestamp);
  const ymd=Number.isNaN(date.getTime())?"????.??.??":date.getFullYear()+"."+String(date.getMonth()+1).padStart(2,"0")+"."+String(date.getDate()).padStart(2,"0");
  const result=classical?resultOf(game,rules):"*";
  const tags=['[Event "SchachNova Offline"]','[Site "Android"]','[Date "'+ymd+'"]','[White "Weiß"]','[Black "Schwarz"]','[Result "'+result+'"]'];
  if(!classical)tags.push('[Variant "'+escapeTag(game.variant)+'"]');
  const parts=[];
  for(let i=0;i<moves.length;i++){
   const state=positions[i];
   if(state.t===1)parts.push(String(state.full||Math.floor(i/2)+1)+".");
   else if(i===0)parts.push(String(state.full||1)+"...");
   parts.push(classical?san(state,positions[i+1],moves[i],rules):uci(moves[i]));
  }
  parts.push(result);
  if(classical)return {filename:"SchachNova-"+ymd.replace(/\./g,"-")+".pgn",mime:"application/x-chess-pgn",text:tags.join("\n")+"\n\n"+parts.join(" ")+"\n",standard:true};
  return {filename:"SchachNova-"+ymd.replace(/\./g,"-")+"-Variante.txt",mime:"text/plain;charset=utf-8",text:tags.join("\n")+"\n\n{ Varianten-Zugfolge in UCI-Koordinaten; kein Standard-PGN }\n"+parts.join(" ")+"\n",standard:false};
 }
 function download(file){
  const a=document.createElement("a"),url=URL.createObjectURL(new Blob([file.text],{type:file.mime}));
  a.href=url;a.download=file.filename;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
 }
 return {square,uci,san,resultOf,generate,download};
});