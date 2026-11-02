'use strict';
// Cliente web de ¿Quién soy? · La Sala. Backend compartido con Supabase.
// Esta clave es publicable: el servidor comprueba los permisos con token por sala.
const CONFIG={url:'https://stpylkumzuqvaioedvvi.supabase.co',key:'sb_publishable_gVmo2eopYweroU5p0edsxg_J87_ouk6',pollLobbyMs:8000,pollPlayingMs:4000,pollEndedMs:15000};
const $=id=>document.getElementById(id), el=$('app');
const game={code:'',token:'',name:localStorage.getItem('quienSoy:name')||'',data:null,view:'entry',busy:false,error:'',loading:false};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* Modo mixto: probabilidades equilibradas entre cultura pop (45 %),
   música/deporte/creadores (35 %) y cultura general (20 %).
   La lista ponderada conserva todos los IDs únicos y sirve a _ts_pick. */
const MIX_GROUPS=[
 {categories:['videojuegos','ficcion','cine'],share:45},
 {categories:['musica','deporte','influencers'],share:35},
 {categories:['historia','ciencia','arte','politica','exploradores','mitologia'],share:20}
];
function availableCharacters(categories,difficulty){
 return CHARACTERS.filter(c=>categories.includes(c.category)&&(difficulty==='mixta'||c.level===difficulty));
}
function buildCandidatePool(categories,difficulty){
 const selected=availableCharacters(categories,difficulty);
 if(difficulty!=='mixta')return selected.map(c=>c.id);
 const groups=MIX_GROUPS.map(group=>({
  share:group.share,
  categories:group.categories.filter(category=>selected.some(ch=>ch.category===category))
 })).filter(group=>group.categories.length);
 const totalShares=groups.reduce((sum,group)=>sum+group.share,0);
 const weighted=[];
 for(const group of groups){
  const budget=960*group.share/totalShares/group.categories.length;
  for(const category of group.categories){
   const cards=selected.filter(ch=>ch.category===category);
   const levels=['facil','media','dificil'].map(level=>({
    level,items:cards.filter(ch=>ch.level===level),share:{facil:60,media:30,dificil:10}[level]
   })).filter(group=>group.items.length);
   const levelsSum=levels.reduce((sum,group)=>sum+group.share,0);
   for(const level of levels){
    const repeats=Math.max(1,Math.round(budget*(level.share/levelsSum)/level.items.length));
    for(const ch of level.items)for(let j=0;j<repeats;j++)weighted.push(ch.id);
   }
  }
 }
 return weighted;
}

