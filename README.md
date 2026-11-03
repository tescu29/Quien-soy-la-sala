# ¿Una partidita?

Biblioteca de juegos sociales para jugar con amigos sin instalar apps ni registrarse. «¿Quién soy?», Cromazo y ¿Qué prefieres? se juegan desde distintos móviles conectados a una sala; Yo nunca se juega **pasando un único móvil** al grupo. **Impostor permite elegir entre un móvil compartido y una sala multijugador**, donde cada persona juega desde su teléfono.

**Flujo:** abrir el enlace → elegir juego → jugar. Los juegos multijugador requieren crear o unirse a una sala; los de un móvil no necesitan ese paso. Los enlaces de invitación llevan directamente a cada sala.

### Incidencia: `party_id` ambiguo

Detectado en dispositivo real al pulsar «Cambiar de juego» en ¿Quién soy?: PostgreSQL devolvió `column reference "party_id" is ambiguous`. La causa es una variable PL/pgSQL innecesaria `party_id uuid` declarada dentro de `gu_attach`, que colisiona con la columna del índice del `INSERT ... ON CONFLICT (party_id,token_hash)`.

- **Código fuente corregido** en `MIGRACION_SALA_UNIVERSAL.sql`.
- **Hotfix incremental listo**: `HOTFIX_SALA_PARTY_ID.sql`, que redefine únicamente `public.gu_attach` sin esa variable.
- **APLICADO EN SUPABASE**: la actualización incremental se ejecutó correctamente. Después se comprobó que la definición instalada de `public.gu_attach` ya no declara `party_id uuid`, que conserva `ON CONFLICT (party_id,token_hash)` y que `gu_open` sigue disponible. Además, una prueba transaccional real de Supabase creó una sala temporal de Cromazo, la registró con `gu_attach`, leyó su estado con `gu_status` y ejecutó `ROLLBACK` para no dejar datos de prueba. **La prueba pasó.** Falta probar una transferencia de juego completa con varios dispositivos reales.
- El cliente `grupo-hub.js` muestra posibles errores dentro de la página, sin diálogo modal del navegador, y no abandona el juego actual si falla el cambio. Además, los botones **Copiar código** y **Compartir enlace** ya no esperan ninguna petición al servidor antes de copiar/compartir; utilizan `navigator.clipboard`/Web Share y tienen respaldo de selección manual para navegadores embebidos.
- Pruebas de interfaz simuladas superadas para compartir con Web Share y copiar con Clipboard API, `execCommand` o selección manual; la prueba end-to-end de cambio de juego entre varios dispositivos sigue pendiente.

## Sala universal entre juegos

La **sala pertenece al grupo**, no a un juego. Se aplica a las cuatro modalidades que crean sala: **¿Quién soy?, Cromazo, Impostor (crear sala) y ¿Qué prefieres?**.

- Se crea una sala nativa **una sola vez** de cara a los usuarios; el gestor `grupo-hub.js` la registra como grupo universal con un **código de invitación permanente** y enlace `/?grupo=ABC123`.
- Al terminar una ronda/partida, aparecen **fichas con los otros tres juegos**. Solo el anfitrión puede elegir. Impostor requiere 3 jugadores; los demás 2.
- El servidor (`gu_open`) valida que la ronda esté terminada y que quien cambia sea el anfitrión.
- Tras cambiar, todos los navegadores reciben el aviso. El anfitrión crea automáticamente la sala interna del nuevo juego; los demás **entran automáticamente con su nombre y su token propio**, sin repetir formularios ni enviar enlaces nuevos.
- Aunque los motores tengan códigos internos diferentes, la invitación y el código **visible del grupo** permanecen, y puede cambiarse de juego cuantas veces se quiera.
- El enlace permanente también funciona para invitados que se incorporan después del cambio, llevándolos al juego actualmente activo. Los nuevos participantes deberán escribir su nombre una sola vez para entrar.
- La sala anterior se conserva en sus tablas; no se trasladan manos, personajes ni votos entre juegos. Sí se mantiene el grupo. Se pueden jugar nuevas rondas en cada juego mediante sus controles habituales.
- La transición tiene recuperación de errores y de creación interrumpida en el navegador del anfitrión. Es necesario que esté conectado para preparar el nuevo juego; los demás ven una pantalla de espera.

**Código**: `grupo-hub.js` controla la sala desde los cuatro clientes; `grupo.js` resuelve la invitación permanente y crea/une a los participantes; `MIGRACION_SALA_UNIVERSAL.sql` crea `gu_parties`, `gu_links`, `gu_members` y RPC `gu_attach`, `gu_status`, `gu_public`, `gu_open`, `gu_activate`. La migración se ejecutó sobre Supabase.

