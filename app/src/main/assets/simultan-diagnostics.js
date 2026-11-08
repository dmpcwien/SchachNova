/* On-device opt-in diagnostics. Does not claim laboratory-grade energy measurements. */
(function(){
"use strict";
const $=id=>document.getElementById(id),panel=$("simultanDiagnosticsPanel"),output=$("simultanDiagnosticsContent"),start=$("simultanMeasure");
if(!panel||!output||!start)return;
let running=false,request=0;
function nativeSample(){
 try{const raw=window.AndroidPerf?.sample?.();return raw?JSON.parse(raw):null;}
 catch(_){return null;}
}
function formatNative(first,last){
 if(!first||!last)return "Android-Prozessdaten: im Browser nicht verfügbar.";
 const wall=last.elapsedMs-first.elapsedMs,process=last.processCpuMs-first.processCpuMs;
 const cpu=wall>0&&process>=0?Math.round(100*process/wall):null;
 const percent=Number.isInteger(last.batteryPercent)?last.batteryPercent:null;
 const current=Number.isFinite(last.batteryCurrentMicroAmp)?last.batteryCurrentMicroAmp:null;
 return "Geschätzte CPU-Prozesszeit: "+(cpu===null?"nicht verfügbar":cpu+" % eines CPU-Kerns")+
  " · Akkustand: "+(percent===null?"nicht verfügbar":percent+" %")+
  " · Momentaner Batteriestrom: "+(current===null?"nicht verfügbar":(current/1000).toFixed(0)+" mA")+
  ". Der Stromwert ist eine geräteabhängige Momentaufnahme, keine Akkulaufzeitmessung.";
}
function close(){
 panel.hidden=true;
 if(running){running=false;cancelAnimationFrame(request);}
 start.disabled=false;
}
$("simultanDiagnostics")?.addEventListener("click",()=>{panel.hidden=false;});
$("simultanDiagnosticsClose")?.addEventListener("click",close);
start.addEventListener("click",()=>{
 if(running)return;
 running=true;start.disabled=true;
 const begin=performance.now(),nativeBefore=nativeSample();
 let frames=0,total=0,maxGap=0,last=begin;
 output.textContent="Messung läuft: 10 Sekunden, Bildschirm und App sichtbar lassen.";
 const step=now=>{
  if(!running)return;
  if(document.hidden){close();output.textContent="Messung abgebrochen: App im Hintergrund.";return;}
  const gap=now-last;if(gap>0){total+=gap;maxGap=Math.max(maxGap,gap);}
  last=now;frames++;
  if(now-begin<10000){request=requestAnimationFrame(step);return;}
  running=false;start.disabled=false;
  const elapsed=(now-begin)/1000,mean=frames/elapsed;
  const min=Math.max(0,Math.round(mean));
  const nativeAfter=nativeSample();
  const memory=Number.isFinite(performance.memory?.usedJSHeapSize)?Math.round(performance.memory.usedJSHeapSize/1048576)+" MiB":"nicht verfügbar";
  output.textContent="Dauer "+elapsed.toFixed(1)+" s · Bildschirm-Callbacks Ø "+min+"/s"+
   " · längste Pause "+maxGap.toFixed(0)+" ms · JS-Heap "+memory+". "+
   formatNative(nativeBefore,nativeAfter)+
   " Die Bildrate stammt aus requestAnimationFrame, nicht aus einem gemessenen Schachzug. Für belastbare Akkuvergleiche mehrere gleich lange Spieltests unter gleichen Bedingungen durchführen.";
 };
 request=requestAnimationFrame(step);
});
})();