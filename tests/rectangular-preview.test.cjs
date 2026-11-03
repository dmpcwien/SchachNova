"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("app/src/main/assets/index.html","utf8");
const js=fs.readFileSync("app/src/main/assets/rectangular-preview.js","utf8");
const standardChess=fs.readFileSync("app/src/main/assets/chess.js","utf8");
const animator=fs.readFileSync("app/src/main/assets/move-animator.js","utf8");
assert.match(animator,/cubic-bezier\(\.25,\.74,\.26,1\)/);

const css=fs.readFileSync("app/src/main/assets/schachnova-theme.css","utf8");
const homeNavigation=fs.readFileSync("app/src/main/assets/home-navigation.js","utf8");
const gameNavigation=fs.readFileSync("app/src/main/assets/game-mode-navigation.js","utf8");
assert.match(html,/<script src="home-navigation.js"><\/script>/);
assert.match(homeNavigation,/function closeSettings\(\)/);
assert.match(homeNavigation,/setup\.hidden=false/);
assert.match(homeNavigation,/button\.dataset\.mode/);
assert.doesNotMatch(gameNavigation,/chooseMode\('human'\);\s*\}\)\(\);/);
assert.match(homeNavigation,/const section=button\.dataset\.section/);
assert.match(homeNavigation,/panel\.hidden=name!==section/);
assert.match(homeNavigation,/tab\.classList\.toggle\('active',active\)/);
assert.match(homeNavigation,/if\(target==='settings'\)\{openSettings\(\);return;\}/);
assert.match(homeNavigation,/enter\(\);\s*actions\[target\]/);
assert.match(css,/#homeScreen:not\(\.nova-show-design\) #novaDesignPicker\{display:none!important\}/);

assert.match(css,/#settingsPanel\[hidden\]\{display:none!important\}/);

assert.match(gameNavigation,/home\?\.classList\.add\('nova-submenu','nova-setup-mode'\)/);
assert.match(gameNavigation,/setup\.hidden=false/);
assert.match(css,/#homeScreen\.nova-setup-mode #novaPlaySection\{display:none!important\}/);
assert.match(css,/#homeScreen #novaGameSetup\[hidden\]\{display:none!important\}/);

assert.match(gameNavigation,/document\.getElementById\('settingsPanel'\)\.hidden=true;home\.hidden=true;game\.hidden=false/);
for(const id of ["settingsBoardSkin","settingsPieceSkin"])assert.ok(html.includes('id="'+id+'"'));
assert.ok(html.includes('<script src="settings-appearance.js"></script>'));
const settingsAppearance=fs.readFileSync("app/src/main/assets/settings-appearance.js","utf8");
assert.match(settingsAppearance,/source.dispatchEvent\(new Event\('change'/);

for(const name of ["game-mode-navigation.js","android-back-navigation.js"]){assert.ok(html.includes('<script src="'+name+'"></script>'));assert.ok(fs.readFileSync("app/src/main/assets/"+name,"utf8").length>100);}
assert.match(fs.readFileSync("app/src/main/assets/game-mode-navigation.js","utf8"),/function chooseMode\(value\)/);
assert.match(fs.readFileSync("app/src/main/assets/android-back-navigation.js","utf8"),/window.schachNovaGoBack=function/);
for(const name of ["appearance-preferences.js","piece-appearance.js"]){assert.ok(html.includes('<script src="'+name+'"></script>'));assert.ok(fs.readFileSync("app/src/main/assets/"+name,"utf8").length>100);}
assert.ok(html.indexOf('src="appearance-preferences.js"')<html.indexOf('src="piece-appearance.js"'));
assert.match(html,/<link rel="stylesheet" href="schachnova-theme.css">/);
for(const name of ["capablanca","janus"]){
 assert.match(html,new RegExp('data-rect-preview="'+name+'"'));
 assert.match(js,new RegExp('rules.initial\\(name\\)'));
}
for(const script of ["board-geometry.js","rectangular-rules.js","rectangular-preview.js"])assert.ok(html.includes('<script src="'+script+'"></script>'));
assert.ok(html.indexOf('src="board-geometry.js"')<html.indexOf('src="rectangular-rules.js"'));
assert.ok(html.indexOf('src="rectangular-rules.js"')<html.indexOf('src="rectangular-preview.js"'));
assert.match(html,/rectPreview\x22 class=\x22rect-preview-panel\x22 hidden/);
assert.match(js,/board.replaceChildren\(fragment\)/);
for(const id of ["rectPreviewUndo","rectPreviewFlip","rectPreviewRestart"])assert.ok(html.includes('id="'+id+'"'));
assert.match(js,/rules.legalMoves\(position\)/);
assert.match(js,/rules.apply\(position,move\)/);
assert.doesNotMatch(js,/\b(?:localStorage|sessionStorage)\b/);
assert.match(js,/function captureMove\(move\)/);
assert.match(css,/\.rect-preview-motion-target>\.rect-piece-svg\{visibility:hidden\}/);
assert.match(js,/function clearMotion\(\)/);
assert.match(js,/return api.capture\(board,steps,cell\)/);
const classic=fs.readFileSync("app/src/main/assets/chess.js","utf8");
assert.match(classic,/function stopPieceAnimation\(\)/);
assert.match(animator,/prefers-reduced-motion: reduce/);
assert.match(animator,/batch.timer=setTimeout/);
assert.match(js,/clearMotion\(\);flipped=!flipped;render\(\)/);
assert.match(js,/const animated=captureMove\(move\)/);
assert.match(js,/SchachNovaMoveAnimator\?\.play\(animated\)/);
assert.doesNotMatch(js,/origin.cloneNode\(true\)/);
assert.match(css,/\.rect-preview-piece-motion\{[^}]*background:transparent!important/);
assert.match(js,/rect-compound-svg/);
assert.match(js,/parts=piece.toUpperCase\(\)==="C"\?\["R","N"\]:\["B","N"\]/);
assert.match(css,/\.rect-preview-motion-target \.rect-compound-svg\{visibility:hidden\}/);
assert.match(animator,/\.rect-piece-svg,\.rect-compound-svg/);
assert.match(animator,/node.cloneNode\(true\)/);
assert.match(css,/\.rect-preview-piece-motion>\.rect-compound-svg/);
console.log("SchachNova: 8x8 and 10x8 piece-only animation and cleanup tests passed");

const blindCss=fs.readFileSync("app/src/main/assets/schachnova-theme.css","utf8");
assert.match(blindCss,/#gameScreen #board \.sq>\.blind-disk/);
assert.match(blindCss,/aspect-ratio:1 \/ 1!important/);
assert.match(blindCss,/border-radius:50%!important/);

assert.match(blindCss,/#gameScreen #board \.sq>\.blind-disk\{[\s\S]*?position:absolute!important/);
assert.match(blindCss,/inset:12%!important/);
assert.match(blindCss,/height:76%!important/);
