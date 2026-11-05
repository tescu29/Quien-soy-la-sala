-- ¿Una partidita? · ¿Quién soy? · 15 intentos y pista sutil de coste 3
-- Compatible con el sistema de salas compartidas y con rondas existentes.
-- El servidor cobra los intentos y solo entrega la pista al jugador activo.
ALTER TABLE public.turn_sessions
 ADD COLUMN IF NOT EXISTS hint_used boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS public.ts_character_hints (
 character_id text PRIMARY KEY,
 hint text NOT NULL CHECK (char_length(hint) BETWEEN 12 AND 220)
);
ALTER TABLE public.ts_character_hints ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ts_character_hints FROM PUBLIC,anon,authenticated;

INSERT INTO public.ts_character_hints(character_id,hint) VALUES
 ('napoleon','Mis victorias me llevaron al poder, pero una isla terminó siendo mi destino.'),
 ('cleopatra','Tuve que negociar con gobernantes extranjeros para mantener mi posición.'),
 ('cesar','Tomé una decisión al cruzar un río que cambió el rumbo de mi país.'),
 ('alejandro','En pocos años llevé mis conquistas muy lejos de donde nací.'),
 ('isabel','Mis decisiones influyeron tanto en la península como al otro lado del océano.'),
 ('juana','Afirmaba escuchar algo que otros no podían y acabé guiando soldados.'),
 ('tutankamon','Mi lugar de descanso se hizo famoso miles de años después de mi reinado.'),
 ('vikinga','Mis hazañas se conocen por relatos donde historia y leyenda se mezclan.'),
 ('leonidas','Mi pequeña fuerza quedó recordada por resistir ante un enemigo enorme.'),
 ('gandhi','Demostré que una protesta podía desafiar a un imperio sin recurrir a las armas.'),
 ('mandela','Pasé muchos años sin libertad antes de llegar a dirigir mi país.'),
 ('lutherking','Reuní multitudes para reclamar derechos a través de la palabra.'),
 ('churchill','Mis palabras ayudaron a mantener la moral durante una guerra.'),
 ('lincoln','Me tocó gobernar cuando una parte del país se separó de la otra.'),
 ('obama','Mi llegada a la presidencia rompió una barrera histórica.'),
 ('trump','Antes de ocupar cargos públicos ya era conocido en negocios y televisión.'),
 ('felipevi','Heredé una responsabilidad institucional que no se decide en las urnas.'),
 ('isabelii','Vi sucederse generaciones enteras mientras conservaba mi posición.'),
 ('diana','Mi historia personal atrajo tanta atención como la institución a la que pertenecía.'),
 ('hitler','Utilicé discursos y propaganda para conducir a mi país a una catástrofe.'),
 ('einstein','Cambiar la forma de entender el tiempo fue parte de mi trabajo.'),
 ('newton','Relacioné el movimiento de los objetos con fuerzas que no podemos ver.'),
 ('curie','Trabajé con materiales cuyas propiedades sorprendían a los científicos.'),
 ('tesla','Defendí una manera de transportar electricidad que no todos aceptaban.'),
 ('darwin','Un viaje observando animales cambió mi manera de explicar la vida.'),
 ('galileo','Mis observaciones del cielo me enfrentaron a las autoridades de mi época.'),
 ('hawking','Estudié fenómenos del universo mientras vivía con grandes limitaciones físicas.'),
 ('ramoncajal','Busqué entender el cerebro mirando estructuras casi invisibles.'),
 ('da-vinci','Podía pasar de pintar un rostro a imaginar el funcionamiento de una máquina.'),
 ('picasso','Cambié tantas veces de estilo que no hay una sola forma de reconocer mi obra.'),
 ('vangogh','Trabajé con colores intensos, pero apenas conocí el éxito en vida.'),
 ('dali','Convertí mi aspecto personal en parte de la imagen de mi obra.'),
 ('frida','Mis autorretratos cuentan cosas de mi cuerpo y de mi vida.'),
 ('miguelangel','Trabajé sobre piedra y también sobre superficies muy por encima de mi cabeza.'),
 ('velazquez','Retraté a personas de una corte y a quienes las rodeaban.'),
 ('goya','Pasé de retratar a personas poderosas a mostrar escenas mucho más oscuras.'),
 ('cervantes','Una de mis historias tiene a alguien que confunde sus lecturas con la realidad.'),
 ('shakespeare','Escribí tragedias y comedias que siguen representándose siglos después.'),
 ('lorca','La música y las tradiciones populares aparecen en buena parte de mi obra.'),
 ('rowling','Empecé construyendo un mundo ficticio alrededor de una escuela poco común.'),
 ('mjackson','Mis movimientos sobre el escenario llegaron a ser tan famosos como mis canciones.'),
 ('madonna','He cambiado de imagen y de sonido muchas veces sin abandonar los escenarios.'),
 ('elvis','Mis movimientos al cantar provocaron tanto revuelo como mi música.'),
 ('freddie','Conseguía que multitudes enteras participaran en mis actuaciones.'),
 ('lennon','Mis canciones acabaron mezclando la fama con mensajes sobre la paz.'),
 ('mccartney','Después de un grupo legendario seguí componiendo durante décadas.'),
 ('shakira','Mi carrera cruzó idiomas sin que dejara de bailar sobre el escenario.'),
 ('taylorswift','He convertido experiencias personales en historias que mi público reconoce.'),
 ('beyonce','Antes de llenar estadios en solitario, compartía el escenario con otras cantantes.'),
 ('rosalia','He mezclado sonidos muy tradicionales con una puesta en escena moderna.'),
 ('badbunny','Mi música ha llevado el español a escenarios internacionales enormes.'),
 ('alejandrosanz','Mis letras suelen contar historias personales acompañadas de una guitarra.'),
 ('serrat','He cantado a la vida cotidiana en más de una lengua.'),
 ('adele','He puesto sentimientos muy íntimos en canciones que canta medio mundo.'),
 ('brunomars','Bailar y recuperar sonidos de otras décadas forman parte de mis espectáculos.'),
 ('messi','Llegué muy joven a otro país y acabé convirtiéndome en su ídolo deportivo.'),
 ('cristiano','Mi carrera ha pasado por varias ligas sin que dejara de perseguir récords.'),
 ('nadal','Una pista de tierra ha sido escenario de muchos de mis mayores triunfos.'),
 ('federer','Mi forma elegante de competir marcó una época de grandes rivalidades.'),
 ('jordan','Mi número de camiseta llegó a ser casi tan famoso como mis saltos.'),
 ('lebron','Debuté muy joven y seguí compitiendo al máximo nivel durante muchos años.'),
 ('usain','Durante unos segundos fui el centro de atención de todo el planeta.'),
 ('alonso','Gané títulos muy joven y seguí corriendo frente a varias generaciones de rivales.'),
 ('marquez','He asumido riesgos enormes sobre dos ruedas para llegar a lo más alto.'),
 ('iniesta','Un momento decisivo fuera de mi club me convirtió en parte de la historia.'),
 ('pele','Empecé a ganar torneos mundiales cuando todavía era adolescente.'),
 ('maradona','Mi talento y mi carácter hicieron que se hablara de mí dentro y fuera del campo.'),
 ('phelps','Durante años acumulé medallas compitiendo en distintas pruebas dentro del agua.'),
 ('hamilton','He unido mis victorias al volante con una presencia pública muy reconocible.'),
 ('schumacher','Mi nombre quedó unido a una etapa de dominio absoluto en los circuitos.'),
 ('chaplin','Conseguí hacer reír a generaciones sin necesitar apenas palabras.'),
 ('marilyn','Mi imagen acabó convirtiéndose en un símbolo más allá de mis películas.'),
 ('disney','Empecé dibujando historias que terminaron llegando a parques y pantallas.'),
 ('spielberg','He hecho que el público tema el agua y mire al cielo con otros ojos.'),
 ('dicapiro','Una historia de amor en un viaje desastroso me hizo mundialmente conocido.'),
 ('tomcruise','Me gusta realizar escenas arriesgadas que otros dejarían a especialistas.'),
 ('willSmith','Mi carrera pasó de la música y la comedia a grandes películas.'),
 ('zendaya','Empecé con papeles juveniles antes de asumir personajes muy distintos.'),
 ('jennifer','Mi personaje de una competición extrema cambió mi carrera.'),
 ('antonio','Mi carrera me llevó de España a protagonizar grandes producciones internacionales.'),
 ('penelope','He trabajado en varios idiomas sin dejar de volver al cine de mi país.'),
 ('almodovar','Mis historias suelen mezclar relaciones intensas con colores muy expresivos.'),
 ('mrbean','Con muy pocas palabras hice reír a espectadores de muchos idiomas.'),
 ('carrey','Mis gestos exagerados son casi tan conocidos como mis personajes.'),
 ('colón','Busqué una ruta marítima y llegué a territorios que no esperaba.'),
 ('marcopolo','Regresé de viajes lejanos con relatos que parecían difíciles de creer.'),
 ('magallanes','Partí en una expedición inmensa que otros tuvieron que terminar.'),
 ('elcano','Regresé de un viaje al que muy pocos de mis compañeros sobrevivieron.'),
 ('armstrong','Realicé un viaje que terminó con un paseo fuera de nuestro planeta.'),
 ('gagarin','Fui elegido para un trayecto donde nadie sabía exactamente qué sentiría.'),
 ('campoamor','Defendí que una parte de la población pudiera participar en las elecciones.'),
 ('malala','Quise seguir estudiando incluso cuando hacerlo suponía un peligro.'),
 ('greta','Una protesta escolar terminó inspirando movilizaciones internacionales.'),
 ('mario','Mi trabajo habitual tiene poco que ver con las aventuras por las que me conocen.'),
 ('luigi','Mi hermano suele llevarse el protagonismo, aunque también tengo aventuras propias.'),
 ('bowser','Mis planes suelen acabar enfrentándome a alguien mucho más pequeño que yo.'),
 ('link','Paso buena parte de mis aventuras intentando ayudar a alguien que tiene un nombre más conocido que el mío.'),
 ('zelda','Mi nombre aparece en muchas aventuras que otro personaje protagoniza.'),
 ('sonic','Lo último que me gustaría sería quedarme quieto.'),
 ('pikachu','Mi tamaño no refleja lo peligroso que puedo llegar a ser.'),
 ('lara','Me meto en lugares antiguos donde lo prudente sería no entrar.'),
 ('kratos','Mis conflictos familiares tienen consecuencias extraordinarias.'),
 ('steve','Puedo construir un refugio con casi cualquier material que encuentre.'),
 ('geralt','Me pagan por resolver problemas que otros prefieren evitar.'),
 ('harry','Un lugar de aprendizaje cambió completamente mi destino.'),
 ('vader','Mi pasado es tan importante como mi aspecto.'),
 ('yoda','La apariencia y la experiencia no siempre van de la mano.'),
 ('batman','La preparación me importa tanto como la fuerza.'),
 ('joker','Mi relación con otra persona define gran parte de mi historia.'),
 ('superman','Mi verdadero origen no coincide con el lugar donde crecí.'),
 ('spiderman','Mi vida cotidiana y mis responsabilidades chocan constantemente.'),
 ('ironman','La tecnología es una extensión de mi personalidad.'),
 ('goku','Cada desafío me empuja a superar mis límites.'),
 ('naruto','No siempre me tomaron en serio al principio.'),
 ('shrek','Las apariencias suelen llevar a conclusiones equivocadas.'),
 ('bobesponja','Me tomo muy en serio cosas que otros consideran pequeñas.'),
 ('zeus','En las historias de mi familia, los conflictos entre parientes son constantes.'),
 ('poseidon','Mi poder está asociado con algo capaz de ser tranquilo o devastador.'),
 ('hades','No vivo con la mayoría de mis parientes y recibo visitantes muy especiales.'),
 ('atenea','La inteligencia y la estrategia son tan importantes para mí como la fuerza.'),
 ('afrodita','Mi influencia puede provocar tanto encuentros como disputas.'),
 ('hermes','Paso buena parte del tiempo llevando mensajes entre mundos diferentes.'),
 ('hercules','Debí superar una serie de pruebas que casi nadie habría aceptado.'),
 ('medusa','Una mirada puede ser mucho más peligrosa que una espada.'),
 ('minotauro','Vivía en un lugar construido para que fuera difícil salir.'),
 ('odin','Sacrifiqué algo de mí mismo para obtener más conocimiento.'),
 ('thor','Un objeto que llevo suele regresar a mis manos.'),
 ('anubis','Mi tarea está relacionada con el viaje después de la muerte.'),
 ('ibai','Empecé hablando para una audiencia y terminé organizando eventos multitudinarios.'),
 ('rubius','He pasado de grabar partidas en casa a tener seguidores de muchos países.'),
 ('auron','De comentar situaciones con humor pasé a hablar en directo durante horas.'),
 ('grefg','Una presentación relacionada con un videojuego reunió una audiencia enorme.'),
 ('illojuan','Mis comentarios espontáneos mientras juego son parte del espectáculo.'),
 ('vegetta','Mis aventuras virtuales suelen convertirse en series de muchos episodios.'),
 ('willyrex','He compartido muchas horas de partidas con otros creadores muy conocidos.'),
 ('jordi','He cambiado las bromas en vídeo por conversaciones largas con invitados.'),
 ('mrbeast','Mis vídeos suelen girar alrededor de retos cada vez más grandes.'),
 ('pewdiepie','Crecí comentando videojuegos hasta convertirme en un referente de internet.'),
 ('khaby','Consigo hacer entender una broma sin hablar apenas una palabra.'),
 ('charli','Unos vídeos de baile muy breves cambiaron mi vida de forma radical.'),
 ('e26-cj','Volví a mi barrio y terminé envuelto en conflictos que creía haber dejado atrás.'),
 ('e26-ellie','He tenido que crecer aprendiendo a sobrevivir sin muchas certezas.'),
 ('e26-joel','Una relación inesperada cambió lo que estaba dispuesto a hacer.'),
 ('e26-nathan','Los mapas y las reliquias suelen meterme en problemas.'),
 ('e26-crash','Mis vueltas y saltos son tan importantes como llegar al final.'),
 ('e26-spyro','Aunque soy pequeño, puedo enfrentarme a enemigos enormes.'),
 ('e26-donkey','Mi fuerza y mi afición por cierta fruta me acompañan en mis aventuras.'),
 ('e26-yoshi','A menudo ayudo a otra persona a llegar donde no podría por sí sola.'),
 ('e26-toad','Trabajo cerca de una familia real y aparezco cuando hay problemas.'),
 ('e26-waluigi','Suelo aparecer como rival sin ser el protagonista de la historia.'),
 ('e26-chief','Casi nunca se ve mi rostro mientras cumplo mis misiones.'),
 ('e26-chunli','La disciplina y la velocidad son esenciales para mi forma de combatir.'),
 ('e26-hermione','Los libros me han ayudado más de una vez a salir de apuros.'),
 ('e26-voldemort','Temo algo que les ocurre a todos tarde o temprano.'),
 ('e26-dobby','La libertad significa mucho más para mí de lo que parece.'),
 ('e26-grogu','Mi aspecto no cuenta toda la historia de mis capacidades.'),
 ('e26-r2d2','No necesito palabras normales para hacerme entender.'),
 ('e26-capitanamerica','Mis valores pertenecen a una época distinta de la que vivo.'),
 ('e26-blackwidow','Mi pasado es más complicado que mi apariencia.'),
 ('e26-deadpool','No siempre respeto las reglas de mi propia historia.'),
 ('e26-wolverine','Mi pasado y mis heridas son parte de quien soy.'),
 ('e26-thanos','Creo que tengo una razón para hacer algo terrible.'),
 ('e26-lokimarvel','No siempre queda claro de qué lado estoy.'),
 ('e26-thormarvel','Las expectativas familiares pesan tanto como mis poderes.'),
 ('e26-vegeta','Mi orgullo me ha hecho cambiar de rumbo muchas veces.'),
 ('e26-luffy','La libertad me importa más que cualquier recompensa.'),
 ('e26-miercoles','No veo lo extraño de la misma forma que los demás.'),
 ('e26-eleven','Crecí en circunstancias muy distintas a las normales.'),
 ('e26-walterwhite','Un cambio personal acabó arrastrándome a otra vida.'),
 ('e26-ricksanchez','Mi inteligencia no me libra de mis propios problemas.'),
 ('e26-frodo','Una responsabilidad enorme terminó en manos muy pequeñas.'),
 ('e26-gollum','Algo que deseo demasiado me ha cambiado por completo.'),
 ('e26-scoobydoo','El valor no siempre es lo que más me caracteriza.'),
 ('e26-xokas','Mi manera intensa de opinar se ha hecho conocida tanto como mis partidas.'),
 ('e26-djmario','He conseguido reunir a aficionados al fútbol delante de una pantalla.'),
 ('e26-fernanfloo','Mi manera exagerada de reaccionar convirtió partidas en vídeos muy populares.'),
 ('e26-luisito','He recorrido lugares muy distintos para enseñarlos con curiosidad.'),
 ('e26-dulceida','Convertí compartir mi estilo personal en una profesión visible.'),
 ('e26-mariapombo','Mi día a día y mis proyectos se han convertido en contenido habitual.'),
 ('e26-dualipa','La música de baile y una estética retro han marcado muchos de mis éxitos.'),
 ('e26-billie','Alcancé la fama muy joven con canciones de atmósfera poco convencional.'),
 ('e26-ariana','Mi carrera comenzó también frente a cámaras antes de dominar los escenarios.'),
 ('e26-weeknd','Mis canciones suelen mezclar ritmos bailables con historias bastante oscuras.'),
 ('e26-rihanna','Mi carrera musical terminó compartiendo espacio con proyectos de belleza y moda.'),
 ('e26-eminem','He contado partes duras de mi vida mediante rimas rápidas y directas.'),
 ('e26-edsheeran','Una guitarra suele bastarme para empezar un espectáculo ante miles de personas.'),
 ('e26-mileycyrus','El público me conoció siendo adolescente y me ha visto cambiar de etapa.'),
 ('e26-karolg','He convertido experiencias sentimentales en himnos que se cantan en grupo.'),
 ('e26-rauw','Mis actuaciones mezclan coreografías elaboradas con música urbana.'),
 ('e26-quevedo','Mi salto a la fama llegó gracias a una colaboración que sonó por todas partes.'),
 ('e26-aitana','Mi carrera arrancó ante las cámaras antes de publicar mis propios discos.'),
 ('e26-lolaindigo','Primero destaqué bailando y después empecé a llenar escenarios cantando.'),
 ('e26-davidbisbal','Una competición musical televisada abrió las puertas de mi carrera.'),
 ('e26-sergioramos','He celebrado tantos goles importantes como enfrentamientos en defensa.'),
 ('e26-ikercasillas','Pasé gran parte de mi carrera evitando que otros marcaran.'),
 ('e26-paugasol','Mi altura me abrió puertas en una liga al otro lado del océano.'),
 ('e26-alcaraz','Desde muy joven empecé a desafiar a jugadores de varias generaciones.'),
 ('e26-lamine','Antes de ser adulto ya disputaba partidos que seguía todo un país.'),
 ('e26-mbappe','Mi velocidad ha sido decisiva en partidos seguidos en todo el mundo.'),
 ('e26-haaland','Mi corpulencia y mi facilidad para marcar me hacen difícil de detener.'),
 ('e26-alexiaputellas','Mi liderazgo en el campo también ayudó a dar visibilidad a otras deportistas.'),
 ('e26-simonebiles','He ejecutado movimientos que muy pocas personas pueden repetir.'),
 ('e26-pique','Después de muchos partidos empecé a organizar competiciones de otra manera.'),
 ('e26-pedropascal','He interpretado protectores de personas jóvenes en mundos muy diferentes.'),
 ('e26-jennaortega','Un personaje de expresión seria me dio nueva fama entre los jóvenes.'),
 ('e26-emmawatson','Crecí ante las cámaras interpretando a una estudiante muy aplicada.'),
 ('e26-tomholland','Antes de saltar por los edificios, aprendí a moverme sobre un escenario.'),
 ('e26-margot','He pasado de papeles oscuros a dar vida a un icono de juguetes.'),
 ('e26-keanu','He protagonizado historias donde la realidad y las reglas se ponen en duda.'),
 ('e26-rdj','Un personaje rodeado de tecnología cambió mi trayectoria profesional.'),
 ('e26-ryanreynolds','He convertido el humor irreverente en una parte importante de mis personajes.'),
 ('e26-milliebrown','Una serie sobre sucesos extraños me dio fama siendo muy joven.'),
 ('e26-therock','Antes de actuar en películas, mi trabajo consistía en combatir ante el público.'),
 ('e26-ares','Los conflictos humanos están muy unidos a mi naturaleza.'),
 ('e26-apolo','Las artes y el conocimiento forman parte de los poderes que se me atribuyen.'),
 ('e26-gengis','Uní grupos enfrentados antes de extender mi dominio por enormes territorios.'),
 ('e26-mariaantonieta','Mi imagen de lujo contrastó con el malestar que crecía fuera de palacio.'),
 ('e26-stevejobs','Me interesaba tanto cómo funcionaba un producto como cómo se presentaba.'),
 ('e26-stephenking','He encontrado motivos inquietantes en lugares y situaciones cotidianas.'),
 ('e26-stanlee','Contribuí a crear héroes con problemas tan humanos como sus lectores.'),
 ('e26-pedrosanchez','Mi trayectoria incluye una vuelta inesperada al liderazgo de mi partido.'),
 ('e26-merkel','Durante años negocié acuerdos entre países con intereses muy distintos.'),
 ('esp-antonio-recio','Me tomo mis negocios y mis ideas demasiado en serio.'),
 ('esp-amador-rivas','Mis planes rara vez acaban como imagino.'),
 ('esp-luisma','La gente que me rodea suele meterse en líos conmigo.'),
 ('esp-mauricio-colmenero','Mi forma de tratar a los demás dice mucho de mí.'),
 ('esp-emilio-delgado','Mi trabajo me permite saber demasiado de mis vecinos.'),
 ('esp-juan-cuesta','El orden en mi entorno me importa casi demasiado.'),
 ('esp-homer-simpson','Mi vida familiar es tan caótica como mis decisiones.'),
 ('esp-bart-simpson','El colegio no suele ser el centro de mis prioridades.'),
 ('esp-shin-chan','Los adultos de mi alrededor rara vez están tranquilos.'),
 ('esp-doraemon','Siempre parece haber una solución inesperada en mi bolsillo.'),
 ('esp-el-profesor','Prefiero que otros ejecuten los planes que preparo.'),
 ('esp-torrente','Mi idea de ser profesional es muy discutible.'),
 ('esp-melendi','Mi trayectoria pasó de historias desenfadadas a canciones más personales.'),
 ('esp-dani-martin','Antes de cantar en solitario fui la voz de una banda muy popular.'),
 ('esp-leiva','Me acostumbré a compartir escenario antes de firmar mis trabajos en solitario.'),
 ('esp-c-tangana','He llevado referencias musicales tradicionales a producciones muy actuales.'),
 ('esp-bad-gyal','He unido ritmos caribeños con una imagen muy reconocible.'),
 ('esp-pablo-alboran','Una voz y un piano me ayudaron a conectar con mucha gente.'),
 ('esp-fito-cabrales','Mi forma de cantar y mi guitarra son reconocibles tras años en distintas bandas.'),
 ('esp-david-bustamante','El público me vio empezar a cantar en un concurso televisivo.'),
 ('esp-wismichu','El humor provocador marcó muchos de mis primeros vídeos.'),
 ('esp-nil-ojeda','Suelo convertir ideas poco corrientes en retos para grabar.'),
 ('esp-yosoyplex','Mis viajes y mis aventuras terminan siendo parte central de mis vídeos.'),
 ('esp-david-broncano','Mis entrevistas se apartan a menudo de las preguntas habituales.'),
 ('esp-belen-esteban','Mi vida cotidiana llegó a ocupar muchas horas de televisión.'),
 ('esp-paco-leon','Pasé de hacer reír en pantalla a dirigir mis propias historias.'),
 ('esp-arturo-valls','He presentado concursos donde los participantes pueden acabar haciendo el ridículo.'),
 ('esp-joaquin-sanchez','Mis bromas llegaron a ser casi tan conocidas como mis jugadas.'),
 ('esp-fernando-torres','Fui conocido por marcar desde muy joven y jugar también lejos de casa.'),
 ('esp-aitana-bonmati','Mi visión del juego ha sido clave en grandes victorias colectivas.'),
 ('esp-kirby','Puedo hacer cosas extraordinarias después de absorber lo que encuentro.'),
 ('esp-pac-man','Mi recorrido suele depender de esquivar a quienes me persiguen.'),
 ('anime-charizard','Mi aspecto impone respeto, aunque empecé siendo muy pequeño.'),
 ('anime-charmander','Hay algo en la punta de mi cuerpo que nunca debería apagarse.'),
 ('anime-bulbasaur','Llevo una pequeña planta conmigo desde que nací.'),
 ('anime-squirtle','Prefiero defenderme con algo que otros necesitan para vivir.'),
 ('anime-eevee','Ante mí existen muchos caminos posibles para cambiar.'),
 ('anime-snorlax','Si decido detenerme, los demás pueden tener problemas para pasar.'),
 ('anime-mewtwo','Mi existencia es el resultado de un experimento, no de un nacimiento normal.'),
 ('anime-meowth','Consigo comunicar cosas que otros de mi especie no pueden.'),
 ('anime-ash-ketchum','Mi mayor objetivo exige viajar y conocer nuevos compañeros.'),
 ('anime-gohan','Mi familia espera de mí cosas muy distintas.'),
 ('anime-piccolo','Mi relación con antiguos rivales ha cambiado mucho.'),
 ('anime-freezer','No suelo aceptar que alguien me supere.'),
 ('anime-krilin','La valentía no siempre depende del tamaño.'),
 ('anime-trunks','Mi futuro y mi pasado están más unidos de lo normal.'),
 ('anime-bulma','Mis inventos facilitan aventuras que otros protagonizan.'),
 ('anime-majin-buu','Mi carácter puede cambiar mucho de un momento a otro.'),
 ('anime-sasuke','Mis decisiones están marcadas por mi familia.'),
 ('anime-kakashi','Enseñar a otros forma parte de mi camino.'),
 ('anime-chopper','Quiero ayudar a otros aunque mi aspecto sea peculiar.'),
 ('anime-oliver-atom','Mi sueño empezó antes de alcanzar la fama.'),
 ('anime-benji-price','Mi papel consiste en impedir que otros lo consigan.'),
 ('anime-agumon','Mi aspecto puede cambiar muchísimo cuando hace falta.'),
 ('anime-nobita','No siempre me salen bien las cosas sin ayuda.'),
 ('anime-sailor-moon','Mi vida cotidiana oculta una responsabilidad extraordinaria.'),
 ('anime-detective-conan','Mi aspecto actual despista a casi todo el mundo.'),
 ('anime-yugi-muto','La estrategia puede ser tan importante como la suerte.'),
 ('popular-ana-frank','Escribí sobre mi vida cotidiana en un espacio del que no podía salir.'),
 ('popular-bill-gates','Ayudé a llevar herramientas informáticas a hogares de todo el mundo.'),
 ('popular-elon-musk','Mis proyectos combinan transporte, tecnología y grandes ambiciones.'),
 ('popular-mark-zuckerberg','Un proyecto entre estudiantes acabó cambiando la vida social en internet.'),
 ('popular-tolkien','Inventé lenguas y lugares enteros antes de que muchos conocieran mis historias.'),
 ('popular-banksy','Mis obras aparecen en lugares públicos sin que se sepa bien quién soy.'),
 ('popular-andy-warhol','Convertí imágenes y objetos de consumo en obras que se exponen.'),
 ('popular-peach','Mis problemas hacen que otras personas emprendan largas aventuras.'),
 ('popular-wario','Prefiero buscar una recompensa antes que salvar a alguien.'),
 ('popular-scorpion-mk','Una antigua tragedia familiar marca cada una de mis peleas.'),
 ('popular-sub-zero','Mi estilo de combate está relacionado con las bajas temperaturas.'),
 ('popular-ryu-streetfighter','Mi vida gira alrededor de viajar, entrenar y ponerme a prueba.'),
 ('popular-rayman','Mi anatomía no parece obedecer las normas habituales.'),
 ('popular-creeper','Puedo sorprender a alguien aunque no lleve ningún arma visible.'),
 ('popular-enderman','Que alguien me mire directamente puede convertirse en un problema.'),
 ('popular-jigglypuff','Cuando me pongo a cantar, los demás no siempre siguen despiertos.'),
 ('popular-psyduck','Mis dolores de cabeza pueden acabar sorprendiendo a los demás.'),
 ('popular-gengar','Me divierte aparecer cuando otros preferirían no verme.'),
 ('popular-blastoise','Mi forma de defenderme tiene más que ver con mi espalda que con mis manos.'),
 ('popular-togepi','Todavía estoy descubriendo de lo que soy capaz.'),
 ('popular-lisa-simpson','No siempre encajo con las costumbres de mi familia.'),
 ('popular-marge-simpson','Sostengo el equilibrio de una familia bastante peculiar.'),
 ('popular-ned-flanders','Mis costumbres contrastan con las de alguien cercano.'),
 ('popular-patricio-estrella','No es mi inteligencia lo que más destaca.'),
 ('popular-calamardo','El entusiasmo ajeno suele acabar con mi paciencia.'),
 ('popular-elsa-frozen','Aprender a aceptarme cambió mi relación con los demás.'),
 ('popular-buzz-lightyear','No siempre entendí cuál era mi verdadera naturaleza.'),
 ('popular-woody-toystory','Mi mayor preocupación suele ser el lugar que ocupo en un grupo.'),
 ('popular-stitch','Aprendí a pertenecer donde nadie lo esperaba.'),
 ('popular-mickey-mouse','Mi imagen ha llegado a generaciones muy diferentes.'),
 ('popular-pato-donald','Mi temperamento me mete en más de un lío.'),
 ('popular-simba','Tuve que aprender a asumir algo que me correspondía.'),
 ('popular-olaf-frozen','Hay experiencias que me entusiasman aunque no me convengan.'),
 ('popular-peter-griffin','Mis ideas suelen traer problemas a toda mi familia.'),
 ('popular-stewie-griffin','Mis ambiciones son grandes para mi tamaño.'),
 ('popular-jack-sparrow','Siempre encuentro otra salida cuando todo parece perdido.'),
 ('popular-sheldon-cooper','Las normas sociales no son mi mayor especialidad.'),
 ('popular-rayo-mcqueen','Al principio creía que ganar era lo único importante.'),
 ('popular-bugs-bunny','Salir airoso de una situación es casi mi especialidad.'),
 ('popular-mario-casas','Una historia adolescente de romance y motos me hizo especialmente conocido.'),
 ('popular-ursula-corbero','Un gran atraco ficticio llevó mi personaje a pantallas de muchos países.'),
 ('popular-enrique-iglesias','Mis canciones han cruzado del español al inglés sin cambiar de público.'),
 ('popular-ronaldinho','Mi sonrisa y mis filigranas hicieron disfrutar incluso a los rivales.'),
 ('popular-xavi-hernandez','Me hice famoso por controlar el ritmo del partido más que por correr.'),
 ('popular-jorge-javier','He moderado debates en los que la convivencia suele saltar por los aires.'),
 ('popular-pablo-motos','Durante años he recibido invitados junto a unos compañeros poco habituales.'),
 ('popular-karlos-arguinano','He enseñado recetas sin dejar de contar chistes ante las cámaras.'),
 ('popular-alberto-chicote','He entrado en cocinas ajenas para poner a prueba cómo funcionan.'),
 ('popular-jose-mota','He creado personajes cómicos reconocibles por sus frases y gestos.'),
 ('popular-cristina-pedroche','Una noche concreta del calendario me ha hecho especialmente reconocible.'),
 ('popular-florentino-fernandez','Mis imitaciones y mis bromas marcaron una etapa de la televisión.'),
 ('popular-chiquito-calzada','Inventé una forma de hablar que muchos empezaron a imitar.')
