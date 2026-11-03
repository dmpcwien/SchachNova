/* Shared source-first chess motion: 8x8, 10x8, replay, training and simultaneous boards.
 * Capture the VISIBLE sprite before a board is re-rendered. The animation is
 * independent of the original image URL, board theme and piece-set selection. */
(function(root,factory){
 "use strict";
 const api=factory(root);
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.SchachNovaMoveAnimator=api;
})(typeof window!=="undefined"?window:null,function(root){
 "use strict";
 const active=new WeakMap();
 const selector=".piece-img,.blind-disk,.review-piece,.simultan-piece,.rect-piece-svg,.rect-compound-svg";
 const clamp=(min,v,max)=>Math.min(max,Math.max(min,v));
 function live(cell){return cell?.querySelector?.(selector)||null;}
 function freeze(original,copy){
  if(!original||!copy)return;
  const rect=original.getBoundingClientRect(),cs=getComputedStyle(original);
  copy.style.setProperty("width",rect.width+"px","important");
  copy.style.setProperty("height",rect.height+"px","important");
  copy.style.setProperty("max-width","none","important");
  copy.style.setProperty("max-height","none","important");
  copy.style.setProperty("margin","0","important");
  copy.style.setProperty("object-fit",cs.objectFit||"contain","important");
  copy.style.setProperty("filter",cs.filter||"none","important");
  copy.style.setProperty("-webkit-filter",cs.filter||"none","important");
  copy.style.setProperty("opacity",cs.opacity||"1","important");
  copy.style.setProperty("transform",cs.transform||"none","important");
  copy.style.setProperty("transition","none","important");
  copy.style.setProperty("animation","none","important");
  if(original.children&&copy.children){
   for(let i=0;i<original.children.length;i++)freeze(original.children[i],copy.children[i]);
  }
 }
 function cloneAt(node,rect,kind){
  if(!node||!rect||rect.width<=0||rect.height<=0)return null;
  const sprite=document.createElement("div");
  sprite.className="nova-motion-sprite";
  sprite.dataset.motionKind=kind;
  sprite.style.cssText="position:fixed;left:"+rect.left+"px;top:"+rect.top+"px;width:"+rect.width+"px;height:"+rect.height+"px;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:2147483000;margin:0;padding:0;border:0;background:transparent;overflow:visible;contain:layout style;will-change:transform;";
  sprite.setAttribute("aria-hidden","true");
  const copy=node.cloneNode(true);
  freeze(node,copy);
  sprite.append(copy);
  document.body.append(sprite);
  return sprite;
 }
 function cancel(board){const batch=board&&active.get(board);if(batch)batch.finish();}
 function capture(board,moves,cellFor){
  if(!board||!Array.isArray(moves)||!moves.length||typeof cellFor!=="function"||!document.body)return null;
  cancel(board);
  const items=[];
  for(const spec of moves){
   const from=cellFor(spec.from),to=cellFor(spec.to),source=live(from);
   if(!from||!to||!source)continue;
   const origin=from.getBoundingClientRect(),destination=to.getBoundingClientRect();
   if(!origin.width||!destination.width)continue;
   const moving=cloneAt(source,origin,"piece");
   if(!moving)continue;
   const victimSquare=spec.captureAt;
   const victimCell=victimSquare===null||victimSquare===undefined?null:cellFor(victimSquare);
   const victimNode=live(victimCell);
   const victim=victimNode?cloneAt(victimNode,victimCell.getBoundingClientRect(),"captured"):null;
   items.push({from:spec.from,to:spec.to,moving,victim,origin,destination,target:null,oldVisibility:null});
  }
  if(!items.length)return null;
  const batch={board,items,cellFor,started:false,ended:false,animations:[],timer:null,resolve:null,promise:null,finish:null};
  batch.finish=()=>{
   if(batch.ended)return;
   batch.ended=true;
   if(batch.timer!==null){clearTimeout(batch.timer);batch.timer=null;}
   for(const a of batch.animations){try{a.cancel();}catch(_){}}
   for(const item of items){
    item.moving.remove();item.victim?.remove();
    if(item.target&&item.target.isConnected&&item.oldVisibility){
     item.target.style.setProperty("visibility",item.oldVisibility.value,item.oldVisibility.priority);
    }else if(item.target&&item.target.isConnected){
     item.target.style.removeProperty("visibility");
    }
   }
   if(active.get(board)===batch)active.delete(board);
   batch.resolve?.();
  };
  active.set(board,batch);
  return batch;
 }
 function play(batch){
  if(!batch)return Promise.resolve();
  if(batch.started)return batch.promise||Promise.resolve();
  if(batch.ended||active.get(batch.board)!==batch)return Promise.resolve();
  batch.started=true;
  batch.promise=new Promise(resolve=>{batch.resolve=resolve;});
  const reduced=root?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
  if(reduced){batch.finish();return batch.promise;}
  const durs=[];
  for(const item of batch.items){
   const toCell=batch.cellFor(item.to);
   if(!toCell){batch.finish();return batch.promise;}
   const dest=toCell.getBoundingClientRect();
   item.target=live(toCell);
   if(item.target){
    item.oldVisibility={value:item.target.style.getPropertyValue("visibility"),priority:item.target.style.getPropertyPriority("visibility")};
    item.target.style.setProperty("visibility","hidden","important");
   }
   const dx=dest.left-item.origin.left,dy=dest.top-item.origin.top;
   const squares=Math.hypot(dx/Math.max(1,item.origin.width),dy/Math.max(1,item.origin.height));
   const duration=clamp(220,195+squares*27,425);
   durs.push(duration);
   try{
    if(typeof item.moving.animate!=="function"){batch.finish();return batch.promise;}
    batch.animations.push(item.moving.animate([
     {transform:"translate3d(0,0,0) scale(1)",offset:0},
     {transform:"translate3d("+(dx*.55)+"px,"+(dy*.55)+"px,0) scale(1.018)",offset:.55},
     {transform:"translate3d("+dx+"px,"+dy+"px,0) scale(1)",offset:1}
    ],{duration,easing:"cubic-bezier(.25,.74,.26,1)",fill:"forwards"}));
    if(item.victim&&typeof item.victim.animate==="function"){
     batch.animations.push(item.victim.animate([
      {opacity:1,transform:"scale(1)",offset:0},
      {opacity:1,transform:"scale(1)",offset:.32},
      {opacity:0,transform:"scale(.83)",offset:1}
     ],{duration:Math.min(250,duration),easing:"ease-out",fill:"forwards"}));
    }
   }catch(_){batch.finish();return batch.promise;}
  }
  let count=batch.animations.length;
  if(!count){batch.finish();return batch.promise;}
  for(const animation of batch.animations){
   const done=()=>{if(--count===0)batch.finish();};
   animation.onfinish=done;
   animation.oncancel=()=>{if(!batch.ended)batch.finish();};
  }
  batch.timer=setTimeout(()=>batch.finish(),Math.max(...durs)+200);
  return batch.promise;
 }
 function standardMoves(m,before){
  if(!Array.isArray(m))return [];
  const spec={from:m[0],to:m[1]};
  if(before?.b){
   const ep=m[3]==="ep"||m[3]==="berolinaEp";
   if(ep)spec.captureAt=m[1]+16*before.t;
   else if(before.b[m[1]]!==".")spec.captureAt=m[1];
  }
  const result=[spec];
  if(m[3]==="castle"){
   const rookFrom=m[1]>m[0]?m[0]+3:m[0]-4;
   const rookTo=m[1]>m[0]?m[0]+1:m[0]-1;
   result.push({from:rookFrom,to:rookTo});
  }
  return result;
 }
 return {capture,play,cancel,standardMoves};
});