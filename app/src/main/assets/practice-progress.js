/* SchachNova offline opening practice: spaced repetition and daily goals.
 * Independently implemented from MIT-licensed Lichess Neo concepts. */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.SchachNovaPractice=api.createPractice(root.localStorage);
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 const KEY="schachnova.practice.v1", DAY=86400000, INTERVALS=[1,3,7,14,30,60,120];
 const MAX_POSITIONS=2500,MAX_DAYS=120,GOAL=10;
 function blank(){return {version:1,positions:{},days:{},favorites:[],goal:GOAL};}
 function localDay(now){const d=new Date(now);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
 function previousDay(day){const [y,m,d]=day.split("-").map(Number);return localDay(new Date(y,m-1,d-1,12).getTime());}
 function nameOf(opening){return String(opening.id||opening.title||"").trim().toLowerCase();}
 function keyOf(opening,ply){return encodeURIComponent(nameOf(opening))+"|"+(opening.side===-1?"b":"w")+"|"+Math.max(0,Math.floor(ply));}
 function ownIndices(line){const indices=[];for(let i=0;i<line.moves.length;i++)if(i%2===(line.side===-1?1:0))indices.push(i);return indices;}
 function createPractice(storage,clock){
  const now=typeof clock==="function"?clock:()=>Date.now();
  function read(){
   try{
    const raw=storage&&storage.getItem(KEY);if(!raw)return blank();
    const d=JSON.parse(raw);
    if(!d||d.version!==1||typeof d.positions!=="object"||!d.positions||Array.isArray(d.positions))return blank();
    return {version:1,positions:d.positions,days:d.days&&typeof d.days==="object"&&!Array.isArray(d.days)?d.days:{},favorites:Array.isArray(d.favorites)?d.favorites:[],goal:Number.isInteger(d.goal)&&d.goal>=5&&d.goal<=50?d.goal:GOAL};
   }catch(_){return blank();}
  }
  function save(d){
   try{
    const keys=Object.keys(d.positions);
    if(keys.length>MAX_POSITIONS){keys.sort((a,b)=>(d.positions[a].last||0)-(d.positions[b].last||0));for(const k of keys.slice(0,keys.length-MAX_POSITIONS))delete d.positions[k];}
    const days=Object.keys(d.days).filter(k=>/^\d{4}-\d\d-\d\d$/.test(k)).sort().reverse().slice(0,MAX_DAYS);
    d.days=Object.fromEntries(days.map(k=>[k,d.days[k]]));
    d.favorites=d.favorites.filter(x=>typeof x==="string").slice(-150);
    if(storage)storage.setItem(KEY,JSON.stringify(d));
   }catch(_){/* Storage blocked or full; active lesson still works. */}
  }
  function entry(d,line,ply){
   const key=keyOf(line,ply),p=d.positions[key];
   const safe=p&&typeof p==="object"&&Number.isFinite(p.level)?p:null;
   if(!safe)d.positions[key]={seen:0,missed:0,level:0,due:0,last:0};
   return d.positions[key];
  }
  function noteMiss(line,ply){
   const d=read(),p=entry(d,line,ply),t=now();
   p.seen=Math.max(0,Number(p.seen)||0)+1;
   p.missed=Math.max(0,Number(p.missed)||0)+1;p.level=0;p.due=t;p.last=t;save(d);
  }
  function noteMove(line,ply,{hadMiss=false,hinted=false}={}){
   const d=read(),p=entry(d,line,ply),t=now();
   if(!hadMiss)p.seen=Math.max(0,Number(p.seen)||0)+1;
   const firstTry=!hadMiss&&!hinted;
   p.level=firstTry?Math.min(7,Math.max(0,Number(p.level)||0)+1):Math.max(0,Math.min(7,Number(p.level)||0));
   p.due=t+DAY*INTERVALS[firstTry?Math.max(0,p.level-1):0];p.last=t;
   const key=localDay(t);d.days[key]=Math.min(10000,(Number(d.days[key])||0)+1);
   save(d);return {level:p.level,due:p.due,firstTry};
  }
  function lineMetrics(line){
   const positions=read().positions,indices=ownIndices(line);
   const items=indices.map(i=>positions[keyOf(line,i)]).filter(x=>x&&typeof x==="object");
   const level=items.reduce((n,p)=>n+Math.max(0,Math.min(5,Number(p.level)||0)),0);
   const progress=indices.length?level/(indices.length*5):0;
   const seen=items.reduce((n,p)=>n+(Number(p.seen)||0),0);
   const missed=items.reduce((n,p)=>n+(Number(p.missed)||0),0);
   const due=items.filter(p=>Number(p.due)>0&&Number(p.due)<=now()).length;
   const mastery=items.length===0?"neu":progress>=.8&&indices.length>=5?"gemeistert":progress>=.45?"gefestigt":"in Arbeit";
   return {positions:indices.length,practiced:items.length,progress,seen,missed,due,mastery};
  }
  function dueLines(lines){
   const positions=read().positions,t=now(),list=[];
   for(const line of lines){
    const due=ownIndices(line).map(i=>positions[keyOf(line,i)]).filter(p=>p&&Number(p.due)>0&&p.due<=t);
    if(due.length)list.push({line,count:due.length,oldest:Math.min(...due.map(p=>p.due))});
   }
   return list.sort((a,b)=>a.oldest-b.oldest||b.count-a.count);
  }
  function recommendation(lines){
   const due=dueLines(lines);
   if(due.length)return {line:due[0].line,reason:due[0].count+" Zug"+(due[0].count===1?"":"e")+" jetzt wiederholen"};
   const practiced=lines.map(line=>({line,metrics:lineMetrics(line)})).filter(x=>x.metrics.practiced>0);
   if(practiced.length){
    practiced.sort((a,b)=>{
     const priority=m=>(m.missed/Math.max(1,m.seen))*.7+(1-m.progress)*.3;
     return priority(b.metrics)-priority(a.metrics)||a.line.title.localeCompare(b.line.title,"de");
    });
    return {line:practiced[0].line,reason:"Diese Eröffnung weiter festigen"};
   }
   const line=lines.find(isFavorite)||lines[0];
   return line?{line,reason:"Mit deinem Repertoire starten"}:null;
  }
  function isFavorite(line){return read().favorites.includes(nameOf(line));}
  function toggleFavorite(line){
   const d=read(),name=nameOf(line),has=d.favorites.includes(name);
   d.favorites=has?d.favorites.filter(x=>x!==name):[...d.favorites,name];save(d);return !has;
  }
  function dayCount(){return Number(read().days[localDay(now())])||0;}
  function dayStreak(){
   const d=read(),goal=d.goal;let date=localDay(now());
   if((Number(d.days[date])||0)<goal)date=previousDay(date);
   let streak=0;while(streak<MAX_DAYS&&(Number(d.days[date])||0)>=goal){streak++;date=previousDay(date);}
   return streak;
  }
  function goal(){return read().goal;}
  function setGoal(value){const d=read();d.goal=Math.max(5,Math.min(50,Math.round(Number(value)||GOAL)));save(d);return d.goal;}
  function summary(lines){const due=dueLines(lines);return {dueLines:due.length,duePositions:due.reduce((n,x)=>n+x.count,0),today:dayCount(),goal:goal(),streak:dayStreak(),favorites:lines.filter(isFavorite).length,practiced:lines.filter(l=>lineMetrics(l).practiced>0).length};}
  return {keyOf,noteMiss,noteMove,lineMetrics,dueLines,recommendation,isFavorite,toggleFavorite,dayCount,dayStreak,goal,setGoal,summary,exportData:()=>read()};
 }
 return {createPractice,localDay,previousDay,ownIndices,keyOf};
});