ON CONFLICT(character_id) DO UPDATE SET hint=EXCLUDED.hint;

CREATE OR REPLACE FUNCTION public.ts_state(p_code text, p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE me players; r rooms; g turn_sessions; active_id uuid;
BEGIN
 me:=_auth(p_code,p_token);
 SELECT * INTO r FROM rooms WHERE id=me.room_id;
 SELECT * INTO g FROM turn_sessions WHERE room_id=r.id;
 active_id:=CASE WHEN g.status='playing' THEN g.turn_order[g.turn_index] ELSE NULL END;
 -- One heartbeat write every 30 seconds per player, not every UI refresh.
 UPDATE players SET last_seen=clock_timestamp()
 WHERE id=me.id AND last_seen<clock_timestamp()-interval '30 seconds';

 RETURN jsonb_build_object(
 'sync_topic','room:'||r.id::text,'room',jsonb_build_object(
   'code',r.code,'status',coalesce(g.status,'lobby'),
   'round',coalesce(g.round,0),'difficulty',r.difficulty,'categories',r.categories,
   'host_player_id',r.host_player_id,'version',r.version),
 'me',jsonb_build_object('id',me.id,'name',me.name,'is_active',me.id=active_id),
 'players',coalesce((
  SELECT jsonb_agg(jsonb_build_object(
   'id',pl.id,'name',pl.name,'is_host',pl.id=r.host_player_id,
   'online',pl.last_seen>clock_timestamp()-interval '65 seconds',
   'is_active',pl.id=active_id,
   'finished',EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(g.history,'[]'::jsonb)) e
       WHERE e->>'player_id'=pl.id::text)
  ) ORDER BY pl.joined_at,pl.id)
  FROM players pl WHERE pl.room_id=r.id
 ),'[]'::jsonb),
 'turn',jsonb_build_object(
  'active_player_id',active_id,
  'character_id',CASE WHEN me.id=active_id THEN NULL ELSE g.active_character END,
  'questions',coalesce(g.question_count,0),'max_questions',15,
  'hint_used',coalesce(g.hint_used,false),
  'hint',CASE WHEN me.id=active_id AND g.hint_used THEN
   (SELECT hint FROM public.ts_character_hints WHERE character_id=g.active_character)
   ELSE NULL END,
  'turn_number',coalesce(g.turn_index,0),
  'total_turns',coalesce(array_length(g.turn_order,1),0)
 ),
 'history',coalesce(g.history,'[]'::jsonb)
 );
