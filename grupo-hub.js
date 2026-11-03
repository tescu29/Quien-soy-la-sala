'use strict';
/* Sala universal para los cuatro juegos con salas.
   Cada jugador mantiene su token; la invitación ?grupo= es permanente.
   El servidor verifica identidad, anfitrión y final real de ronda. */
(function(){
const api='https://stpylkumzuqvaioedvvi.supabase.co/rest/v1/rpc/';
const key='sb_publishable_gVmo2eopYweroU5p0edsxg_J87_ouk6';
const GAMES=[
 {id:'quien',title:'¿Quién soy?',desc:'Adivina tu personaje'},
 {id:'cromazo',title:'Cromazo',desc:'Cartas y caos'},
 {id:'impostor',title:'Impostor',desc:'Encuentra al infiltrado',min:3},
 {id:'queprefieres',title:'¿Qué prefieres?',desc:'Dilemas y votaciones'}
];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let attached=null,group='',nativeCode='',working=false,redirecting=false,failed='',timer=null;
const get=()=>attached?.session?.();
const nativeKey=(game,code)=>'gu:native:'+game+':'+code;
const groupKey=code=>'gu:member:'+code;
async function rpc(name,args){
 const controller=new AbortController(),to=setTimeout(()=>controller.abort(),13000);
 try{
  const r=await fetch(api+name,{method:'POST',headers:{apikey:key,'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify(args),signal:controller.signal});
  const body=await r.text();let data;try{data=JSON.parse(body)}catch{data=body}
  if(!r.ok)throw Error(data?.message||'No se pudo sincronizar el grupo.');
  return data;
 }finally{clearTimeout(to)}
}
function remember(code,me,game,roomCode){
 group=code;
 localStorage.setItem(groupKey(code),JSON.stringify({name:me.name,token:me.token}));
 localStorage.setItem(nativeKey(game,roomCode),code);
 localStorage.setItem('gu:last',code);
}
function inviteUrl(){return group?location.origin+location.pathname+'?grupo='+encodeURIComponent(group):null}
async function ensure(){
 const me=get();
 if(!attached||!me?.code||!me?.token||!me?.name)return null;
 if(nativeCode!==me.code){nativeCode=me.code;group=localStorage.getItem(nativeKey(attached.game,me.code))||'';}
 if(group){
  try{
   const status=await rpc('gu_status',{p_code:group,p_token:me.token});
   if(status?.code)return status;
  }catch(e){if(!/No se encuentra el grupo|No tienes acceso/.test(e.message))throw e;group='';}
 }
 const linked=await rpc('gu_attach',{p_game:attached.game,p_code:me.code,p_token:me.token,p_name:me.name});
 if(!linked)return null; // Invitado entra antes de que el anfitrión haya registrado la sala
 remember(linked.code,me,attached.game,me.code);
 return linked;
}
async function tick(){
 if(working||redirecting||!attached||document.visibilityState==='hidden')return;
 working=true;
 try{
  const me=get();
  if(!me?.code||!me?.token){nativeCode='';group='';return;}
  const status=await ensure();
  if(!status)return;
  failed='';
  if(status.phase==='switching'||status.game!==attached.game||status.game_code!==me.code){
   redirecting=true;
   location.assign(location.pathname+'?grupo='+encodeURIComponent(status.code));
  }
 }catch(e){failed=e.message||'Sin conexión con el grupo';}
 finally{working=false;}
}
async function switchGame(game){
 const current=GAMES.find(g=>g.id===game),me=get();
 if(!current||current.id===attached?.game||!me?.token)return;
 if(working)return;
 working=true;
 try{
  let info=await ensure();
  if(!info)throw Error('El grupo todavía no se ha sincronizado. Reinténtalo.');
  if(!info.is_host)throw Error('Solo el anfitrión puede cambiar de juego');
  const result=await rpc('gu_open',{p_code:info.code,p_token:me.token,p_target:game});
  redirecting=true;
  location.assign(location.pathname+'?grupo='+encodeURIComponent(result.code));
 }catch(e){failed=e.message||'No se pudo cambiar de juego';alert(failed)}
 finally{working=false;}
}
function menu(game,isHost,count){
 if(!attached||!GAMES.some(g=>g.id===game))return '';
 const options=GAMES.filter(g=>g.id!==game);
 return '<section class="gu-picker" aria-label="Elegir otro juego">'+
 '<div class="gu-picker-head"><span class="gu-kicker">MISMO GRUPO · OTRA PARTIDA</span>'+
 '<h2>¿A qué jugamos ahora?</h2><p>Sin volver a crear sala ni introducir nombres. Los móviles cambiarán juntos.</p></div>'+
 (isHost?'<div class="gu-game-grid">'+options.map(g=>
  '<button type="button" class="gu-game-choice" data-group-target="'+esc(g.id)+'" '+(g.min&&count<g.min?'disabled':'')+'>'+
  '<strong>'+esc(g.title)+'</strong><span>'+esc(g.desc)+'</span>'+
  (g.min&&count<g.min?'<small>Mínimo '+g.min+' jugadores</small>':'<small>Cambiar de juego →</small>')+'</button>'
 ).join('')+'</div>':
 '<p class="gu-await-host">El anfitrión elegirá el siguiente juego. Todos pasaréis automáticamente.</p>')+'</section>';
}
function attach(game,session){
 if(!GAMES.some(g=>g.id===game)||typeof session!=='function')return;
 attached={game,session};nativeCode='';group='';
 if(timer)clearInterval(timer);
 timer=setInterval(tick,2300);
 tick();
}
document.addEventListener('click',e=>{
 const button=e.target.closest?.('[data-group-target]');if(!button)return;
 e.preventDefault();e.stopPropagation();
 const target=button.dataset.groupTarget;
 if(!GAMES.some(g=>g.id===target)||button.disabled)return;
 switchGame(target);
},true);
window.GroupHub={attach,menu,inviteUrl,ensure,switchGame,
 displayCode:code=>group||code,
 get groupCode(){return group},
 get lastError(){return failed}};
})();