**Verificación**: se comprobó la sintaxis de los clientes y se simularon la inscripción al grupo, el cambio iniciado por el anfitrión y **ocho transiciones (anfitrión e invitado hacia cada uno de los cuatro juegos)**; se verificó la creación automática de sala interna, la configuración de ¿Quién soy?, la entrada automática del invitado y la conservación de su identidad. Sigue pendiente una prueba end-to-end real que recorra los cuatro juegos y valide los RPC contra Supabase, porque se ha alcanzado temporalmente el límite del conector de consultas.

Las antiguas migraciones `MIGRACION_SALA_COMPARTIDA.sql` y `MIGRACION_SALA_ENLACE.sql` eran una integración previa limitada a Impostor y ¿Qué prefieres?; el cliente actual usa únicamente el sistema universal `gu_*`.

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
- En la zona superior del tablero, **«Cartas de tus rivales»** muestra el número de cartas restantes de cada contrincante, el turno activo y un aviso destacado cuando alguien se queda con una sola carta. Estos contadores salen de `cp_state` y no exponen el contenido de ninguna mano; no se necesita migración SQL.

El backend de Cromazo se ha desplegado en la base Supabase conectada al proyecto, creando tablas `cp_rooms`, `cp_players` y RPC `cp_create`, `cp_join`, `cp_state`, `cp_start`, `cp_action`, `cp_restart` y `cp_leave`. Los permisos de lectura directa de las tablas se han revocado a `anon`/`authenticated`; solo se exponen funciones autorizadas. **Esta instancia de Supabase es necesaria para jugar**; GitHub Pages solo publica el cliente web.

### Impostor
Al tocar Impostor aparecen **dos fichas de modalidad**:
- **Un solo móvil:** juego local existente, para 3–10 personas pasando el mismo teléfono; sin conexión a Supabase.
- **Crear sala:** cada participante accede desde su propio móvil, comparte un código o enlace y recibe su papel privado. De 3 a 10 jugadores, anfitrión, palabras de todas las temáticas mezcladas automáticamente, votación individual secreta, resultados sincronizados y revancha.

**Backend activado:** la migración `MIGRACION_IMPOSTOR_SALAS.sql` se ha ejecutado correctamente en Supabase. El código del cliente también está en `main`. Está pendiente validar una partida completa desde móviles/navegadores separados antes de afirmar que la experiencia de producción ha sido comprobada.

El backend crea `im_rooms`, `im_players`, `im_words` con **175 palabras** compartidas con la modalidad local, y las RPC `im_create`, `im_join`, `im_state`, `im_settings`, `im_start`, `im_ready`, `im_advance`, `im_vote`, `im_next` e `im_leave`. Por seguridad, el servidor guarda la palabra, el impostor y los votos privados; cada jugador recibe únicamente su papel hasta revelar resultados. Los cambios se sincronizan por consulta periódica cada 2,3 segundos.

#### Un solo móvil
Juego social de identidades ocultas para **3–10 jugadores en un mismo móvil**, sin conexión a Supabase.

- Elegid cuántos sois y escribid los nombres si queréis. Las 175 palabras de lugares, comida, ocio, objetos y cultura pop aparecen **mezcladas automáticamente**.
- Se reparte aleatoriamente una palabra común y **exactamente un impostor** que no la conoce.
- Cada persona consulta su papel de forma privada antes de pasar el teléfono.
- Tras el debate, todos votan individualmente y en secreto en el mismo dispositivo.
- El grupo gana solo si el impostor es el **único** candidato con más votos; los empates favorecen al impostor.
- Soporta otra ronda con los mismos jugadores, nombres opcionales y memoria de palabras recientes.

### Yo nunca
Juego de conversación para **2–10 jugadores en un mismo móvil**, sin backend.

- Más de 250 frases: las 110 originales y **150 nuevas para adultos** (70 Picante, 80 Sin filtro) repartidas entre cinco temáticas: Amigos, Fiesta, Amor y citas, Internet y Vida caótica.
- Los participantes levantan la mano si han hecho lo que aparece en pantalla.
- Contador **opcional** de respuestas afirmativas, para no obligar a nadie a usar su móvil.
- Control de siguiente/anterior sin repeticiones hasta agotar las cartas del conjunto seleccionado; resumen y reanudación.
- Selector de intensidad **Tranquilo / Sin miedo al éxito**; **Sin miedo al éxito** es el valor predeterminado. Tranquilo utiliza las 110 frases originales; Sin miedo al éxito mezcla las 150 frases adultas (70 picantes y 80 especialmente fuertes).
- La modalidad **Sin miedo al éxito** está señalizada como **18+**; se puede pasar cualquier pregunta sin necesidad de justificarse. No requiere bebidas ni pruebas físicas.

