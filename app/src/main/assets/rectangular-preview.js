"use strict";
/* Standalone local 10x8 game: does not touch the existing 8x8 game. */
(function(){
 const rules=window.SchachNovaRectangularRules,geo=window.SchachNovaBoardGeometry;
 if(!rules||!geo)return;
 let position=null,selected=null,legal=[],history=[],flipped=false,ended=false;
 let motion=null,lastMove=null;
 const glyphs={K:"♔",Q:"♕",R:"♖",B:"♗",N:"♘",P:"♙",A:"♗♘",C:"♖♘",J:"♗♘",k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟",a:"♝♞",c:"♜♞",j:"♝♞"};
 function render(){
  if(!position)return;
  const board=document.getElementById("rectPreviewBoard"),shape=geo.geometry(position.variant);
  const status=rules.status(position);
  const caption=document.getElementById("rectPreviewCaption");
  caption.textContent=status.ended?(status.result==="checkmate"?"Schachmatt · "+(status.winner==="w"?"Weiß":"Schwarz")+" gewinnt":"Patt · Remis"):(position.turn==="w"?"Weiß":"Schwarz")+" am Zug"+(status.check?" · Schach!":"")+" · Lokales 10×8-Schach";
  board.style.gridTemplateColumns="repeat("+shape.width+",minmax(0,1fr))";
  board.style.aspectRatio=shape.width+"/"+shape.height;
  const fragment=document.createDocumentFragment();
  for(let row=0;row<shape.height;row++)for(let col=0;col<shape.width;col++){
   const x=flipped?shape.width-1-col:col,y=flipped?shape.height-1-row:row;
   const idx=geo.index(x,y,shape),piece=position.board[idx];
   const square=document.createElement("button");
   square.type="button";
   square.className="rect-preview-square "+((x+y)%2?"rect-preview-dark":"rect-preview-light");
   if(idx===selected)square.classList.add("rect-preview-selected");
   if(lastMove&&(idx===lastMove.from||idx===lastMove.to))square.classList.add("rect-preview-lastmove");
   if(motion&&motion.to===idx)square.classList.add("rect-preview-motion-target");
   if(legal.some(m=>m.to===idx))square.classList.add("rect-preview-target");
   if(["a","c","j"].includes(piece.toLowerCase()))square.classList.add("rect-preview-compound");
   if(piece!=="."&&"KQRBNP kqrbnp".includes(piece)&&piece!==" "){
    const img=document.createElement("img");img.className="rect-piece-svg";img.alt="";img.draggable=false;
    img.src="pieces/"+(piece===piece.toUpperCase()?"w":"b")+piece.toUpperCase()+".svg";
    square.append(img);
   }else if(piece!=="."){
    const parts=piece.toUpperCase()==="C"?["R","N"]:["B","N"];
    const wrap=document.createElement("span");wrap.className="rect-compound-svg";
    for(const kind of parts){
     const icon=document.createElement("img");
     icon.className="rect-compound-svg-icon";icon.alt="";icon.draggable=false;
     icon.src="pieces/"+(piece===piece.toUpperCase()?"w":"b")+kind+".svg";
     wrap.append(icon);
    }
    square.append(wrap);
   }
   square.title=geo.algebraic(x,y,shape)+(piece==="."?"":": "+piece);
   square.setAttribute("aria-label",square.title);
   square.addEventListener("click",()=>tap(idx));
   fragment.append(square);
  }
  board.replaceChildren(fragment);
  document.getElementById("rectPreviewUndo").disabled=history.length===0;
 }
 /* One animation renderer for 10x8 compound and standard figures, same as 8x8. */
 function clearMotion(){window.SchachNovaMoveAnimator?.cancel(document.getElementById("rectPreviewBoard"));}
 function captureMove(move){
  const board=document.getElementById("rectPreviewBoard"),api=window.SchachNovaMoveAnimator;
  if(!board||!position||!api)return null;
  const shape=geo.geometry(position.variant);
  const cell=i=>board.children[flipped?shape.squares-1-i:i]||null;
  const primary={from:move.from,to:move.to};
  if(move.enPassant)primary.captureAt=move.to+(position.turn==="w"?shape.width:-shape.width);
  else if(position.board[move.to]!==".")primary.captureAt=move.to;
  const steps=[primary];
  if(move.castle)steps.push({from:move.rookFrom,to:move.rookTo});
  return api.capture(board,steps,cell);
 }
 function tap(index){
  if(ended||!position)return;
  const moves=legal.filter(m=>m.to===index);
  if(moves.length){
   let move=moves[0];
   if(moves.length>1){
    const answer=window.prompt("Bauernumwandlung: q Dame, r Turm, b Läufer, n Springer, a Erzbischof, c Kanzler","q");
    if(answer===null)return;
    move=moves.find(m=>m.promotion===answer.trim().toLowerCase())||moves[0];
   }
   const animated=captureMove(move);
   lastMove={from:move.from,to:move.to};
   history.push({position,move:lastMove});
   position=rules.apply(position,move);
   selected=null;legal=[];
   ended=rules.status(position).ended;
   render();
   window.SchachNovaMoveAnimator?.play(animated);
   return;
  }
  const piece=position.board[index],own=position.turn==="w"?piece===piece.toUpperCase():piece===piece.toLowerCase();
  if(piece!=="."&&own){selected=index;legal=rules.legalMoves(position).filter(m=>m.from===index);}
  else {selected=null;legal=[];}
  render();
 }
 function start(name){
  clearMotion();
  position=rules.initial(name);history=[];lastMove=null;selected=null;legal=[];ended=false;flipped=false;
  document.getElementById("rectPreviewTitle").textContent=name==="capablanca"?"Capablanca-Schach":"Janus-Schach";
  document.getElementById("rectPreview").hidden=false;
  render();
  document.getElementById("rectPreviewClose").focus();
 }
 document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll("[data-rect-preview]").forEach(button=>button.addEventListener("click",()=>start(button.dataset.rectPreview)));
  document.getElementById("rectPreviewClose")?.addEventListener("click",()=>{clearMotion();document.getElementById("rectPreview").hidden=true});
  document.getElementById("rectPreviewRestart")?.addEventListener("click",()=>{if(position)start(position.variant)});
  document.getElementById("rectPreviewFlip")?.addEventListener("click",()=>{clearMotion();flipped=!flipped;render()});
  document.getElementById("rectPreviewUndo")?.addEventListener("click",()=>{if(history.length){clearMotion();const previous=history.pop();position=previous.position;lastMove=history.length?history[history.length-1].move:null;selected=null;legal=[];ended=false;render()}});
 });
})();
