'use strict';
/* Entrada permanente a la sala del grupo: ?grupo=CODIGO.
   Resuelve automáticamente qué juego está activo y recupera la identidad
   almacenada en este teléfono, incluso después de muchos cambios de juego. */
(function(){
const root=document.getElementById('app');
const api='https://stpylkumzuqvaioedvvi.supabase.co/rest/v1/rpc/';
const key='sb_publishable_gVmo2eopYweroU5p0edsxg_J87_ouk6';
const code=(new URLSearchParams(location.search).get('grupo')||'').toUpperCase().trim();
let active=false,failed='',running=false,interval=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const map={
 quien:{create:'create_room',join:'join_room',state:'ts_state',param:'sala',storage:c=>'quienSoy:session:'+c,last:'quienSoy:lastRoom',profile:'quienSoy:name'},
 cromazo:{create:'cp_create',join:'cp_join',state:'cp_state',param:'cartas',storage:c=>'cromazo:room:'+c,last:'cromazo:last',profile:'cromazo:nick'},
 impostor:{create:'im_create',join:'im_join',state:'im_state',param:'codigo',storage:c=>'impostor:sala:'+c,last:null,profile:'impostor:nombre'},
 queprefieres:{create:'qp_create',join:'qp_join',state:'qp_state',param:'codigo',storage:c=>'queprefieres:sala:'+c,last:null,profile:'queprefieres:nombre'}
};
function view(title,message,isError=false){
 root.innerHTML='<div class="party-app gu-landing"><header class="party-nav"><div class="party-container party-nav-inner">'+
 '<a class="party-brand" href="'+location.pathname+'"><span class="party-brand-icon">✦</span>¿Una partidita<span class="party-brand-question">?</span></a></div></header>'+
 '<main class="party-container party-main"><section class="party-panel gu-loading-card">'+
 '<span class="party-step">SALA DEL GRUPO · '+esc(code)+'</span><div class="gu-landing-symbol">'+(isError?'!':'✦')+'</div>'+
 '<h1>'+esc(title)+'</h1><p>'+esc(message)+'</p>'+
 (isError?'<button type="button" class="party-button party-primary" data-gu-retry>Reintentar</button>':'<div class="gu-wait-dots" aria-hidden="true"><span></span><span></span><span></span></div>')+
 '</section></main></div>';
}
async function rpc(method,args){
 const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),14000);
 try{
  const r=await fetch(api+method,{method:'POST',headers:{apikey:key,'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify(args),signal:ctl.signal});
  const raw=await r.text();let d;try{d=JSON.parse(raw)}catch{d=raw}
  if(!r.ok)throw Error(d?.message||'El servidor de salas no responde.');
  return d;
 }finally{clearTimeout(to)}
}
function member(){
 try{const obj=JSON.parse(localStorage.getItem('gu:member:'+code)||'null');
  return obj?.name&&/^[a-f0-9]{64}$/.test(obj.token)?obj:null;
 }catch{return null}
}
function route(game,gameCode){
 if(!map[game])throw Error('Juego desconocido');
 const path=game==='impostor'
  ?'?juego=impostor&modo=sala&codigo='+encodeURIComponent(gameCode)
  :game==='queprefieres'?'?juego=queprefieres&codigo='+encodeURIComponent(gameCode)
  :'?'+map[game].param+'='+encodeURIComponent(gameCode);
 location.replace(location.pathname+path);
}
function saveNative(game,gameCode,m){
 const info=map[game];
 localStorage.setItem(info.storage(gameCode),JSON.stringify({name:m.name,token:m.token}));
 if(info.last)localStorage.setItem(info.last,gameCode);
 if(info.profile)localStorage.setItem(info.profile,m.name);
 localStorage.setItem('gu:native:'+game+':'+gameCode,code);
 localStorage.setItem('gu:last',code);
}
async function activateTarget(state,m){
 const game=state.target_game,info=map[game];
 if(!info)throw Error('Este juego no está disponible para cambios de sala');
 const pendingKey='gu:pending:'+code+':'+game;
 let gameCode=localStorage.getItem(pendingKey);
 if(gameCode){
  try{await rpc(info.state,{p_code:gameCode,p_token:m.token})}
  catch{gameCode=null;localStorage.removeItem(pendingKey)}
 }
 if(!gameCode){
  view('Preparando '+(game==='quien'?'¿Quién soy?':game==='queprefieres'?'¿Qué prefieres?':game==='impostor'?'Impostor':'Cromazo'),
   'Estamos organizando el nuevo juego con vuestro grupo.');
  gameCode=await rpc(info.create,{p_name:m.name,p_token:m.token});
  localStorage.setItem(pendingKey,gameCode);
  saveNative(game,gameCode,m);
 }
 if(game==='quien'){
  // ¿Quién soy? requiere inicializar todas sus categorías antes de jugar.
  // Equivale a la configuración de una sala creada desde su pantalla normal.
  await rpc('update_settings',{p_code:gameCode,p_token:m.token,p_difficulty:'mixta',
   p_categories:['historia','ciencia','musica','cine','deporte','arte','politica','exploradores',
    'videojuegos','ficcion','mitologia','influencers']});
 }
 await rpc('gu_activate',{p_code:code,p_token:m.token,p_game_code:gameCode});
 localStorage.removeItem(pendingKey);
 saveNative(game,gameCode,m);
 route(game,gameCode);
}
async function joinTarget(state,m){
 const game=state.game,gameCode=state.game_code,info=map[game];
 if(!info||!gameCode)throw Error('No se puede abrir el nuevo juego.');
 const existing=localStorage.getItem(info.storage(gameCode));
 if(existing){
  try{
   const previous=JSON.parse(existing);
   if(previous?.token===m.token){
    await rpc(info.state,{p_code:gameCode,p_token:m.token});
    saveNative(game,gameCode,m);route(game,gameCode);return;
   }
  }catch{}
 }
 view('Entrando en '+(game==='quien'?'¿Quién soy?':game==='queprefieres'?'¿Qué prefieres?':game==='impostor'?'Impostor':'Cromazo'),
  'Conectando con tus compañeros, sin pedirte de nuevo el nombre.');
 await rpc(info.join,{p_code:gameCode,p_name:m.name,p_token:m.token});
 saveNative(game,gameCode,m);
 await rpc('gu_attach',{p_game:game,p_code:gameCode,p_token:m.token,p_name:m.name});
 route(game,gameCode);
}
async function step(){
 if(running||active)return;
 running=true;
 try{
  if(!/^[A-Z0-9]{6}$/.test(code))throw Error('El código de grupo no es válido.');
  const m=member();
  const status=m?await rpc('gu_status',{p_code:code,p_token:m.token}):
   await rpc('gu_public',{p_code:code});
  if(!status||!map[status.game])throw Error('No se reconoce el juego de esta sala.');
  failed='';
  if(status.phase==='switching'){
   if(m&&status.is_host){
    active=true;await activateTarget(status,m);
   }else{
    view('Cambiando de juego','El anfitrión está preparando '+(map[status.target_game]?
     ({quien:'¿Quién soy?',cromazo:'Cromazo',impostor:'Impostor',queprefieres:'¿Qué prefieres?'})[status.target_game]:'el próximo juego')+
     '. Se abrirá automáticamente en cuanto esté listo.');
   }
  }else if(status.phase==='ready'&&status.game_code){
   active=true;
   if(m)await joinTarget(status,m);
   else route(status.game,status.game_code);
  }else{
   view('Preparando la partida','La sala se está sincronizando con los demás jugadores.');
  }
 }catch(e){
  failed=e.message||'No se pudo abrir el grupo';
  active=false;view('No se pudo abrir la sala',failed,true);
 }finally{running=false}
}
root.addEventListener('click',e=>{
 if(!e.target.closest('[data-gu-retry]'))return;
 e.preventDefault();step();
});
window.addEventListener('online',step);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')step()});
view('Abriendo vuestro grupo','Buscando el juego en el que estáis jugando.');
interval=setInterval(()=>{if(document.visibilityState==='visible'&&!active&&!failed)step()},2200);
step();
})();