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

const ADULT_PACKS=[
 {
  "id": "amigos",
  "level": 2,
  "items": [
   "he tenido un crush con alguien de este grupo",
   "he imaginado cómo sería besar a alguien de esta mesa",
   "he ocultado una cita a mis amigos para evitar preguntas",
   "he sentido celos de un ligue de un amigo",
   "he hablado mal de alguien del grupo y luego me he arrepentido",
   "he fingido apoyar una relación que me parecía desastrosa",
   "he coqueteado con dos personas del mismo grupo",
   "he cotilleado un chat privado que no era mío",
   "he estado a punto de confesar un secreto en una fiesta",
   "he tenido una cita con alguien que conocía un amigo",
   "he besado a alguien y pedido que no se enterara el grupo",
   "he sentido atracción por la pareja de un amigo",
   "he inventado una excusa para no presentar a alguien con quien salía",
   "he descubierto algo de un amigo que todavía no sabe que sé"
  ]
 },
 {
  "id": "fiesta",
  "level": 2,
  "items": [
   "he besado a dos personas en la misma noche",
   "he vuelto de fiesta con alguien que acababa de conocer",
   "he acabado durmiendo en una casa sin saber de quién era",
   "he dado mi número a alguien y luego me he arrepentido",
   "he fingido estar soltero para ligar",
   "he enviado un mensaje subido de tono después de una fiesta",
   "he ido a una fiesta solo porque sabía que estaría mi crush",
   "he hecho una apuesta relacionada con besar a alguien",
   "he bailado muy pegado con una persona desconocida",
   "he tenido un rollo que empezó por un juego de fiesta",
   "he acabado confesando algo íntimo al volver de fiesta",
   "he besado a alguien y al día siguiente no sabía qué decirle",
   "he tenido un encuentro romántico en un baño de discoteca",
   "he evitado salir en una foto para que alguien no supiera dónde estaba"
  ]
 },
 {
  "id": "citas",
  "level": 2,
  "items": [
   "he tenido una aventura de una noche",
   "he enviado una foto sugerente",
   "he recibido una foto íntima que no esperaba",
   "he practicado sexting",
   "he tenido una cita solo por la atracción física",
   "he besado a alguien sin saber su apellido",
   "he vuelto con alguien sabiendo que era mala idea",
   "he tenido una relación sin querer ponerle nombre",
   "he tenido un flechazo con alguien mucho mayor que yo",
   "he hablado de exclusividad sin estar preparado para ella",
   "he tenido una cita con una persona que había conocido por una app",
   "he besado a alguien solo por curiosidad",
   "he tenido una fantasía con una persona famosa",
   "he fantaseado con alguien que no era mi pareja"
  ]
 },
 {
  "id": "internet",
  "level": 2,
  "items": [
   "he enviado un mensaje caliente y luego he querido borrarlo",
   "he borrado un chat para que no lo viera mi pareja",
   "he usado una aplicación de citas estando de viaje",
   "he investigado a una nueva pareja en redes mucho más de lo que admitiría",
   "he tenido una conversación picante por videollamada",
   "he guardado una foto de alguien porque me parecía muy atractivo",
   "he coqueteado por mensajes con una persona a la que no conocía en persona",
   "he enviado un audio comprometedor a la persona equivocada",
   "he publicado algo para darle celos a alguien",
   "he mentido sobre mi edad en una aplicación de citas",
   "he enviado una indirecta clarísima por historias",
   "he tenido dos conversaciones románticas a la vez",
   "he creado una cuenta secundaria para cotillear",
   "he borrado mensajes que me daba vergüenza recordar"
  ]
 },
 {
  "id": "caos",
  "level": 2,
  "items": [
   "he mentido para no ir a trabajar al día siguiente",
   "he ocultado una compra cara a mi pareja",
   "he revisado una conversación antigua para buscar pruebas",
   "he hecho una locura por impresionar a alguien",
   "he dicho una mentira tan grande que he tenido que inventar otras",
   "he tenido un ligue con alguien de mi trabajo",
   "he tenido una discusión por mirar el móvil de otra persona",
   "he inventado una versión más inocente de cómo conocí a alguien",
   "he gastado demasiado dinero en una sola noche",
   "he desaparecido de un plan sin avisar",
   "he ido a una cita sabiendo que quería cancelarla",
   "he hecho ghosting a alguien",
   "he vuelto a escribir a un ex por puro aburrimiento",
   "he puesto una excusa para dormir fuera de casa"
  ]
 },
 {
  "id": "amigos",
  "level": 3,
  "items": [
   "he tenido sexo con alguien de mi grupo de amigos",
   "he mantenido un secreto íntimo que afectaría a este grupo",
   "he besado a alguien que estaba ligando con un amigo",
   "he tenido un rollo con un ex de un amigo",
   "he sentido atracción por dos personas de este grupo a la vez",
   "he sido infiel y no se lo he contado a mi pareja",
   "he ocultado a mis amigos que había vuelto con mi ex",
   "he comparado en secreto la vida sexual de mis amigos con la mía",
   "he tenido una fantasía sexual con alguien que está aquí",
   "he besado a una persona del grupo a escondidas",
   "he tenido una conversación íntima con alguien de aquí que nadie más conoce",
   "he contado detalles íntimos de una pareja que preferiría que no se supieran",
   "he seguido viéndome con alguien después de prometer que no lo haría",
   "he tenido algo con dos amigos que se conocían entre sí",
   "he preferido guardar silencio ante una infidelidad de un amigo",
   "he pensado que una pareja de este grupo debería romper"
  ]
 },
 {
  "id": "fiesta",
  "level": 3,
  "items": [
   "he tenido sexo la misma noche que conocí a alguien",
   "he tenido sexo en un lugar público",
   "he tenido un encuentro íntimo durante una fiesta",
   "he besado a tres personas diferentes en una sola noche",
   "he enviado un mensaje sexual a alguien mientras estaba en una fiesta",
   "he despertado al lado de alguien con quien apenas había hablado",
   "he tenido un lío con alguien y fingido al día siguiente que no había pasado nada",
   "he terminado una fiesta en casa de una persona que acababa de conocer",
   "he mentido sobre con quién había pasado la noche",
   "he coincidido en una fiesta con dos personas con las que había tenido algo",
   "he tenido un encuentro íntimo sabiendo que la situación era un auténtico lío",
   "he usado una fiesta como excusa para reencontrarme con un ex",
   "he tenido un ligue secreto durante un viaje con amigos",
   "he besado a alguien y después descubierto que tenía pareja",
   "he tenido una noche que preferiría que nadie del grupo recordara",
   "he hecho algo en una despedida que no contaría en una comida familiar"
  ]
 },
 {
  "id": "citas",
  "level": 3,
  "items": [
   "he fingido un orgasmo",
   "he tenido sexo con alguien sin querer volver a verle",
   "he tenido una relación abierta",
   "he participado en un trío entre adultos",
   "he tenido sexo con un ex después de romper",
   "he tenido una relación paralela que oculté",
   "he mentido sobre mi experiencia sexual",
   "he tenido sexo con alguien con quien había discutido ese mismo día",
   "he tenido una fantasía sexual con alguien prohibido para mí",
   "he usado juguetes sexuales con una pareja",
   "he practicado sexting con alguien que no era mi pareja",
   "he tenido sexo por reconciliación y después hemos vuelto a discutir",
   "he tenido una aventura con alguien del trabajo",
   "he tenido una cita con una persona casada sin saberlo al principio",
   "he ocultado una infidelidad durante meses",
   "he salido con alguien principalmente por interés"
  ]
 },
 {
  "id": "internet",
  "level": 3,
  "items": [
   "he enviado una foto íntima de mí mismo",
   "he enviado un mensaje sexual a una persona equivocada",
   "he tenido una relación secreta que empezó por Internet",
   "he usado una aplicación de citas mientras tenía pareja",
   "he mantenido una conversación sexual con alguien que nunca he conocido",
   "he ocultado chats íntimos a mi pareja",
   "he descubierto una infidelidad a través de redes sociales",
   "he usado el móvil de otra persona para comprobar mis sospechas",
   "he hablado de sexo con alguien a quien apenas conocía",
   "he publicado contenido para llamar la atención de una persona concreta",
   "he bloqueado a alguien después de un encuentro íntimo",
   "he revisado obsesivamente si un ex había visto mis historias",
   "he borrado un intercambio de mensajes que podía meterme en problemas",
   "he tenido un romance digital que me habría dado vergüenza explicar",
   "he enviado un audio sexual por error a otro chat",
   "he utilizado un perfil falso para descubrir una mentira"
  ]
 },
 {
  "id": "caos",
  "level": 3,
  "items": [
   "he sido la tercera persona en una relación sin que la otra parte lo supiera",
   "he mantenido dos relaciones a la vez",
   "he mentido sobre dónde dormí",
   "he tenido sexo con alguien por despecho",
   "he tenido un lío con mi jefe o con alguien a mi cargo",
   "he tenido una relación que sabría que destrozaría una amistad",
   "he perdonado una infidelidad y luego la he usado en una discusión",
   "he dejado a alguien por otra persona",
   "he tenido un encuentro íntimo que no me atreví a contar a mis amigos",
   "he besado a alguien estando en una relación exclusiva",
   "he tenido sexo con alguien y después me he arrepentido de haberle escrito",
   "he mantenido en secreto un romance durante mucho tiempo",
   "he mentido sobre mi situación sentimental para ligar",
   "he tenido una conversación íntima que cambió una amistad",
   "he fantaseado con una persona de mi entorno que sería un problema",
   "he tenido que ocultar una marca en el cuello"
  ]
 }
];
const NORMAL_STATEMENTS=GROUPS.flatMap(group=>group.items.map((text,i)=>({id:group.id+':'+i,category:group.id,text:'Yo nunca '+text+'.'})));
const statements=[
 ...NORMAL_STATEMENTS.map(x=>({...x,level:1})),
 ...ADULT_PACKS.flatMap((pack,pi)=>pack.items.map((text,i)=>({
   id:'adult:'+pi+':'+i,category:pack.id,level:pack.level,text:'Yo nunca '+text+'.'
 })))
];
const dict=new Map(statements.map(item=>[item.id,item]));
function rnd(n){if(n<=1)return 0;const a=new Uint32Array(1),limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%n;}
function shuffle(arr){const c=arr.slice();for(let i=c.length-1;i>0;i--){const j=rnd(i+1);[c[i],c[j]]=[c[j],c[i]];}return c;}
function initial(){return {phase:'setup',count:5,intensity:'sinmiedo',categories:GROUPS.map(x=>x.id),deck:[],history:[],idx:-1,help:false};}
const LEVELS=[{id:'suave',label:'Tranquilo',desc:'Para romper el hielo'},{id:'sinmiedo',label:'Sin miedo al éxito',desc:'Confesiones fuertes · 18+'}];
function poolForSettings(){return statements.filter(p=>state.categories.includes(p.category)&&(state.intensity==='suave'?p.level===1:p.level>=2));}
function load(){try{const obj=JSON.parse(sessionStorage.getItem(store)||'null');if(obj&&Number.isInteger(obj.count)&&obj.count>=2&&obj.count<=10&&Array.isArray(obj.categories)&&Array.isArray(obj.history)&&Array.isArray(obj.deck)){return {...initial(),...obj,intensity:obj.intensity==='suave'?'suave':'sinmiedo',help:false};}}catch{}return initial();}
let state=load();
function save(){try{sessionStorage.setItem(store,JSON.stringify({...state,help:false}))}catch{}}
function set(next){state={...state,...next};save();render();}
function navbar(){return '<header class="party-nav"><div class="party-container party-nav-inner"><a class="party-brand" href="'+location.pathname+'"><span class="party-brand-icon">✦</span>¿Una partidita<span class="party-brand-question">?</span></a><button class="party-link-btn" data-action="rules">Cómo jugar</button></div></header>'}
function top(){return '<div class="party-top"><a class="party-back" href="'+location.pathname+'">← Biblioteca</a><span class="party-top-tag">YO NUNCA · UN MÓVIL</span></div>'}
function rules(){return navbar()+'<main class="party-container party-main">'+top()+'<section class="party-panel party-rules"><button class="party-back-btn" data-action="rules">← Volver al juego</button><h1>Cómo jugar a Yo nunca</h1><p>Una frase aparece en pantalla. Si te ha pasado, levanta la mano; si no quieres responder, pasa. En Sin miedo al éxito hay preguntas fuertes para mayores de 18 años.</p><ol><li>Elegid cuántos sois y las temáticas que queréis incluir.</li><li>Leed una frase en voz alta y contad quiénes la habéis hecho.</li><li>Si queréis, apuntad el número de personas que levantan la mano; es opcional.</li><li>Pasad a la siguiente frase cuando hayáis terminado. No se repiten hasta agotar las seleccionadas.</li></ol><p>No hace falta beber ni hacer retos: simplemente hablar y reírse.</p><button class="party-button party-primary" data-action="rules">¡Entendido!</button></section></main>'}
function setup(){
 return navbar()+'<main class="party-container party-main">'+top()+'<section class="party-heading"><div class="party-hero-icon yn-hero-icon">✌</div><span class="party-kicker">QUE EMPIECEN LAS CONFESIONES</span><h1>Yo nunca<span class="party-dot">.</span></h1><p>Para descubrir cosas de tus amigos que no esperabas.</p></section>'+
 '<section class="party-panel party-settings"><div class="party-label-row"><h2>¿Cuántos sois?</h2><span class="party-count">'+state.count+'/10</span></div><div class="party-stepper"><button data-action="minus" '+(state.count===2?'disabled':'')+' aria-label="Quitar jugador">−</button><strong>'+state.count+'</strong><button data-action="plus" '+(state.count===10?'disabled':'')+' aria-label="Añadir jugador">+</button></div>'+
 '<h2>¿Cuánto os atrevéis?</h2><div class="yn-levels">'+LEVELS.map(level=>'<button class="yn-level '+(state.intensity===level.id?'active':'')+'" data-action="level" data-id="'+level.id+'" aria-pressed="'+(state.intensity===level.id)+'"><strong>'+level.label+'</strong><small>'+level.desc+'</small></button>').join('')+'</div><p class="yn-adult-note">Sin miedo al éxito reúne las confesiones más atrevidas y comprometidas (18+). Cualquiera puede pasar sin explicarse.</p><h2>Elegid temáticas</h2><div class="party-categories">'+GROUPS.map(g=>'<button class="party-topic '+(state.categories.includes(g.id)?'active':'')+'" data-action="cat" data-id="'+g.id+'" aria-pressed="'+state.categories.includes(g.id)+'"><span class="party-topic-icon">'+g.icon+'</span><span>'+g.name+'</span><span class="party-check">'+(state.categories.includes(g.id)?'✓':'+')+'</span></button>').join('')+'</div>'+
 '<button class="party-button party-primary party-start" data-action="start">¡A jugar! <span>→</span></button><p class="party-caption">2–10 personas · sin crear salas · sin descargas</p></section></main>';
}
function play(){
 const cur=state.history[state.idx]||{id:null,yes:0},entry=dict.get(cur.id);
 if(!entry)return setup();
 const group=GROUPS.find(x=>x.id===entry.category);
 return navbar()+'<main class="party-container party-main">'+top()+
 '<section class="party-center yn-card"><div class="yn-card-top"><span class="party-step">FRASE '+(state.idx+1)+'</span><span class="yn-group">'+group.icon+' '+group.name+'</span></div><span class="yn-heat">'+(entry.level>=2?'SIN MIEDO AL ÉXITO · 18+':'ENTRE AMIGOS')+'</span><div class="yn-big-icon">✦</div><h1>'+entry.text+'</h1><p>¿Quién de vosotros sí lo ha hecho? ¡Que levante la mano!</p></section>'+
 '<section class="party-panel yn-count-panel"><div><h2>¿Cuántos lo habéis hecho?</h2><p>Opcional · Para llevar la cuenta de las confesiones</p></div><div class="party-stepper yn-stepper"><button data-action="less" '+(cur.yes===0?'disabled':'')+' aria-label="Restar una persona">−</button><strong>'+cur.yes+' <small>/ '+state.count+'</small></strong><button data-action="more" '+(cur.yes===state.count?'disabled':'')+' aria-label="Añadir una persona">+</button></div></section>'+
 '<div class="yn-controls"><button class="party-button party-secondary" data-action="prev" '+(state.idx===0?'disabled':'')+'>← Anterior</button><button class="party-button party-primary" data-action="next">Siguiente →</button></div><button class="yn-results-link" data-action="results">Ver resumen de la partida</button><p class="party-caption">Podéis saltaros cualquier pregunta sin explicaciones.</p></main>';
}
function results(){
 const history=state.history,total=history.reduce((sum,r)=>sum+r.yes,0),best=history.reduce((a,b)=>b.yes>a.yes?b:a,history[0]||{id:null,yes:0}),bestStatement=dict.get(best.id);
 return navbar()+'<main class="party-container party-main">'+top()+'<section class="party-center party-outcome yn-finish"><span class="party-step">RESUMEN DEL GRUPO</span><div class="party-talk-icon">✦</div><h1>¡Menudo grupo!</h1><div class="yn-stats"><div><strong>'+history.length+'</strong><span>frases vistas</span></div><div><strong>'+total+'</strong><span>confesiones registradas</span></div></div>'+(bestStatement?'<p>La frase con más manos levantadas fue:</p><div class="party-result-word"><strong>'+bestStatement.text+'</strong><span>'+best.yes+' de '+state.count+' personas</span></div>':'')+
 '<button class="party-button party-primary" data-action="continue">Seguir jugando</button><button class="party-button party-secondary" data-action="restart">Nueva partida</button></section></main>';
}
function newGame(){const pool=poolForSettings().map(p=>p.id);if(pool.length===0)return;const deck=shuffle(pool);const first=deck.pop();set({phase:'play',history:[{id:first,yes:0}],idx:0,deck});}
function next(){
 if(state.idx<state.history.length-1){set({idx:state.idx+1});return;}
 let deck=[...state.deck];
 if(!deck.length){const pool=poolForSettings().filter(x=>x.id!==state.history.at(-1)?.id);deck=shuffle(pool);}
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
 if(action==='level'&&state.phase==='setup'&&LEVELS.some(x=>x.id===btn.dataset.id)){set({intensity:btn.dataset.id});return;}
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