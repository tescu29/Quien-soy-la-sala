'use strict';
/* ¿Una partidita? · ¿Qué prefieres?
   Modo multijugador, lector rotativo por ronda y voto individual A/B.
   El lector jamás vota en su propio dilema. El servidor valida esta regla. */
(function(){
const app=document.getElementById('app');
const api='https://stpylkumzuqvaioedvvi.supabase.co/rest/v1/rpc/';
const publicKey='sb_publishable_gVmo2eopYweroU5p0edsxg_J87_ouk6';
const params=new URLSearchParams(location.search);
const KEY='queprefieres:sala:';
const levels=[
 {id:'suave',name:'Tranquilo',desc:'Para romper el hielo'},
 {id:'sinmiedo',name:'Sin miedo al éxito',desc:'Dilemas sin cortarse · 18+'}
];
const s={code:'',name:localStorage.getItem('queprefieres:nombre')||'',token:'',room:null,busy:false,loading:false,error:'',help:false};
let timer=null;
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
const session=code=>KEY+code;
const auth=()=>({p_code:s.code,p_token:s.token});
const url=()=>location.origin+location.pathname+'?juego=queprefieres&codigo='+encodeURIComponent(s.code);
function store(code){try{return JSON.parse(localStorage.getItem(session(code))||'null')}catch{return null}}
function persist(){localStorage.setItem(session(s.code),JSON.stringify({name:s.name,token:s.token}));localStorage.setItem('queprefieres:nombre',s.name)}
function enter(code,name,sessionToken){
 s.code=code;s.name=name;s.token=sessionToken;s.room=null;s.error='';
 history.replaceState(null,'','?juego=queprefieres&codigo='+encodeURIComponent(code));
 persist();poll();
}
function leaveLocal(){
 if(s.code)localStorage.removeItem(session(s.code));
 if(timer)clearInterval(timer);timer=null;s.code='';s.token='';s.room=null;s.error='';
 history.replaceState(null,'','?juego=queprefieres');
}
function toast(message){
 const el=document.getElementById('toast');if(!el)return;
 el.textContent=message;el.classList.add('show');
 setTimeout(()=>el.classList.remove('show'),2300);
}
async function rpc(name,args){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch(api+name,{method:'POST',
   headers:{'apikey':publicKey,'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify(args),signal:controller.signal});
  const raw=await response.text();let data;
  try{data=JSON.parse(raw)}catch{data=raw}
  if(!response.ok){
   if(response.status===404&&String(data?.code||'').startsWith('PGRST'))throw Error('El servidor de ¿Qué prefieres? no está disponible todavía.');
   throw Error(data?.message||data?.hint||'No se pudo completar la operación');
  }
  return data;
 }catch(e){
  if(e.name==='AbortError')throw Error('La conexión ha tardado demasiado. Inténtalo de nuevo.');
  throw e;
 }finally{clearTimeout(timeout)}
}
function act(fn){
 if(s.busy)return Promise.resolve();
 s.busy=true;s.error='';render();
 return Promise.resolve().then(fn).catch(e=>{s.error=e.message||'Ha ocurrido un problema';render()}).finally(()=>{s.busy=false;render()});
}
async function sync(force=false){
 if(!s.code||!s.token||s.loading)return;
 const code=s.code;s.loading=true;
 try{
  const next=await rpc('qp_state',auth());
  if(s.code!==code)return;
  if(force||s.room?.version!==next.version||s.room?.status!==next.status){
   s.room=next;s.error='';render();
  }
 }catch(e){if(s.code===code){s.error=e.message||'No se pudo actualizar la sala';render()}}
 finally{s.loading=false}
}
function poll(){if(timer)clearInterval(timer);timer=setInterval(()=>{if(document.visibilityState==='visible')sync()},2000)}
function header(){
 return '<header class="party-nav"><div class="party-container party-nav-inner"><a class="party-brand" href="'+location.pathname+'"><span class="party-brand-icon">✦</span>¿Una partidita<span class="party-brand-question">?</span></a><div class="qp-room-head-actions"><button type="button" class="party-link-btn" data-action="rules">Reglas</button>'+(s.code?'<button type="button" class="party-link-btn" data-action="leave">Salir</button>':'')+'</div></div></header>';
}
function top(){return '<div class="party-top"><a class="party-back" href="'+location.pathname+'">← Biblioteca</a><span class="party-top-tag">¿QUÉ PREFIERES? · MULTIJUGADOR</span></div>'}
function error(){return s.error?'<div class="qp-room-error" role="alert">'+esc(s.error)+'</div>':''}
function loading(){return header()+'<main class="party-container party-main">'+top()+error()+'<section class="party-panel qp-room-loading">Conectando con la sala…</section></main>'}
function rules(){
 return header()+'<main class="party-container party-main">'+top()+'<section class="party-panel party-rules"><button class="party-back-btn" data-action="rules">← Volver</button><h1>Cómo se juega</h1><p>En cada ronda le toca a una persona leer el dilema y los demás votan A o B desde su móvil. El lector no vota.</p><ol><li>Un jugador crea la sala y pasa el código o el enlace a los demás.</li><li>El anfitrión elige la intensidad y comienza la partida.</li><li>El jugador 1 lee las dos opciones; los demás eligen A o B en secreto.</li><li>Cuando todos han votado, se muestran los porcentajes y se debate la decisión.</li><li>El lector o el anfitrión pulsa «Siguiente turno»: el jugador 2 lee un nuevo dilema, luego el 3, y así sucesivamente.</li></ol><p>Se puede saltar cualquier dilema sin tener que dar explicaciones. La intensidad Sin miedo al éxito está dirigida a adultos (18+).</p><button class="party-button party-primary" data-action="rules">Entendido</button></section></main>';
}
function entry(){
 const requested=(new URLSearchParams(location.search).get('codigo')||'').trim().toUpperCase();
 return header()+'<main class="party-container party-main">'+top()+
 '<section class="party-heading qp-room-heading"><div class="party-hero-icon qp-hero-icon">A/B</div><span class="party-kicker">DOS OPCIONES · UN GRUPO DIVIDIDO</span><h1>¿Qué prefieres<span class="party-dot">?</span></h1><p>Una pregunta para cada jugador. Los demás deciden desde su móvil.</p></section>'+
 '<div class="imp-entry-grid qp-entry-grid">'+
 '<form class="party-panel" id="qp-create"><span class="party-step">01 · ORGANIZA</span><h2>Crear sala</h2><p>Invita a tus amigos y elige cuánto queréis arriesgar.</p><label for="qp-host">Tu nombre</label><input id="qp-host" name="name" maxlength="20" autocomplete="nickname" placeholder="Escribe tu nombre" value="'+esc(s.name)+'" required><button type="submit" class="party-button party-primary" '+(s.busy?'disabled':'')+'>Crear sala →</button></form>'+
 '<form class="party-panel" id="qp-join"><span class="party-step">02 · PARTICIPA</span><h2>Entrar en sala</h2><p>¿Te han enviado un código? Puedes entrar directamente.</p><label for="qp-guest">Tu nombre</label><input id="qp-guest" name="name" maxlength="20" autocomplete="nickname" placeholder="Escribe tu nombre" value="'+esc(s.name)+'" required><label for="qp-code">Código de sala</label><input id="qp-code" name="code" minlength="6" maxlength="6" autocapitalize="characters" autocomplete="off" placeholder="A1B2C3" value="'+esc(requested)+'" required><button type="submit" class="party-button party-secondary" '+(s.busy?'disabled':'')+'>Entrar en sala →</button></form></div>'+
 error()+'<p class="party-caption">2–10 jugadores · Cada uno desde su móvil · Sin registros</p></main>';
}
function roomBar(r){
 return '<section class="imp-room-header"><div><span>CÓDIGO DE LA SALA</span><strong>'+esc(r.code)+'</strong></div><div class="imp-room-actions"><button data-action="copy">Copiar código</button><button data-action="share">Compartir enlace</button></div></section>';
}
function people(r){
 return '<div class="imp-roster">'+r.players.map((p,i)=>
  '<div class="imp-roster-player '+(p.reader?'qp-current-reader':'')+'"><span class="imp-avatar">'+(i+1)+'</span>'+
  '<span class="imp-roster-name">'+esc(p.name)+(p.id===r.me?' <small>(tú)</small>':'')+'</span>'+
  '<span class="imp-player-badge '+(p.voted?'done':'')+'">'+(p.reader?'Lee':p.host?'Anfitrión':r.status==='voting'?(p.voted?'✓ Votó':'Sin votar'):p.online?'●':'○')+'</span></div>'
 ).join('')+'</div>';
}
function lobby(r){
 const selected=r.intensity==='suave'?'suave':'sinmiedo';
 const host=r.me===r.host,level=levels.find(d=>d.id===selected)||levels[1],total=r.players.length;
 return header()+'<main class="party-container party-main">'+top()+roomBar(r)+error()+
 '<section class="imp-online-heading"><span class="party-step">SALA DE ESPERA</span><h1>¿Ya estáis todos?</h1><p>Cuando empecéis, el primer jugador leerá y los demás votarán.</p></section>'+
 '<div class="imp-lobby-grid qp-lobby-grid"><section class="party-panel"><div class="party-label-row"><h2>Jugadores</h2><span class="party-count">'+total+'/10</span></div>'+people(r)+(total<2?'<p class="imp-hint">Invita al menos a otra persona.</p>':'')+'</section>'+
 '<section class="party-panel"><h2>Intensidad</h2><div class="yn-levels qp-level-picker">'+levels.map(l=>'<button class="yn-level '+(selected===l.id?'active':'')+'" data-action="level" data-level="'+l.id+'" '+(!host||s.busy?'disabled':'')+' aria-pressed="'+(selected===l.id)+'"><strong>'+l.name+'</strong><small>'+l.desc+'</small></button>').join('')+'</div>'+
 '<p class="yn-adult-note">'+(r.intensity==='suave'?'Preguntas para romper el hielo.':'Contenido adulto (18+). Podéis saltar cualquier dilema.')+'</p>'+
 (host?'<button class="party-button party-primary imp-action-wide" data-action="start" '+(total<2||s.busy?'disabled':'')+'>Empezar partida →</button>':'<p class="imp-hint">El anfitrión comienza cuando todos estén dentro. Intensidad: '+esc(level.name)+'.</p>')+
 '</section></div></main>';
}
function choice(letter,text,canVote){
 return '<button type="button" class="qp-choice qp-choice-'+letter.toLowerCase()+(canVote?'':' qp-choice-static')+'" '+(canVote?'data-action="vote" data-choice="'+letter+'"':'disabled')+'>'+
 '<span class="qp-letter">'+letter+'</span><span class="qp-choice-text">'+esc(text)+'</span>'+
 (canVote?'<span class="qp-pick">Elegir '+letter+' ↗</span>':'<span class="qp-pick">Opción '+letter+'</span>')+'</button>';
}
function phaseLabel(r){return r.status==='results'?'RESULTADOS':'VOTACIÓN'}
function round(r){
 const q=r.dilemma,reader=r.players.find(p=>p.id===r.reader),imReader=r.me===r.reader,
       hasVoted=!!r.my_vote,num=r.players.filter(p=>p.voted).length,total=r.players.length-1;
 if(!q)return loading();
 const headline=imReader?'Te toca leer el dilema':'Lee '+esc(reader?.name||'tu compañero');
 const description=imReader?'Lee las dos opciones en voz alta. En esta ronda tú no votas.':'Escucha el dilema y elige una de las dos opciones. Tu voto es secreto.';
 const voting=r.status==='voting';
 const canVote=voting&&!imReader&&!hasVoted&&!s.busy;
 return header()+'<main class="party-container party-main qp-game-main">'+top()+error()+
 '<section class="qp-turn-heading"><span class="party-step">RONDA '+r.round+' · JUGADOR '+(r.players.findIndex(p=>p.id===r.reader)+1)+' DE '+r.players.length+'</span><h1>'+headline+'</h1><p>'+description+'</p></section>'+
 '<div class="qp-reader-note"><span class="qp-reader-avatar">'+esc((reader?.name||'?').slice(0,1).toUpperCase())+'</span><span>Turno de <strong>'+esc(reader?.name||'—')+'</strong></span><span class="qp-reader-tag">'+(imReader?'TU TURNO':'LECTOR')+'</span></div>'+
 '<section class="qp-vote-grid qp-multi-options" aria-label="Dilema de la ronda">'+choice('A',q.a,canVote)+
 '<span class="qp-versus">O</span>'+choice('B',q.b,canVote)+'</section>'+
 (voting?
  '<section class="qp-live-status"><div class="qp-live-top"><span>'+num+' de '+total+' votos</span><span>'+(imReader?'Lee y espera':'Las respuestas no se revelan hasta el final')+'</span></div><div class="qp-progress-rail"><span style="width:'+(total?Math.round(num/total*100):0)+'%"></span></div>'+
  (hasVoted?'<div class="qp-confirmation">✓ Has elegido '+esc(r.my_vote)+'. Esperando al resto.</div>':'')+
  ((imReader||r.me===r.host)?'<button type="button" data-action="skip" class="yn-results-link">Cambiar de dilema ↗</button>':'')+
  '</section>':
  result(r))+
 '<p class="party-caption">2–10 jugadores · Sin descarga · Una pregunta por turno</p></main>';
}
function result(r){
 const a=Number(r.results?.a||0),b=Number(r.results?.b||0),votes=a+b;
 const pctA=votes?Math.round(a/votes*100):0,pctB=votes?100-pctA:0;
 const canNext=r.me===r.reader||r.me===r.host;
 const people=r.players;
 const pos=people.findIndex(p=>p.id===r.reader),next=people[(pos+1)%people.length];
 return '<section class="qp-multiplayer-result"><span class="party-step">TODOS HAN VOTADO</span><h2>'+(a===b?'¡Empate!':a>b?'¡Gana la A!':'¡Gana la B!')+'</h2>'+
 '<div class="qp-result-list"><div class="qp-result-card qp-result-a"><div><span>A</span><strong>'+esc(r.dilemma.a)+'</strong></div><b>'+a+' <small>('+pctA+' %)</small></b></div>'+
 '<div class="qp-result-card qp-result-b"><div><span>B</span><strong>'+esc(r.dilemma.b)+'</strong></div><b>'+b+' <small>('+pctB+' %)</small></b></div></div>'+
 '<div class="qp-result-bar"><span style="width:'+pctA+'%"></span></div>'+
 '<p>Ahora podéis debatir por qué habéis elegido así.</p>'+
 (canNext?'<button class="party-button party-primary" data-action="next" '+(s.busy?'disabled':'')+'>Siguiente turno: '+esc(next?.name||'jugador siguiente')+' →</button>':
 '<p class="qp-next-waiting">Esperando a '+esc((people.find(p=>p.id===r.reader)||people.find(p=>p.id===r.host))?.name||'otro jugador')+' para cambiar de ronda.</p>')+
 '</section>';
}
function render(){
 let content;if(s.help)content=rules();else if(!s.code)content=entry();else if(!s.room)content=loading();else content=s.room.status==='lobby'?lobby(s.room):round(s.room);
 app.innerHTML='<div class="party-app qp-online-app">'+content+'</div>';
}
async function changeLevel(level){
 try{return await rpc('qp_settings',{...auth(),p_intensity:level})}
 catch(e){
  // Compatibilidad temporal: el servidor anterior llama "picante" al conjunto completo 2+3.
  // Únicamente reintentamos ante la validación antigua de intensidad.
  if(level==='sinmiedo'&&/Intensidad no válida/.test(e.message))return rpc('qp_settings',{...auth(),p_intensity:'picante'});
  throw e;
 }
}
async function copy(value){try{await navigator.clipboard.writeText(value);toast('¡Copiado!')}catch{prompt('Copia el enlace',value)}}
async function click(button){
 const type=button.dataset.action;
 if(type==='rules'){s.help=!s.help;render();return;}
 if(s.help)return;
 if(type==='copy'){await copy(s.code);return;}
 if(type==='share'){try{if(navigator.share)await navigator.share({title:'¿Qué prefieres? · ¿Una partidita?',url:url()});else await copy(url())}catch{}return;}
 if(type==='leave'){if(!confirm('¿Quieres abandonar la sala?'))return;await act(async()=>{try{await rpc('qp_leave',auth())}finally{leaveLocal()}});return;}
 const r=s.room;if(!r)return;
 if(type==='level'&&r.status==='lobby'&&r.me===r.host&&levels.some(l=>l.id===button.dataset.level)){
  await act(async()=>{s.room=await changeLevel(button.dataset.level)});return;
 }
 if(type==='start'&&r.status==='lobby'&&r.me===r.host){
  await act(async()=>{if(r.intensity==='sinfiltro')s.room=await changeLevel('sinmiedo');s.room=await rpc('qp_start',auth())});return;
 }
 if(type==='vote'&&r.status==='voting'&&r.me!==r.reader&&!r.my_vote&&['A','B'].includes(button.dataset.choice)){
  await act(async()=>{s.room=await rpc('qp_vote',{...auth(),p_choice:button.dataset.choice})});return;
 }
 if(type==='next'&&r.status==='results'&&(r.me===r.reader||r.me===r.host)){
  await act(async()=>{s.room=await rpc('qp_next',auth())});return;
 }
 if(type==='skip'&&r.status==='voting'&&(r.me===r.reader||r.me===r.host)){
  if(!confirm('¿Cambiar el dilema y reiniciar los votos de esta ronda?'))return;
  await act(async()=>{s.room=await rpc('qp_skip',auth())});return;
 }
}
app.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;e.preventDefault();click(b).catch(e=>{s.error=e.message;render()})});
app.addEventListener('submit',e=>{
 if(!['qp-create','qp-join'].includes(e.target.id))return;
 e.preventDefault();
 const data=new FormData(e.target),name=String(data.get('name')||'').trim();
 if(name.length<1||name.length>20){s.error='Introduce un nombre de 1 a 20 caracteres';render();return;}
 if(e.target.id==='qp-create'){
  act(async()=>{const tok=token(),code=await rpc('qp_create',{p_name:name,p_token:tok});enter(code,name,tok);s.room=await rpc('qp_state',auth())});
 }else{
  const code=String(data.get('code')||'').trim().toUpperCase();
  if(!/^[A-F0-9]{6}$/.test(code)){s.error='El código debe tener seis caracteres';render();return;}
  const saved=store(code);
  act(async()=>{const tok=saved?.token||token();await rpc('qp_join',{p_code:code,p_name:name,p_token:tok});enter(code,name,tok);s.room=await rpc('qp_state',auth())});
 }
});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync(true)});
window.addEventListener('online',()=>sync(true));
async function init(){
 const code=(params.get('codigo')||'').toUpperCase();
 if(/^[A-F0-9]{6}$/.test(code)){
  const saved=store(code);
  if(saved?.token){s.code=code;s.name=saved.name||s.name;s.token=saved.token;poll();await sync(true);}
 }
 render();
}
init();
})();