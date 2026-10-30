
(function(){
const home=document.getElementById('homeScreen'),game=document.getElementById('gameScreen'),notice=document.getElementById('homeNotice');let mode='human',seconds=600,increment=0;
function chooseMode(value){
 document.getElementById('settingsPanel').hidden=true;
 home?.classList.remove('nova-show-design');
 if(value==='training'){if(typeof window.openSchachTraining==='function')window.openSchachTraining();else notice.textContent='Trainingsmenü konnte nicht geladen werden.';return;}
 if(value==='analysis'){document.getElementById('archiveOpen').click();return;}
 mode=value;
 const home=document.getElementById('homeScreen'),setup=document.getElementById('novaGameSetup');
 // Make the setup view exclusive: a selected mode must never leave the mode grid on top.
 for(const section of ['play','training','analysis','profile']){
  const element=document.getElementById('nova'+section[0].toUpperCase()+section.slice(1)+'Section');
  if(element)element.hidden=section!=='play';
 }
 home?.classList.add('nova-submenu','nova-setup-mode');
 home?.classList.remove('nova-show-design');
 setup.hidden=false;
 const variants=value==='variants',blind=value==='blind';
 document.getElementById('variantChooser').hidden=!variants;
 document.getElementById('blindChooser').hidden=!blind;
 for(const id of ['variantInfoCatalog','variantPlayModes']){const element=document.getElementById(id);if(element)element.hidden=!variants;}
 const opponent=document.getElementById('variantOpponent')?.value;
 const bot= value==='bot'||value==='coach'||(blind&&document.getElementById('blindVsBot').checked)||(variants&&opponent==='bot');
 document.getElementById('homeBotStrength').hidden=!bot;
 document.querySelectorAll('#novaPlaySection [data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===value));
 if(home){home.classList.add('nova-submenu','nova-setup-mode');home.classList.remove('nova-show-design');}
 notice.textContent=({online:'Online-Modus benötigt eine Serververbindung.',variants:'Nur freigeschaltete Varianten sind spielbar.'})[value]||'';
 setup.scrollIntoView({block:'start',behavior:'smooth'});
}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>chooseMode(b.dataset.mode)));
document.addEventListener('DOMContentLoaded',()=>{const picker=document.getElementById('novaDesignPicker'),setup=document.getElementById('novaGameSetup');if(picker&&setup&&picker.parentElement!==setup)setup.insertBefore(picker,document.getElementById('timeChooser')||setup.firstChild);});
function novaSection(name){document.getElementById('settingsPanel').hidden=true;document.getElementById('homeScreen')?.classList.remove('nova-show-design');for(const n of ['play','training','analysis','profile'])document.getElementById('nova'+n[0].toUpperCase()+n.slice(1)+'Section').hidden=n!==name;document.querySelectorAll('[data-section]').forEach(b=>{b.classList.toggle('active',b.dataset.section===name);b.setAttribute('aria-current',b.dataset.section===name?'page':'false');});const setup=document.getElementById('novaGameSetup'),home=document.getElementById('homeScreen');const selected=!!document.querySelector('#novaPlaySection [data-mode].active');setup.hidden=name!=='play'||!selected;if(home){home.classList.toggle('nova-setup-mode',name==='play'&&selected);home.classList.remove('nova-show-design');}}
document.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>novaSection(b.dataset.section)));