END $function$
;

CREATE OR REPLACE FUNCTION public.ts_start(p_code text, p_token text, p_candidates text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE me public.players; r public.rooms; o uuid[]; total integer; chosen text;
BEGIN
 me:=_auth(p_code,p_token);
 SELECT * INTO r FROM rooms WHERE id=me.room_id FOR UPDATE;
 IF me.id<>r.host_player_id THEN RAISE EXCEPTION 'Solo el anfitrión puede comenzar'; END IF;
 IF EXISTS(SELECT 1 FROM turn_sessions WHERE room_id=r.id AND status='playing') THEN RAISE EXCEPTION 'Ronda en curso'; END IF;
 SELECT array_agg(id ORDER BY joined_at,id),count(*) INTO o,total FROM players WHERE room_id=r.id;
 IF total<2 THEN RAISE EXCEPTION 'Se necesitan al menos 2 personas'; END IF;
 IF coalesce(array_length(p_candidates,1),0)<total OR
 (SELECT count(DISTINCT c) FROM unnest(p_candidates) AS c)<total
 THEN RAISE EXCEPTION 'Selecciona más personajes'; END IF;
 INSERT INTO turn_sessions(room_id,status,round,turn_order,turn_index,question_count,hint_used,active_character,candidates,history)
 VALUES(r.id,'playing',1,o,1,0,false,NULL,p_candidates,'[]'::jsonb)
 ON CONFLICT(room_id) DO UPDATE SET
 status='playing',round=turn_sessions.round+1,turn_order=excluded.turn_order,turn_index=1,
 question_count=0,hint_used=false,active_character=NULL,candidates=excluded.candidates,history='[]'::jsonb;
 chosen:=_ts_pick(r.id);
 UPDATE turn_sessions SET active_character=chosen WHERE room_id=r.id;
 PERFORM _bump(r.id);
END $function$
;

CREATE OR REPLACE FUNCTION public._ts_advance(p_room uuid, p_success boolean, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE g public.turn_sessions; current_player uuid; j int; next_player uuid; selected text;
BEGIN
 SELECT * INTO g FROM turn_sessions WHERE room_id=p_room FOR UPDATE;
 IF g.status <> 'playing' THEN RAISE EXCEPTION 'No hay turno en curso'; END IF;
 current_player:=g.turn_order[g.turn_index];
 UPDATE turn_sessions
 SET history = history || jsonb_build_array(jsonb_build_object(
   'player_id',current_player,'character_id',g.active_character,'questions',g.question_count,
   'hint_used',g.hint_used,'success',p_success,'reason',p_reason))
 WHERE room_id=p_room;
 j:=g.turn_index+1;
 WHILE j<=coalesce(array_length(g.turn_order,1),0) LOOP
   SELECT id INTO next_player FROM players WHERE room_id=p_room AND id=g.turn_order[j];
   EXIT WHEN next_player IS NOT NULL;
   j:=j+1;
 END LOOP;
 IF j>coalesce(array_length(g.turn_order,1),0) THEN
   UPDATE turn_sessions SET status='ended',turn_index=j,question_count=0,hint_used=false,active_character=NULL WHERE room_id=p_room;
 ELSE
   UPDATE turn_sessions SET turn_index=j,question_count=0,hint_used=false WHERE room_id=p_room;
   selected:=_ts_pick(p_room);
   UPDATE turn_sessions SET active_character=selected WHERE room_id=p_room;
 END IF;
 PERFORM _bump(p_room);
END $function$
;

CREATE OR REPLACE FUNCTION public.ts_action(p_code text, p_token text, p_action text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE me public.players; r public.rooms; g public.turn_sessions; active_id uuid;
BEGIN
 me:=_auth(p_code,p_token);
 SELECT * INTO r FROM rooms WHERE id=me.room_id FOR UPDATE;
 SELECT * INTO g FROM turn_sessions WHERE room_id=r.id FOR UPDATE;
 IF g.room_id IS NULL THEN RAISE EXCEPTION 'No hay ninguna ronda'; END IF;
 active_id:=g.turn_order[g.turn_index];
 IF p_action='lobby' THEN
   IF me.id<>r.host_player_id OR g.status<>'ended' THEN RAISE EXCEPTION 'Solo el anfitrión puede preparar otra ronda'; END IF;
   UPDATE turn_sessions SET status='lobby',active_character=NULL,turn_order='{}'::uuid[],question_count=0,hint_used=false,history='[]'::jsonb,turn_index=1 WHERE room_id=r.id;
 ELSIF p_action='end' THEN
   IF me.id<>r.host_player_id OR g.status<>'playing' THEN RAISE EXCEPTION 'Solo el anfitrión puede finalizar'; END IF;
   PERFORM _ts_advance(r.id,false,'interrumpido');
   UPDATE turn_sessions SET status='ended',active_character=NULL WHERE room_id=r.id;
 ELSIF p_action='skip' THEN
   IF me.id<>r.host_player_id OR g.status<>'playing' THEN RAISE EXCEPTION 'Solo el anfitrión puede saltar turnos'; END IF;
   PERFORM _ts_advance(r.id,false,'omitido');
 ELSIF p_action='hint' THEN
   IF g.status<>'playing' OR active_id<>me.id THEN RAISE EXCEPTION 'Solo puede pedir pista quien está adivinando'; END IF;
   IF g.hint_used THEN RAISE EXCEPTION 'Ya has usado la pista en este turno'; END IF;
   IF g.question_count>11 THEN RAISE EXCEPTION 'Necesitas al menos 4 intentos para pedir una pista'; END IF;
   IF NOT EXISTS(SELECT 1 FROM public.ts_character_hints WHERE character_id=g.active_character) THEN RAISE EXCEPTION 'No hay pista disponible para este personaje'; END IF;
   UPDATE turn_sessions SET question_count=question_count+3,hint_used=true WHERE room_id=r.id;
 ELSIF p_action='question' THEN
   IF g.status<>'playing' OR active_id<>me.id THEN RAISE EXCEPTION 'No es tu turno'; END IF;
   IF g.question_count>=15 THEN RAISE EXCEPTION 'Se han agotado los intentos'; END IF;
   UPDATE turn_sessions SET question_count=question_count+1 WHERE room_id=r.id;
   IF g.question_count+1>=15 THEN PERFORM _ts_advance(r.id,false,'limite'); END IF;
 ELSIF p_action='correct' THEN
   IF g.status<>'playing' OR active_id<>me.id THEN RAISE EXCEPTION 'No es tu turno'; END IF;
   PERFORM _ts_advance(r.id,true,'acertado');
 ELSE RAISE EXCEPTION 'Acción no reconocida'; END IF;
 PERFORM _bump(r.id);
END $function$
;

-- La pista y los contadores solo se consultan mediante ts_state; la tabla es privada.
