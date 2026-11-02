'use strict';
// Cliente web de ¿Quién soy? · La Sala. Backend compartido con Supabase.
// Esta clave es publicable: el servidor comprueba los permisos con token por sala.
const CONFIG={url:'https://stpylkumzuqvaioedvvi.supabase.co',key:'sb_publishable_gVmo2eopYweroU5p0edsxg_J87_ouk6',pollLobbyMs:8000,pollPlayingMs:4000,pollEndedMs:15000};
const $=id=>document.getElementById(id), el=$('app');
const game={code:'',token:'',name:localStorage.getItem('quienSoy:name')||'',data:null,view:'entry',busy:false,error:'',loading:false};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* Cada personaje tiene la misma probabilidad dentro de su categoría.
   El reparto conserva variedad temática: 45 % cultura pop,
   35 % música/deporte/creadores y 20 % cultura general. */
const THEME_GROUPS=[
 {categories:['videojuegos','ficcion','cine'],share:45},
 {categories:['musica','deporte','influencers'],share:35},
 {categories:['historia','ciencia','arte','politica','exploradores','mitologia'],share:20}
];
function availableCharacters(categories){
 return CHARACTERS.filter(c=>categories.includes(c.category));
}
function buildCandidatePool(categories){
 const selected=availableCharacters(categories);
 const groups=THEME_GROUPS.map(group=>({
  share:group.share,
  categories:group.categories.filter(category=>selected.some(ch=>ch.category===category))
 })).filter(group=>group.categories.length);
 const totalShares=groups.reduce((sum,group)=>sum+group.share,0);
 const weighted=[];
 for(const group of groups){
  const budget=960*group.share/totalShares/group.categories.length;
  for(const category of group.categories){
   const cards=selected.filter(ch=>ch.category===category);
   const repeats=Math.max(1,Math.round(budget/cards.length));
   for(const ch of cards)for(let j=0;j<repeats;j++)weighted.push(ch.id);
  }
 }
 return weighted;
}

const sessionKey=code=>'quienSoy:session:'+code;
const initials=v=>v?.trim().slice(0,1).toUpperCase()||'?';
let toastTimeout, pollTimer=null, consecutiveErrors=0;

