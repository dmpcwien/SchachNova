/* Imported from supplied ZIP: mode selection and settings runtime regression. */
const fs=require("node:fs"),assert=require("node:assert/strict");
const js=fs.readFileSync("app/src/main/assets/game-mode-navigation.js","utf8");
const start=js.indexOf("function chooseMode("),end=js.indexOf("document.querySelectorAll('[data-mode]')");
assert(start>0&&end>start);
const body=js.slice(start,end);
assert.equal((body.match(/\b(const|let|var)\s+home\b/g)||[]).length,0,"chooseMode must not shadow outer home binding");
const el=()=>new Proxy({hidden:false,textContent:"",value:"",checked:false,dataset:{},classList:{add(){},remove(){},toggle(){}},scrollIntoView(){},click(){}},{get:(t,k)=>k in t?t[k]:undefined});
const stub={getElementById:()=>el(),querySelectorAll:()=>({forEach(){}}),addEventListener(){}};
const src=js.replace(/^\s*\n?\(function\(\)\{/,"").replace(/\}\)\(\);?\s*$/,"");
const fn=new Function("document","window",src.slice(0,src.indexOf("document.querySelectorAll('[data-mode]')"))+";return chooseMode;");
const chooseMode=fn(stub,{});
for(const mode of ["human","bot","coach","online","variants","blind"])chooseMode(mode);
const nav=fs.readFileSync("app/src/main/assets/home-navigation.js","utf8");
const open=nav.slice(nav.indexOf("function openSettings()"),nav.indexOf("function reset()"));
assert(/picker\.parentElement===setup[\s\S]*insertBefore\(picker,setup\)/.test(open),"design picker must leave hidden setup container");
console.log("PASS SchachNova: mode navigation, settings picker and runtime test.");
