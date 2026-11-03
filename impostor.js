'use strict';
/* Impostor — juego local de un solo móvil. Nadie necesita registrarse. */
(function(){
const app=document.getElementById('app'), store='unapartidita:impostor:1';
const CATS=[
 {id:'lugares',name:'Lugares',icon:'⌖',terms:['Parque de atracciones','Aeropuerto','Cine','Discoteca','Piscina','Supermercado','Gimnasio','Hospital','Camping','Playa','Estadio de fútbol','Biblioteca','Gasolinera','Restaurante','Hotel','Museo','Peluquería','Boda','Universidad','Parque acuático','Zoo','Estación de tren','Centro comercial','Feria','Bolera','Karaoke','Mercadillo','Pista de patinaje','Escape room','Concierto','Ascensor','Oficina','Terraza de bar','Tienda de ropa','Sala de espera']},
 {id:'comida',name:'Comida',icon:'◈',terms:['Pizza','Paella','Sushi','Hamburguesa','Tortilla de patatas','Croquetas','Ramen','Tacos','Kebab','Helado','Churros','Patatas bravas','Nachos','Cereales','Gofres','Palomitas','Donuts','Chocolate','Galletas','Macarrones','Ensaladilla rusa','Gazpacho','Bocadillo','Pancakes','Fideuá','Nuggets','Tarta de queso','Arroz a la cubana','Sandía','Café con leche','Lasaña','Guacamole','Aceitunas','Burrito','Empanada']},
 {id:'ocio',name:'Ocio',icon:'✧',terms:['Videojuegos','Bicicleta','Karaoke','Juegos de mesa','Senderismo','Viaje por carretera','Ir de compras','Fotografía','Pescar','Bailar','Ir de fiesta','Patinar','Ver una serie','Jugar al pádel','Dibujar','Ir al gimnasio','Hacer una barbacoa','Montar en moto','Jugar al fútbol','Hacer un puzle','Leer manga','Dormir la siesta','Acampar','Cocinar','Ir al cine','Tocar la guitarra','Hacer un TikTok','Hacer una escapada','Bañarse en el mar','Ir a un festival','Jugar a los bolos','Ver anime','Escape room','Montar un LEGO','Hacer snorkel']},
 {id:'objetos',name:'Objetos',icon:'⬡',terms:['Teléfono móvil','Cargador','Llaves','Paraguas','Mochila','Auriculares','Gafas de sol','Mando de televisión','Air fryer','Consola','Patinete','Silla gamer','Cepillo de dientes','Batería externa','Impresora 3D','Bolígrafo','Ventilador','Pelota','Espejo','Reloj','Ordenador portátil','Almohada','Botella de agua','Monopatín','Tostadora','Cámara de fotos','Sudadera','Anillo','Linterna','Microondas','Bañador','Nevera','Teclado','Altavoz','Libro']},
 {id:'pop',name:'Cultura pop',icon:'★',terms:['Pikachu','Mario Bros','Shrek','Bob Esponja','Spider-Man','Batman','Homer Simpson','Darth Vader','Harry Potter','Goku','Luffy','Naruto','Stitch','Sonic','Elsa de Frozen','Barbie','Iron Man','Wednesday Addams','Ronaldo','Messi','Bad Bunny','Rosalía','Taylor Swift','Doraemon','Mickey Mouse','Saitama','Deadpool','Wolverine','Charizard','Godzilla','Grogu','Mr. Bean','Jack Sparrow','Minions','Buzz Lightyear']}
];
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function rnd(n){if(n<=1)return 0;const a=new Uint32Array(1),limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%n;}
function initial(){return {phase:'setup',count:5,players:[],categories:CATS.map(c=>c.id),word:'',impostor:-1,turn:0,first:0,voteIndex:0,votes:[],help:false,seen:[]};}
function load(){try{const s=JSON.parse(sessionStorage.getItem(store)||'null');if(s&&Array.isArray(s.players)&&Number.isInteger(s.count)&&s.count>=3&&s.count<=10&&Array.isArray(s.categories)){s.phase=s.phase==='reveal'?'pass':s.phase==='vote'?'vote-pass':s.phase;return {...initial(),...s,help:false}}}catch{}return initial();}
let s=load();
function save(){const copy={...s,phase:s.phase==='reveal'?'pass':s.phase==='vote'?'vote-pass':s.phase,help:false};try{sessionStorage.setItem(store,JSON.stringify(copy))}catch{}}
function set(changes){s={...s,...changes};save();render();}
function names(){return Array.from({length:s.count},(_,i)=>(s.players[i]||'').trim().slice(0,20)||'Jugador '+(i+1));}
function newRound(){
 const pool=CATS.filter(c=>s.categories.includes(c.id)).flatMap(c=>c.terms);
 if(pool.length===0)return;
 const recent=new Set(s.seen||[]),filtered=pool.filter(w=>!recent.has(w)),choices=filtered.length?filtered:pool;
 const word=choices[rnd(choices.length)],players=names();
 set({phase:'pass',players,word,impostor:rnd(players.length),turn:0,votes:[],voteIndex:0,first:rnd(players.length),seen:[...(s.seen||[]).slice(-14),word]});
}
function nav(){return '<header class="party-nav"><div class="party-container party-nav-inner"><a class="party-brand" href="'+location.pathname+'"><span class="party-brand-icon">✦</span>¿Una partidita<span class="party-brand-question">?</span></a><button class="party-link-btn" data-action="help">Cómo jugar</button></div></header>'}
function top(){return '<div class="party-top"><a class="party-back" href="'+location.pathname+'">← Biblioteca</a><span class="party-top-tag">IMPOSTOR · UN MÓVIL</span></div>'}
function rules(){return nav()+'<main class="party-container party-main">'+top()+'<section class="party-panel party-rules"><button class="party-back-btn" data-action="help">← Volver al juego</button><h1>Cómo jugar a Impostor</h1><p>Una persona no conoce la palabra secreta. Todos los demás reciben la misma palabra. Intentad descubrir quién está improvisando.</p><ol><li>Elegid cuántos jugadores sois y una o varias temáticas.</li><li>Pasad el móvil de uno en uno. Cada persona ve su papel y lo oculta antes de pasarlo.</li><li>Por turnos, decid una pista relacionada con la palabra. No la digáis directamente.</li><li>Votad en secreto desde el mismo móvil. Si el impostor es el único más votado, gana el grupo. En caso de empate o error, gana el impostor.</li></ol><button class="party-button party-primary" data-action="help">Entendido</button></section></main>'}
function setup(){
 const count=s.count;
 return nav()+'<main class="party-container party-main">'+top()+'<section class="party-heading"><div class="party-hero-icon imp-hero-icon">◉</div><span class="party-kicker">DESCUBRE AL INFILTRADO</span><h1>Impostor<span class="party-dot">.</span></h1><p>Todos saben de qué habláis… menos uno.</p></section>'+
 '<section class="party-panel party-settings"><div class="party-label-row"><h2>¿Cuántos sois?</h2><span class="party-count">'+count+'/10</span></div><div class="party-stepper"><button type="button" data-action="minus" '+(count<=3?'disabled':'')+' aria-label="Quitar jugador">−</button><strong>'+count+'</strong><button type="button" data-action="plus" '+(count>=10?'disabled':'')+' aria-label="Añadir jugador">+</button></div>'+
 '<div class="party-label-row imp-name-heading"><h2>¿Quién juega?</h2><span class="party-count">'+count+' nombres</span></div><p class="imp-names-hint">Escribe los nombres directamente, o deja el nombre predeterminado.</p>'+
 '<div class="party-name-list imp-name-grid">'+Array.from({length:count},(_,i)=>'<label class="imp-player-field"><span class="imp-player-number">'+(i+1)+'</span><input class="party-name-input" data-index="'+i+'" aria-label="Nombre del jugador '+(i+1)+'" maxlength="20" value="'+esc(s.players[i]||'')+'" placeholder="Jugador '+(i+1)+'" autocomplete="off" autocapitalize="words" spellcheck="false"></label>').join('')+'</div>'+
 '<h2>Elegid temáticas</h2><div class="party-categories">'+CATS.map(c=>'<button type="button" class="party-topic '+(s.categories.includes(c.id)?'active':'')+'" data-action="cat" data-id="'+c.id+'" aria-pressed="'+s.categories.includes(c.id)+'"><span class="party-topic-icon">'+c.icon+'</span><span>'+c.name+'</span><span class="party-check">'+(s.categories.includes(c.id)?'✓':'+')+'</span></button>').join('')+'</div>'+
 '<button type="button" class="party-button party-primary party-start" data-action="start">Empezar partida <span>→</span></button><p class="party-caption">3–10 personas · 1 impostor · sin crear salas</p></section></main>';
}
function privacyScreen(){
 const name=names()[s.turn];
 return nav()+'<main class="party-container party-main">'+top()+'<section class="party-center party-transfer"><div class="party-step">JUGADOR '+(s.turn+1)+' DE '+s.count+'</div><div class="party-hide-icon">▣</div><h1>Pasa el móvil a<br><em>'+esc(name)+'</em></h1><p>Solo '+esc(name)+' debe mirar la siguiente pantalla.</p><button class="party-button party-primary" data-action="show">Ver mi papel</button><div class="party-privacy">El papel desaparece al pulsar «Ocultar y pasar».</div></section></main>';
}
function reveal(){
 const imp=s.turn===s.impostor;return nav()+'<main class="party-container party-main">'+top()+
 '<section class="party-center party-reveal '+(imp?'party-impostor':'party-civil')+'"><span class="party-step">PAPEL DE '+esc(names()[s.turn])+'</span><div class="party-role-icon">'+(imp?'?':'✦')+'</div><h1>'+(imp?'¡Eres el impostor!':'Tu palabra es…')+'</h1>'+(imp?'<p>No conoces la palabra. Escucha las pistas e intenta pasar desapercibido.</p>':'<div class="party-secret-word">'+esc(s.word)+'</div><p>Da pistas sin decir la palabra tal cual.</p>')+'<button class="party-button party-primary" data-action="hide">Ocultar y pasar →</button></section></main>';
}
function talk(){
 return nav()+'<main class="party-container party-main">'+top()+'<section class="party-center party-talk"><span class="party-step">TODOS HAN VISTO SU PAPEL</span><div class="party-talk-icon">✳</div><h1>¡A dar pistas!</h1><p>Empieza <strong>'+esc(names()[s.first])+'</strong>. Seguid el orden del grupo. Cada uno dice una pista, sin mencionar la palabra.</p><div class="party-rule-note">Cuando hayáis debatido, votad a quien creáis que no sabe de qué habláis.</div><button class="party-button party-primary" data-action="vote-start">Empezar votación →</button></section></main>';
}
function votePass(){
 return nav()+'<main class="party-container party-main">'+top()+'<section class="party-center party-transfer"><span class="party-step">VOTO '+(s.voteIndex+1)+' DE '+s.count+'</span><div class="party-hide-icon">◎</div><h1>Le toca votar a<br><em>'+esc(names()[s.voteIndex])+'</em></h1><p>Pasadle el móvil para que vote sin que los demás vean a quién elige.</p><button class="party-button party-primary" data-action="vote-open">Votar en secreto</button></section></main>';
}
function voteScreen(){
 return nav()+'<main class="party-container party-main">'+top()+'<section class="party-center party-vote"><span class="party-step">VOTA '+esc(names()[s.voteIndex])+'</span><h1>¿Quién es el impostor?</h1><p>Elige a una persona. No puedes votarte a ti mismo.</p><div class="party-vote-grid">'+names().map((n,i)=>i===s.voteIndex?'':'<button class="party-vote-choice" data-action="cast" data-index="'+i+'"><span>'+esc(n.slice(0,1).toUpperCase())+'</span><strong>'+esc(n)+'</strong></button>').join('')+'</div><p class="party-caption">Tu voto se guarda al tocar a alguien.</p></section></main>';
}
function results(){
 const count=names().map((n,i)=>({name:n,index:i,votes:s.votes.filter(v=>v===i).length}));
 const max=Math.max(...count.map(p=>p.votes));const chosen=count.filter(p=>p.votes===max),win=chosen.length===1&&chosen[0].index===s.impostor;
 return nav()+'<main class="party-container party-main">'+top()+'<section class="party-center party-outcome '+(win?'party-won':'party-lost')+'"><span class="party-step">FIN DE LA PARTIDA</span><div class="party-talk-icon">'+(win?'★':'?')+'</div><h1>'+(win?'¡Habéis pillado al impostor!':'¡El impostor se ha librado!')+'</h1><p>El impostor era <strong>'+esc(names()[s.impostor])+'</strong>.</p><div class="party-result-word"><span>LA PALABRA ERA</span><strong>'+esc(s.word)+'</strong></div><h2>Votación</h2><div class="party-results">'+count.sort((a,b)=>b.votes-a.votes).map(p=>'<div class="party-result-row"><span>'+esc(p.name)+(p.index===s.impostor?' <b>(impostor)</b>':'')+'</span><strong>'+p.votes+'</strong></div>').join('')+'</div><button class="party-button party-primary" data-action="again">Otra ronda</button><button class="party-button party-secondary" data-action="reset">Cambiar jugadores</button></section></main>';
}
function render(){
 app.innerHTML='<div class="party-app impostor-app">'+(s.help?rules():s.phase==='setup'?setup():s.phase==='pass'?privacyScreen():s.phase==='reveal'?reveal():s.phase==='talk'?talk():s.phase==='vote-pass'?votePass():s.phase==='vote'?voteScreen():results())+'</div>';
}
app.addEventListener('input',e=>{
 const item=e.target.closest('.party-name-input');if(!item||s.phase!=='setup')return;
 const i=Number(item.dataset.index);if(i<0||i>=10)return;
 s.players[i]=item.value.slice(0,20);save();
});
app.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b)return;e.preventDefault();
 const action=b.dataset.action;
 if(action==='help'){set({help:!s.help});return;}
 if(s.help)return;
 if(action==='plus'||action==='minus'){set({count:Math.max(3,Math.min(10,s.count+(action==='plus'?1:-1)))});return;}
 if(action==='cat'){const id=b.dataset.id;if(!CATS.some(c=>c.id===id))return;const c=s.categories.includes(id)?s.categories.filter(x=>x!==id):[...s.categories,id];if(c.length)set({categories:c});return;}
 if(action==='start'&&s.phase==='setup'){newRound();return;}
 if(action==='show'&&s.phase==='pass'){set({phase:'reveal'});return;}
 if(action==='hide'&&s.phase==='reveal'){set(s.turn===s.count-1?{phase:'talk'}:{phase:'pass',turn:s.turn+1});return;}
 if(action==='vote-start'&&s.phase==='talk'){set({phase:'vote-pass',voteIndex:0,votes:[]});return;}
 if(action==='vote-open'&&s.phase==='vote-pass'){set({phase:'vote'});return;}
 if(action==='cast'&&s.phase==='vote'){
  const person=Number(b.dataset.index);
  if(!Number.isInteger(person)||person<0||person>=s.count||person===s.voteIndex)return;
  const votes=[...s.votes,person];set(s.voteIndex===s.count-1?{votes,phase:'results'}:{votes,phase:'vote-pass',voteIndex:s.voteIndex+1});return;
 }
 if(action==='again'&&s.phase==='results'){newRound();return;}
 if(action==='reset'&&s.phase==='results'){set({phase:'setup'});}
});
render();
})();