// Avisos desde el servidor: sin datos privados; la identidad sigue protegida por ts_state.
// El sondeo periódico permanece como respaldo para cortes de red y móviles suspendidos.
let realtimeSocket=null,realtimeTopic='',realtimeReady=false,realtimeGeneration=0;
let realtimeHeartbeat=null,realtimeReconnectTimer=null,realtimeReconnectAttempts=0;
let liveRefreshTimer=null,realtimeLastRef=0;
let queuedRefresh=false;
function realtimeSend(ws,topic,event,payload,joinRef=null){
 if(ws.readyState!==WebSocket.OPEN)return;
 const ref=String(++realtimeLastRef);
 ws.send(JSON.stringify({topic,event,payload,ref,join_ref:joinRef}));
 return ref;
}
function stopRealtime(clearTopic=true){
 realtimeGeneration++;
 clearInterval(realtimeHeartbeat);
 clearTimeout(realtimeReconnectTimer);
 clearTimeout(liveRefreshTimer);
 realtimeHeartbeat=null;realtimeReconnectTimer=null;liveRefreshTimer=null;
 const hadConnection=realtimeReady;
 realtimeReady=false;
 const socket=realtimeSocket;
 realtimeSocket=null;
 if(socket){
  socket.onopen=socket.onmessage=socket.onclose=socket.onerror=null;
  if(socket.readyState<=WebSocket.OPEN)socket.close();
 }
 if(clearTopic)realtimeTopic='';
 if(hadConnection&&game.data)render();
}
function scheduleRealtimeReconnect(topic){
 if(topic!==realtimeTopic||!game.code||document.visibilityState!=='visible')return;
 clearTimeout(realtimeReconnectTimer);
 const retry=Math.min(25000,1000*Math.pow(2,Math.min(4,realtimeReconnectAttempts++)));
 realtimeReconnectTimer=setTimeout(()=>startRealtime(topic),retry+Math.random()*450);
}
function startRealtime(topic){
 if(!/^room:[0-9a-f-]{36}$/.test(topic||'')||!game.code)return;
 if(realtimeTopic!==topic){
  stopRealtime();
  realtimeTopic=topic;
  realtimeReconnectAttempts=0;
 }
 if(document.visibilityState==='hidden')return;
 if(realtimeSocket&&realtimeSocket.readyState<=WebSocket.OPEN)return;
 const code=game.code;
 const generation=++realtimeGeneration;
 let socket;
 try{
  const uri=CONFIG.url.replace(/^https:/,'wss:')+'/realtime/v1/websocket?apikey='+encodeURIComponent(CONFIG.key)+'&vsn=1.0.0';
  socket=new WebSocket(uri);
 }catch(e){
  console.warn('La conexión directa no está disponible; continuamos con actualización automática.',e);
  scheduleRealtimeReconnect(topic);return;
 }
 realtimeSocket=socket;
 let joinReference=null;
 socket.onopen=()=>{
  if(generation!==realtimeGeneration||game.code!==code)return;
  joinReference=realtimeSend(socket,'realtime:'+topic,'phx_join',{
   config:{
    broadcast:{ack:false,self:false,replication_ready:true},
    presence:{enabled:false},postgres_changes:[],private:false
   }
  });
  realtimeHeartbeat=setInterval(()=>{
   if(socket.readyState===WebSocket.OPEN){
    realtimeSend(socket,'phoenix','heartbeat',{});
   }else{
    socket.close();
   }
  },25000);
 };
 socket.onmessage=event=>{
  if(generation!==realtimeGeneration||game.code!==code)return;
  let msg;
  try{msg=JSON.parse(event.data)}catch{return}
  if(msg.event==='phx_reply'&&msg.ref===joinReference){
   if(msg.payload?.status==='ok'){
    realtimeReady=true;
    realtimeReconnectAttempts=0;
    if(game.data)render();
    // A change may have occurred while the channel was joining.
    refresh();
   }else socket.close();
  }else if(msg.event==='broadcast'&&msg.topic==='realtime:'+topic&&msg.payload?.event==='updated'){
   const announced=Number(msg.payload?.payload?.version);
   if(Number.isFinite(announced)&&announced<=Number(game.data?.room?.version))return;
   clearTimeout(liveRefreshTimer);
   liveRefreshTimer=setTimeout(()=>refresh(true),120);
  }else if(msg.event==='phx_error'||msg.event==='phx_close'){
   socket.close();
  }
 };
 socket.onerror=()=>{socket.close()};
 socket.onclose=()=>{
  if(generation!==realtimeGeneration||realtimeSocket!==socket)return;
  clearInterval(realtimeHeartbeat);
  realtimeHeartbeat=null;
  realtimeSocket=null;
  const wasReady=realtimeReady;
  realtimeReady=false;
  if(wasReady&&game.data)render();
  scheduleRealtimeReconnect(topic);
 };
}

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
 if(!game.code||!game.token)return;
 if(game.loading){if(force)queuedRefresh=true;return;}
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
  if(data.sync_topic)startRealtime(data.sync_topic);
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
  if(queuedRefresh&&game.code===code){queuedRefresh=false;refresh(true);}
 }
}
function pollDelay(){
 if(!game.code||!game.token)return 30000;
 const status=game.data?.room?.status;
 const base=realtimeReady?18000:(status==='playing'?CONFIG.pollPlayingMs:
   status==='ended'?CONFIG.pollEndedMs:CONFIG.pollLobbyMs);
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
function enter(code,name,secret){stopRealtime();game.code=code;game.name=name;game.token=secret;game.data=null;game.view='room';history.replaceState(null,'','?sala='+code);save();schedulePoll();}
async function createRoom(name){name=name.trim();if(!name)throw Error('Escribe un nombre o apodo.');const secret=token();const code=await rpc('create_room',{p_name:name,p_token:secret});enter(code,name,secret);await rpc('update_settings',{p_code:code,p_token:secret,p_difficulty:'mixta',p_categories:CATEGORIES});await refresh(true);toast('¡Sala creada! Comparte el código.');}
async function joinRoom(name,code){name=name.trim();code=code.trim().toUpperCase();if(!name)throw Error('Escribe un nombre o apodo.');if(!/^[A-Z2-9]{6}$/.test(code))throw Error('Introduce un código de seis caracteres.');let prev;try{prev=JSON.parse(localStorage.getItem(sessionKey(code))||'null')}catch{}
 const secret=prev?.token||token();await rpc('join_room',{p_code:code,p_name:name,p_token:secret});enter(code,name,secret);await refresh(true);toast('¡Ya estás en la sala!');}
async function playAction(action){await rpc('ts_action',{p_code:game.code,p_token:game.token,p_action:action});await refresh(true);}
function header(){return `<header class="topbar"><div class="max topbar-inner"><a class="brand" data-action="home" href="#"><span class="brand-icon">?</span><span class="brand-name">¿QUIÉN SOY?<span class="brand-sub">La sala</span></span></a><div class="top-actions"><button class="btn btn-small btn-ghost" data-action="rules">Cómo jugar</button>${game.code?'<button class="btn btn-small btn-ghost" data-action="leave">Salir</button>':''}</div></div></header>`;}
function footer(){return `<footer class="footer">Juega en grupo · Sin cuentas para los participantes · Máximo 10 preguntas por turno</footer>`;}
function error(){return game.error?`<div role="alert" class="error">${esc(game.error)}</div>`:'';}
function roomBar(d){return `<div class="room-header"><div><div class="room-title">${d.room.status==='lobby'?'Sala de espera':'Ronda '+d.room.round} · Código compartido</div><span class="room-code">${esc(d.room.code)}</span> <span class="chip ${realtimeReady?'':'grey'}" title="${realtimeReady?'Los cambios se reciben en directo':'Sincronización automática activa'}">${realtimeReady?'● En directo':'↻ Sincronizando'}</span></div><div class="room-actions"><button class="btn btn-small" data-action="copy">Copiar código</button><button class="btn btn-small" data-action="share">Compartir enlace</button></div></div>`;}
function playerList(d){return `<ul class="player-list">${(d.players||[]).map(p=>`<li><div class="avatar">${esc(initials(p.name))}</div><div class="player-main"><strong>${esc(p.name)} ${p.id===d.me.id?'<span class="muted text-small">(tú)</span>':''}</strong><small>${p.is_active?'Le toca adivinar · ':''}${p.online?'Conectado':'Sin actividad reciente'}</small></div>${p.is_active?'<span class="chip coral">Turno actual</span>':p.finished?'<span class="chip">✓ Jugó</span>':p.is_host?'<span class="chip gold">Anfitrión</span>':''}</li>`).join('')}</ul>`;}
function entry(){const pre=new URLSearchParams(location.search).get('sala')||'';return `<div class="shell">${header()}<main><section class="hero"><div class="max"><div><span class="hero-tag">MULTIJUGADOR · SIN REGISTRO</span><h1>¿QUIÉN <em>SOY?</em></h1><p>Adivina quién eres en 10 preguntas. Cultura pop, videojuegos, música y mucho más: crea una sala y juega con tus amigos.</p></div><div class="hero-cards"><div class="mystery-back"></div><div class="mystery-card"><div class="mystery-icon">?</div><span>Identidad oculta</span></div></div></div></section><div class="max entry-grid"><section class="panel"><span class="eyebrow">01 · Organiza</span><h2>Crea una sala</h2><p>Comparte un código de seis caracteres para jugar todos juntos.</p><form id="create-form"><div class="field"><label class="input-label" for="create-name">Tu nombre o apodo</label><input id="create-name" name="name" class="text-input" maxlength="20" value="${esc(game.name)}" placeholder="Ej.: Ana" required autocomplete="nickname"></div><button class="btn btn-primary btn-wide" ${game.busy?'disabled':''}>Crear sala</button></form></section><section class="panel"><span class="eyebrow">02 · Participa</span><h2>Únete a tus amigos</h2><p>Entra desde cualquier móvil utilizando el código compartido.</p><form id="join-form"><div class="field"><label class="input-label" for="join-name">Tu nombre o apodo</label><input id="join-name" name="name" maxlength="20" class="text-input" value="${esc(game.name)}" placeholder="Ej.: Luis" required autocomplete="nickname"></div><div class="field"><label class="input-label" for="join-code">Código de sala</label><input id="join-code" name="code" maxlength="6" minlength="6" value="${esc(pre.toUpperCase())}" class="text-input code-input" placeholder="ABC123" required autocapitalize="characters"></div><button class="btn btn-dark btn-wide" ${game.busy?'disabled':''}>Entrar en sala</button></form></section></div>${error()}</main>${footer()}</div>`;}
/* Seis tarjetas visibles para doce categorías internas existentes.
   Los grupos solo afectan a la selección; las fichas y las salas no cambian. */
const TOPIC_GROUPS=[
 {id:'pantalla',label:'Cine, series y animación',icon:'🎬',color:'#93603e',tint:'#fff0e2',categories:['cine','ficcion']},
 {id:'videojuegos',label:'Videojuegos',icon:'🎮',color:'#6554ab',tint:'#efebff',categories:['videojuegos']},
 {id:'musica',label:'Música',icon:'🎵',color:'#9d4e88',tint:'#f7e8f2',categories:['musica']},
 {id:'deporte',label:'Deportes',icon:'⚽',color:'#398367',tint:'#e4f4e8',categories:['deporte']},
 {id:'internet',label:'Internet',icon:'📱',color:'#417e97',tint:'#e6f2f8',categories:['influencers']},
 {id:'general',label:'Cultura general',icon:'🌍',color:'#8a663f',tint:'#f6ebdb',categories:['historia','ciencia','arte','politica','exploradores','mitologia']}
];
const POP_CATEGORIES=TOPIC_GROUPS.filter(group=>['pantalla','videojuegos','musica','internet'].includes(group.id)).flatMap(group=>group.categories);
function topicPicker(d,host,cats){
 const all=CATEGORIES.every(id=>cats.includes(id));
 const pop=cats.length===POP_CATEGORIES.length&&POP_CATEGORIES.every(id=>cats.includes(id));
 const disabled=!host||game.busy?'disabled':'';
 const active=TOPIC_GROUPS.filter(group=>group.categories.some(id=>cats.includes(id))).length;
 return `<div class="topic-panel-head"><div><span class="eyebrow">LA PARTIDA, A VUESTRO GUSTO</span><h2>Elegid temáticas</h2><p>Tocad las que queráis incluir.</p></div><span class="topic-host-label">${host?'Tú eliges':'Elige el anfitrión'}</span></div>
 <div class="topic-presets" role="group" aria-label="Selección rápida"><button type="button" class="topic-preset ${all?'active':''}" data-action="category-preset" data-value="all" aria-pressed="${all}" ${disabled}>Todas</button><button type="button" class="topic-preset ${pop?'active':''}" data-action="category-preset" data-value="pop" aria-pressed="${pop}" ${disabled}>Cultura pop</button></div>
 <div class="topic-grid" role="group" aria-label="Temáticas disponibles">${TOPIC_GROUPS.map(group=>{const included=group.categories.filter(id=>cats.includes(id)).length;const selected=included===group.categories.length;const partial=included>0&&!selected;return `<button type="button" class="topic-card ${selected?'is-selected':partial?'is-partial':''}" data-action="category" data-value="${group.id}" aria-label="${esc(group.label)}${partial?', selección parcial':''}" aria-pressed="${partial?'mixed':selected}" style="--topic-color:${group.color};--topic-tint:${group.tint}" ${disabled}><span class="topic-check" aria-hidden="true">${partial?'−':'✓'}</span><span class="topic-icon" aria-hidden="true">${group.icon}</span><span class="topic-name">${esc(group.label)}</span></button>`;}).join('')}</div>
 <div class="topic-foot" aria-live="polite"><span class="topic-summary"><strong>${active} de ${TOPIC_GROUPS.length}</strong> temáticas activas${active<TOPIC_GROUPS.length?'':''}</span></div>`;
}
async function applyCategories(next){
 if(!game.data||game.busy||game.data.me.id!==game.data.room.host_player_id)return;
 const previous=[...game.data.room.categories],code=game.code;
 if(previous.length===next.length&&previous.every(id=>next.includes(id)))return;
 game.busy=true;game.error='';game.data.room.categories=[...next];render();
 try{
  await rpc('update_settings',{p_code:game.code,p_token:game.token,p_difficulty:'mixta',p_categories:next});
  await refresh(true);
 }catch(e){
  if(game.code===code&&game.data){game.data.room.categories=previous;game.error=e?.message||'No se pudieron guardar las temáticas.';}
 }finally{
  if(game.code===code){game.busy=false;render();}
 }
}

function lobby(d){const host=d.me.id===d.room.host_player_id, cats=d.room.categories||CATEGORIES, pool=availableCharacters(cats);return `<div class="shell">${header()}<main class="max page">${roomBar(d)}${error()}<span class="eyebrow">VESTÍBULO</span><h1 class="page-title">Preparad las preguntas.</h1><p class="subheading">Cada persona tendrá su turno. Solo ella desconoce el personaje; los demás verán los datos para responder.</p><div class="lobby-layout lobby-layout--topics"><section class="panel"><div class="section-title"><h2>Jugadores</h2><span class="chip">${d.players.length}/12</span></div>${playerList(d)}${d.players.length<2?'<div class="rule-note">Se necesitan al menos dos jugadores.</div>':''}</section><section class="panel topic-panel">${topicPicker(d,host,cats)}${host?`<button class="btn btn-primary btn-wide" data-action="start" ${game.busy||d.players.length<2||pool.length<d.players.length?'disabled':''}>Empezar los turnos</button>`:'<div class="rule-note">Esperando al anfitrión.</div>'}</section></div></main>${footer()}</div>`;}
function characterCard(ch,playerName){if(!ch)return '<div class="panel">No se ha encontrado la ficha.</div>';return `<div class="character-card"><div class="character-head"><span class="eyebrow">NO ENSEÑAR A ${esc(playerName)}</span><div class="character-name">${esc(ch.name)}</div><span class="chip gold">${esc(CATEGORY_LABELS[ch.category])}</span><div class="small-warning">Utiliza los datos para responder sin revelar el nombre.</div></div><div class="card-content"><div class="meta-row"><span>¿Es real?</span><b>${['videojuegos','ficcion','mitologia'].includes(ch.category)?'No, es un personaje ficticio o mitológico':'Sí'}</b></div><div class="meta-row"><span>¿Está vivo?</span><b>${ch.alive===null?'No aplica':ch.alive?'Sí':'No'} · ${esc(ch.life)}</b></div><div class="meta-row"><span>Procedencia</span><b>${esc(ch.origin)}</b></div><div class="meta-row"><span>Época</span><b>${esc(ch.era)}</b></div><div class="meta-row"><span>Profesión</span><b>${esc(ch.role)}</b></div></div><div class="accordion"><strong>Hechos importantes</strong><ul class="facts">${ch.facts.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><p><b>Guía para responder:</b> ${esc(ch.guide)}</p>${ch.caution?`<p><b>Matices:</b> ${esc(ch.caution)}</p>`:''}</div></div>`;}
function historyMarkup(d){const h=d.history||[];if(!h.length)return '';return `<div class="separator"></div><div class="section-title"><h2>Turnos completados</h2><span class="chip">${h.length}</span></div><div class="cards-grid">${h.map(x=>{const pl=d.players.find(p=>p.id===x.player_id);const ch=CHARACTER_MAP.get(x.character_id);const result=x.success?'Acertó':x.reason==='limite'?'10 preguntas agotadas':x.reason==='omitido'?'Turno saltado':'Ronda interrumpida';return `<div class="panel"><span class="eyebrow">${esc(result)}</span><h3 style="margin:7px 0 5px">${esc(pl?.name||'Jugador que salió')}</h3><p style="font-size:20px;font-weight:900;margin:0">${esc(ch?.name||'Personaje')}</p><span class="chip">${Number(x.questions)||0}/10 preguntas</span></div>`;}).join('')}</div>`;}
function playing(d){const host=d.me.id===d.room.host_player_id,turn=d.turn||{},active=d.players.find(p=>p.id===turn.active_player_id),isMe=d.me.is_active,q=turn.questions||0,ch=CHARACTER_MAP.get(turn.character_id);const name=active?.name||'Jugador';return `<div class="shell">${header()}<main class="max page">${roomBar(d)}${error()}<section class="panel" style="border:2px solid #ffcf74"><span class="eyebrow">Ronda ${d.room.round} · Turno ${turn.turn_number} de ${turn.total_turns}</span><h1 class="page-title">Le toca a ${esc(name)}${isMe?' (tú)':''}</h1><p class="subheading">${isMe?'Haz preguntas de sí o no. Los demás tienen tu ficha. Registra cada pregunta después de hacerla.':'Escucha sus preguntas y responde usando los datos de su personaje.'}</p><div style="display:flex;justify-content:space-between;gap:12px;font-weight:900"><span>Preguntas</span><span>${q} / 10</span></div><div class="questions-meter">${Array.from({length:10},(_,i)=>`<i class="${i<q?'used':''}"></i>`).join('')}</div>${isMe?'<div class="toolbar" style="margin-top:17px"><button class="btn btn-dark" data-action="question" '+(game.busy?'disabled':'')+'>+ Registrar pregunta</button><button class="btn btn-primary" data-action="correct" '+(game.busy?'disabled':'')+'>¡He acertado!</button></div>':'<div class="rule-note">Se cambiará de jugador automáticamente cuando acierte o llegue a 10 preguntas.</div>'}</section><div class="lobby-layout" style="margin-top:19px"><section>${isMe?'<div class="secret-banner"><div class="secret-icon">?</div><div><h2>Tu personaje es secreto</h2><p>Solo los demás pueden verlo. ¡Adivina quién eres!</p></div></div>':characterCard(ch,name)}</section><aside class="panel"><h2>Orden de juego</h2>${playerList(d)}<div class="hint">${(d.history||[]).length} turnos completados de ${turn.total_turns}.${d.players.length>turn.total_turns?' Los jugadores incorporados durante la ronda participarán en la siguiente.':''}</div>${host?`<div class="toolbar" style="margin-top:17px"><button class="btn btn-outline" data-action="skip">Saltar turno</button><button class="btn btn-outline" data-action="finish">Terminar ronda</button></div>`:''}</aside></div>${historyMarkup(d)}</main>${footer()}</div>`;}
function ended(d){const h=d.history||[],win=h.filter(x=>x.success).length,host=d.me.id===d.room.host_player_id;return `<div class="shell">${header()}<main class="max page">${roomBar(d)}${error()}<section class="panel"><span class="eyebrow">Ronda ${d.room.round}</span><h1 class="page-title">¡Fin de la ronda!</h1><p class="subheading">${win} de ${h.length} turnos acabaron en acierto.</p>${host?'<button class="btn btn-primary" data-action="lobby">Preparar otra ronda</button>':'<div class="rule-note">El anfitrión podrá preparar otra ronda.</div>'}</section>${historyMarkup(d)}</main>${footer()}</div>`;}
function rules(){return `<div class="shell">${header()}<main class="max page"><button class="btn btn-soft btn-small" data-action="back">← Volver</button><span class="eyebrow" style="display:block;margin-top:24px">REGLAS</span><h1 class="page-title">Cómo jugar</h1><div class="rule-grid"><section class="panel"><h3>1. Entrad en la sala</h3><p>Alguien crea una sala. Los demás se unen por código o enlace, desde su propio móvil.</p></section><section class="panel"><h3>2. Un solo jugador pregunta</h3><p>En cada turno solo una persona desconoce su personaje. Los demás ven su ficha, con hechos y datos.</p></section><section class="panel"><h3>3. Máximo 10 preguntas</h3><p>Pregunta cosas de sí o no: «¿Soy real?», «¿Soy español?». Para figuras de ficción, la edad y estar vivo pueden no aplicar. Tras cada pregunta, el protagonista registra una.</p></section><section class="panel"><h3>4. Cambio automático</h3><p>Al acertar o consumir la décima pregunta, se registra el resultado y empieza el siguiente turno. Al jugar todos, termina la ronda.</p></section></div></main>${footer()}</div>`;}
function render(){if(game.view==='rules'){el.innerHTML=rules();return;}if(!game.code){el.innerHTML=entry();return;}if(!game.data){el.innerHTML=`<div class="shell">${header()}<main class="max page"><div class="panel">${game.error?'No se ha podido conectar. Comprueba la conexión o vuelve a la pantalla principal.':'Conectando con la sala…'}</div>${error()}</main></div>`;return;}const d=game.data;el.innerHTML=d.room.status==='lobby'?lobby(d):d.room.status==='playing'?playing(d):ended(d);}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('Copiado.')}catch{prompt('Copia este texto:',text);}}
async function click(b){const action=b.dataset.action,d=game.data;if(action==='rules'){game.view='rules';render();return;}if(action==='back'){game.view=game.code?'room':'entry';render();return;}if(action==='home'){game.view=game.code?'room':'entry';render();return;}if(action==='copy')return copy(game.code);if(action==='share'){const url=roomUrl();try{if(navigator.share)await navigator.share({title:'¿Quién soy?',url});else await copy(url);}catch{}return;}if(action==='leave'){if(!confirm('¿Salir de la sala?'))return;return run(async()=>{try{await rpc('leave_room',{p_code:game.code,p_token:game.token});}catch(e){console.warn('No se pudo notificar la salida; la sesión local se cerrará.',e);}localStorage.removeItem(sessionKey(game.code));localStorage.removeItem('quienSoy:lastRoom');stopRealtime();game.code='';game.token='';game.data=null;game.view='entry';schedulePoll();history.replaceState(null,'',location.pathname);});}if(!d)return;
 const host=d.me.id===d.room.host_player_id;
 if(action==='category'){
  if(!host||game.busy)return;
  const group=TOPIC_GROUPS.find(group=>group.id===b.dataset.value);
  if(!group)return;
  const cats=[...d.room.categories],selected=group.categories.every(id=>cats.includes(id));
  const next=selected?cats.filter(id=>!group.categories.includes(id)):[...new Set([...cats,...group.categories])];
  if(!next.length){toast('Deja al menos una temática activa.');return;}
  return applyCategories(CATEGORIES.filter(id=>next.includes(id)));
 }
 if(action==='category-preset'){if(!host||game.busy)return;const next=b.dataset.value==='all'?[...CATEGORIES]:b.dataset.value==='pop'?[...POP_CATEGORIES]:null;return next?applyCategories(next):undefined;}
 if(action==='start'){const pool=buildCandidatePool(d.room.categories);return run(async()=>{await rpc('ts_start',{p_code:game.code,p_token:game.token,p_candidates:pool});await refresh(true);});}
 if(action==='question')return run(()=>playAction('question'));
 if(action==='correct'){if(!confirm('¿Los demás han confirmado que has adivinado tu personaje?'))return;return run(()=>playAction('correct'));}
 if(action==='skip'){if(!confirm('¿Saltar el turno de esta persona?'))return;return run(()=>playAction('skip'));}
 if(action==='finish'){if(!confirm('¿Terminar la ronda?'))return;return run(()=>playAction('end'));}
 if(action==='lobby')return run(()=>playAction('lobby'));
}
el.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b){e.preventDefault();click(b).catch(err=>{game.error=err.message;render();});}});
el.addEventListener('submit',e=>{if(!['create-form','join-form'].includes(e.target.id))return;e.preventDefault();const f=new FormData(e.target);if(e.target.id==='create-form')run(()=>createRoom(String(f.get('name')||'')));else run(()=>joinRoom(String(f.get('name')||''),String(f.get('code')||'')));});
async function init(){const code=(new URLSearchParams(location.search).get('sala')||localStorage.getItem('quienSoy:lastRoom')||'').toUpperCase();if(code){let s;try{s=JSON.parse(localStorage.getItem(sessionKey(code))||'null')}catch{}if(s?.token){game.code=code;game.name=s.name||game.name;game.token=s.token;game.view='room';await refresh(true);if(!game.data){stopRealtime();game.code='';game.token='';game.view='entry';}}}render();}
document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='hidden'){stopRealtime(false);return;}
 if(game.code){startRealtime(game.data?.sync_topic);refresh(true);schedulePoll(1000);}
});
window.addEventListener('online',()=>{
 if(game.code){startRealtime(game.data?.sync_topic);refresh(true);schedulePoll(1000);}
});
window.addEventListener('offline',()=>stopRealtime(false));
window.addEventListener('pageshow',e=>{
 if(e.persisted&&game.code){startRealtime(game.data?.sync_topic);refresh(true);schedulePoll(1000);}
});
init().finally(()=>schedulePoll());