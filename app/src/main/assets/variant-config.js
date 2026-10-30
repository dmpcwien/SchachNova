"use strict";
/* SchachNova: zentrale Zuordnung der Varianten für Fairy-Stockfish.
 * Die Varianten werden erst freigeschaltet, wenn Regel- und Engine-Anbindung
 * einschließlich der Android-Assets vollständig getestet wurden.
 * GPLv3: https://github.com/fairy-stockfish/Fairy-Stockfish
 */
window.SchachNovaVariants=Object.freeze({
 standard:{label:"Klassisch",uci:"chess",local:true},
 hill:{label:"King of the Hill",uci:"kingofthehill",local:true},
 threecheck:{label:"Drei-Schach",uci:"3check",local:true},
 fivecheck:{label:"Fünf-Schach",uci:null,local:true,bot:true,botEngine:"local"},
 hoppelpoppel:{label:"Hoppel-Poppel",uci:null,local:true,bot:false},
 torpedo:{label:"Torpedo-Schach",uci:null,local:true,bot:true,botEngine:"local"},
 nocastling:{label:"Schach ohne Rochade",uci:null,local:true,bot:false},
 berolina:{label:"Berolina-Schach",uci:null,local:true,bot:false},
 antichess:{label:"Räuberschach",uci:"antichess",local:true,bot:true},
 chess960:{label:"Schach960",uci:"chess",uciChess960:true,local:false},
 atomic:{label:"Atomschach",uci:"atomic",local:true,bot:true},
 horde:{label:"Horde",uci:"horde",local:false},
 racingkings:{label:"Racing Kings",uci:"racingkings",local:false},
 crazyhouse:{label:"Crazyhouse",uci:"crazyhouse",local:false}
});
/* Complete documented catalog. A catalog entry is not proof of playable
 * local rules or of support in the bundled Fairy-Stockfish binary. */
window.SchachNovaVariantStatus=function(name){
 const catalog=window.SchachNovaVariantCatalog||[];
 const entry=catalog.find(item=>item.id===name);
 const config=window.SchachNovaVariants[name];
 return {
  id:name,
  label:config?.label||entry?.name||name,
  documented:!!entry||!!config,
  localRules:!!config?.local,
  engineConfigured:!!config?.uci,
  analysisEligible:!!config?.local&&!!config?.uci,
  requiresImplementation:!config?.local,
  reason:!config?.local
   ?"Regeln, Brett und Zugdarstellung müssen zuerst vollständig implementiert und getestet werden."
   :!config?.uci?"Keine geprüfte Engine-Konfiguration vorhanden.":"Lokale Regeln und Engine-Konfiguration vorhanden; Engine-Laufzeittest erforderlich."
 };
};
window.SchachNovaAllVariantStatuses=function(){
 const ids=new Set(["standard",...Object.keys(window.SchachNovaVariants),...(window.SchachNovaVariantCatalog||[]).map(v=>v.id)]);
 return [...ids].map(window.SchachNovaVariantStatus);
};
window.schachNovaVariantUciOptions=function(name){
 const variant=window.SchachNovaVariants[name];
 if(!variant)throw new Error("Unbekannte Schachvariante: "+name);
 return ["setoption name UCI_Variant value "+variant.uci,
         "setoption name UCI_Chess960 value "+(variant.uciChess960?"true":"false"),
         "ucinewgame"];
};
