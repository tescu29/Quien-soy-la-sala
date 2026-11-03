'use strict';
/* Yo nunca — juego social de un solo móvil, sin cuenta ni backend. */
(function(){
const app=document.getElementById('app'),store='unapartidita:yonunca:1';
const GROUPS=[
 {id:'amigos',icon:'✦',name:'Entre amigos',items:[
 'he fingido entender un chiste para no quedar mal','he contado una anécdota exagerándola muchísimo','he sido el último en enterarme de un cotilleo del grupo','he quedado con alguien solo por la comida','he prometido llegar en cinco minutos estando aún en casa','he olvidado felicitar a un amigo por su cumpleaños','he inventado una excusa para no salir','he compartido un secreto que se suponía que debía guardar','me he quedado dormido en casa de un amigo','he repetido la misma historia sin darme cuenta','he hecho una foto horrible a propósito para vacilar','he ganado una discusión buscando algo en Google','he cambiado de opinión por pura presión del grupo','he fingido que conocía a alguien que no recordaba','he enviado un mensaje al grupo equivocado','he querido irme de una reunión sin saber cómo decirlo','he defendido una película malísima delante de mis amigos','he guardado un meme para enseñarlo en persona','he perdido una apuesta absurda','he llorado de risa en un momento inoportuno','he copiado la expresión favorita de un amigo','he hecho una broma que nadie entendió']},
 {id:'fiesta',icon:'♫',name:'Fiesta',items:[
 'he bailado como si nadie me estuviera mirando','he perdido a mis amigos en una fiesta','he cantado mal una canción a pleno pulmón','he vuelto a casa cuando ya había amanecido','he ido a una fiesta sin conocer a casi nadie','he dicho que me iba y me he quedado una hora más','he acabado en una fiesta que no estaba planeada','he hecho cola para entrar y me he arrepentido','he pedido una canción al DJ','he sido quien ha puesto la música del grupo','he tenido que pedir prestado un cargador en una fiesta','he salido a por una cosa y he vuelto con cinco','he hecho una foto de grupo que nadie quería','he llevado un disfraz improvisado','he llegado vestido de forma totalmente distinta al resto','he conocido a alguien y olvidado su nombre al instante','he hablado con desconocidos como si fuéramos amigos de siempre','he acabado comiendo algo a horas rarísimas','he vuelto de una fiesta con algo que no era mío por confusión','he dicho «una más y nos vamos» más de tres veces','he intentado bailar una coreografía sin sabérmela','he usado una excusa ridícula para esquivar una canción']},
 {id:'citas',icon:'♡',name:'Amor y citas',items:[
 'he mirado varias veces si alguien estaba en línea','he rehecho un mensaje más de cinco veces antes de enviarlo','he esperado a que la otra persona escribiera primero','he buscado el perfil de alguien que acababa de conocer','he tenido una cita en la que no sabía de qué hablar','he fingido que me gustaba una canción para impresionar','he ensayado una conversación importante','he sentido vergüenza al releer un mensaje antiguo','he dado me gusta a una publicación antigua sin querer','he puesto una excusa para no tener una segunda cita','me he puesto nervioso al ver a alguien que me gusta','he imaginado una historia de amor con alguien que apenas conocía','he preguntado a mis amigos qué contestar a un mensaje','he tardado a propósito en responder para parecer interesante','he tenido un crush con un personaje de ficción','he cambiado de ropa varias veces antes de una cita','he interpretado una indirecta que no iba para mí','he sentido celos de algo completamente absurdo','he hecho una playlist pensando en alguien','he dicho «me da igual» cuando sí me importaba','he olvidado el nombre de una persona que me gustaba','he hablado de una cita durante más tiempo del que duró']},
 {id:'internet',icon:'▣',name:'Internet',items:[
 'he perdido una hora viendo vídeos cortos','he pasado de largo por un vídeo y luego he ido a buscarlo','he borrado una publicación porque casi nadie reaccionó','he enviado un audio larguísimo','he escuchado un audio en velocidad doble','he dejado un mensaje en visto por despiste','he abierto una aplicación y olvidado a qué iba','he entrado en un perfil sin querer que se notase','he buscado un tutorial para una cosa facilísima','he comprado algo después de verlo en redes','he discutido con un desconocido en Internet','he guardado un montón de vídeos que nunca volveré a ver','he cambiado mi foto de perfil y me he arrepentido','he usado un filtro que no se parecía nada a mí','he intentado hacer una foto perfecta de comida','he pasado más tiempo eligiendo una serie que viéndola','he visto spoilers por mirar el móvil','he dejado cargando un juego y me he dormido','he enviado una captura de pantalla a quien aparecía en ella','he memorizado un meme sin querer','he tenido veinte pestañas abiertas a la vez','he dicho «solo cinco minutos de móvil» y ha pasado una hora']},
 {id:'caos',icon:'↯',name:'Vida caótica',items:[
 'he salido de casa y tenido que volver por las llaves','he abierto la nevera sin tener hambre','he buscado el móvil mientras lo tenía en la mano','he puesto varias alarmas y las he ignorado','he comido algo que se había caído al suelo','he empezado a ordenar y he dejado la casa peor','he comprado algo y me he olvidado de usarlo','he entrado en una habitación sin recordar para qué','he llevado una camiseta del revés sin darme cuenta','he fingido saber por dónde iba','he hecho la compra con hambre y me he pasado','he tenido que mirar un tutorial para montar algo sencillo','he hecho una siesta que parecía una noche entera','he pospuesto algo importante hasta el último minuto','he perdido unas gafas que llevaba puestas','he encontrado dinero en un bolsillo antiguo','he olvidado qué iba a decir en mitad de una frase','he dicho «mañana empiezo» más de una semana seguida','he intentado arreglar algo y lo he roto más','he cogido un camino equivocado por no querer preguntar','he preparado una receta que terminó siendo otra cosa','he hablado con un animal como si pudiera contestarme']}
];
const statements=GROUPS.flatMap(group=>group.items.map((text,i)=>({id:group.id+':'+i,category:group.id,text:'Yo nunca '+text+'.'})));
const dict=new Map(statements.map(item=>[item.id,item]));
function rnd(n){if(n<=1)return 0;const a=new Uint32Array(1),limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%n;}
function shuffle(arr){const c=arr.slice();for(let i=c.length-1;i>0;i--){const j=rnd(i+1);[c[i],c[j]]=[c[j],c[i]];}return c;}
function initial(){return {phase:'setup',count:5,categories:GROUPS.map(x=>x.id),deck:[],history:[],idx:-1,help:false};}
function load(){try{const obj=JSON.parse(sessionStorage.getItem(store)||'null');if(obj&&Number.isInteger(obj.count)&&obj.count>=2&&obj.count<=10&&Array.isArray(obj.categories)&&Array.isArray(obj.history)&&Array.isArray(obj.deck)){return {...initial(),...obj,help:false};}}catch{}return initial();}
let state=load();
function save(){try{sessionStorage.setItem(store,JSON.stringify({...state,help:false}))}catch{}}
function set(next){state={...state,...next};save();render();}
function navbar(){return '<header class="party-nav"><div class="party-container party-nav-inner"><a class="party-brand" href="'+location.pathname+'"><span class="party-brand-icon">✦</span>¿Una partidita<span class="party-brand-question">?</span></a><button class="party-link-btn" data-action="rules">Cómo jugar</button></div></header>'}
function top(){return '<div class="party-top"><a class="party-back" href="'+location.pathname+'">← Biblioteca</a><span class="party-top-tag">YO NUNCA · UN MÓVIL</span></div>'}
function rules(){return navbar()+'<main class="party-container party-main">'+top()+'<section class="party-panel party-rules"><button class="party-back-btn" data-action="rules">← Volver al juego</button><h1>Cómo jugar a Yo nunca</h1><p>Una frase aparece en pantalla. Quien sí haya hecho eso, levanta la mano. Lo divertido son las historias que salen después.</p><ol><li>Elegid cuántos sois y las temáticas que queréis incluir.</li><li>Leed una frase en voz alta y contad quiénes la habéis hecho.</li><li>Si queréis, apuntad el número de personas que levantan la mano; es opcional.</li><li>Pasad a la siguiente frase cuando hayáis terminado. No se repiten hasta agotar las seleccionadas.</li></ol><p>No hace falta beber ni hacer retos: simplemente hablar y reírse.</p><button class="party-button party-primary" data-action="rules">¡Entendido!</button></section></main>'}
function setup(){
 return navbar()+'<main class="party-container party-main">'+top()+'<section class="party-heading"><div class="party-hero-icon yn-hero-icon">✌</div><span class="party-kicker">QUE EMPIECEN LAS CONFESIONES</span><h1>Yo nunca<span class="party-dot">.</span></h1><p>Para descubrir cosas de tus amigos que no esperabas.</p></section>'+
 '<section class="party-panel party-settings"><div class="party-label-row"><h2>¿Cuántos sois?</h2><span class="party-count">'+state.count+'/10</span></div><div class="party-stepper"><button data-action="minus" '+(state.count===2?'disabled':'')+' aria-label="Quitar jugador">−</button><strong>'+state.count+'</strong><button data-action="plus" '+(state.count===10?'disabled':'')+' aria-label="Añadir jugador">+</button></div>'+
 '<h2>Elegid temáticas</h2><div class="party-categories">'+GROUPS.map(g=>'<button class="party-topic '+(state.categories.includes(g.id)?'active':'')+'" data-action="cat" data-id="'+g.id+'" aria-pressed="'+state.categories.includes(g.id)+'"><span class="party-topic-icon">'+g.icon+'</span><span>'+g.name+'</span><span class="party-check">'+(state.categories.includes(g.id)?'✓':'+')+'</span></button>').join('')+'</div>'+
 '<button class="party-button party-primary party-start" data-action="start">¡A jugar! <span>→</span></button><p class="party-caption">2–10 personas · sin crear salas · sin descargas</p></section></main>';
}
function play(){
 const cur=state.history[state.idx]||{id:null,yes:0},entry=dict.get(cur.id);
 if(!entry)return setup();
 const group=GROUPS.find(x=>x.id===entry.category);
 return navbar()+'<main class="party-container party-main">'+top()+
 '<section class="party-center yn-card"><div class="yn-card-top"><span class="party-step">FRASE '+(state.idx+1)+'</span><span class="yn-group">'+group.icon+' '+group.name+'</span></div><div class="yn-big-icon">✦</div><h1>'+entry.text+'</h1><p>¿Quién de vosotros sí lo ha hecho? ¡Que levante la mano!</p></section>'+
 '<section class="party-panel yn-count-panel"><div><h2>¿Cuántos lo habéis hecho?</h2><p>Opcional · Para llevar la cuenta de las confesiones</p></div><div class="party-stepper yn-stepper"><button data-action="less" '+(cur.yes===0?'disabled':'')+' aria-label="Restar una persona">−</button><strong>'+cur.yes+' <small>/ '+state.count+'</small></strong><button data-action="more" '+(cur.yes===state.count?'disabled':'')+' aria-label="Añadir una persona">+</button></div></section>'+
 '<div class="yn-controls"><button class="party-button party-secondary" data-action="prev" '+(state.idx===0?'disabled':'')+'>← Anterior</button><button class="party-button party-primary" data-action="next">Siguiente →</button></div><button class="yn-results-link" data-action="results">Ver resumen de la partida</button><p class="party-caption">Podéis saltaros cualquier pregunta sin explicaciones.</p></main>';
}
function results(){
 const history=state.history,total=history.reduce((sum,r)=>sum+r.yes,0),best=history.reduce((a,b)=>b.yes>a.yes?b:a,history[0]||{id:null,yes:0}),bestStatement=dict.get(best.id);
 return navbar()+'<main class="party-container party-main">'+top()+'<section class="party-center party-outcome yn-finish"><span class="party-step">RESUMEN DEL GRUPO</span><div class="party-talk-icon">✦</div><h1>¡Menudo grupo!</h1><div class="yn-stats"><div><strong>'+history.length+'</strong><span>frases vistas</span></div><div><strong>'+total+'</strong><span>confesiones registradas</span></div></div>'+(bestStatement?'<p>La frase con más manos levantadas fue:</p><div class="party-result-word"><strong>'+bestStatement.text+'</strong><span>'+best.yes+' de '+state.count+' personas</span></div>':'')+
 '<button class="party-button party-primary" data-action="continue">Seguir jugando</button><button class="party-button party-secondary" data-action="restart">Nueva partida</button></section></main>';
}
function newGame(){const pool=statements.filter(p=>state.categories.includes(p.category)).map(p=>p.id);if(pool.length===0)return;const deck=shuffle(pool);const first=deck.pop();set({phase:'play',history:[{id:first,yes:0}],idx:0,deck});}
function next(){
 if(state.idx<state.history.length-1){set({idx:state.idx+1});return;}
 let deck=[...state.deck];
 if(!deck.length){const pool=statements.filter(x=>state.categories.includes(x.category)&&x.id!==state.history.at(-1)?.id);deck=shuffle(pool);}
 const id=deck.pop();if(!id)return;
 set({history:[...state.history,{id,yes:0}],idx:state.idx+1,deck});
}
function render(){app.innerHTML='<div class="party-app yonunca-app">'+(state.help?rules():state.phase==='setup'?setup():state.phase==='results'?results():play())+'</div>';}
app.addEventListener('click',event=>{
 const btn=event.target.closest('[data-action]');if(!btn)return;event.preventDefault();
 const action=btn.dataset.action;
 if(action==='rules'){set({help:!state.help});return;}
 if(state.help)return;
 if(action==='plus'||action==='minus'){if(state.phase!=='setup')return;set({count:Math.max(2,Math.min(10,state.count+(action==='plus'?1:-1)))});return;}
 if(action==='cat'&&state.phase==='setup'){
  const id=btn.dataset.id;if(!GROUPS.some(g=>g.id===id))return;
  const cats=state.categories.includes(id)?state.categories.filter(x=>x!==id):[...state.categories,id];if(cats.length)set({categories:cats});return;
 }
 if(action==='start'&&state.phase==='setup'){newGame();return;}
 if(action==='next'&&state.phase==='play'){next();return;}
 if(action==='prev'&&state.phase==='play'&&state.idx>0){set({idx:state.idx-1});return;}
 if((action==='more'||action==='less')&&state.phase==='play'){
  const history=state.history.slice(),item=history[state.idx];if(!item)return;
  history[state.idx]={...item,yes:Math.max(0,Math.min(state.count,item.yes+(action==='more'?1:-1)))};
  set({history});return;
 }
 if(action==='results'&&state.phase==='play'){set({phase:'results'});return;}
 if(action==='continue'&&state.phase==='results'){set({phase:'play'});return;}
 if(action==='restart'&&state.phase==='results'){set({phase:'setup',history:[],deck:[],idx:-1});return;}
});
render();
})();