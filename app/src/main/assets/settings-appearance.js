/* Settings controls mirror the existing home appearance picker. */
(function(){
 const pairs=[['novaBoardSkin','settingsBoardSkin'],['novaPieceSkin','settingsPieceSkin'],['novaSoundSkin','settingsSoundSkin']];
 for(const [sourceId,targetId] of pairs){
  const source=document.getElementById(sourceId),target=document.getElementById(targetId);
  if(!source||!target)continue;
  for(const option of source.options)target.add(option.cloneNode(true));
  target.value=source.value;
  target.addEventListener('change',()=>{
   source.value=target.value;
   source.dispatchEvent(new Event('change',{bubbles:true}));
  });
  source.addEventListener('change',()=>{target.value=source.value;});
 }
})();
