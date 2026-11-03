"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict"),vm=require("node:vm");
const root="app/src/main/assets/";
const {squareAt,chooseTarget}=require("../app/src/main/assets/coordinate-trainer.js");
for(let n=0;n<64;n++){
 const normal=squareAt(n,false),flipped=squareAt(n,true);
 assert.match(normal,/^[a-h][1-8]$/);
 assert.match(flipped,/^[a-h][1-8]$/);
 assert.equal(flipped,squareAt(63-n,false),"180 degree rotation");
 for(const random of [()=>0,()=>.5,()=>.999999]){
  const chosen=chooseTarget(n,random);
  assert.ok(chosen>=0&&chosen<64&&chosen!==n,"do not repeat same target");
 }
}
assert.equal(squareAt(0,false),"a8");
assert.equal(squareAt(63,false),"h1");
assert.equal(squareAt(0,true),"h1");
assert.equal(squareAt(63,true),"a8");
assert.equal(squareAt(-1,false),null);
assert.equal(squareAt(64,true),null);
assert.equal(chooseTarget(-1,()=>0),0);
assert.equal(chooseTarget(-1,()=>.999999),63);
new vm.Script(fs.readFileSync(root+"coordinate-trainer.js","utf8"));
const html=fs.readFileSync(root+"index.html","utf8");
for(const id of ["coordinateScreen","coordinateBoard","coordinateBack","coordinateTarget","coordinateStart","coordinateFlip","coordinateLabels","coordinateBest","coordinateRemaining"]){
 assert.ok(html.includes('id="'+id+'"'),"coordinate UI missing "+id);
}
assert.match(fs.readFileSync(root+"training.js","utf8"),/group:"coordinates"/);
assert.match(fs.readFileSync(root+"android-back-navigation.js","utf8"),/visible\('coordinateScreen'\)/);
console.log("PASS offline coordinate training: 64 squares, rotation, prompts, navigation and controls");
