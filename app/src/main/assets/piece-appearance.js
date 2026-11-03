
/* Distinct, locally generated sculpted chrome/sapphire SVG piece set.
   Existing SVG pieces remain available under Originalfiguren. */
(function(){
 const symbols={K:"♚",Q:"♛",R:"♜",B:"♝",N:"♞",P:"♟"};
 const cache={};
 function sculpted(color,type){
  const id=color+type;if(cache[id])return cache[id];
  const silver=color==="w",shine=silver?["#ffffff","#d7e5f6","#8197b4","#f4fbff","#607a9b"]:["#a5e8ff","#328fe6","#06316e","#4cb5ff","#001632"];
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><defs>'+
   '<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+shine[0]+'"/><stop offset=".25" stop-color="'+shine[1]+'"/><stop offset=".52" stop-color="'+shine[2]+'"/><stop offset=".72" stop-color="'+shine[3]+'"/><stop offset="1" stop-color="'+shine[4]+'"/></linearGradient>'+
   '<linearGradient id="base" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+shine[0]+'"/><stop offset=".45" stop-color="'+shine[2]+'"/><stop offset="1" stop-color="'+shine[4]+'"/></linearGradient>'+
   '<filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="3"/></filter></defs>'+
   '<ellipse cx="80" cy="145" rx="49" ry="7" fill="#000b23" opacity=".55" filter="url(#shadow)"/>'+
   '<text x="80" y="120" text-anchor="middle" font-size="120" font-family="DejaVu Sans,Segoe UI Symbol,serif" fill="#031c42" opacity=".8" transform="translate(2 3)">'+symbols[type]+'</text>'+
   '<text x="80" y="120" text-anchor="middle" font-size="120" font-family="DejaVu Sans,Segoe UI Symbol,serif" fill="url(#metal)" stroke="'+(silver?'#3b536e':'#001638')+'" stroke-width="1.7" paint-order="stroke">'+symbols[type]+'</text>'+
   '<path d="M38 128 Q80 121 122 128 L126 136 Q80 147 34 136Z" fill="url(#base)" stroke="'+(silver?'#657d9c':'#001e4b')+'" stroke-width="2"/>'+
   '<path d="M42 130 Q80 126 118 130" fill="none" stroke="'+shine[0]+'" stroke-width="2" opacity=".75"/></svg>';
  return cache[id]='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
 }
 function refresh(){
  const skin=document.body.dataset.pieceSkin;
  document.querySelectorAll('img.piece-img, img.rect-piece-svg, img.rect-compound-svg-icon, img.review-piece, img.simultan-piece').forEach(img=>{
   if(img.closest(".nova-motion-sprite"))return;
   const original=img.dataset.novaOriginal||img.getAttribute('src');
   if(!img.dataset.novaOriginal&&/^pieces\/[wb][KQRBNP]\.svg$/.test(original))img.dataset.novaOriginal=original;
   const path=img.dataset.novaOriginal;
   if(!path)return;
   const match=/^pieces\/([wb])([KQRBNP])\.svg$/.exec(path);
   if(!match)return;
   const wanted=skin==="silverblue"?sculpted(match[1],match[2]):skin==="warmwood"?`neo-assets/warmwood/pieces/${match[1]}${match[2]}.svg`:skin==="mochi"||skin==="mellow"?`neo-assets/${skin}/pieces/${match[1]}${match[2]}.webp`:path;
   if(img.getAttribute('src')!==wanted)img.setAttribute('src',wanted);
  });
 }
 document.addEventListener('DOMContentLoaded',()=>{
  const select=document.getElementById('novaPieceSkin');
  if(select)select.addEventListener('change',()=>requestAnimationFrame(refresh));
  new MutationObserver(()=>refresh()).observe(document.body,{childList:true,subtree:true});
  refresh();
 });
})();
