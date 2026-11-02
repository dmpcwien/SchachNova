/* Single owner for home menu navigation: prevent settings from leaking into play. */
(function(){
 const home=document.getElementById('homeScreen'),setup=document.getElementById('novaGameSetup'),picker=document.getElementById('novaDesignPicker'),panel=document.getElementById('settingsPanel'),back=document.getElementById('novaBackHome');
 if(!home||!setup||!picker||!back)return;
 function closeSettings(){
  home.classList.remove('nova-show-design');
  if(panel)panel.hidden=true;
 }
 function enter(){
  closeSettings();
  home.classList.add('nova-submenu');
  window.scrollTo({top:0,behavior:'smooth'});
 }
 function openSettings(){
  // The setup container is hidden in settings; move its design picker outside first.
  if(picker.parentElement===setup&&setup.parentElement)setup.parentElement.insertBefore(picker,setup);
  home.classList.add('nova-submenu','nova-show-design');
  home.classList.remove('nova-setup-mode');
  setup.hidden=true;
  if(panel)panel.hidden=true;
  picker.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function reset(){
  closeSettings();
  home.classList.remove('nova-submenu','nova-setup-mode');
  document.querySelectorAll('#novaPlaySection [data-mode].active').forEach(b=>b.classList.remove('active'));
  setup.hidden=true;
  for(const name of ['play','training','analysis','profile']){
   const view=document.getElementById('nova'+name[0].toUpperCase()+name.slice(1)+'Section');
   if(view)view.hidden=name!=='play';
  }
  document.querySelectorAll('.nova-main-nav .nova-nav').forEach(tab=>{
   const selected=tab.dataset.section==='play';tab.classList.toggle('active',selected);
   tab.setAttribute('aria-current',selected?'page':'false');
  });
  window.scrollTo({top:0,behavior:'smooth'});
 }
 const actions={
  play:()=>document.querySelector('.nova-nav[data-section="play"]')?.click(),
  online:()=>document.querySelector('#novaPlaySection [data-mode="online"]')?.click(),
  training:()=>document.querySelector('.nova-nav[data-section="training"]')?.click(),
  variants:()=>document.querySelector('#novaPlaySection [data-mode="variants"]')?.click(),
  analysis:()=>document.querySelector('.nova-nav[data-section="analysis"]')?.click(),
  blind:()=>document.querySelector('#novaPlaySection [data-mode="blind"]')?.click(),
  simultan:()=>document.getElementById('simultanOpen')?.click()
 };
 back.addEventListener('click',reset);
 document.querySelectorAll('[data-nova-jump]').forEach(button=>button.addEventListener('click',()=>{
  const target=button.dataset.novaJump;
  if(target==='settings'){openSettings();return;}
  if(target==='simultan'){actions.simultan();return;}
  enter();
  actions[target]?.();
 }));
 document.querySelectorAll('.nova-main-nav .nova-nav').forEach(button=>button.addEventListener('click',()=>{
  enter();
  const section=button.dataset.section;
  if(!['play','training','analysis','profile'].includes(section))return;
  for(const name of ['play','training','analysis','profile']){
   const panel=document.getElementById('nova'+name[0].toUpperCase()+name.slice(1)+'Section');
   if(panel)panel.hidden=name!==section;
  }
  document.querySelectorAll('.nova-main-nav .nova-nav').forEach(tab=>{
   const active=tab.dataset.section===section;
   tab.classList.toggle('active',active);
   tab.setAttribute('aria-current',active?'page':'false');
  });
  if(section!=='play'){
   setup.hidden=true;
   home.classList.remove('nova-setup-mode');
  }else{
   const selected=!!document.querySelector('#novaPlaySection [data-mode].active');
   home.classList.toggle('nova-setup-mode',selected);
   setup.hidden=!selected;
  }
}));
 // Defensive fallback: a mode tap must always reveal the setup even if another listener fails.
 document.querySelectorAll('#novaPlaySection [data-mode]').forEach(button=>button.addEventListener('click',()=>{
  closeSettings();
  const mode=button.dataset.mode;
  if(mode==='training'||mode==='analysis')return;
  home.classList.add('nova-submenu','nova-setup-mode');
  home.classList.remove('nova-show-design');
  for(const section of ['play','training','analysis','profile']){
   const view=document.getElementById('nova'+section[0].toUpperCase()+section.slice(1)+'Section');
   if(view)view.hidden=section!=='play';
  }
  setup.hidden=false;
  document.querySelectorAll('#novaPlaySection [data-mode]').forEach(item=>item.classList.toggle('active',item===button));
  const variant=document.getElementById('variantChooser'),blind=document.getElementById('blindChooser');
  if(variant)variant.hidden=mode!=='variants';
  if(blind)blind.hidden=mode!=='blind';
  const strength=document.getElementById('homeBotStrength');
  if(strength)strength.hidden=!['bot','coach'].includes(mode);
 }));

})();