const sessionKey=code=>'quienSoy:session:'+code;
const initials=v=>v?.trim().slice(0,1).toUpperCase()||'?';
let toastTimeout, pollTimer=null, consecutiveErrors=0;
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>t.classList.remove('show'),2600);}
function token(){const b=crypto.getRandomValues(new Uint8Array(32));return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');}
function roomUrl(){return location.origin+location.pathname+'?sala='+encodeURIComponent(game.code);}
function save(){localStorage.setItem(sessionKey(game.code),JSON.stringify({name:game.name,token:game.token}));localStorage.setItem('quienSoy:lastRoom',game.code);localStorage.setItem('quienSoy:name',game.name);}
async function rpc(fn,args){const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),12000);try{
 const res=await fetch(CONFIG.url+'/rest/v1/rpc/'+fn,{method:'POST',headers:{'apikey':CONFIG.key,'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(args),signal:ctrl.signal});
 const raw=await res.text();let data;try{data=JSON.parse(raw)}catch{data=raw}
 if(!res.ok){const err=new Error(data?.message||'Error de conexión ('+res.status+')');err.status=res.status;throw err;}return data;
 }catch(e){if(e.name==='AbortError')throw Error('La conexión ha tardado demasiado.');throw e;}finally{clearTimeout(timeout);}}
async function refresh(force=false){
 if(!game.code||!game.token||game.loading)return;
 game.loading=true;
 const code=game.code;
 try{
  const data=await rpc('ts_state',{p_code:code,p_token:game.token});
  if(code!==game.code)return;
  const previous=game.data&&JSON.stringify(game.data);
  const restored=consecutiveErrors>0;
  consecutiveErrors=0;
  game.data=data;
  game.error='';
  if(force||JSON.stringify(data)!==previous||restored)render();
  if(restored&&!force)toast('Conexión recuperada.');
 }catch(e){
  consecutiveErrors++;
  if(force||consecutiveErrors===2){
   game.error=e?.status===429?'El servidor está ocupado. Reintentando automáticamente.':
      (e?.message||'Error al actualizar la partida. Se reintentará.');
   render();
  }
 }finally{
  game.loading=false;
 }
}
function pollDelay(){
 if(!game.code||!game.token)return 30000;
 const status=game.data?.room?.status;
 const base=status==='playing'?CONFIG.pollPlayingMs:
   status==='ended'?CONFIG.pollEndedMs:CONFIG.pollLobbyMs;
 const multiplier=Math.pow(2,Math.min(3,consecutiveErrors));
 return Math.min(60000,base*multiplier)+Math.floor(Math.random()*600);
}
function schedulePoll(delay){
 clearTimeout(pollTimer);
 if(!game.code||!game.token)return;
 pollTimer=setTimeout(async()=>{
   if(document.visibilityState==='visible'&&game.view!=='rules')await refresh();
   schedulePoll();
 },delay??pollDelay());
}
async function run(fn){if(game.busy)return;game.busy=true;game.error='';render();try{await fn()}catch(e){game.error=e.message||'No se pudo completar la acción.';render();}finally{game.busy=false;render();}}
function enter(code,name,secret){game.code=code;game.name=name;game.token=secret;game.data=null;game.view='room';history.replaceState(null,'','?sala='+code);save();schedulePoll();}
async function createRoom(name){name=name.trim();if(!name)throw Error('Escribe un nombre o apodo.');const secret=token();const code=await rpc('create_room',{p_name:name,p_token:secret});enter(code,name,secret);await rpc('update_settings',{p_code:code,p_token:secret,p_difficulty:'mixta',p_categories:CATEGORIES});await refresh(true);toast('¡Sala creada! Comparte el código.');}
async function joinRoom(name,code){name=name.trim();code=code.trim().toUpperCase();if(!name)throw Error('Escribe un nombre o apodo.');if(!/^[A-Z2-9]{6}$/.test(code))throw Error('Introduce un código de seis caracteres.');let prev;try{prev=JSON.parse(localStorage.getItem(sessionKey(code))||'null')}catch{}
 const secret=prev?.token||token();await rpc('join_room',{p_code:code,p_name:name,p_token:secret});enter(code,name,secret);await refresh(true);toast('¡Ya estás en la sala!');}
async function playAction(action){await rpc('ts_action',{p_code:game.code,p_token:game.token,p_action:action});await refresh(true);}
function header(){return `<header class="topbar"><div class="max topbar-inner"><a class="brand" data-action="home" href="#"><span class="brand-icon">?</span><span class="brand-name">¿QUIÉN SOY?<span class="brand-sub">La sala</span></span></a><div class="top-actions"><button class="btn btn-small btn-ghost" data-action="rules">Cómo jugar</button>${game.code?'<button class="btn btn-small btn-ghost" data-action="leave">Salir</button>':''}</div></div></header>`;}
function footer(){return `<footer class="footer">Juega en grupo · Sin cuentas para los participantes · Máximo 10 preguntas por turno</footer>`;}
function error(){return game.error?`<div role="alert" class="error">${esc(game.error)}</div>`:'';}
function roomBar(d){return `<div class="room-header"><div><div class="room-title">${d.room.status==='lobby'?'Sala de espera':'Ronda '+d.room.round} · Código compartido</div><span class="room-code">${esc(d.room.code)}</span></div><div class="room-actions"><button class="btn btn-small" data-action="copy">Copiar código</button><button class="btn btn-small" data-action="share">Compartir enlace</button></div></div>`;}
function playerList(d){return `<ul class="player-list">${(d.players||[]).map(p=>`<li><div class="avatar">${esc(initials(p.name))}</div><div class="player-main"><strong>${esc(p.name)} ${p.id===d.me.id?'<span class="muted text-small">(tú)</span>':''}</strong><small>${p.is_active?'Le toca adivinar · ':''}${p.online?'Conectado':'Sin actividad reciente'}</small></div>${p.is_active?'<span class="chip coral">Turno actual</span>':p.finished?'<span class="chip">✓ Jugó</span>':p.is_host?'<span class="chip gold">Anfitrión</span>':''}</li>`).join('')}</ul>`;}
function entry(){const pre=new URLSearchParams(location.search).get('sala')||'';return `<div class="shell">${header()}<main><section class="hero"><div class="max"><div><span class="hero-tag">MULTIJUGADOR · SIN REGISTRO</span><h1>¿QUIÉN <em>SOY?</em></h1><p>Adivina quién eres en 10 preguntas. Cultura pop, videojuegos, música y mucho más: crea una sala y juega con tus amigos.</p></div><div class="hero-cards"><div class="mystery-back"></div><div class="mystery-card"><div class="mystery-icon">?</div><span>Identidad oculta</span></div></div></div></section><div class="max entry-grid"><section class="panel"><span class="eyebrow">01 · Organiza</span><h2>Crea una sala</h2><p>Comparte un código de seis caracteres para jugar todos juntos.</p><form id="create-form"><div class="field"><label class="input-label" for="create-name">Tu nombre o apodo</label><input id="create-name" name="name" class="text-input" maxlength="20" value="${esc(game.name)}" placeholder="Ej.: Ana" required autocomplete="nickname"></div><button class="btn btn-primary btn-wide" ${game.busy?'disabled':''}>Crear sala</button></form></section><section class="panel"><span class="eyebrow">02 · Participa</span><h2>Únete a tus amigos</h2><p>Entra desde cualquier móvil utilizando el código compartido.</p><form id="join-form"><div class="field"><label class="input-label" for="join-name">Tu nombre o apodo</label><input id="join-name" name="name" maxlength="20" class="text-input" value="${esc(game.name)}" placeholder="Ej.: Luis" required autocomplete="nickname"></div><div class="field"><label class="input-label" for="join-code">Código de sala</label><input id="join-code" name="code" maxlength="6" minlength="6" value="${esc(pre.toUpperCase())}" class="text-input code-input" placeholder="ABC123" required autocapitalize="characters"></div><button class="btn btn-dark btn-wide" ${game.busy?'disabled':''}>Entrar en sala</button></form></section></div>${error()}</main>${footer()}</div>`;}
function lobby(d){const host=d.me.id===d.room.host_player_id, cats=d.room.categories||CATEGORIES, dif=d.room.difficulty, pool=availableCharacters(cats,dif);return `<div class="shell">${header()}<main class="max page">${roomBar(d)}${error()}<span class="eyebrow">VESTÍBULO</span><h1 class="page-title">Preparad las preguntas.</h1><p class="subheading">Cada persona tendrá su turno. Solo ella desconoce el personaje; los demás verán los datos para responder.</p><div class="lobby-layout"><section class="panel"><div class="section-title"><h2>Jugadores</h2><span class="chip">${d.players.length}/12</span></div>${playerList(d)}${d.players.length<2?'<div class="rule-note">Se necesitan al menos dos jugadores.</div>':''}</section><section class="panel"><div class="section-title"><h2>Configuración</h2>${host?'<span class="chip gold">Anfitrión</span>':'<span class="chip grey">Solo el anfitrión</span>'}</div><div class="settings-group"><h3>Dificultad</h3><div class="options">${[['facil','Fácil'],['media','Media'],['mixta','Mixta ★']].map(([id,label])=>`<button class="option ${dif===id?'selected':''}" data-action="difficulty" data-value="${id}" ${!host||game.busy?'disabled':''}>${label}</button>`).join('')}</div></div><div class="settings-group"><h3>Categorías</h3><div class="options">${CATEGORIES.map(id=>`<button class="option ${cats.includes(id)?'selected':''}" data-action="category" data-value="${id}" ${!host||game.busy?'disabled':''}>${esc(CATEGORY_LABELS[id])}</button>`).join('')}</div><div class="hint">${pool.length} personajes disponibles. El modo Mixto es el recomendado: combina referencias populares y cultura general, e incluye algunos personajes difíciles.</div></div>${host?`<button class="btn btn-primary btn-wide" data-action="start" ${game.busy||d.players.length<2||pool.length<d.players.length?'disabled':''}>Empezar los turnos</button>`:'<div class="rule-note">Esperando al anfitrión.</div>'}</section></div></main>${footer()}</div>`;}
function characterCard(ch,playerName){if(!ch)return '<div class="panel">No se ha encontrado la ficha.</div>';return `<div class="character-card"><div class="character-head"><span class="eyebrow">NO ENSEÑAR A ${esc(playerName)}</span><div class="character-name">${esc(ch.name)}</div><span class="chip gold">${esc(CATEGORY_LABELS[ch.category])}</span><div class="small-warning">Utiliza los datos para responder sin revelar el nombre.</div></div><div class="card-content"><div class="meta-row"><span>¿Es real?</span><b>${['videojuegos','ficcion','mitologia'].includes(ch.category)?'No, es un personaje ficticio o mitológico':'Sí'}</b></div><div class="meta-row"><span>¿Está vivo?</span><b>${ch.alive===null?'No aplica':ch.alive?'Sí':'No'} · ${esc(ch.life)}</b></div><div class="meta-row"><span>Procedencia</span><b>${esc(ch.origin)}</b></div><div class="meta-row"><span>Época</span><b>${esc(ch.era)}</b></div><div class="meta-row"><span>Profesión</span><b>${esc(ch.role)}</b></div></div><div class="accordion"><strong>Hechos importantes</strong><ul class="facts">${ch.facts.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><p><b>Guía para responder:</b> ${esc(ch.guide)}</p>${ch.caution?`<p><b>Matices:</b> ${esc(ch.caution)}</p>`:''}</div></div>`;}
function historyMarkup(d){const h=d.history||[];if(!h.length)return '';return `<div class="separator"></div><div class="section-title"><h2>Turnos completados</h2><span class="chip">${h.length}</span></div><div class="cards-grid">${h.map(x=>{const pl=d.players.find(p=>p.id===x.player_id);const ch=CHARACTER_MAP.get(x.character_id);const result=x.success?'Acertó':x.reason==='limite'?'10 preguntas agotadas':x.reason==='omitido'?'Turno saltado':'Ronda interrumpida';return `<div class="panel"><span class="eyebrow">${esc(result)}</span><h3 style="margin:7px 0 5px">${esc(pl?.name||'Jugador que salió')}</h3><p style="font-size:20px;font-weight:900;margin:0">${esc(ch?.name||'Personaje')}</p><span class="chip">${Number(x.questions)||0}/10 preguntas</span></div>`;}).join('')}</div>`;}
function playing(d){const host=d.me.id===d.room.host_player_id,turn=d.turn||{},active=d.players.find(p=>p.id===turn.active_player_id),isMe=d.me.is_active,q=turn.questions||0,ch=CHARACTER_MAP.get(turn.character_id);const name=active?.name||'Jugador';return `<div class="shell">${header()}<main class="max page">${roomBar(d)}${error()}<section class="panel" style="border:2px solid #ffcf74"><span class="eyebrow">Ronda ${d.room.round} · Turno ${turn.turn_number} de ${turn.total_turns}</span><h1 class="page-title">Le toca a ${esc(name)}${isMe?' (tú)':''}</h1><p class="subheading">${isMe?'Haz preguntas de sí o no. Los demás tienen tu ficha. Registra cada pregunta después de hacerla.':'Escucha sus preguntas y responde usando los datos de su personaje.'}</p><div style="display:flex;justify-content:space-between;gap:12px;font-weight:900"><span>Preguntas</span><span>${q} / 10</span></div><div class="questions-meter">${Array.from({length:10},(_,i)=>`<i class="${i<q?'used':''}"></i>`).join('')}</div>${isMe?'<div class="toolbar" style="margin-top:17px"><button class="btn btn-dark" data-action="question" '+(game.busy?'disabled':'')+'>+ Registrar pregunta</button><button class="btn btn-primary" data-action="correct" '+(game.busy?'disabled':'')+'>¡He acertado!</button></div>':'<div class="rule-note">Se cambiará de jugador automáticamente cuando acierte o llegue a 10 preguntas.</div>'}</section><div class="lobby-layout" style="margin-top:19px"><section>${isMe?'<div class="secret-banner"><div class="secret-icon">?</div><div><h2>Tu personaje es secreto</h2><p>Solo los demás pueden verlo. ¡Adivina quién eres!</p></div></div>':characterCard(ch,name)}</section><aside class="panel"><h2>Orden de juego</h2>${playerList(d)}<div class="hint">${(d.history||[]).length} turnos completados de ${turn.total_turns}.${d.players.length>turn.total_turns?' Los jugadores incorporados durante la ronda participarán en la siguiente.':''}</div>${host?`<div class="toolbar" style="margin-top:17px"><button class="btn btn-outline" data-action="skip">Saltar turno</button><button class="btn btn-outline" data-action="finish">Terminar ronda</button></div>`:''}</aside></div>${historyMarkup(d)}</main>${footer()}</div>`;}
function ended(d){const h=d.history||[],win=h.filter(x=>x.success).length,host=d.me.id===d.room.host_player_id;return `<div class="shell">${header()}<main class="max page">${roomBar(d)}${error()}<section class="panel"><span class="eyebrow">Ronda ${d.room.round}</span><h1 class="page-title">¡Fin de la ronda!</h1><p class="subheading">${win} de ${h.length} turnos acabaron en acierto.</p>${host?'<button class="btn btn-primary" data-action="lobby">Preparar otra ronda</button>':'<div class="rule-note">El anfitrión podrá preparar otra ronda.</div>'}</section>${historyMarkup(d)}</main>${footer()}</div>`;}
function rules(){return `<div class="shell">${header()}<main class="max page"><button class="btn btn-soft btn-small" data-action="back">← Volver</button><span class="eyebrow" style="display:block;margin-top:24px">REGLAS</span><h1 class="page-title">Cómo jugar</h1><div class="rule-grid"><section class="panel"><h3>1. Entrad en la sala</h3><p>Alguien crea una sala. Los demás se unen por código o enlace, desde su propio móvil.</p></section><section class="panel"><h3>2. Un solo jugador pregunta</h3><p>En cada turno solo una persona desconoce su personaje. Los demás ven su ficha, con hechos y datos.</p></section><section class="panel"><h3>3. Máximo 10 preguntas</h3><p>Pregunta cosas de sí o no: «¿Soy real?», «¿Soy español?». Para figuras de ficción, la edad y estar vivo pueden no aplicar. Tras cada pregunta, el protagonista registra una.</p></section><section class="panel"><h3>4. Cambio automático</h3><p>Al acertar o consumir la décima pregunta, se registra el resultado y empieza el siguiente turno. Al jugar todos, termina la ronda.</p></section></div></main>${footer()}</div>`;}
function render(){if(game.view==='rules'){el.innerHTML=rules();return;}if(!game.code){el.innerHTML=entry();return;}if(!game.data){el.innerHTML=`<div class="shell">${header()}<main class="max page"><div class="panel">${game.error?'No se ha podido conectar. Comprueba la conexión o vuelve a la pantalla principal.':'Conectando con la sala…'}</div>${error()}</main></div>`;return;}const d=game.data;el.innerHTML=d.room.status==='lobby'?lobby(d):d.room.status==='playing'?playing(d):ended(d);}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('Copiado.')}catch{prompt('Copia este texto:',text);}}
async function click(b){const action=b.dataset.action,d=game.data;if(action==='rules'){game.view='rules';render();return;}if(action==='back'){game.view=game.code?'room':'entry';render();return;}if(action==='home'){game.view=game.code?'room':'entry';render();return;}if(action==='copy')return copy(game.code);if(action==='share'){const url=roomUrl();try{if(navigator.share)await navigator.share({title:'¿Quién soy?',url});else await copy(url);}catch{}return;}if(action==='leave'){if(!confirm('¿Salir de la sala?'))return;return run(async()=>{try{await rpc('leave_room',{p_code:game.code,p_token:game.token});}catch(e){console.warn('No se pudo notificar la salida; la sesión local se cerrará.',e);}localStorage.removeItem(sessionKey(game.code));localStorage.removeItem('quienSoy:lastRoom');game.code='';game.token='';game.data=null;game.view='entry';schedulePoll();history.replaceState(null,'',location.pathname);});}if(!d)return;
 const host=d.me.id===d.room.host_player_id;
 if(action==='difficulty')return run(async()=>{await rpc('update_settings',{p_code:game.code,p_token:game.token,p_difficulty:b.dataset.value,p_categories:d.room.categories});await refresh(true);});
 if(action==='category'){let cats=[...d.room.categories],id=b.dataset.value;if(cats.includes(id)){if(cats.length===1){toast('Selecciona alguna categoría.');return;}cats=cats.filter(c=>c!==id);}else cats.push(id);return run(async()=>{await rpc('update_settings',{p_code:game.code,p_token:game.token,p_difficulty:d.room.difficulty,p_categories:cats});await refresh(true);});}
 if(action==='start'){const pool=buildCandidatePool(d.room.categories,d.room.difficulty);return run(async()=>{await rpc('ts_start',{p_code:game.code,p_token:game.token,p_candidates:pool});await refresh(true);});}
 if(action==='question')return run(()=>playAction('question'));
 if(action==='correct'){if(!confirm('¿Los demás han confirmado que has adivinado tu personaje?'))return;return run(()=>playAction('correct'));}
 if(action==='skip'){if(!confirm('¿Saltar el turno de esta persona?'))return;return run(()=>playAction('skip'));}
 if(action==='finish'){if(!confirm('¿Terminar la ronda?'))return;return run(()=>playAction('end'));}
 if(action==='lobby')return run(()=>playAction('lobby'));
}
el.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b){e.preventDefault();click(b).catch(err=>{game.error=err.message;render();});}});
el.addEventListener('submit',e=>{if(!['create-form','join-form'].includes(e.target.id))return;e.preventDefault();const f=new FormData(e.target);if(e.target.id==='create-form')run(()=>createRoom(String(f.get('name')||'')));else run(()=>joinRoom(String(f.get('name')||''),String(f.get('code')||'')));});
async function init(){const code=(new URLSearchParams(location.search).get('sala')||localStorage.getItem('quienSoy:lastRoom')||'').toUpperCase();if(code){let s;try{s=JSON.parse(localStorage.getItem(sessionKey(code))||'null')}catch{}if(s?.token){game.code=code;game.name=s.name||game.name;game.token=s.token;game.view='room';await refresh(true);if(!game.data){game.code='';game.token='';game.view='entry';}}}render();}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&game.code){refresh(true);schedulePoll();}});
window.addEventListener('online',()=>{if(game.code){refresh(true);schedulePoll();}});
init().finally(()=>schedulePoll());