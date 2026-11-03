'use strict';
// ¿Una partidita? — selector de juegos compartiendo identidad visual.
// Los enlaces antiguos ?sala=... continúan abriendo directamente ¿Quién soy?.
const params=new URLSearchParams(location.search);
const view=params.has('cartas')||params.get('juego')==='cromazo'?'cromazo':params.has('sala')||params.get('juego')==='quien'?'quien':'biblioteca';
const root=document.getElementById('app');
const startScript=src=>new Promise((resolve,reject)=>{
 const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(new Error('No se pudo cargar '+src));document.head.appendChild(script);
});
if(view==='quien'){
 document.title='¿Quién soy? · ¿Una partidita?';
 startScript('characters.js?v=14').then(()=>startScript('app.js?v=14')).catch(e=>root.innerHTML='<main class="loading-root">Error cargando ¿Quién soy?. Vuelve a abrir el enlace.</main>');
}else if(view==='cromazo'){
 document.title='Cromazo · ¿Una partidita?';
 startScript('cromazo.js?v=14').catch(e=>root.innerHTML='<main class="loading-root">Error cargando Cromazo. Vuelve a abrir el enlace.</main>');
}else{
 document.title='¿Una partidita? · Juegos para jugar juntos';
 root.innerHTML=`<div class="library">
   <header class="library-nav"><div class="library-wrap"><a class="library-logo" href="${location.pathname}" aria-label="Inicio ¿Una partidita?"><span class="library-mark">✦</span><span>¿Una partidita<span class="library-accent">?</span></span></a><span class="library-nav-note">Juegos entre amigos</span></div></header>
   <main class="library-wrap">
    <section class="library-intro"><span class="library-kicker"><span class="library-live"></span> LA PARTIDA EMPIEZA AQUÍ</span><h1>¿A qué <em>jugamos?</em></h1><p>Elige un juego, invita a tus amigos y que empiece la partida.</p></section>
    <section aria-label="Biblioteca de juegos" class="library-grid">
      <a class="game-tile mystery-tile" href="?juego=quien">
        <div class="game-art mystery-art" aria-hidden="true"><span class="art-ring"></span><span class="art-question">?</span><span class="art-spark art-spark-a">✦</span><span class="art-spark art-spark-b">✳</span></div>
        <div class="game-tile-bottom"><div><span class="game-tile-type">ADIVINA EL PERSONAJE</span><h2>¿Quién soy?</h2><p>Haz preguntas. Descubre tu identidad.</p><span class="game-players">2–10 jugadores</span></div><span class="game-arrow" aria-hidden="true">↗</span></div>
      </a>
      <a class="game-tile cromazo-tile" href="?juego=cromazo">
        <div class="game-art cromazo-art" aria-hidden="true"><span class="art-card art-card-red">7</span><span class="art-card art-card-blue">↻</span><span class="art-card art-card-yellow">+2</span><span class="art-spark art-spark-c">✦</span></div>
        <div class="game-tile-bottom"><div><span class="game-tile-type">CARTAS Y CAOS</span><h2>Cromazo</h2><p>Combina colores, cambia el turno, gana.</p><span class="game-players">2–10 jugadores</span></div><span class="game-arrow" aria-hidden="true">↗</span></div>
      </a>
    </section>
    <p class="library-footnote">Sin descargas. Sin registros. Cada uno desde su móvil.</p>
   </main><footer class="library-footer">¿Una partidita? · Una excusa para jugar juntos</footer>
  </div>`;
}