Los juegos de un solo móvil guardan el estado de la partida en `sessionStorage` del navegador utilizado. Las salas multijugador guardan su estado en Supabase.


### ¿Qué prefieres?
**Multijugador en sala** para **2–10 personas**, cada una desde su móvil, sin registro ni instalación.

- **180 dilemas originales**: 30 tranquilos, 75 picantes y 75 sin filtro, conservados del modo anterior.
- Selección de intensidad en la sala: **Tranquilo / Sin miedo al éxito**. Esta última está seleccionada por defecto, marcada como contenido 18+ e incluye los 150 dilemas adultos (75 picantes y 75 sin filtro).
- La primera persona que entra en la sala **lee en voz alta el primer dilema y no vota**. El resto del grupo elige A o B desde sus teléfonos.
- Las decisiones individuales no se muestran antes de acabar la votación. Cuando todos los que deben votar han elegido, aparecen el recuento y los porcentajes.
- El lector (o el anfitrión, como respaldo) pulsa **«Siguiente turno»** y se asigna el dilema siguiente al segundo jugador, luego al tercero, etc., en orden de entrada.
- El lector o anfitrión puede cambiar el dilema sin que nadie tenga que justificarse; esto reinicia los votos de la ronda.
- Los jugadores usan el código/enlace compartible y pueden recuperar su sala desde el mismo navegador.
- Los votos se validan en Supabase: el lector **no puede votar**, nadie puede votar dos veces y no se permite cerrar la votación hasta que todos los votantes activos hayan respondido.
- Los dilemas no se repiten mientras queden otros disponibles en la intensidad seleccionada.

**Backend**: tablas `qp_rooms`, `qp_players`, `qp_dilemmas`; RPC `qp_create`, `qp_join`, `qp_state`, `qp_settings`, `qp_start`, `qp_vote`, `qp_next`, `qp_skip`, `qp_leave`. Las tablas tienen RLS activa sin acceso directo público y cada jugador tiene un token privado. Migraciones `MIGRACION_QUE_PREFIERES_SALAS.sql` y `MIGRACION_QUE_PREFIERES_DILEMAS.sql` aplicadas en la instancia de Supabase. También están aplicados los parches `MIGRACION_QUE_PREFIERES_SALIDAS.sql` (abandono de salas) y `MIGRACION_QUE_PREFIERES_ORDEN.sql` (anfitrión siempre lector 1; orden de entrada del resto).

El archivo `queprefieres.js` antiguo se conserva como referencia del juego de un solo móvil, pero **la ruta pública usa `queprefieres-sala.js`**.

**Compatibilidad temporal:** mientras no se aplique la última migración, el cliente muestra solo dos niveles y traduce «Sin miedo al éxito» al valor anterior `picante` si el servidor rechaza el nuevo identificador. El contenido utilizado es el mismo conjunto de preguntas de nivel 2 y 3. Las salas antiguas configuradas con el anterior `sinfiltro` se normalizan al nuevo nivel al iniciar desde el vestíbulo.

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
- `/?juego=impostor` — selector de fichas Un solo móvil / Crear sala.
- `/?juego=impostor&modo=movil` — Impostor con un móvil.
- `/?juego=impostor&modo=sala` — Crear o unirse a una sala de Impostor.
- `/?juego=impostor&modo=sala&codigo=ABC123` — invitación directa a una sala de Impostor (cuando esté activado el backend).
- `/?juego=yonunca` — Yo nunca, partida en un móvil.
- `/?juego=queprefieres` — ¿Qué prefieres?, crear o unirse a sala.
- `/?juego=queprefieres&codigo=ABC123` — entrar directamente en sala de ¿Qué prefieres?.
- `/?grupo=ABC123` — invitación permanente al grupo, independientemente del juego activo.

Las URLs se resuelven respecto a la ruta de GitHub Pages del repositorio.

## Archivos

