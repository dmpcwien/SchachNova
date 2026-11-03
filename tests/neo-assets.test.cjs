"use strict";
/* Neo media and rating regression tests — no Android runtime required. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),vm=require("node:vm");
const root="app/src/main/assets",names=["wK","wQ","wR","wB","wN","wP","bK","bQ","bR","bB","bN","bP"];
const effects=["capture","castle","game-end","game-start","illegal","move-check","move-opponent","move-self","notify","premove","promote","tenseconds"];
for(const n of names){
 const svg=fs.readFileSync(path.join(root,"neo-assets/warmwood/pieces",n+".svg"),"utf8");
 assert.match(svg,/<svg(?:\s|>)/,"Warm Wood svg missing "+n);
 for(const skin of ["mochi","mellow"]){
  const buf=fs.readFileSync(path.join(root,"neo-assets",skin,"pieces",n+".webp"));
  assert.equal(buf.toString("ascii",0,4),"RIFF");
  assert.equal(buf.toString("ascii",8,12),"WEBP");
 }
}
assert.match(fs.readFileSync(path.join(root,"neo-assets/warmwood/board.svg"),"utf8"),/<svg(?:\s|>)/);
for(const board of ["slate","brushed"]){
 const buf=fs.readFileSync(path.join(root,"neo-assets/boards",board+".webp"));
 assert.equal(buf.toString("ascii",8,12),"WEBP");
}
for(const effect of effects){
 const buf=fs.readFileSync(path.join(root,"neo-assets/warmwood/sounds",effect+".wav"));
 assert.equal(buf.toString("ascii",0,4),"RIFF");
 assert.equal(buf.toString("ascii",8,12),"WAVE");
}
for(const script of ["piece-appearance","neo-sounds","settings-appearance","rating-converter","chess"]){
 new vm.Script(fs.readFileSync(path.join(root,script+".js"),"utf8"),{filename:script+".js"});
}
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"schachnova-theme.css"),"utf8");
for(const id of ["novaBoardSkin","novaPieceSkin","novaSoundSkin","settingsSoundSkin","ratingConverterPanel","ratingConverterOpen"]){
 assert.ok(html.includes('id="'+id+'"'),"Missing UI control "+id);
}
for(const theme of ["warmwood","mochi","mellow","neo-slate","neo-brushed"]){
 assert.ok(html.includes('value="'+theme+'"'),"Missing theme "+theme);
}
assert.ok(css.includes('neo-assets/warmwood/board.svg'));
assert.ok(css.includes('neo-assets/boards/slate.webp'));
assert.ok(css.includes('neo-assets/boards/brushed.webp'));
assert.ok(fs.readFileSync(path.join(root,"chess.js"),"utf8").includes("SchachNovaSounds?.playMove"));
const {convert}=require("../app/src/main/assets/rating-converter.js");
const ratings=JSON.parse(fs.readFileSync(path.join(root,"neo-rating-conversion.json"),"utf8"));
assert.deepEqual(convert(ratings,"blitz",1500),{rating:1095,spread:90});
assert.deepEqual(convert(ratings,"blitz",1525),{rating:1132,spread:90});
assert.equal(convert(ratings,"blitz",100),null);
assert.equal(convert(ratings,"invalid",1500),null);
console.log("PASS Neo licensed media (51 files), selections, audio hooks and rating estimate.");
