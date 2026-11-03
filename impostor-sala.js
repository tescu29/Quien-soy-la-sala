'use strict';
/* Impostor — salas multijugador con funciones seguras de Supabase.
   La palabra y los votos de otros nunca se guardan en el cliente antes del resultado. */
(function(){
const app=document.getElementById('app');
const api='https://stpylkumzuqvaioedvvi.supabase.co/rest/v1/rpc/';
const publicKey='sb_publishable_gVmo2eopYweroU5p0edsxg_J87_ouk6';
const PARAMS=new URLSearchParams(location.search);
const state={code:'',token:'',name:localStorage.getItem('impostor:nombre')||'',room:null,busy:false,error:'',showRole:false,help:false,loading:false,previousVersion:0};
const clean=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const secret=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const sessionKey=code=>'impostor:sala:'+code;
const link=()=>window.GroupHub?.inviteUrl()||location.origin+location.pathname+'?juego=impostor&modo=sala&codigo='+encodeURIComponent(state.code);
const auth=()=>({p_code:state.code,p_token:state.token});
let poll=null;
function storage(code){try{return JSON.parse(localStorage.getItem(sessionKey(code))||'null')}catch{return null}}
function save(){localStorage.setItem(sessionKey(state.code),JSON.stringify({name:state.name,token:state.token}));localStorage.setItem('impostor:nombre',state.name);}
function resetLocal(){if(state.code)localStorage.removeItem(sessionKey(state.code));clearInterval(poll);poll=null;state.code='';state.token='';state.room=null;state.showRole=false;state.error='';history.replaceState(null,'','?juego=impostor&modo=sala');}
function enter(code,name,token){state.code=code;state.name=name;state.token=token;state.room=null;state.showRole=false;state.error='';history.replaceState(null,'','?juego=impostor&modo=sala&codigo='+code);save();startPolling();}
function notify(msg){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600);}
async function rpc(name,args){
 const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),15000);
 try{
  const response=await fetch(api+name,{method:'POST',headers:{'apikey':publicKey,'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(args),signal:ctrl.signal});
  const raw=await response.text();let data;try{data=JSON.parse(raw)}catch{data=raw}
  if(!response.ok){
   if(response.status===404&&String(data?.code||'').includes('PGRST'))throw Error('No está activado todavía el servidor de salas de Impostor. Hay que aplicar la migración de Supabase.');
   throw Error(data?.message||data?.hint||'No se pudo contactar con la sala.');
  }
  return data;
 }catch(e){if(e.name==='AbortError')throw Error('La conexión tardó demasiado. Vuelve a intentarlo.');throw e}
 finally{clearTimeout(timeout)}
}
function run(fn){
 if(state.busy)return Promise.resolve();
 state.busy=true;state.error='';render();
 return Promise.resolve().then(fn).catch(e=>{state.error=e.message||'No se pudo completar la acción';render()}).finally(()=>{state.busy=false;render()});
}
async function refresh(force=false){
 if(!state.code||!state.token||state.loading)return;
 const code=state.code;state.loading=true;
 try{
  const next=await rpc('im_state',auth());
  if(state.code!==code)return;
  if(force||state.room?.version!==next.version||state.room?.status!==next.status){
    const previous=state.room;
    if(previous?.round!==next.round||previous?.status==='lobby'&&next.status==='reveal'||previous?.status==='result'&&next.status==='lobby')state.showRole=false;
    state.room=next;state.error='';render();
  }
 }catch(e){
  if(state.code===code){state.error=e.message;render();}
 }finally{state.loading=false;}
}
function startPolling(){clearInterval(poll);poll=setInterval(()=>{if(document.visibilityState==='visible')refresh()},2300)}

function header(){
 return '<header class="party-nav"><div class="party-container party-nav-inner"><a class="party-brand" href="'+location.pathname+'"><span class="party-brand-icon">✦</span>¿Una partidita<span class="party-brand-question">?</span></a><div class="imp-nav-actions"><button class="party-link-btn" data-action="help">Reglas</button>'+(state.code?'<button class="party-link-btn" data-action="leave">Salir</button>':'')+'</div></div></header>';
}
function top(){return '<div class="party-top"><a class="party-back" href="?juego=impostor">← Modos de juego</a><span class="party-top-tag">IMPOSTOR · SALA MULTIJUGADOR</span></div>'}
function error(){return state.error?'<div class="imp-online-error" role="alert">'+clean(state.error)+'</div>':''}
function rules(){
 return header()+'<main class="party-container party-main">'+top()+'<section class="party-panel party-rules"><button data-action="help" class="party-back-btn">← Volver</button><h1>Cómo jugar en sala</h1><p>Uno crea la partida y comparte el enlace. Cada persona entra desde su propio móvil y recibe su palabra en privado, sin necesidad de pasar el teléfono.</p><ol><li>Entre 3 y 10 personas entran por el enlace o código.</li><li>El anfitrión reparte papeles de un catálogo mezclado automáticamente. Una persona será el impostor y no sabrá la palabra.</li><li>Cada participante consulta su papel, lo oculta y confirma que está listo.</li><li>Todos dan pistas en voz alta, empezando por la persona indicada. Intentad descubrir quién está improvisando.</li><li>Cada persona vota en secreto a otro jugador desde su móvil. Los resultados solo aparecen al terminar.</li></ol><p>El anfitrión puede cerrar la votación tras dos votos si alguien pierde la conexión.</p><button class="party-button party-primary" data-action="help">Entendido</button></section></main>';
}
function entry(){
 const requested=(new URLSearchParams(location.search).get('codigo')||'').trim().toUpperCase();
 const nickname=clean(state.name);
 return header()+'<main class="party-container party-main">'+top()+
 '<section class="party-heading"><div class="party-hero-icon imp-hero-icon">◉</div><span class="party-kicker">CADA UNO DESDE SU MÓVIL</span><h1>Impostor<span class="party-dot">.</span></h1><p>Crea una sala o entra con el enlace de tus amigos.</p></section>'+
 '<div class="imp-entry-grid"><form id="imp-create" class="party-panel"><span class="party-step">01 · ORGANIZA</span><h2>Crea una sala</h2><p>Invita con un código y empieza cuando estéis todos.</p><label for="imp-host">Tu nombre</label><input name="name" id="imp-host" maxlength="20" autocomplete="nickname" value="'+nickname+'" placeholder="Ej.: Alba" required><button class="party-button party-primary" '+(state.busy?'disabled':'')+'>Crear sala →</button></form>'+
 '<form id="imp-join" class="party-panel"><span class="party-step">02 · PARTICIPA</span><h2>Únete a una sala</h2><p>Accede directamente desde el enlace compartido.</p><label for="imp-guest">Tu nombre</label><input name="name" id="imp-guest" maxlength="20" autocomplete="nickname" value="'+nickname+'" placeholder="Ej.: Hugo" required><label for="imp-code">Código de sala</label><input name="code" id="imp-code" maxlength="6" minlength="6" autocapitalize="characters" autocomplete="off" value="'+clean(requested)+'" placeholder="ABC123" required><button class="party-button party-secondary" '+(state.busy?'disabled':'')+'>Entrar en sala →</button></form></div>'+
 error()+'<p class="party-caption">Sin registro · 3–10 jugadores · Cada persona ve únicamente su papel</p></main>';
}
function roomBar(r){
 return '<section class="imp-room-header"><div><span>CÓDIGO DE LA SALA</span><strong>'+clean(r.code)+'</strong></div><div class="imp-room-actions"><button data-action="copy">Copiar código</button><button data-action="share">Compartir enlace</button></div></section>';
}
function playerList(r){
 return '<div class="imp-roster">'+r.players.map((p,i)=>'<div class="imp-roster-player"><span class="imp-avatar">'+clean(p.name.slice(0,1).toUpperCase())+'</span><span class="imp-roster-name">'+clean(p.name)+(p.id===r.me?' <small>(tú)</small>':'')+'</span><span class="imp-player-badge '+(p.ready||p.voted?'done':'')+'">'+(p.host?'★ Anfitrión':r.status==='reveal'?(p.ready?'✓ Listo':'Sin ver'):r.status==='vote'?(p.voted?'✓ Votó':'Sin votar'):p.online?'●':'○')+'</span></div>').join('')+'</div>';
}
function lobby(r){
 const host=r.me===r.host,count=r.players.length;
 return header()+'<main class="party-container party-main">'+top()+roomBar(r)+error()+
 '<section class="imp-online-heading"><span class="party-step">SALA DE ESPERA</span><h1>Preparad la partida</h1><p>Compartid el enlace. Las palabras se mezclarán automáticamente en cada ronda.</p></section>'+
 '<div class="imp-lobby-grid"><section class="party-panel"><div class="party-label-row"><h2>Jugadores</h2><span class="party-count">'+count+'/10</span></div>'+playerList(r)+(count<3?'<p class="imp-hint">Se necesitan al menos 3 personas.</p>':'')+'</section>'+
 '<section class="party-panel"><div class="imp-lobby-ready-icon">✦</div><h2>Todo listo para jugar</h2><p class="imp-hint">Lugares, comida, cultura pop y muchas otras palabras están mezcladas. Nadie tiene que configurar categorías.</p>'+
 (host?'<button class="party-button party-primary imp-action-wide" data-action="start" '+(count<3||state.busy?'disabled':'')+'>Repartir papeles →</button>':'<p class="imp-hint">Esperando a que el anfitrión reparta los papeles.</p>')+
 '</section></div></main>';
}
function roleView(r){
 const me=r.players.find(p=>p.id===r.me),ready=!!me?.ready,host=r.me===r.host,othersReady=r.players.filter(p=>p.ready).length,allReady=othersReady===r.players.length;
 let piece;
 if(!state.showRole&&ready)piece='<div class="imp-role-hidden"><span>✓</span><h2>Papel oculto</h2><p>Tu papel ya está confirmado. Espera al resto.</p><button class="party-button party-secondary" data-action="toggle-role">Consultar mi papel</button></div>';
 else if(!state.showRole)piece='<div class="imp-role-hidden"><span>?</span><h2>Tu papel es secreto</h2><p>Busca un momento en el que nadie vea tu pantalla.</p><button class="party-button party-primary" data-action="toggle-role">Ver mi papel</button></div>';
 else piece='<div class="imp-role-private '+(r.my_role==='impostor'?'is-impostor':'')+'"><span class="party-step">'+(r.my_role==='impostor'?'IDENTIDAD OCULTA':'TU PALABRA SECRETA')+'</span><div class="imp-role-symbol">'+(r.my_role==='impostor'?'?':'✦')+'</div><h2>'+(r.my_role==='impostor'?'¡Eres el impostor!':clean(r.word))+'</h2><p>'+(r.my_role==='impostor'?'No sabes la palabra. Escucha las pistas y consigue que no sospechen de ti.':'Da pistas sobre la palabra, pero nunca la digas directamente.')+'</p>'+(ready?'':'<button class="party-button party-primary" data-action="ready">Ya he visto mi papel →</button>')+'<button class="party-button party-secondary" data-action="toggle-role">Ocultar</button></div>';
 return header()+'<main class="party-container party-main">'+top()+roomBar(r)+error()+
 '<section class="imp-online-heading"><span class="party-step">RONDA '+r.round+' · REPARTO</span><h1>Descubre tu papel</h1><p>Solo tú puedes verlo en este teléfono.</p></section>'+
 '<div class="imp-lobby-grid"><section class="party-panel imp-role-panel">'+piece+'</section>'+
 '<section class="party-panel"><h2>Preparados <span class="party-count">'+othersReady+'/'+r.players.length+'</span></h2>'+playerList(r)+
 (host?'<button class="party-button party-primary imp-action-wide" data-action="debate" '+(!allReady||state.busy?'disabled':'')+'>Empezar las pistas →</button>'+(allReady?'':'<p class="imp-hint">Todos deben confirmar su papel para comenzar.</p>'):'<p class="imp-hint">El anfitrión comenzará cuando todos hayan visto su papel.</p>')+
 '</section></div></main>';
}
function debate(r){
 const host=r.host===r.me,start=r.players.find(p=>p.id===r.opening);
 return header()+'<main class="party-container party-main">'+top()+roomBar(r)+error()+
 '<section class="party-center imp-talk"><span class="party-step">RONDA '+r.round+' · PISTAS</span><div class="party-talk-icon">✳</div><h1>¡A dar pistas!</h1><p>Empieza <strong>'+clean(start?.name||'la primera persona')+'</strong>. Cada persona dice algo sobre la palabra, evitando nombrarla.</p>'+
 '<div class="imp-secret-recall">'+(state.showRole?(r.my_role==='impostor'?'<strong>Eres el impostor.</strong>':'<strong>Tu palabra: '+clean(r.word)+'</strong>'):'<span>Tu papel permanece oculto</span>')+'<button data-action="toggle-role">'+(state.showRole?'Ocultar':'Ver mi papel')+'</button></div>'+
 (host?'<button class="party-button party-primary" data-action="vote-open" '+(state.busy?'disabled':'')+'>Abrir votación →</button>':'<div class="imp-hint">Cuando hayáis debatido, el anfitrión abrirá la votación.</div>')+
 '</section></main>';
}
function voting(r){
 const me=r.players.find(p=>p.id===r.me),voted=!!me?.voted,host=r.host===r.me,votes=r.players.filter(p=>p.voted).length;
 const content=voted?'<section class="party-center imp-voted"><div class="party-talk-icon">✓</div><h1>Voto registrado</h1><p>Tu elección queda secreta hasta que termine la votación.</p><strong>'+votes+' de '+r.players.length+' han votado.</strong></section>':
 '<section class="party-center imp-voting"><span class="party-step">RONDA '+r.round+' · VOTACIÓN SECRETA</span><h1>¿Quién es el impostor?</h1><p>Vota a la persona que crees que no sabe la palabra. No puedes votarte a ti mismo.</p><div class="party-vote-grid">'+r.players.filter(p=>p.id!==r.me).map(p=>'<button class="party-vote-choice" data-action="vote" data-id="'+clean(p.id)+'" '+(state.busy?'disabled':'')+'><span>'+clean(p.name.slice(0,1).toUpperCase())+'</span><strong>'+clean(p.name)+'</strong></button>').join('')+'</div><p class="party-caption">No se puede cambiar el voto.</p></section>';
 return header()+'<main class="party-container party-main">'+top()+roomBar(r)+error()+content+
 '<section class="party-panel imp-vote-status"><h2>Votos <span class="party-count">'+votes+'/'+r.players.length+'</span></h2>'+playerList(r)+
 (host&&votes>=2?'<button data-action="finish-vote" class="party-button party-secondary" '+(state.busy?'disabled':'')+'>Mostrar resultados antes de tiempo</button>':'')+
 '</section></main>';
}
function results(r){
 const outcome=r.outcome||{votes:[],impostor:null,word:''};
 const votes=outcome.votes||[],highest=Math.max(0,...votes.map(p=>Number(p.count)||0)),leaders=votes.filter(p=>p.count===highest),groupWin=leaders.length===1&&leaders[0].id===outcome.impostor;
 const imp=r.players.find(p=>p.id===outcome.impostor);
 return header()+'<main class="party-container party-main">'+top()+roomBar(r)+error()+
 '<section class="party-center party-outcome '+(groupWin?'party-won':'party-lost')+'"><span class="party-step">RONDA '+r.round+' · RESULTADOS</span><div class="party-talk-icon">'+(groupWin?'★':'?')+'</div><h1>'+(groupWin?'¡Habéis pillado al impostor!':'¡El impostor se ha librado!')+'</h1><p>El impostor era <strong>'+clean(imp?.name||'quien ha abandonado')+'</strong>.</p><div class="party-result-word"><span>LA PALABRA ERA</span><strong>'+clean(outcome.word)+'</strong></div><h2>Votaciones</h2><div class="party-results">'+votes.slice().sort((a,b)=>b.count-a.count).map(p=>'<div class="party-result-row"><span>'+clean(p.name)+(p.id===outcome.impostor?' <b>(impostor)</b>':'')+'</span><strong>'+Number(p.count||0)+'</strong></div>').join('')+'</div>'+
 (r.me===r.host?'<button class="party-button party-primary" data-action="again" '+(state.busy?'disabled':'')+'>Otra ronda con el grupo →</button>':'<p class="imp-hint">El anfitrión puede preparar otra ronda.</p>')+
 '</section></main>';
}
function render(){
 let view;if(state.help)view=rules();else if(!state.code)view=entry();else if(!state.room)view=header()+'<main class="party-container party-main">'+top()+error()+'<div class="party-panel">Conectando con la sala…</div></main>';
 else view=state.room.status==='lobby'?lobby(state.room):state.room.status==='reveal'?roleView(state.room):state.room.status==='debate'?debate(state.room):state.room.status==='vote'?voting(state.room):results(state.room);
 app.innerHTML='<div class="party-app impostor-online-app">'+view+'</div>';
 if(state.room?.status==='result')app.innerHTML+=window.GroupHub?.menu('impostor',state.room.me===state.room.host,state.room.players.length)||'';
}
async function copy(s){try{await navigator.clipboard.writeText(s);notify('¡Copiado!')}catch{prompt('Copia este enlace:',s)}}
async function handleClick(btn){
 const action=btn.dataset.action;
 if(action==='help'){state.help=!state.help;render();return}
 if(state.help)return;
 if(action==='share'){try{await window.GroupHub?.ensure();if(navigator.share)await navigator.share({title:'Impostor · ¿Una partidita?',url:link()});else await copy(link())}catch{}return}
 if(action==='copy'){await window.GroupHub?.ensure();await copy(window.GroupHub?.groupCode||state.code);return}
 if(action==='leave'){if(!confirm('¿Quieres salir de la sala?'))return;await run(async()=>{try{await rpc('im_leave',auth())}catch(e){console.warn('No se pudo notificar la salida',e)}resetLocal()});return}
 if(!state.room)return;
 const r=state.room,host=r.me===r.host;
 if(action==='start'&&host&&r.status==='lobby'){await run(async()=>{state.room=await rpc('im_start',auth());state.showRole=false});return;}
 if(action==='toggle-role'){state.showRole=!state.showRole;render();return}
 if(action==='ready'&&r.status==='reveal'){await run(async()=>{state.room=await rpc('im_ready',auth());state.showRole=false});return;}
 if(action==='debate'&&host&&r.status==='reveal'&&r.players.every(p=>p.ready)){await run(async()=>{state.room=await rpc('im_advance',{...auth(),p_next:'debate'});state.showRole=false});return;}
 if(action==='vote-open'&&host&&r.status==='debate'){await run(async()=>{state.room=await rpc('im_advance',{...auth(),p_next:'vote'});state.showRole=false});return;}
 if(action==='vote'&&r.status==='vote'&&!r.players.find(p=>p.id===r.me)?.voted){await run(async()=>{state.room=await rpc('im_vote',{...auth(),p_target:btn.dataset.id})});return;}
 if(action==='finish-vote'&&host&&r.status==='vote'&&r.players.filter(p=>p.voted).length>=2){
   if(!confirm('¿Cerrar la votación aunque falten jugadores?'))return;
   await run(async()=>{state.room=await rpc('im_advance',{...auth(),p_next:'result'})});return;
 }
 if(action==='again'&&host&&r.status==='result'){await run(async()=>{state.room=await rpc('im_next',auth());state.showRole=false});}
}
app.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;e.preventDefault();handleClick(b).catch(err=>{state.error=err.message;render()})});
app.addEventListener('submit',e=>{
 const id=e.target.id;if(!['imp-create','imp-join'].includes(id))return;e.preventDefault();
 const data=new FormData(e.target),name=String(data.get('name')||'').trim();
 if(!name||name.length>20){state.error='Escribe un nombre de hasta 20 caracteres';render();return;}
 if(id==='imp-create'){
  run(async()=>{const token=secret(),code=await rpc('im_create',{p_name:name,p_token:token});enter(code,name,token);state.room=await rpc('im_state',auth())});
 }else{
  const code=String(data.get('code')||'').trim().toUpperCase();
  if(!/^[A-F0-9]{6}$/.test(code)){state.error='El código debe tener seis caracteres';render();return;}
  const saved=storage(code);
  run(async()=>{const token=saved?.token||secret();await rpc('im_join',{p_code:code,p_name:name,p_token:token});enter(code,name,token);state.room=await rpc('im_state',auth())});
 }
});
async function init(){
 const code=(PARAMS.get('codigo')||'').trim().toUpperCase();
 if(code){
  const saved=storage(code);
  if(saved?.token){
   state.code=code;state.token=saved.token;state.name=saved.name||state.name;startPolling();
   try{await refresh(true)}catch{state.code='';state.token='';state.room=null}
  }
 }
 render();
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh(true)});
window.addEventListener('online',()=>refresh(true));
window.GroupHub?.attach('impostor',()=>({code:state.code,token:state.token,name:state.name}));
init();
})();