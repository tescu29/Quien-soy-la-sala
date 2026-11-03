'use strict';
/* Confirmaciones integradas en ¿Una partidita?
   Sustituye confirm() del navegador por un diálogo accesible y táctil. */
(function(){
 let active=null;
 function close(confirmed){
  if(!active)return;
  const dialog=active;
  active=null;
  document.removeEventListener('keydown',dialog.onKey,true);
  dialog.overlay.remove();
  document.body.style.overflow=dialog.previousOverflow;
  const previous=dialog.previousFocus;
  if(previous?.isConnected&&typeof previous.focus==='function'){
   try{previous.focus({preventScroll:true})}catch{previous.focus()}
  }
  dialog.resolve(confirmed);
 }
 function confirm({title='¿Seguro que quieres continuar?',detail='',confirmText='Confirmar',cancelText='Cancelar',tone='normal'}={}){
  if(active)close(false);
  return new Promise(resolve=>{
   const overlay=document.createElement('div');
   overlay.className='party-confirm-overlay';
   overlay.innerHTML=
    '<section class="party-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="party-confirm-title" aria-describedby="party-confirm-detail">'+
     '<div class="party-confirm-icon" aria-hidden="true">?</div>'+
     '<h2 id="party-confirm-title"></h2>'+
     '<p id="party-confirm-detail"></p>'+
     '<div class="party-confirm-actions">'+
      '<button class="party-confirm-cancel" type="button" data-dialog-cancel></button>'+
      '<button class="party-confirm-accept" type="button" data-dialog-accept></button>'+
     '</div>'+
    '</section>';
   const dialog=overlay.querySelector('.party-confirm-dialog');
   dialog.classList.toggle('party-confirm-danger',tone==='danger');
   overlay.querySelector('#party-confirm-title').textContent=title;
   const detailNode=overlay.querySelector('#party-confirm-detail');
   detailNode.textContent=detail;
   if(!detail)detailNode.hidden=true;
   const cancel=overlay.querySelector('[data-dialog-cancel]');
   const accept=overlay.querySelector('[data-dialog-accept]');
   cancel.textContent=cancelText;
   accept.textContent=confirmText;
   cancel.addEventListener('click',()=>close(false));
   accept.addEventListener('click',()=>close(true));
   overlay.addEventListener('click',event=>{if(event.target===overlay)close(false)});
   const onKey=event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(false);return}
    if(event.key!=='Tab')return;
    if(event.shiftKey&&document.activeElement===cancel){event.preventDefault();accept.focus();}
    else if(!event.shiftKey&&document.activeElement===accept){event.preventDefault();cancel.focus();}
   };
   active={overlay,resolve,onKey,previousFocus:document.activeElement,previousOverflow:document.body.style.overflow};
   document.body.appendChild(overlay);
   document.body.style.overflow='hidden';
   document.addEventListener('keydown',onKey,true);
   cancel.focus();
  });
 }
 window.PartyDialogs={confirm};
})();