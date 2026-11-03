'use strict';
/* Enlace de grupo permanente.
   ?grupo=ABC123 conserva el enlace al cambiar el juego activo en la misma sala. */
(async function(){
const root=document.getElementById('app');
const code=(new URLSearchParams(location.search).get('grupo')||'').trim().toUpperCase();
const api='https://stpylkumzuqvaioedvvi.supabase.co/rest/v1/rpc/gp_resolve';
const key='sb_publishable_gVmo2eopYweroU5p0edsxg_J87_ouk6';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
function screen(title,message){
 root.innerHTML='<div class="party-app"><header class="party-nav"><div class="party-container party-nav-inner"><a class="party-brand" href="'+location.pathname+'"><span class="party-brand-icon">✦</span>¿Una partidita<span class="party-brand-question">?</span></a></div></header>'+
 '<main class="party-container party-main"><div class="party-panel gp-entry-message"><span class="party-step">SALA COMPARTIDA</span><h1>'+esc(title)+'</h1><p>'+esc(message)+'</p><a class="party-button party-primary" href="'+location.pathname+'">Volver a los juegos</a></div></main></div>';
}
if(!/^[A-F0-9]{6}$/.test(code)){screen('Código incorrecto','Comprueba el enlace de invitación que te han enviado.');return;}
screen('Abriendo la sala '+code,'Buscando a qué está jugando tu grupo…');
try{
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 let response;
 try{
  response=await fetch(api,{method:'POST',headers:{apikey:key,'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({p_code:code}),signal:controller.signal});
 }finally{clearTimeout(timeout)}
 const raw=await response.text();let data;try{data=JSON.parse(raw)}catch{data={}}
 if(!response.ok)throw Error(data.message||'No se puede encontrar la sala.');
 if(!['impostor','queprefieres'].includes(data.game))throw Error('El juego activo no se encuentra disponible.');
 const target=data.game==='impostor'?'impostor:sala:':'queprefieres:sala:';
 const other=data.game==='impostor'?'queprefieres:sala:':'impostor:sala:';
 if(!localStorage.getItem(target+code)){
  const previous=localStorage.getItem(other+code);
  if(previous){
   try{const person=JSON.parse(previous);if(person?.name&&/^[a-f0-9]{64}$/.test(person.token))localStorage.setItem(target+code,JSON.stringify({name:person.name,token:person.token}));}catch{}
  }
 }
 const route=data.game==='impostor'?'?juego=impostor&modo=sala&codigo=':'?juego=queprefieres&codigo=';
 location.replace(location.pathname+route+encodeURIComponent(code));
}catch(e){
 screen('No se pudo abrir la sala',e.name==='AbortError'?'El servidor tardó demasiado en responder. Prueba a abrir el enlace de nuevo.':e.message||'Comprueba tu conexión e inténtalo de nuevo.');
}
})();