
/* Native Android back key: close the innermost active screen first. */
window.schachNovaGoBack=function(){
 const visible=id=>{const e=document.getElementById(id);return e&&!e.hidden&&getComputedStyle(e).display!=='none'};
 const click=id=>{const e=document.getElementById(id);if(e){e.click();return true}return false};
 if(visible('simultanPanel'))return click('simultanClose');
 if(visible('reviewOverview'))return click('overviewClose')||click('reviewBack');
 if(visible('reviewScreen'))return click('reviewBack');
 if(visible('coordinateScreen'))return click('coordinateBack');
 if(visible('trainingScreen'))return click('trainingBack')||click('trainingExit');
 if(visible('gameScreen'))return click('backHome');
 const home=document.getElementById('homeScreen');
 const setup=document.getElementById('novaGameSetup');
 if(home&&home.classList.contains('nova-setup-mode')){
  home.classList.remove('nova-setup-mode');
  if(setup)setup.hidden=true;
  document.querySelectorAll('#novaPlaySection [data-mode].active').forEach(b=>b.classList.remove('active'));
  return true;
 }
 if(home&&home.classList.contains('nova-show-design')){home.classList.remove('nova-show-design');return true}
 if(home&&home.classList.contains('nova-submenu'))return click('novaBackHome');
 if(setup&&!setup.hidden){setup.hidden=true;return true}
 return false;
};