- `index.html` — entrada HTML y política CSP.
- `grupo-hub.js`, `grupo.js` — sala universal, cambio entre juegos e invitación permanente.
- `MIGRACION_SALA_UNIVERSAL.sql` — esquema y seguridad del grupo compartido.
- `library.js`, `library.css` — biblioteca común.
- `app.js`, `characters.js`, `styles.css` — juego «¿Quién soy?» existente.
- `cromazo.js`, `cromazo.css` — interfaz, salas y jugadas de Cromazo.
- `impostor.js` — Impostor en un solo móvil.
- `impostor-sala.js` — Impostor en salas sincronizadas con Supabase.
- `MIGRACION_IMPOSTOR_SALAS.sql` — migración SQL del servidor para Impostor (versión base actualizada).
- `MIGRACION_IMPOSTOR_TODO_MEZCLADO.sql` — actualización aplicada al Supabase existente para escoger palabras de cualquier temática, incluso en salas antiguas.
- `yonunca.js` — juego local de un móvil.
- `queprefieres-sala.js` — juego de lectura y votación multijugador, conectado a Supabase.
- `queprefieres.js` — versión anterior de un móvil, mantenida como referencia sin ruta pública.
- `MIGRACION_QUE_PREFIERES_SALAS.sql`, `MIGRACION_QUE_PREFIERES_DILEMAS.sql` — backend y banco de 180 dilemas.
- `MIGRACION_QUE_PREFIERES_SALIDAS.sql`, `MIGRACION_QUE_PREFIERES_ORDEN.sql` — parches incrementales de desconexión y rotación, ya aplicados.
- `MIGRACION_QUE_PREFIERES_DOS_NIVELES.sql` — actualización incremental de Supabase para los dos niveles, **pendiente de ejecutar** por límite temporal del conector. La interfaz es compatible tanto con el servidor antiguo como con el nuevo.
- `party.css` — estilos comunes.
- `MIGRACION_LIMITE_10.sql` — migración pendiente del máximo real de plazas de ¿Quién soy?
- `AUDITORIA_CATALOGO.md` — selección editorial de 332 personajes.

## Verificaciones realizadas

- Pruebas funcionales simuladas de tres clientes de ¿Qué prefieres?: creación de sala, incorporación de jugadores, lector excluido del voto, votos A/B independientes, resultados 50/50 y rotación del lector por los tres jugadores.
- Las tablas del backend de ¿Qué prefieres? y los 180 dilemas se comprobaron en Supabase. Una prueba SQL transaccional detectó un empate en la ordenación inicial del anfitrión; se aplicó el parche de orden. Su repetición quedó pendiente al agotarse la cuota del conector. La validación end-to-end en varios móviles también sigue pendiente.

- Sintaxis JavaScript comprobada para `app.js`, `library.js`, `cromazo.js`, `impostor.js`, `impostor-sala.js`, `yonunca.js` y `queprefieres.js`, `queprefieres-sala.js`.
- Pruebas funcionales de las interfaces locales con simulación de eventos: en Impostor, cinco revelaciones con un único impostor, pistas, votación de cinco personas, resultado y revancha; en Yo nunca, frase inicial, contador, siguiente, anterior, resumen y reanudación.
- Prueba SQL transaccional de Cromazo con dos usuarios, creación y acceso a sala, reparto de siete cartas, privacidad de manos en `cp_state`, salto para dos personas, penalización +2, robo y cambio de turno, denegación de +4 ilegal y victoria. Se ejecutó con `ROLLBACK`, sin dejar partidas de prueba.
- Pruebas funcionales simuladas de las dos intensidades adultas de Yo nunca y de ¿Qué prefieres? con cinco y diez votantes, porcentajes 60/40, salto, resumen, siguiente dilema, recuperación de sesión, y comprobación de las cinco rutas de la biblioteca.
- **Aplicado**: backend privado de Impostor en Supabase; pendiente verificar con pruebas SQL automatizadas y una sesión completa en varios dispositivos. La prueba SQL transaccional todavía no pudo ejecutarse por un límite temporal de consultas del conector.
- **Pendiente**: prueba de grupo transversal real con cuatro juegos, varios navegadores y mismo enlace antes de considerarlo validado para publicación.
- **Pendiente**: prueba end-to-end del modo ¿Qué prefieres? con varios navegadores reales, comprobando paso de lector, bloqueo del voto del lector y resultados finales.
- **Pendiente**: prueba end-to-end con dos navegadores/móviles reales en una URL publicada para los juegos con sala; accesibilidad y aspecto visual de los cuatro juegos en dispositivos reales, despliegue de Pages y migración de límite de ¿Quién soy?. No se debe considerar el lanzamiento validado para producción hasta completarlas.

## Privacidad

La clave `sb_publishable_...` dentro de `app.js` y `cromazo.js` es una clave **publicable** del frontend, no una clave administrativa. Nunca subir claves de tipo service role ni secretos al repositorio.

## Selección cultural

Se mantienen 332 personajes después de la auditoría original: 280 fichas conservadas y 52 sustituidas por referencias transversales de cine, series, música, redes, animación y videojuegos. La selección se organiza en Cine/series/animación, Videojuegos, Música, Deportes, Internet y Cultura general. Véase [AUDITORIA_CATALOGO.md](AUDITORIA_CATALOGO.md).
