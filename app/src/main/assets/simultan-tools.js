/* SchachNova Simultan: portable session, chess clocks and evidence-limited training summary. */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.SchachNovaSimultanTools=api;
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 const VERSION=2,MAX_BYTES=800000,MAX_PLY=500;
 const validUci=move=>typeof move==="string"&&/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move);
 const validResult=s=>s===""||s==="Schachmatt"||s==="Patt"||
  /^Remis \((?:unzureichendes Material|75-Züge-Regel|fünffache Stellungswiederholung|dreifache Stellungswiederholung|50-Züge-Regel)\)$/.test(s)||
  /^Zeitüberschreitung \((?:Weiß|Schwarz) gewinnt\)$/.test(s);
 function makeClock(minutes=0,increment=0){
  const base=Number(minutes),inc=Number(increment);
  if(!Number.isInteger(base)||base<0||base>180||![0,1,2,3,5,10,15,30].includes(inc))throw Error("Ungültige Schachuhr");
  return base===0?null:{remaining:[base*60,base*60],initialSeconds:base*60,increment:inc,startedAt:null};
 }
 function copyClock(c){
  if(c===null||c===undefined)return null;
  if(!Array.isArray(c.remaining)||c.remaining.length!==2||!c.remaining.every(x=>Number.isFinite(x)&&x>=0&&x<=10860)||
     ![0,1,2,3,5,10,15,30].includes(c.increment))throw Error("Ungültige Restzeit");
  return {remaining:c.remaining.slice(),initialSeconds:Number.isInteger(c.initialSeconds)&&c.initialSeconds>=60&&c.initialSeconds<=10800?c.initialSeconds:Math.ceil(Math.max(...c.remaining)/60)*60,increment:c.increment,startedAt:null};
 }
 function freezeClock(clock,side,now){
  if(!clock||clock.startedAt===null)return false;
  const idx=side===1?0:1;
  const elapsed=Math.max(0,Math.min(36000000,now-clock.startedAt))/1000;
  clock.remaining[idx]=Math.max(0,clock.remaining[idx]-elapsed);
  clock.startedAt=null;
  return clock.remaining[idx]<=0;
 }
 function startClock(clock,now){if(clock&&clock.startedAt===null)clock.startedAt=now;}
 function currentClock(clock,side,now){
  if(!clock)return null;
  const times=clock.remaining.slice();
  if(clock.startedAt!==null){const idx=side===1?0:1;times[idx]=Math.max(0,times[idx]-Math.max(0,now-clock.startedAt)/1000);}
  return times;
 }
 function serialize(games,settings){
  return {format:"SchachNova-Simultan",version:VERSION,exportedAt:new Date().toISOString(),
   active:settings.active,autoSwitch:settings.autoSwitch,botsPaused:settings.botsPaused,
   powerMode:settings.powerMode,strengthMode:settings.strengthMode,
   fixedStrength:settings.fixedStrength,startedAt:settings.startedAt,
   games:games.map(g=>({
    humanColor:g.humanColor,strength:g.strength,moves:g.moves,finished:g.finished||"",
    clock:g.clock?{remaining:currentClock(g.clock,g.turn,Date.now()),initialSeconds:g.clock.initialSeconds,increment:g.clock.increment}:null
   }))};
 }
 function parse(json){
  if(typeof json!=="string"||json.length>MAX_BYTES)throw Error("Sicherung ist zu groß");
  const d=JSON.parse(json);
  if(!d||typeof d!=="object"||![1,2].includes(d.version)||
    (d.format!==undefined&&d.format!=="SchachNova-Simultan")||
    !Array.isArray(d.games)||d.games.length<5||d.games.length>20)throw Error("Ungültige Simultan-Sicherung");
  const games=d.games.map(g=>{
   if(!g||![-1,1].includes(g.humanColor)||!Number.isInteger(g.strength)||g.strength<0||g.strength>20||
      !Array.isArray(g.moves)||g.moves.length>MAX_PLY||!g.moves.every(validUci)||
      !validResult(g.finished||""))throw Error("Ungültige Brett-Daten");
   return {humanColor:g.humanColor,strength:g.strength,moves:g.moves.slice(),finished:g.finished||"",clock:copyClock(g.clock)};
  });
  const active=Number.isInteger(d.active)?Math.min(games.length-1,Math.max(0,d.active)):0;
  return {games,active,autoSwitch:d.autoSwitch!==false,botsPaused:d.botsPaused===true,
   powerMode:["eco","balanced","strong"].includes(d.powerMode)?d.powerMode:"balanced",
   strengthMode:["random","same"].includes(d.strengthMode)?d.strengthMode:"random",
   fixedStrength:Number.isInteger(d.fixedStrength)?Math.max(0,Math.min(20,d.fixedStrength)):8,
   startedAt:Number.isFinite(d.startedAt)&&d.startedAt>0?d.startedAt:Date.now()};
 }
 const result=(g)=>{
  const s=g.finished||"";
  if(!s)return "offen";
  if(s.startsWith("Remis")||s==="Patt")return "Remis";
  const winner=s==="Schachmatt"?(g.turn===1?-1:1):s.includes("Weiß gewinnt")?1:s.includes("Schwarz gewinnt")?-1:0;
  if(!winner)return "unbekannt";
  return winner===g.humanColor?"Sieg":"Niederlage";
 };
 function analyze(games){
  const stats={total:games.length,finished:0,wins:0,losses:0,draws:0,plies:0,byStrength:[],boards:[]};
  for(let i=0;i<games.length;i++){
   const g=games[i],outcome=result(g),plies=g.moves.length;
   stats.plies+=plies;
   if(outcome!=="offen")stats.finished++;
   if(outcome==="Sieg")stats.wins++;
   if(outcome==="Niederlage")stats.losses++;
   if(outcome==="Remis")stats.draws++;
   stats.boards.push({number:i+1,outcome,plies,strength:g.strength,color:g.humanColor===1?"Weiß":"Schwarz"});
  }
  stats.averagePlies=stats.total?Math.round(stats.plies/stats.total):0;
  return stats;
 }
 /* Observable, rule-based practice suggestions; never call these Stockfish error scores. */
 function training(games){
  let opening=0,defense=0,endgame=0,blitz=0,material=0;
  for(const g of games){
   const own=g.moves.filter((_,i)=>i%2===(g.humanColor===1?0:1));
   if(own.length&&own.length<12)opening++;
   if(g.finished==="Schachmatt"&&result(g)==="Niederlage")defense++;
   if(g.moves.length>80)endgame++;
   if(g.finished?.startsWith("Zeitüberschreitung")&&result(g)==="Niederlage")blitz++;
   if(Array.isArray(g.history)&&g.history.length===g.moves.length+1){
    for(let i=0;i+1<g.moves.length;i++){
     if(i%2!==(g.humanColor===1?0:1))continue;
     const reply=g.moves[i+1],beforeReply=g.history[i+1];
     if(!Array.isArray(reply)||!Array.isArray(beforeReply?.b))continue;
     const captured=beforeReply.b[reply[1]];
     if(!"QRBNqrbn".includes(captured||"."))continue;
     const immediateRecapture=g.moves[i+2]&&g.moves[i+2][1]===reply[1];
     if(!immediateRecapture)material++;
    }
   }
  }
  const suggestions=[
   {key:"opening",n:opening,label:"Eröffnungsgrundsätze",why:"Kurze Partien oder wenige eigene Züge",task:"5 Eröffnungsaufgaben und Entwicklung der Leichtfiguren üben"},
   {key:"defense",n:defense,label:"Mattabwehr",why:"Verlorene Partien durch Schachmatt",task:"5 Aufgaben zu Schachgeboten, Fluchtfeldern und Mattdrohungen"},
   {key:"endgame",n:endgame,label:"Endspieltechnik",why:"Partien mit über 80 Halbzügen",task:"5 Endspiele zu Bauernumwandlung und Königaktivität"},
   {key:"material",n:material,label:"Figurensicherung",why:"Gegner schlug eine hochwertige Figur ohne unmittelbare Rücknahme",task:"5 Taktikaufgaben zu ungedeckten Figuren und Abtauschfolgen"},
   {key:"time",n:blitz,label:"Zeitmanagement",why:"Partieverlust durch Zeitüberschreitung",task:"3 kurze Partien mit Uhr und Zugtempo bewusst trainieren"}
  ];
  return suggestions.filter(x=>x.n>0).sort((a,b)=>b.n-a.n).slice(0,3);
 }
 return Object.freeze({VERSION,makeClock,copyClock,freezeClock,startClock,currentClock,serialize,parse,result,analyze,training});
});