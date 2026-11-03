'use strict';
// ¿Una partidita? — selector de juegos compartiendo identidad visual.
// Los enlaces antiguos ?sala=... continúan abriendo directamente ¿Quién soy?.
const params=new URLSearchParams(location.search);
const view=params.has('cartas')||params.get('juego')==='cromazo'?'cromazo':params.has('sala')||params.get('juego')==='quien'?'quien':params.get('juego')==='impostor'?'impostor':params.get('juego')==='yonunca'?'yonunca':'biblioteca';
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
}else if(view==='impostor'){
 document.title='Impostor · ¿Una partidita?';
 startScript('impostor.js?v=15').catch(()=>root.innerHTML='<main class="loading-root">No se pudo cargar Impostor. Comprueba tu conexión.</main>');
}else if(view==='yonunca'){
 document.title='Yo nunca · ¿Una partidita?';
 startScript('yonunca.js?v=15').catch(()=>root.innerHTML='<main class="loading-root">No se pudo cargar Yo nunca. Comprueba tu conexión.</main>');
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
      <a class="game-tile impostor-tile" href="?juego=impostor">
        <div class="game-art impostor-art" aria-hidden="true"><span class="spy-aura"></span><span class="spy-icon"><span class="spy-head"></span><span class="spy-body"></span><span class="spy-question">?</span></span><span class="spy-star">✦</span></div>
        <div class="game-tile-bottom"><div><span class="game-tile-type">DESCUBRE AL INFILTRADO</span><h2>Impostor</h2><p>Todos conocen la palabra… menos uno.</p><span class="game-players">3–10 jugadores · 1 móvil</span></div><span class="game-arrow" aria-hidden="true">↗</span></div>
      </a>
      <a class="game-tile yonunca-tile" href="?juego=yonunca">
        <div class="game-art yonunca-art" aria-hidden="true"><span class="yn-art-back">YO</span><span class="yn-art-front">NUNCA</span><span class="yn-art-confetti yn-confetti-one">✳</span><span class="yn-art-confetti yn-confetti-two">✦</span></div>
        <div class="game-tile-bottom"><div><span class="game-tile-type">CONFESIONES ENTRE AMIGOS</span><h2>Yo nunca</h2><p>Una frase. Muchas historias que contar.</p><span class="game-players">2–10 jugadores · 1 móvil</span></div><span class="game-arrow" aria-hidden="true">↗</span></div>
      </a>
    </section>
    <p class="library-footnote">Sin descargas. Sin registros. Juega desde el móvil.</p>
   </main><footer class="library-footer">¿Una partidita? · Una excusa para jugar juntos</footer>
  </div>`;
}
