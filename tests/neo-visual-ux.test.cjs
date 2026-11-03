"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const root="app/src/main/assets/";
for(const name of ["neo-visual-ux.js","training.js","home-navigation.js","game-mode-navigation.js","appearance-preferences.js"]){
 new vm.Script(fs.readFileSync(root+name,"utf8"),{filename:name});
}
for(const name of ["openings","puzzles","analysis","practice","coach"]){
 const data=fs.readFileSync(root+"neo-assets/illustrations/"+name+".webp");
 assert.equal(data.toString("ascii",0,4),"RIFF","Missing RIFF "+name);
 assert.equal(data.toString("ascii",8,12),"WEBP","Missing WEBP "+name);
 assert.ok(data.length>2000);
}
const html=fs.readFileSync(root+"index.html","utf8");
const css=fs.readFileSync(root+"neo-visual-ux.css","utf8");
const ux=fs.readFileSync(root+"neo-visual-ux.js","utf8");
const training=fs.readFileSync(root+"training.js","utf8");
for(const id of ["novaQuickBot","novaQuickTraining","novaResumeGame","novaHeroProgress","trainingSearch","trainingSearchWrap","trainingSearchEmpty","practiceRecommendation"]){
 assert.ok(html.includes('id="'+id+'"'),"Missing control "+id);
}
assert.match(html,/<details class="nova-more-modes">/);
assert.match(html,/<summary>Weitere Spielarten/);
for(const target of ["play","training","analysis","simultan","online","variants","blind","settings"]){
 assert.equal((html.match(new RegExp('data-nova-jump="'+target+'"',"g"))||[]).length,1,"Lost or duplicate mode "+target);
}
assert.ok(html.indexOf('href="neo-visual-ux.css"')>html.indexOf('href="schachnova-theme.css"'),"Visual layer loads last");
assert.ok(html.indexOf('src="neo-visual-ux.js"')>html.indexOf('src="home-navigation.js"'),"Shortcuts bind after navigation");
assert.ok(html.includes('neo-assets/illustrations/coach.webp'));
assert.match(css,/#trainingList>\[hidden\]/);
assert.match(css,/#homeScreen \.nova-more-grid/);
assert.match(ux,/SchachNovaPractice/);
assert.match(ux,/key="schachnova-game-v2"/);
assert.match(ux,/mode="bot"/);
assert.match(training,/function filterTraining\(\)/);
assert.match(training,/filterTraining\(\);/);
const appearance=fs.readFileSync(root+"appearance-preferences.js","utf8");
assert.match(appearance,/board,'silverblue'/);
assert.match(appearance,/piece,'silverblue'/);
console.log("PASS Neo art (5 files), compact modes, shortcuts, training filter, and silver-blue fallbacks");
