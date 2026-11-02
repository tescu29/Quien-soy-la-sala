# ¿QUIÉN SOY? · La Sala

Juego social multijugador para navegador. Cada jugador debe descubrir su personaje haciendo un máximo de 10 preguntas. Los demás participantes ven una ficha con pistas y datos.

## Estado

- 332 personajes en 12 categorías (videojuegos, ficción, música, influencers, historia y más).
- Salas de 2 a 12 jugadores con código de seis caracteres.
- Sin registro; acceso desde móviles y ordenadores.
- Dificultad fácil, media o mixta.
- Base de datos compartida en Supabase (conexión pública para la interfaz, reglas y autenticación por tokens aplicadas en el servidor).

## Publicación con GitHub Pages

En **Settings → Pages**, seleccionar **Deploy from a branch**, rama **main**, carpeta **/(root)** y guardar.

La dirección pública será `https://tescu29.github.io/<nombre-del-repositorio>/`.

Este repositorio contiene únicamente el juego. El proyecto de acuario está en otro repositorio y no debe mezclarse con este.

## Archivos

- `index.html`: interfaz de entrada.
- `styles.css`: estilos responsivos.
- `characters.js`: catálogo y fichas.
- `app.js`: lógica de partidas y cliente Supabase.

Las funciones RPC y las tablas permanecen en la instancia Supabase del proyecto existente; no se trasladan ni se duplican al publicar esta web estática.

## Privacidad y seguridad

El valor `sb_publishable_...` incluido en `app.js` es una clave **publicable** para el navegador, no una clave administrativa. La seguridad debe mantenerse en los permisos y las funciones RPC del servidor. No almacenar secretos administrativos, contraseñas ni service role keys en este repositorio.

## Selección cultural para partidas rápidas

El catálogo ha sido auditado personaje por personaje para el público objetivo español de 20 a 35 años. Se conservan 280 fichas originales y se sustituyen 52 referencias más especializadas por iconos de televisión, música, películas, animación y videojuegos ampliamente conocidos. El total sigue siendo 332. El modo Mixto favorece las referencias conocidas; las categorías y la dificultad son configurables.

La auditoría editorial completa está en [AUDITORIA_CATALOGO.md](AUDITORIA_CATALOGO.md). La selección es una estimación y debe validarse con partidas reales.
