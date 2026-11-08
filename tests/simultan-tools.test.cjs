"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const t=require("../app/src/main/assets/simultan-tools.js");
const src=fs.readFileSync("app/src/main/assets/simultan.js","utf8");
const html=fs.readFileSync("app/src/main/assets/index.html","utf8");
const android=fs.readFileSync("app/src/main/java/at/schachnova/app/MainActivity.kt","utf8");
const diag=fs.readFileSync("app/src/main/assets/simultan-diagnostics.js","utf8");
const clock=t.makeClock(5,2);
assert.deepEqual(clock.remaining,[300,300]);
assert.equal(clock.initialSeconds,300);
t.startClock(clock,1000);
assert.equal(clock.startedAt,1000);
assert.deepEqual(t.currentClock(clock,1,31000),[270,300]);
assert.equal(t.freezeClock(clock,1,31000),false);
assert.equal(clock.remaining[0],270);
assert.equal(clock.startedAt,null);
t.startClock(clock,40000);
assert.equal(t.freezeClock(clock,1,340001),true);
assert.equal(clock.remaining[0],0);
assert.equal(t.makeClock(0,0),null);
assert.throws(()=>t.makeClock(181,0));
assert.throws(()=>t.makeClock(5,999));
assert.throws(()=>t.copyClock({remaining:[-1,300],increment:0}));
const copied=t.copyClock({remaining:[45,60],initialSeconds:180,increment:2,startedAt:100});
assert.equal(copied.startedAt,null);
assert.equal(copied.remaining[0],45);
const gs=[
 {humanColor:1,strength:5,moves:["e2e4","e7e5"],turn:1,finished:"Schachmatt"},
 {humanColor:-1,strength:14,moves:Array(90).fill("e2e4"),turn:1,finished:"Patt"},
 {humanColor:1,strength:11,moves:[],turn:-1,finished:"Zeitüberschreitung (Schwarz gewinnt)"},
 {humanColor:1,strength:4,moves:[],turn:1,finished:""}
];
const a=t.analyze(gs);
assert.equal(a.finished,3);
assert.equal(a.wins,0);
assert.equal(a.losses,2);
assert.equal(a.draws,1);
assert.equal(a.total,4);
assert.equal(t.result(gs[0]),"Niederlage");
assert.equal(t.result(gs[1]),"Remis");
assert.equal(t.result(gs[2]),"Niederlage");
assert.equal(t.result(gs[3]),"offen");
const plan=t.training(gs);
assert.ok(plan.some(x=>x.key==="defense"));
assert.ok(plan.some(x=>x.key==="endgame"));
assert.ok(plan.some(x=>x.key==="time"));
assert.match(src,/SchachNovaNotation\.generate/);
assert.match(src,/function pgnGame\(g,index\)/);
assert.match(src,/function tickClocks\(\)/);
assert.match(src,/sessionTools\.freezeClock/);
assert.match(src,/simultanClockApply/);
assert.match(html,/id="simultanDiagnostics"/);
assert.match(diag,/requestAnimationFrame/);
assert.match(android,/ACTION_CREATE_DOCUMENT/);
assert.match(android,/ACTION_OPEN_DOCUMENT/);
assert.match(android,/Process\.getElapsedCpuTime\(\)/);
assert.match(android,/BatteryManager\.BATTERY_PROPERTY_CURRENT_NOW/);
console.log("Clock persistence, timeouts, statistics, training suggestions, Android import and diagnostics verified");