document.getElementById('novaTrainingOpen').onclick=()=>window.openSchachTraining?.();
document.getElementById('novaTrainingReview').onclick=()=>document.getElementById('archiveOpen')?.click();
document.getElementById('novaArchiveOpen').onclick=()=>document.getElementById('archiveOpen')?.click();
document.getElementById('novaAnalysisTraining').onclick=()=>document.getElementById('archiveOpen')?.click();
document.getElementById('novaProfileSettings').onclick=()=>document.getElementById('settingsButton')?.click();
document.querySelectorAll('[data-seconds]').forEach(b=>b.addEventListener('click',()=>{seconds=Number(b.dataset.seconds);increment=Number(b.dataset.increment||0);document.querySelectorAll('[data-seconds]').forEach(x=>x.classList.toggle('active',x===b));}));
document.getElementById('customTimeApply').onclick=()=>{seconds=Math.max(60,Math.min(7200,Number(document.getElementById('customMinutes').value||10)*60));increment=Math.max(0,Math.min(60,Number(document.getElementById('customIncrement').value||0)));document.querySelectorAll('[data-seconds]').forEach(x=>x.classList.remove('active'));notice.textContent='Eigene Zeit übernommen.'};
document.getElementById('launchGame').onclick=()=>{const selectedMode=document.querySelector('#novaPlaySection [data-mode].active')?.dataset.mode;if(selectedMode)mode=selectedMode;if(mode==='variants'&&document.getElementById('variantOpponent').value==='online'){notice.textContent='Online-Varianten sind noch nicht mit einem Spielserver verbunden.';return;}if(mode==='variants'&&document.getElementById('variantOpponent').value==='bot'&&window.SchachNovaVariants?.[document.getElementById('variantSelect').value]?.bot===false){notice.textContent='Für diese Variante ist der Computergegner noch nicht freigeschaltet. Bitte lokal mit zwei Spielern spielen.';return;}if(mode==='training'){window.openSchachTraining();return;}if(mode==='online'){notice.textContent='Online-Modus benötigt noch eine Serververbindung.';return;}const select=document.getElementById('timeSelect');if(![...select.options].some(o=>Number(o.value)===seconds)){const o=document.createElement('option');o.value=String(seconds);o.textContent=Math.round(seconds/60)+' Minuten';select.append(o);}select.value=String(seconds);if(mode==='bot'||mode==='coach'||(mode==='blind'&&document.getElementById('blindVsBot').checked)||(mode==='variants'&&document.getElementById('variantVsBot').checked)){const chosen=document.getElementById('homeBotLevel').value;document.getElementById('botLevel').value=chosen;document.getElementById('botLevel').dispatchEvent(new Event('change'));}const selectedVariant=mode==='variants'?document.getElementById('variantSelect').value:'standard';const botSupported=window.SchachNovaVariants?.[selectedVariant]?.bot!==false;document.getElementById('botMode').value=mode==='bot'||mode==='coach'||(mode==='blind'&&document.getElementById('blindVsBot').checked)||(mode==='variants'&&botSupported&&document.getElementById('variantVsBot').checked)?'bot':'human';document.getElementById('botMode').dispatchEvent(new Event('change'));document.getElementById('settingsPanel').hidden=true;home.hidden=true;game.hidden=false;variantMode=mode==='variants'?document.getElementById('variantSelect').value:'standard';document.getElementById('newGame').click();blindLevel=mode==='blind'?Number(document.getElementById('blindSelect').value):0;window.schachNovaBotColor=mode==='blind'&&document.getElementById('blindVsBot').checked&&document.getElementById('blindPlayerColor').value==='black'?1:-1;if(mode==='blind'&&document.getElementById('blindVsBot').checked){flipped=window.schachNovaBotColor===1;render();window.schachNovaBotKickoff?.();}checksGiven=[0,0];render();window.schachNovaIncrement=increment;if(mode==="coach"){window.SchachNovaLiveCoach?.enable(true);window.schachNovaBotKickoff?.();}else if(window.SchachNovaLiveCoach?.isEnabled()){window.SchachNovaLiveCoach.enable(false);}};
// Keep unsupported bot combinations disabled before the game starts.
const variantSelectEl=document.getElementById('variantSelect');
const variantVsBotEl=document.getElementById('variantVsBot');
function syncVariantBotChoice(source='variant'){
 const opponent=document.getElementById('variantOpponent');
 const message=document.getElementById('variantModeAvailability');
 const unsupported=window.SchachNovaVariants?.[variantSelectEl.value]?.bot===false;
 if(source==='checkbox'&&opponent)opponent.value=variantVsBotEl.checked?'bot':'local';
 if(unsupported){
  variantVsBotEl.checked=false;
  variantVsBotEl.disabled=true;
  if(opponent&&opponent.value==='bot')opponent.value='local';
 }else{
  variantVsBotEl.disabled=false;
  if(opponent)variantVsBotEl.checked=opponent.value==='bot';
 }
 const strength=document.getElementById('homeBotStrength');
 if(strength&&mode==='variants')strength.hidden=!variantVsBotEl.checked;
 if(message){
  message.textContent=unsupported
   ?'Diese Variante ist nur für zwei Personen am selben Gerät freigeschaltet. Computer- und Onlinepartien sind nicht verfügbar.'
   :opponent?.value==='online'
    ?'Online-Varianten benötigen eine aktive Serververbindung und sind noch nicht freigeschaltet.'
    :opponent?.value==='bot'
     ?'Computergegner für diese Variante verfügbar.'
     :'Lokaler Spielmodus: zwei Personen am selben Gerät.';
 }
}
variantSelectEl.addEventListener('change',syncVariantBotChoice);
document.getElementById('variantOpponent').addEventListener('change',syncVariantBotChoice);
variantVsBotEl.addEventListener('change',()=>syncVariantBotChoice('checkbox'));
document.getElementById('blindVsBot').addEventListener('change',()=>{if(mode==='blind')document.getElementById('homeBotStrength').hidden=!document.getElementById('blindVsBot').checked;});
syncVariantBotChoice();
document.getElementById('backHome').onclick=()=>{game.hidden=true;home.hidden=false;};document.getElementById('exportGame').onclick=()=>exportPgn();document.getElementById('claimDraw').onclick=()=>claimDraw();document.getElementById('agreeDraw').onclick=()=>agreeDraw();document.getElementById('removePremove').onclick=()=>removeLastPremove();document.getElementById('clearPremoves').onclick=()=>clearPremoves();document.getElementById('resultReviewButton').onclick=()=>{document.getElementById('resultDialog').hidden=true;document.getElementById('openReview').click();};document.getElementById('closeResultButton').onclick=()=>document.getElementById('resultDialog').hidden=true;document.getElementById('rematchButton').onclick=()=>{document.getElementById('resultDialog').hidden=true;document.getElementById('newGame').click();};
document.getElementById('newGame').textContent='♙ Neue Partie';
// Do not open a setup screen automatically during initialization.
})();
