'use strict';
// Cromazo: juego de descarte original. Las manos y reglas se validan en Supabase.
(function(){
const api='https://stpylkumzuqvaioedvvi.supabase.co/rest/v1/rpc/';
const key='sb_publishable_gVmo2eopYweroU5p0edsxg_J87_ouk6';
const app=document.getElementById('app');
const profileKey='cromazo:nick';
const state={code:'',token:'',name:localStorage.getItem(profileKey)||'',room:null,busy:false,error:'',loading:false,pending:null,showRules:false};
const names={r:'Coral',b:'Azul',g:'Menta',y:'Dorado',w:'Comodín'};
const labels={skip:'Salto',reverse:'Giro',draw2:'+2',wild:'★',wild4:'+4'};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roomLink=()=>window.GroupHub?.inviteUrl()||location.origin+location.pathname+'?cartas='+encodeURIComponent(state.code);
const secret=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const sessionKey=c=>'cromazo:room:'+c;
let timer;
function notice(message){const t=document.getElementById('toast');if(t){t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400);}}
async function rpc(fn,args){
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),14000);
 try{
  const res=await fetch(api+fn,{method:'POST',headers:{'apikey':key,'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(args),signal:controller.signal});
  const raw=await res.text();let payload;try{payload=JSON.parse(raw)}catch{payload=raw}
  if(!res.ok)throw Error(payload?.message||'No se pudo comunicar con la sala.');
  return payload;
 }catch(e){if(e.name==='AbortError')throw Error('Tiempo de espera agotado. Comprueba tu conexión.');throw e}finally{clearTimeout(timeout)}
}
function auth(){return {p_code:state.code,p_token:state.token};}
function save(){localStorage.setItem(sessionKey(state.code),JSON.stringify({token:state.token,name:state.name}));localStorage.setItem('cromazo:last',state.code);localStorage.setItem(profileKey,state.name);}
function enter(code,token,name){state.code=code;state.token=token;state.name=name;state.room=null;state.error='';history.replaceState(null,'','?cartas='+code);save();window.GroupHub?.ensure().catch(()=>{});}
async function refresh(force=false){
 if(!state.code||!state.token||state.loading)return;
 state.loading=true;
 try{
  const response=await rpc('cp_state',auth());
  if(force||response.version!==state.room?.version||response.status!==state.room?.status){state.room=response;state.error='';render();}
 }catch(e){state.error=e.message;render()}finally{state.loading=false}
}
function startPolling(){clearInterval(timer);timer=setInterval(()=>{if(document.visibilityState==='visible')refresh()},2000)}
async function run(callback){if(state.busy)return;state.busy=true;state.error='';render();try{await callback()}catch(e){state.error=e.message||'No se pudo realizar la acción.'}finally{state.busy=false;render()}}
function baseHeader(){
 return '<header class="cm-nav"><div class="cm-wrap cm-nav-inner"><a href="'+location.pathname+'" class="cm-brand"><span class="cm-logo">✦</span>¿Una partidita<span class="cm-pink">?</span></a><div class="cm-nav-actions"><button class="cm-text-btn" data-action="rules">Reglas</button>'+(state.code?'<button class="cm-text-btn" data-action="leave">Salir</button>':'')+'</div></div></header>';
}
function error(){return state.error?'<div class="cm-error" role="alert">'+esc(state.error)+'</div>':''}
function homeLink(){return '<a class="cm-back" href="'+location.pathname+'">← Biblioteca de juegos</a>'}
function entry(){
 const requested=(new URLSearchParams(location.search).get('cartas')||'').toUpperCase();
 return '<div class="cm-app">'+baseHeader()+'<main class="cm-wrap cm-entry">'+homeLink()+'<div class="cm-entry-head"><div class="cm-hero-mini"><div class="cm-artcard cm-art-red">7</div><div class="cm-artcard cm-art-blue">↻</div><div class="cm-artcard cm-art-yellow">+2</div></div><span class="cm-eyebrow">CARTAS · 2 A 10 JUGADORES</span><h1>Cromazo<span class="cm-pink">.</span></h1><p>Combina números, cambia colores y deja a tus amigos con la mano llena.</p></div><div class="cm-entry-options"><form id="cm-create" class="cm-panel"><span class="cm-eyebrow">01 · ORGANIZA</span><h2>Crea una partida</h2><label for="cm-name-create">Tu apodo</label><input id="cm-name-create" name="nick" maxlength="20" autocomplete="nickname" value="'+esc(state.name)+'" placeholder="¿Cómo te llamas?" required><button class="cm-button cm-primary" '+(state.busy?'disabled':'')+'>Crear sala</button></form><form id="cm-join" class="cm-panel"><span class="cm-eyebrow">02 · ÚNETE</span><h2>Entra con tus amigos</h2><label for="cm-name-join">Tu apodo</label><input id="cm-name-join" name="nick" maxlength="20" autocomplete="nickname" value="'+esc(state.name)+'" placeholder="¿Cómo te llamas?" required><label for="cm-code-join">Código</label><input id="cm-code-join" name="code" maxlength="6" value="'+esc(requested)+'" placeholder="A3F9C0" autocapitalize="characters" required><button class="cm-button cm-secondary" '+(state.busy?'disabled':'')+'>Entrar en sala</button></form></div>'+error()+'</main><footer class="cm-footer">Sin registro · Sin descargas · Cada uno desde su móvil</footer></div>';
}
function players(room,mode){
 return '<div class="cm-players">'+room.players.map(p=>'<div class="cm-player '+(p.id===room.turn&&mode==='play'?'cm-active':'')+'"><span class="cm-avatar">'+esc(p.name.slice(0,1).toUpperCase())+'</span><div class="cm-player-data"><strong>'+esc(p.name)+(p.id===room.me?' (tú)':'')+'</strong><small>'+ (p.host?'Anfitrión · ':'')+(mode==='play'?p.cards+' cartas':p.id===room.me?'Conectado':'En la sala')+'</small></div>'+(p.id===room.turn&&mode==='play'?'<span class="cm-turn-dot">Turno</span>':'')+'</div>').join('')+'</div>';
}
function roomHead(room){
 return '<div class="cm-room-head"><div><span class="cm-eyebrow">SALA COMPARTIDA</span><div class="cm-room-code">'+esc(window.GroupHub?.displayCode(room.code)||room.code)+'</div></div><div class="cm-room-buttons"><button data-action="copy" class="cm-outline">Copiar código</button><button data-action="share" class="cm-outline">Compartir enlace</button></div></div>';
}
function lobby(room){
 const host=room.me===room.host;
 return '<div class="cm-app">'+baseHeader()+'<main class="cm-wrap cm-page">'+homeLink()+roomHead(room)+error()+'<div class="cm-page-intro"><span class="cm-eyebrow">SALA DE ESPERA</span><h1>¡Que se repartan las cartas!</h1><p>Comparte el enlace con tus amigos y empezad cuando estéis preparados.</p></div><div class="cm-columns"><section class="cm-panel"><h2>Jugadores <span class="cm-capacity">'+room.players.length+'/10</span></h2>'+players(room,'lobby')+'</section><section class="cm-panel"><h2>Listos para jugar</h2><p>Se reparten siete cartas a cada persona. El primer jugador que se quede sin cartas gana.</p>'+(host?'<button class="cm-button cm-primary" data-action="start" '+(room.players.length<2||state.busy?'disabled':'')+'>Empezar partida</button>':'<div class="cm-note">Esperando a que empiece el anfitrión…</div>')+'<button class="cm-button cm-light" data-action="rules">Ver las reglas</button></section></div></main></div>';
}
function cardHtml(card,opts={}){
 if(!card)return '';
 const color=card.c||'w';const value=labels[card.v]||card.v;
 const playable=opts.playable;const selected=opts.selected;
 const canPlay=!opts.interactive||playable;
 return '<button type="button" class="cm-card cm-'+esc(color)+(selected?' cm-selected':'')+'" '+(opts.interactive?'data-action="play" data-id="'+esc(card.id)+'"':'disabled')+' '+(canPlay?'':'disabled')+' aria-label="'+esc((names[color]||'Comodín')+' '+value)+'"><span class="cm-card-small">'+esc(value)+'</span><span class="cm-card-symbol">'+esc(value)+'</span><span class="cm-card-small cm-card-small-bottom">'+esc(value)+'</span></button>';
}
function isPlayable(card,room){
 if(!card||room.turn!==room.me)return false;
 if(card.c==='w'&&card.v==='wild4')return !room.hand.some(x=>x.c===room.color);
 return card.c==='w'||card.c===room.color||card.v===room.pile?.v;
}
function table(room){
 const ownTurn=room.turn===room.me;
 const current=room.players.find(p=>p.id===room.turn);
 const result=room.status==='ended';
 const winner=room.players.find(p=>p.id===room.winner);
 return '<div class="cm-app">'+baseHeader()+'<main class="cm-wrap cm-page">'+homeLink()+roomHead(room)+error()+
 (result?'<section class="cm-victory"><span class="cm-eyebrow">FIN DE LA RONDA '+room.round+'</span><h1>'+ (room.winner===room.me?'¡Has ganado!':'¡'+esc(winner?.name||'Alguien')+' ha ganado!')+'</h1><p>¿Echamos otra partida?</p>'+(room.host===room.me?'<button class="cm-button cm-primary" data-action="restart">Preparar otra ronda</button>':'<div class="cm-note">Esperando al anfitrión para volver a jugar.</div>')+'</section>':
 '<div class="cm-board"><div class="cm-status"><span>RONDA '+room.round+'</span><span>'+ (room.direction===1?'↻ Sentido horario':'↺ Sentido inverso')+'</span></div><h1>'+ (ownTurn?'¡Es tu turno!':'Juega '+esc(current?.name||'otro jugador'))+'</h1><p>'+esc(room.last||'Elige una carta para comenzar.')+'</p><div class="cm-table"><div class="cm-pile">'+cardHtml(room.pile)+'<span>Última carta</span></div><div class="cm-current"><span>COLOR ACTIVO</span><div class="cm-color-disc cm-disc-'+esc(room.color)+'"></div><strong>'+esc(names[room.color]||'')+'</strong></div><button class="cm-deck" data-action="draw" '+(ownTurn&&!state.busy?'':'disabled')+'><span>✦</span><b>Robar</b><small>1 carta y pasar</small></button></div></div>')+
 '<div class="cm-columns cm-game-columns"><section class="cm-panel cm-my-hand"><h2>Tu mano <span class="cm-capacity">'+room.hand.length+' cartas</span></h2><p>'+ (result?'Así terminó tu mano.':ownTurn?'Toca una carta que coincida por color o símbolo.':'Puedes preparar tu siguiente jugada.')+'</p><div class="cm-hand">'+room.hand.map(card=>cardHtml(card,{interactive:!result,playable:isPlayable(card,room)})).join('')+'</div></section><aside class="cm-panel"><h2>En la mesa</h2>'+players(room,'play')+'</aside></div>'+
 (state.pending&&!result?'<div class="cm-overlay"><div class="cm-color-modal"><h2>Elige un color</h2><p>¿Qué color seguirá la partida?</p><div class="cm-color-options">'+['r','b','g','y'].map(c=>'<button class="cm-color-option cm-'+c+'" data-action="color" data-color="'+c+'">'+names[c]+'</button>').join('')+'</div><button class="cm-text-btn" data-action="cancel-color">Cancelar</button></div></div>':'')+
 '</main></div>';
}
function rules(){
 return '<div class="cm-app">'+baseHeader()+'<main class="cm-wrap cm-page">'+
 '<button class="cm-back cm-back-button" data-action="back">← Volver</button><span class="cm-eyebrow">CÓMO SE JUEGA</span><h1>Reglas de Cromazo</h1><div class="cm-rule-grid">'+[
 ['El objetivo','Quédate sin cartas antes que tus amigos. Cada uno empieza con siete cartas.'],
 ['Tu turno','Juega una carta del mismo color o símbolo que la carta central, o un comodín. Si no quieres o no puedes jugar, roba una carta y termina tu turno.'],
 ['Salto y Giro','Salto hace perder el turno al siguiente. Giro invierte el sentido; con dos personas permite jugar otra vez.'],
 ['+2 y +4','El siguiente roba dos o cuatro cartas y pierde su turno. No se pueden acumular penalizaciones. El +4 solo es válido si no tienes una carta del color activo.'],
 ['Comodines','Elige el color que continuará. Al quedarte sin cartas se acaba la ronda.'],
 ['Turnos y privacidad','Solo tú puedes ver las cartas de tu mano. El servidor valida las jugadas y actualiza la partida para todos.']
 ].map(x=>'<section class="cm-panel"><h2>'+x[0]+'</h2><p>'+x[1]+'</p></section>').join('')+'</div></main></div>';
}
function render(){
 if(state.showRules){app.innerHTML=rules();return}
 if(!state.code){app.innerHTML=entry();return}
 if(!state.room){app.innerHTML='<div class="cm-app">'+baseHeader()+'<main class="cm-wrap cm-page"><h1>Conectando con la sala…</h1>'+error()+'</main></div>';return}
 app.innerHTML=state.room.status==='lobby'?lobby(state.room):table(state.room);
 if(state.room.status==='ended')app.innerHTML+=window.GroupHub?.menu('cromazo',state.room.me===state.room.host,state.room.players.length)||'';
}
async function copy(value){try{await navigator.clipboard.writeText(value);notice('¡Copiado!')}catch{window.prompt('Copia este enlace:',value)}}
async function action(button){
 const command=button.dataset.action;
 if(command==='rules'){state.showRules=true;render();return}
 if(command==='back'){state.showRules=false;render();return}
 if(command==='cancel-color'){state.pending=null;render();return}
 if(command==='copy'){await window.GroupHub?.ensure();return copy(window.GroupHub?.groupCode||state.code)}
 if(command==='share'){try{await window.GroupHub?.ensure();if(navigator.share)await navigator.share({title:'Cromazo · ¿Una partidita?',url:roomLink()});else await copy(roomLink())}catch{}return}
 if(command==='leave'){
  if(!confirm('¿Abandonar esta sala?'))return;
  return run(async()=>{try{await rpc('cp_leave',auth())}catch(e){console.warn(e)}
   localStorage.removeItem(sessionKey(state.code));localStorage.removeItem('cromazo:last');state.code='';state.token='';state.room=null;state.pending=null;history.replaceState(null,'','?juego=cromazo');clearInterval(timer);});
 }
 if(command==='start')return run(async()=>{state.room=await rpc('cp_start',auth());});
 if(command==='restart')return run(async()=>{state.room=await rpc('cp_restart',auth());});
 if(command==='draw')return run(async()=>{state.room=await rpc('cp_action',{...auth(),p_action:'draw'});});
 if(command==='play'){
  const card=state.room?.hand.find(c=>c.id===button.dataset.id);
  if(!card||!isPlayable(card,state.room)||state.busy)return;
  if(card.c==='w'){state.pending=card.id;render();return}
  return run(async()=>{state.room=await rpc('cp_action',{...auth(),p_action:'play',p_card_id:card.id});});
 }
 if(command==='color'){
  if(!state.pending||!['r','b','g','y'].includes(button.dataset.color))return;
  const id=state.pending,color=button.dataset.color;state.pending=null;
  return run(async()=>{state.room=await rpc('cp_action',{...auth(),p_action:'play',p_card_id:id,p_color:color});});
 }
}
app.addEventListener('click',e=>{
 const button=e.target.closest('[data-action]');
 if(button){e.preventDefault();action(button).catch(err=>{state.error=err.message;render()});}
});
app.addEventListener('submit',e=>{
 if(e.target.id!=='cm-create'&&e.target.id!=='cm-join')return;
 e.preventDefault();
 const form=new FormData(e.target),name=String(form.get('nick')||'').trim();
 if(e.target.id==='cm-create'){
  return run(async()=>{if(!name||name.length>20)throw Error('Escribe un apodo de hasta 20 caracteres.');const id=secret();const code=await rpc('cp_create',{p_name:name,p_token:id});enter(code,id,name);state.room=await rpc('cp_state',auth());startPolling();});
 }else{
  const code=String(form.get('code')||'').trim().toUpperCase();
  return run(async()=>{if(!/^[A-F0-9]{6}$/.test(code))throw Error('Introduce un código válido de seis caracteres.');const existing=JSON.parse(localStorage.getItem(sessionKey(code))||'null');const id=existing?.token||secret();await rpc('cp_join',{p_code:code,p_name:name,p_token:id});enter(code,id,name);state.room=await rpc('cp_state',auth());startPolling();});
 }
});
async function init(){
 const code=(new URLSearchParams(location.search).get('cartas')||localStorage.getItem('cromazo:last')||'').toUpperCase();
 if(code){let saved;try{saved=JSON.parse(localStorage.getItem(sessionKey(code))||'null')}catch{}
  if(saved?.token){state.code=code;state.name=saved.name||state.name;state.token=saved.token;
   try{state.room=await rpc('cp_state',auth());startPolling()}catch{state.code='';state.token='';state.room=null;localStorage.removeItem('cromazo:last');}
  }
 }
 render();
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh(true)});
window.addEventListener('online',()=>refresh(true));
window.GroupHub?.attach('cromazo',()=>({code:state.code,token:state.token,name:state.name}));
init();
})();