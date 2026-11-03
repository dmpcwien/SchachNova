/* SchachNova coordinate trainer: stand-alone offline exercise, no rating claims. */
(function(root,factory){
 "use strict";
 const logic=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=logic;
 if(!root||!root.document)return;
 const $=id=>document.getElementById(id),screen=$("coordinateScreen"),board=$("coordinateBoard");
 if(!screen||!board)return;
 const KEY="schachnova.coordinates.best60.v1";
 let flipped=false,labels=false,running=false,score=0,wrong=0,target=-1,endAt=0,timer=null,mode="speed";
 function best(){try{return Math.max(0,Math.floor(Number(localStorage.getItem(KEY))||0));}catch(_){return 0;}}
 function saveBest(){try{if(score>best())localStorage.setItem(KEY,String(score));}catch(_){}}
 function feedback(text){$("coordinateFeedback").textContent=text;}
 function stop(){
  if(timer){clearInterval(timer);timer=null;}
  if(running&&mode==="speed")saveBest();
  running=false;
  $("coordinateStart").textContent="▶ Neustarten";
  $("coordinateBest").textContent=best()+" Punkte";
 }
 function clock(){
  if(!running||mode!=="speed")return;
  const left=Math.max(0,Math.ceil((endAt-Date.now())/1000));
  $("coordinateRemaining").textContent=left+" s";
  if(left===0){stop();feedback("Zeit abgelaufen · "+score+" richtige Felder · "+wrong+" Fehler");}
 }
 function draw(){
  board.replaceChildren();
  for(let n=0;n<64;n++){
   const file=logic.squareAt(n,flipped),button=document.createElement("button");
   button.type="button";button.className="coordinate-square "+((Math.floor(n/8)+n%8)%2?"dark":"light");
   button.setAttribute("aria-label","Feld "+file);
   button.textContent=labels?file:"";
   button.onclick=()=>guess(file);
   board.append(button);
  }
  const files=flipped?"hgfedcba":"abcdefgh";
  $("coordinateFiles").replaceChildren();
  for(const letter of files){const el=document.createElement("span");el.textContent=letter;$("coordinateFiles").append(el);}
  const ranks=flipped?"12345678":"87654321";
  $("coordinateRanks").replaceChildren();
  for(const rank of ranks){const el=document.createElement("span");el.textContent=rank;$("coordinateRanks").append(el);}
 }
 function update(){ $("coordinateScore").textContent=String(score);$("coordinateMistakes").textContent=String(wrong);$("coordinateBest").textContent=best()+" Punkte"; }
 function next(){
  const previous=target;target=logic.chooseTarget(previous,Math.random);
  $("coordinateTarget").textContent=logic.squareAt(target,false);
 }
 function guess(square){
  if(!running)return;
  const answer=logic.squareAt(target,false);
  if(square!==answer){wrong++;feedback("Das war "+square+". Gesucht ist "+answer+".");}
  else{
   score++;feedback("Richtig! "+square);root.SchachNovaSounds?.play("move-self");next();
  }
  update();
 }
 function start(){
  stop();mode=$("coordinateMode").value;running=true;score=0;wrong=0;target=-1;
  endAt=Date.now()+60000;
  $("coordinateStart").textContent="↻ Neu starten";
  $("coordinateRemaining").textContent=mode==="speed"?"60 s":"Ohne Zeitlimit";
  feedback("Finde das angezeigte Feld auf dem Brett.");
  next();update();
  if(mode==="speed")timer=setInterval(clock,200);
 }
 function close(){
  stop();screen.hidden=true;
  root.openSchachTraining?.();
 }
 $("coordinateStart").addEventListener("click",start);
 $("coordinateBack").addEventListener("click",close);
 $("coordinateFlip").addEventListener("click",()=>{flipped=!flipped;draw();});
 $("coordinateLabels").addEventListener("click",()=>{labels=!labels;$("coordinateLabels").setAttribute("aria-pressed",String(labels));draw();});
 $("coordinateMode").addEventListener("change",()=>{stop();$("coordinateRemaining").textContent=$("coordinateMode").value==="speed"?"60 s":"Ohne Zeitlimit";feedback("Zum Starten bereit.");});
 root.SchachNovaCoordinates={open(){
  $("trainingScreen").hidden=true;screen.hidden=false;screen.scrollTop=0;draw();update();
  $("coordinateRemaining").textContent=$("coordinateMode").value==="speed"?"60 s":"Ohne Zeitlimit";
  feedback("Wähle Übungsmodus und tippe auf Start.");$("coordinateTarget").textContent="–";
 },close};
 draw();update();
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 function squareAt(i,flipped){
  if(!Number.isInteger(i)||i<0||i>=64)return null;
  const row=Math.floor(i/8),column=i%8;
  return (flipped?"hgfedcba":"abcdefgh")[column]+(flipped?row+1:8-row);
 }
 function chooseTarget(previous,random){
  let v=Math.max(0,Math.min(0.999999999999,Number(random())||0));
  if(!Number.isInteger(previous)||previous<0||previous>=64)return Math.floor(v*64);
  const n=Math.floor(v*63);return n>=previous?n+1:n;
 }
 return {squareAt,chooseTarget};
});