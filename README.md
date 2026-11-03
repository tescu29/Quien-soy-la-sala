# ¿Una partidita?

Biblioteca de juegos sociales para jugar con amigos sin instalar apps ni registrarse. «¿Quién soy?» y Cromazo se juegan desde distintos móviles conectados a una sala; Impostor y Yo nunca se juegan **pasando un único móvil** al grupo.

**Flujo:** abrir el enlace → elegir juego → jugar. Los juegos multijugador requieren crear o unirse a una sala; los de un móvil no necesitan ese paso. Los enlaces de invitación llevan directamente a cada sala.

## Juegos

### ¿Quién soy?
- Juego previo conservado, con su catálogo **332 personajes** auditados para público español de 20 a 35 años.
- Seis temáticas visuales que agrupan las doce categorías internas; sin dificultad ni ejemplos de personajes en el selector.
- Identidad oculta al jugador activo, visible para el resto; preguntas y turnos de hasta diez.
- Funciona con las RPC existentes de Supabase (create_room, join_room, ts_state, ts_start, ts_action, etc.).
- El frontend muestra **10 plazas**. **Pendiente de aplicar** `MIGRACION_LIMITE_10.sql` al Supabase original: actualmente la función `join_room` del servidor todavía admite 12.

### Cromazo
Juego **original** de descarte de colores y números, con mecánicas familiares, pero sin marca ni diseños de UNO.

- Entre 2 y 10 jugadores por sala; código de seis caracteres y enlace compartible.
- Mazo original de 108 cartas con cuatro colores, números, Salto, Giro, +2, comodín y +4.
- Siete cartas iniciales; robo de una carta y fin de turno; no hay acumulación de penalizaciones.
- Giro con dos personas funciona como salto, para que quien lo juega pueda repetir.
- El +4 no se puede usar si tienes alguna carta del color activo.
- Turnos, manos y jugadas se guardan y validan en Supabase. Cada sesión recibe solo su propia mano; la tabla privada no se expone directamente.
- Las pantallas actualizan el estado cada 2 segundos mientras están visibles.

El backend de Cromazo se ha desplegado en la base Supabase conectada al proyecto, creando tablas `cp_rooms`, `cp_players` y RPC `cp_create`, `cp_join`, `cp_state`, `cp_start`, `cp_action`, `cp_restart` y `cp_leave`. Los permisos de lectura directa de las tablas se han revocado a `anon`/`authenticated`; solo se exponen funciones autorizadas. **Esta instancia de Supabase es necesaria para jugar**; GitHub Pages solo publica el cliente web.

### Impostor
Juego social de identidades ocultas para **3–10 jugadores en un mismo móvil**, sin conexión a Supabase.

- Elegid el número de participantes y las temáticas (Lugares, Comida, Ocio, Objetos y Cultura pop).
- Se reparte aleatoriamente una palabra común y **exactamente un impostor** que no la conoce.
- Cada persona consulta su papel de forma privada antes de pasar el teléfono.
- Tras el debate, todos votan individualmente y en secreto en el mismo dispositivo.
- El grupo gana solo si el impostor es el **único** candidato con más votos; los empates favorecen al impostor.
- Soporta otra ronda con los mismos jugadores, nombres opcionales y memoria de palabras recientes.

### Yo nunca
Juego de conversación para **2–10 jugadores en un mismo móvil**, sin backend.

- Más de 100 frases repartidas entre cinco temáticas: Amigos, Fiesta, Amor y citas, Internet y Vida caótica.
- Los participantes levantan la mano si han hecho lo que aparece en pantalla.
- Contador **opcional** de respuestas afirmativas, para no obligar a nadie a usar su móvil.
- Control de siguiente/anterior sin repeticiones hasta agotar las cartas del conjunto seleccionado; resumen y reanudación.
- No requiere bebidas ni pruebas físicas: basta con hablar.

Ambos juegos guardan el estado de la partida en `sessionStorage` del navegador utilizado. Si se cambia de navegador o de dispositivo, **no se transfiere la partida**.

## Publicación

En el repositorio, entra en **Settings → Pages**, selecciona **Deploy from a branch**, rama **main**, carpeta **/(root)** y guarda.

Si Pages está activado, la dirección pública prevista es:
`https://tescu29.github.io/Quien-soy-la-sala/`

No se ha verificado todavía una publicación pública funcional en esa dirección.

## Rutas y compatibilidad

- `/` — biblioteca de juegos.
- `/?juego=quien` — entrada de ¿Quién soy?
- `/?sala=ABC123` — invitación directa a la sala de ¿Quién soy? (compatible con enlaces anteriores).
- `/?juego=cromazo` — entrada a Cromazo.
- `/?cartas=A3F9C0` — invitación directa a Cromazo.
- `/?juego=impostor` — Impostor, partida en un móvil.
- `/?juego=yonunca` — Yo nunca, partida en un móvil.

Las URLs se resuelven respecto a la ruta de GitHub Pages del repositorio.

## Archivos

- `index.html` — entrada HTML y política CSP.
- `library.js`, `library.css` — biblioteca común.
- `app.js`, `characters.js`, `styles.css` — juego «¿Quién soy?» existente.
- `cromazo.js`, `cromazo.css` — interfaz, salas y jugadas de Cromazo.
- `impostor.js`, `yonunca.js`, `party.css` — dos juegos sociales locales con identidad visual compartida.
- `MIGRACION_LIMITE_10.sql` — migración pendiente del máximo real de plazas de ¿Quién soy?
- `AUDITORIA_CATALOGO.md` — selección editorial de 332 personajes.

## Verificaciones realizadas

- Sintaxis JavaScript comprobada para `app.js`, `library.js`, `cromazo.js`, `impostor.js` y `yonunca.js`.
- Pruebas funcionales de las interfaces locales con simulación de eventos: en Impostor, cinco revelaciones con un único impostor, pistas, votación de cinco personas, resultado y revancha; en Yo nunca, frase inicial, contador, siguiente, anterior, resumen y reanudación.
- Prueba SQL transaccional de Cromazo con dos usuarios, creación y acceso a sala, reparto de siete cartas, privacidad de manos en `cp_state`, salto para dos personas, penalización +2, robo y cambio de turno, denegación de +4 ilegal y victoria. Se ejecutó con `ROLLBACK`, sin dejar partidas de prueba.
- **Pendiente**: prueba end-to-end con dos navegadores/móviles reales en una URL publicada para los juegos con sala; accesibilidad y aspecto visual de los cuatro juegos en dispositivos reales, despliegue de Pages y migración de límite de ¿Quién soy?. No se debe considerar el lanzamiento validado para producción hasta completarlas.

## Privacidad

La clave `sb_publishable_...` dentro de `app.js` y `cromazo.js` es una clave **publicable** del frontend, no una clave administrativa. Nunca subir claves de tipo service role ni secretos al repositorio.

## Selección cultural

Se mantienen 332 personajes después de la auditoría original: 280 fichas conservadas y 52 sustituidas por referencias transversales de cine, series, música, redes, animación y videojuegos. La selección se organiza en Cine/series/animación, Videojuegos, Música, Deportes, Internet y Cultura general. Véase [AUDITORIA_CATALOGO.md](AUDITORIA_CATALOGO.md).
