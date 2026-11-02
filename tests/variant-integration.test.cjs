// Verify the Atomschach UI, game restoration and variant configuration stay aligned.
const fs=require("node:fs");
const assert=require("node:assert/strict");
const html=fs.readFileSync("app/src/main/assets/index.html","utf8");
const navigation=fs.readFileSync("app/src/main/assets/game-mode-navigation.js","utf8");
const chess=fs.readFileSync("app/src/main/assets/chess.js","utf8");
const config=fs.readFileSync("app/src/main/assets/variant-config.js","utf8");
const bridge=fs.readFileSync("app/src/main/assets/stockfish-bridge.js","utf8");
assert.match(html,/<option value="atomic">Atomschach \(lokal, 2 Spieler\)<\/option>/,"Atomschach must be selectable");
assert.match(navigation,/variantVsBotEl\.disabled=true/,"Unsupported variant bot checkbox must be disabled");
assert.match(chess,/\["standard","hill","threecheck","fivecheck","hoppelpoppel","torpedo","berolina","nocastling","antichess","atomic"\]\.includes\(d\.variantMode\)/,"Atomic save restore must be allowed");
assert.match(chess,/\["standard","hill","threecheck","fivecheck","hoppelpoppel","torpedo","berolina","nocastling","antichess","atomic"\]\.includes\(v\)/,"Atomic mode setter must be allowed");
assert.match(chess,/if\(variantMode==="atomic"\)\{const outcome=status\(\)/,"Finished atomic game must restore its result");
assert.match(bridge,/SchachNovaVariants\?\.\[variantMode\]\?\.bot===false/,"Engine bridge must enforce unsupported variant bots");
assert.match(bridge,/if\(variantMode!=="standard"\)\{setInfo\("Stockfish-Analyse für diese Variante noch nicht freigegeben"\)/,"Standard Stockfish analysis must reject variants");
assert.doesNotMatch(bridge,/coachEnabled&&variantMode==="standard"/,"Duplicate Coach analysis must not be started by bot transport");
assert.match(bridge,/dedicated live-coach\.js owns the Coach button/,"Only the Live-Coach owns its toggle");
const fairy=fs.readFileSync("app/src/main/assets/fairy-bridge.js","utf8");
assert.match(fairy,/ready=false;awaitingReady=true;for\(const cmd/,"Fairy must await variant configuration");
assert.match(bridge,/fairy\.configure\(variantMode\);fairyVariant=variantMode;watchFairy\("Konfiguration"\);return;/,"Variant search must wait for readyok (with watchdog)");
assert.match(fairy,/for\(const cmd of window\.schachNovaVariantUciOptions\(name\)\)post\(cmd\);post\("isready"\);/,"Fairy must explicitly request readyok after variant options");
assert.match(fairy,/const completed=request;request=null;if\(completed&&uciMove\(move\)\)notify\("bestmove"/,"Fairy request must be cleared before notifying listeners");
assert.match(bridge,/catch\(e\)\{fairyRequested=false;fairyFaulted=true;setInfo\("⚠ Engine-Start fehlgeschlagen\. Notfallmodus: lokaler Ersatzgegner\."\);playVariantFallback\(\);\}/,"Fairy startup failure must permit retry and fall back to the local opponent");
assert.match(bridge,/if\(event\.type==="error"\)\{clearFairyWatchdog\(\);fairyReady=false;fairyVariant=null;/,"Fairy errors must invalidate variant state");
assert.match(fairy,/worker.onerror=e=>\{if\(!worker\)return;const failed=worker;worker=null;/,"Fairy worker errors must release failed worker");
assert.match(fairy,/failed\.terminate\(\)/,"Failed Fairy worker must be terminated");
assert.match(bridge,/engine.onerror=\(\)=>\{if\(worker===engine\)standardFailure/,"Classical Stockfish must recover from worker failures");
assert.match(bridge,/botPosition=movesPlayed\.map\(notation\)\.join\(" "\)/,"Classical bot must snapshot position");
assert.match(bridge,/if\(expected!==movesPlayed\.map\(notation\)\.join\(" "\)\)return;/,"Classical bot must reject stale result");
assert.match(fairy,/catch\(e\)\{if\(worker\)\{try\{worker\.terminate\(\);\}/,"Fairy startup exception must terminate worker");
console.log("SchachNova: variant integration assertions passed");


const vm=require("node:vm");
const catalog=fs.readFileSync("app/src/main/assets/variant-catalog.js","utf8");
const review=fs.readFileSync("app/src/main/assets/game-review.js","utf8");
const context={window:{}};
vm.runInNewContext(catalog,context);
vm.runInNewContext(config,context);
const all=context.window.SchachNovaAllVariantStatuses();
const documented=context.window.SchachNovaVariantCatalog;
assert.equal(documented.length,30,"All 30 documented variants must remain available in the catalog");
for(const item of documented){
 const status=context.window.SchachNovaVariantStatus(item.id);
 assert.equal(status.documented,true,item.id+" must remain documented");
 assert.equal(status.analysisEligible,Boolean(status.localRules&&status.engineConfigured),item.id+" cannot be marked ready without rules and engine");
}
// Five-check runs with local rules and a local computer opponent; Fairy UCI is not configured.
assert.equal(context.window.SchachNovaVariantStatus("fivecheck").localRules,true,"Five-check local rules must remain enabled");
assert.equal(context.window.SchachNovaVariantStatus("fivecheck").analysisEligible,false,"Five-check must not claim unavailable Fairy engine analysis");
assert.equal(context.window.SchachNovaVariants.fivecheck.botEngine,"local","Five-check uses local opponent without Fairy");
for(const id of ["standard","hill","threecheck","antichess","atomic"]){
 assert.equal(context.window.SchachNovaVariantStatus(id).analysisEligible,true,id+" must have a local rules/engine configuration");
}
for(const id of ["shogi","xiangqi","janggi","capablanca","crazyhouse","horde","racingkings"]){
 assert.equal(context.window.SchachNovaVariantStatus(id).analysisEligible,false,id+" must not be presented as fully playable yet");
}
assert.ok(all.length>=30,"Status API must cover the complete catalog");
assert.match(review,/SchachNovaVariantStatus\?\.\(variantMode\)\?\.analysisEligible/,"Review must check variant capability before analysis");
assert.match(review,/variant\?"fairy-stockfish\.js":"stockfish-19-lite-single\.js"/,"Review must select Fairy engine for supported variants");
assert.match(review,/Fairy-Stockfish init error/,"Review must surface missing engine assets");
console.log("SchachNova: all documented variant statuses and analysis routing checked");

assert.match(html,/<option value="fivecheck">Fünf-Schach \(lokaler Computergegner\)<\/option>/,"Five-check local bot must be labeled correctly");
assert.match(chess,/variantMode==="fivecheck"\?5:3/,"Five-check must end after five checks");

assert.match(html,/<option value="hoppelpoppel">Hoppel-Poppel \(lokal, 2 Spieler\)<\/option>/);
assert.match(chess,/variantMode==="hoppelpoppel"&&p==="b"\?dirs\.n/);
assert.equal(context.window.SchachNovaVariantStatus("hoppelpoppel").localRules,true);
assert.equal(context.window.SchachNovaVariantStatus("hoppelpoppel").analysisEligible,false,"No unverified Fairy analysis");

for(const id of ["torpedo","berolina"]){assert.equal(context.window.SchachNovaVariantStatus(id).localRules,true);assert.equal(context.window.SchachNovaVariantStatus(id).analysisEligible,false);assert.match(html,new RegExp('<option value="'+id+'">'));}
assert.match(chess,/variantMode==="torpedo"\|\|/,"Torpedo must allow two-square pawn advances");
assert.match(chess,/variantMode==="berolina"/,"Berolina must have distinct pawn movement");

// Torpedo pawns may advance two empty squares from ANY rank, not only their home rank.
assert.match(chess,/variantMode==="torpedo"\|\|\(f>>4\)===\(s\.t===1\?6:1\)/,"Torpedo must allow a double-step after the pawn has moved");
assert.match(navigation,/selectedMode=document\.querySelector\('#novaPlaySection \[data-mode\]\.active'\)\?\.dataset\.mode/,"Launch must read the actual selected game mode");
assert.match(navigation,/variantMode=mode==='variants'\?document\.getElementById\('variantSelect'\)\.value:'standard'/,"Selected variant must be applied before new game");

assert.match(html,/<option value="nocastling">Schach ohne Rochade/);
assert.match(chess,/variantMode!=="nocastling"&&f===home/);
assert.match(config,/nocastling:\{label:"Schach ohne Rochade",uci:null,local:true,bot:false\}/);
assert.match(navigation,/const botSupported=window\.SchachNovaVariants\?\.\[selectedVariant\]\?\.bot!==false/);

assert.match(navigation,/const unsupported=window\.SchachNovaVariants\?\.\[variantSelectEl\.value\]\?\.bot===false/);
assert.match(config,/atomic:\{label:"Atomschach",uci:"atomic",local:true,bot:true\}/);
assert.match(config,/antichess:\{label:"Räuberschach",uci:"antichess",local:true,bot:true\}/);
assert.match(config,/torpedo:\{label:"Torpedo-Schach",uci:null,local:true,bot:true,botEngine:"local"\}/);
assert.match(bridge,/function playTorpedoBot\(\)/);
assert.match(bridge,/const options=legal\(position\)/);
assert.match(bridge,/if\(variantMode==="torpedo"\)\{playTorpedoBot\(\);return;\}/);
