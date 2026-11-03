"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const root="app/src/main/assets/";
const api=require("../app/src/main/assets/move-animator.js");
const src=fs.readFileSync(root+"move-animator.js","utf8");
new vm.Script(src,{filename:"move-animator.js"});
const code=Object.fromEntries(["chess.js","game-review.js","training.js","simultan.js","rectangular-preview.js","piece-appearance.js"].map(p=>[p,fs.readFileSync(root+p,"utf8")]));
for(const [p,s]of Object.entries(code))new vm.Script(s,{filename:p});
const html=fs.readFileSync(root+"index.html","utf8");
assert.ok(html.indexOf('src="move-animator.js"')<html.indexOf('src="chess.js"'),"shared animation loads before game code");
assert.match(code["chess.js"],/const old=current\(\),motion=captureMovedPiece\(m,old\)/);
assert.match(code["chess.js"],/render\(\);animateMovedPiece\(m,motion\)/);
assert.match(code["training.js"],/api\?\.capture\(board,api\.standardMoves\(m,state\),trainingCell\)/);
assert.match(code["training.js"],/state=apply\(state,m\);\s*renderTraining\(\);\s*return api\?\.play\(animation\)/);
assert.match(code["game-review.js"],/const motion=spec\?\.length\?api\?\.capture\(board,spec,cell\):null;\s*board.replaceChildren/);
assert.match(code["game-review.js"],/api\?\.play\(motion\)/);
assert.match(code["simultan.js"],/captureMove\(g,valid,s\)/);
assert.match(code["simultan.js"],/draw\(true\);window\.SchachNovaMoveAnimator\?\.play\(animation\)/);
assert.match(code["rectangular-preview.js"],/const animated=captureMove\(move\)/);
assert.match(code["rectangular-preview.js"],/render\(\);\s*window\.SchachNovaMoveAnimator\?\.play\(animated\)/);
assert.match(code["piece-appearance.js"],/img.closest\("\.nova-motion-sprite"\)/);
assert.match(src,/prefers-reduced-motion: reduce/);
assert.match(src,/document\.body\.append\(sprite\)/);
assert.match(src,/item\.target\.style\.setProperty\("visibility","hidden","important"\)/);
assert.ok(!/board\.append\(piece\)/.test(src),"overlay must never be a CSS grid child");
const before={b:Array(128).fill("."),t:1};before.b[51]="p";
const castle=api.standardMoves([116,118,"","castle"],before);
assert.deepEqual(castle,[{from:116,to:118},{from:119,to:117}]);
const ep=api.standardMoves([68,51,"","ep"],before);
assert.equal(ep[0].captureAt,67);
assert.deepEqual(api.standardMoves([100,84,"q",""],before),[{from:100,to:84}]);
function style(){
 const items={};
 return {items,cssText:"",setProperty(k,v){items[k]=v;},getPropertyValue(k){return items[k]||"";},getPropertyPriority(){return "";},removeProperty(k){delete items[k];}};
}
function element(rect,src=""){
 const el={style:style(),dataset:{},children:[],rect,src,isConnected:true,removed:false,
  getBoundingClientRect(){return this.rect;},
  cloneNode(){return element(this.rect,this.src);},
  append(item){this.children.push(item);},
  remove(){this.removed=true;this.isConnected=false;},
  setAttribute(){},
  animate(frames,options){
   const a={frames,options,cancel(){this.oncancel?.();}};
   this.motion=a;return a;
  }
 };
 return el;
}
global.getComputedStyle=()=>({width:"64px",height:"64px",filter:"none",opacity:"1",objectFit:"contain",transform:"none"});
const body={added:[],append(x){this.added.push(x);}};
global.document={body,createElement(){return element({left:0,top:0,width:64,height:64});}};
const original=element({left:10,top:20,width:64,height:64},"neo-assets/mochi/pieces/wP.webp");
const oldVictim=element({left:75,top:20,width:64,height:64},"neo-assets/mochi/pieces/bP.webp");
const cells=[
 {getBoundingClientRect(){return {left:10,top:20,width:64,height:64};},querySelector(){return original;}},
 {getBoundingClientRect(){return {left:75,top:20,width:64,height:64};},querySelector(){return oldVictim;}}
];
const board={name:"test"};
const motion=api.capture(board,[{from:0,to:1,captureAt:1}],i=>cells[i]);
assert.ok(motion&&body.added.length===2,"Capture must create moving and victim sprites before render");
assert.equal(body.added[0].children[0].src,original.src,"Clone must retain actual selected figure style");
const queen=element({left:75,top:20,width:64,height:64},"neo-assets/mellow/pieces/wQ.webp");
cells[1]={getBoundingClientRect(){return {left:75,top:20,width:64,height:64};},querySelector(){return queen;}};
(async()=>{
 const done=api.play(motion);
 assert.equal(queen.style.getPropertyValue("visibility"),"hidden","Destination must not pop in at redraw");
 assert.match(body.added[0].motion.frames[2].transform,/65px,0px/,"The original figure must physically glide");
 for(const item of motion.animations)item.onfinish?.();
 await done;
 assert.equal(queen.style.getPropertyValue("visibility"),"","Destination restored on animation completion");
 assert.ok(body.added.every(el=>el.removed),"No sprite leaks");
 console.log("PASS shared source-first motion, actual piece styles, capture, castling, en passant, hide/restore, 8x8 and 10x8 hooks");
})().catch(e=>{console.error(e);process.exitCode=1;});
