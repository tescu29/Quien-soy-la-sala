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
 ('napoleon','Mi ambición acabó siendo tan conocida como mis derrotas.'),
 ('cleopatra','Mi vida estuvo ligada a alianzas muy poderosas.'),
 ('cesar','Mis decisiones cambiaron el destino de una república.'),
 ('alejandro','Mi camino me llevó mucho más lejos que mi lugar de origen.'),
 ('isabel','Mi época estuvo marcada por grandes cambios en varios continentes.'),
 ('juana','Mi vida se convirtió en símbolo mucho después de terminar.'),
 ('tutankamon','Parte de mi fama llegó mucho después de mi muerte.'),
 ('vikinga','No es sencillo separar mi historia de la leyenda.'),
 ('leonidas','Una derrota puede convertirse en un símbolo de resistencia.'),
 ('gandhi','Mi manera de luchar no dependía de las armas.'),
 ('mandela','Mi paciencia fue puesta a prueba durante muchos años.'),
 ('lutherking','Mis palabras fueron una herramienta tan importante como mis actos.'),
 ('churchill','Mis discursos tuvieron un gran peso en momentos difíciles.'),
 ('lincoln','Tuve que dirigir un país dividido.'),
 ('obama','Una barrera histórica cayó cuando llegué a un cargo importante.'),
 ('trump','Mi carrera pública no comenzó en la política.'),
 ('felipevi','Mi papel está ligado a una institución muy antigua.'),
 ('isabelii','Fui testigo de cambios durante un tiempo excepcionalmente largo.'),
 ('diana','Mi vida privada terminó siendo de interés público.'),
 ('hitler','Mis decisiones arrastraron al mundo a consecuencias terribles.'),
 ('einstein','Puse en duda ideas que parecían inamovibles.'),
 ('newton','Busqué reglas que explicaran fenómenos muy distintos.'),
 ('curie','Mi trabajo cambió la manera de estudiar lo invisible.'),
 ('tesla','Algunas de mis ideas se adelantaron a su tiempo.'),
 ('darwin','Observar la naturaleza me llevó a cambiar viejas explicaciones.'),
 ('galileo','Mirar al cielo me trajo problemas en la Tierra.'),
 ('hawking','Estudié el universo mientras mi propio cuerpo planteaba enormes desafíos.'),
 ('ramoncajal','El detalle más pequeño puede explicar sistemas enormes.'),
 ('da-vinci','No me limité a una sola disciplina.'),
 ('picasso','Mi forma de representar el mundo no siempre fue convencional.'),
 ('vangogh','Parte de mi reconocimiento llegó demasiado tarde.'),
 ('dali','Mi imagen pública era casi otra obra de arte.'),
 ('frida','Mi experiencia personal dejó huella en lo que creaba.'),
 ('miguelangel','Trabajé con materiales y escalas muy diferentes.'),
 ('velazquez','Mi oficio me acercó a personas muy poderosas.'),
 ('goya','Mi obra muestra caras muy distintas de la sociedad.'),
 ('cervantes','Una de mis creaciones acabó siendo más famosa que yo.'),
 ('shakespeare','Mis historias siguen representándose de muchas maneras.'),
 ('lorca','Mi obra estuvo unida a una época convulsa.'),
 ('rowling','Un mundo inventado transformó mi vida.'),
 ('mjackson','No todo lo que hago sucede delante de un micrófono.'),
 ('madonna','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('elvis','No todo lo que hago sucede delante de un micrófono.'),
 ('freddie','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('lennon','También doy forma a lo que luego escuchan otras personas.'),
 ('mccartney','También doy forma a lo que luego escuchan otras personas.'),
 ('shakira','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('taylorswift','También doy forma a lo que luego escuchan otras personas.'),
 ('beyonce','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('rosalia','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('badbunny','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('alejandrosanz','También doy forma a lo que luego escuchan otras personas.'),
 ('serrat','También doy forma a lo que luego escuchan otras personas.'),
 ('adele','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('brunomars','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('messi','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('cristiano','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('nadal','A menudo solo hay una persona al otro lado de la competición.'),
 ('federer','A menudo solo hay una persona al otro lado de la competición.'),
 ('jordan','La disciplina ha sido tan importante como mi talento.'),
 ('lebron','La disciplina ha sido tan importante como mi talento.'),
 ('usain','La disciplina ha sido tan importante como mi talento.'),
 ('alonso','La velocidad no sirve de nada sin concentración.'),
 ('marquez','La velocidad no sirve de nada sin concentración.'),
 ('iniesta','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('pele','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('maradona','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('phelps','Mi disciplina exige controlar cada movimiento y cada respiración.'),
 ('hamilton','La velocidad no sirve de nada sin concentración.'),
 ('schumacher','La velocidad no sirve de nada sin concentración.'),
 ('chaplin','A menudo mi trabajo se nota más detrás de las cámaras.'),
 ('marilyn','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('disney','A menudo mi trabajo se nota más detrás de las cámaras.'),
 ('spielberg','A menudo mi trabajo se nota más detrás de las cámaras.'),
 ('dicapiro','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('tomcruise','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('willSmith','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('zendaya','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('jennifer','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('antonio','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('penelope','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('almodovar','A menudo mi trabajo se nota más detrás de las cámaras.'),
 ('mrbean','Provocar una reacción en los demás forma parte de mi trabajo.'),
 ('carrey','Provocar una reacción en los demás forma parte de mi trabajo.'),
 ('colón','Mis viajes tuvieron consecuencias que yo no podía imaginar.'),
 ('marcopolo','Lo que conté de mis viajes despertó mucha curiosidad.'),
 ('magallanes','Mi expedición llegó más lejos que yo.'),
 ('elcano','Terminamos un viaje que parecía imposible.'),
 ('armstrong','Mi trabajo me llevó a un lugar muy poco visitado.'),
 ('gagarin','Viví una experiencia que nadie había podido contar antes.'),
 ('campoamor','Defendí un cambio social que hoy parece imprescindible.'),
 ('malala','Defender algo básico me convirtió en una voz internacional.'),
 ('greta','Una protesta pequeña llegó a convertirse en un movimiento global.'),
 ('mario','Mi ocupación habitual no explica mis aventuras.'),
 ('luigi','A menudo vivo a la sombra de alguien muy cercano.'),
 ('bowser','Mis planes suelen depender demasiado de otra persona.'),
 ('link','No suelo ser quien da nombre a mis aventuras.'),
 ('zelda','Mi papel es importante aunque no siempre sea quien lucha.'),
 ('sonic','La paciencia no es precisamente lo que me caracteriza.'),
 ('pikachu','Mi amistad es casi tan reconocible como mis habilidades.'),
 ('lara','No me detienen los lugares a los que otros no entrarían.'),
 ('kratos','Mi pasado influye en cada decisión que tomo.'),
 ('steve','Mi mundo cambia según lo que decida construir.'),
 ('geralt','Mi oficio me obliga a tratar con criaturas poco comunes.'),
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
 ('zeus','Me atribuyen poderes sobre cosas que los humanos no controlan.'),
 ('poseidon','Me atribuyen poderes sobre cosas que los humanos no controlan.'),
 ('hades','Me atribuyen poderes sobre cosas que los humanos no controlan.'),
 ('atenea','Me atribuyen poderes sobre cosas que los humanos no controlan.'),
 ('afrodita','Me atribuyen poderes sobre cosas que los humanos no controlan.'),
 ('hermes','Me atribuyen poderes sobre cosas que los humanos no controlan.'),
 ('hercules','Mi historia pertenece a relatos que han sobrevivido durante siglos.'),
 ('medusa','Mi historia pertenece a relatos que han sobrevivido durante siglos.'),
 ('minotauro','Mi historia pertenece a relatos que han sobrevivido durante siglos.'),
 ('odin','Me atribuyen poderes sobre cosas que los humanos no controlan.'),
 ('thor','Me atribuyen poderes sobre cosas que los humanos no controlan.'),
 ('anubis','Me atribuyen poderes sobre cosas que los humanos no controlan.'),
 ('ibai','Muchas personas me acompañan mientras hago algo en directo.'),
 ('rubius','Construí una audiencia fuera de los medios tradicionales.'),
 ('auron','Muchas personas me acompañan mientras hago algo en directo.'),
 ('grefg','Muchas personas me acompañan mientras hago algo en directo.'),
 ('illojuan','Muchas personas me acompañan mientras hago algo en directo.'),
 ('vegetta','Construí una audiencia fuera de los medios tradicionales.'),
 ('willyrex','Construí una audiencia fuera de los medios tradicionales.'),
 ('jordi','A veces mis invitados son tan importantes como yo.'),
 ('mrbeast','Construí una audiencia fuera de los medios tradicionales.'),
 ('pewdiepie','Construí una audiencia fuera de los medios tradicionales.'),
 ('khaby','Construí una audiencia fuera de los medios tradicionales.'),
 ('charli','Construí una audiencia fuera de los medios tradicionales.'),
 ('e26-cj','Mi historia transcurre entre calles, bandas y decisiones.'),
 ('e26-ellie','He tenido que madurar en un mundo difícil.'),
 ('e26-joel','Proteger a alguien cambió por completo mis prioridades.'),
 ('e26-nathan','Los lugares olvidados suelen atraerme demasiado.'),
 ('e26-crash','Mi forma de moverme es tan conocida como mis aventuras.'),
 ('e26-spyro','Mi tamaño no dice mucho de lo que puedo hacer.'),
 ('e26-donkey','La fuerza es una de mis mejores cartas.'),
 ('e26-yoshi','Suelo acompañar a otro héroe en muchas aventuras.'),
 ('e26-toad','No siempre protagonizo la aventura, pero aparezco a menudo.'),
 ('e26-waluigi','Mi rivalidad me ha dado una personalidad propia.'),
 ('e26-chief','La protección que llevo es parte de mi identidad.'),
 ('e26-chunli','Mi técnica requiere mucha disciplina.'),
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
 ('e26-xokas','Muchas personas me acompañan mientras hago algo en directo.'),
 ('e26-djmario','Construí una audiencia fuera de los medios tradicionales.'),
 ('e26-fernanfloo','Construí una audiencia fuera de los medios tradicionales.'),
 ('e26-luisito','Conocer lugares ha formado parte de mi contenido.'),
 ('e26-dulceida','Mi imagen también forma parte de mi trabajo.'),
 ('e26-mariapombo','Construí una audiencia fuera de los medios tradicionales.'),
 ('e26-dualipa','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('e26-billie','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('e26-ariana','No todo lo que hago sucede delante de un micrófono.'),
 ('e26-weeknd','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('e26-rihanna','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('e26-eminem','Mis palabras suelen seguir un ritmo muy marcado.'),
 ('e26-edsheeran','También doy forma a lo que luego escuchan otras personas.'),
 ('e26-mileycyrus','No todo lo que hago sucede delante de un micrófono.'),
 ('e26-karolg','Mis palabras suelen seguir un ritmo muy marcado.'),
 ('e26-rauw','Mis palabras suelen seguir un ritmo muy marcado.'),
 ('e26-quevedo','Mis palabras suelen seguir un ritmo muy marcado.'),
 ('e26-aitana','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('e26-lolaindigo','No todo lo que hago sucede delante de un micrófono.'),
 ('e26-davidbisbal','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('e26-sergioramos','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('e26-ikercasillas','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('e26-paugasol','En mi disciplina cuentan mucho la altura y los reflejos.'),
 ('e26-alcaraz','A menudo solo hay una persona al otro lado de la competición.'),
 ('e26-lamine','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('e26-mbappe','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('e26-haaland','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('e26-alexiaputellas','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('e26-simonebiles','La disciplina ha sido tan importante como mi talento.'),
 ('e26-pique','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('e26-pedropascal','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('e26-jennaortega','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('e26-emmawatson','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('e26-tomholland','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('e26-margot','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('e26-keanu','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('e26-rdj','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('e26-ryanreynolds','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('e26-milliebrown','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('e26-therock','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('e26-ares','Me atribuyen poderes sobre cosas que los humanos no controlan.'),
 ('e26-apolo','Me atribuyen poderes sobre cosas que los humanos no controlan.'),
 ('e26-gengis','Mi influencia llegó más allá de las fronteras de mi origen.'),
 ('e26-mariaantonieta','Mi imagen pública acabó separándose de la realidad.'),
 ('e26-stevejobs','Mis productos transformaron hábitos cotidianos.'),
 ('e26-stephenking','He conseguido que muchos lectores miren de otro modo lo cotidiano.'),
 ('e26-stanlee','Ayudé a poblar de personajes extraordinarios las viñetas.'),
 ('e26-pedrosanchez','Mi carrera se ha desarrollado entre debates y elecciones.'),
 ('e26-merkel','Durante años tuve que negociar entre posiciones muy distintas.'),
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
 ('esp-melendi','También doy forma a lo que luego escuchan otras personas.'),
 ('esp-dani-martin','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('esp-leiva','También doy forma a lo que luego escuchan otras personas.'),
 ('esp-c-tangana','También doy forma a lo que luego escuchan otras personas.'),
 ('esp-bad-gyal','Mis palabras suelen seguir un ritmo muy marcado.'),
 ('esp-pablo-alboran','También doy forma a lo que luego escuchan otras personas.'),
 ('esp-fito-cabrales','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('esp-david-bustamante','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('esp-wismichu','Construí una audiencia fuera de los medios tradicionales.'),
 ('esp-nil-ojeda','Construí una audiencia fuera de los medios tradicionales.'),
 ('esp-yosoyplex','Construí una audiencia fuera de los medios tradicionales.'),
 ('esp-david-broncano','Mi público me conoce especialmente por verme en una pantalla.'),
 ('esp-belen-esteban','Mi público me conoce especialmente por verme en una pantalla.'),
 ('esp-paco-leon','A menudo mi trabajo se nota más detrás de las cámaras.'),
 ('esp-arturo-valls','Mi público me conoce especialmente por verme en una pantalla.'),
 ('esp-joaquin-sanchez','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('esp-fernando-torres','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('esp-aitana-bonmati','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('esp-kirby','Mi aspecto amable esconde habilidades inesperadas.'),
 ('esp-pac-man','Moverme por caminos repetidos forma parte de mi historia.'),
 ('anime-charizard','Mi apariencia intimida más de lo que mi origen sugería.'),
 ('anime-charmander','Algo pequeño en mi cuerpo es importante para mí.'),
 ('anime-bulbasaur','Llevo conmigo algo que crece con el tiempo.'),
 ('anime-squirtle','No siempre necesito mucha fuerza para defenderme.'),
 ('anime-eevee','Lo que puedo llegar a ser depende de muchas elecciones.'),
 ('anime-snorlax','Mi ritmo de vida no encaja con las prisas de otros.'),
 ('anime-mewtwo','No nací de una manera corriente.'),
 ('anime-meowth','Mi capacidad de comunicarme me distingue de mis semejantes.'),
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
 ('popular-ana-frank','Mis palabras siguen llegando a lectores de otras generaciones.'),
 ('popular-bill-gates','Algo que ayudé a crear está en muchísimos hogares.'),
 ('popular-elon-musk','Mis proyectos no se limitan a un solo sector.'),
 ('popular-mark-zuckerberg','Una idea digital terminó conectando a millones.'),
 ('popular-tolkien','Construir mundos era casi tan importante como contar la historia.'),
 ('popular-banksy','Mi identidad importa menos que lo que dejo a la vista.'),
 ('popular-andy-warhol','Convertí objetos cotidianos en algo digno de exposición.'),
 ('popular-peach','A menudo otros convierten mis problemas en sus aventuras.'),
 ('popular-wario','Me gusta encontrar la ventaja para mí.'),
 ('popular-scorpion-mk','Mi pasado está detrás de mis enfrentamientos.'),
 ('popular-sub-zero','Mis habilidades guardan relación con algo de la naturaleza.'),
 ('popular-ryu-streetfighter','Entrenar es casi tan importante como combatir.'),
 ('popular-rayman','Mi aspecto se sale de lo habitual incluso en mi mundo.'),
 ('popular-creeper','Suelo aparecer cuando menos me esperan.'),
 ('popular-enderman','No es buena idea mirarme de cierta manera.'),
 ('popular-jigglypuff','Lo que parece inofensivo puede traer sorpresas.'),
 ('popular-psyduck','A veces ni yo entiendo lo que me está pasando.'),
 ('popular-gengar','Me gusta jugar con los nervios de otros.'),
 ('popular-blastoise','La defensa forma una parte esencial de mi aspecto.'),
 ('popular-togepi','No necesito ser grande para llamar la atención.'),
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
 ('popular-mario-casas','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('popular-ursula-corbero','He sido alguien distinto muchas veces sin dejar de ser yo.'),
 ('popular-enrique-iglesias','Mi trabajo ha acompañado momentos muy distintos de mucha gente.'),
 ('popular-ronaldinho','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('popular-xavi-hernandez','Mi trabajo depende de un equipo aunque la fama sea individual.'),
 ('popular-jorge-javier','Mi público me conoce especialmente por verme en una pantalla.'),
 ('popular-pablo-motos','Mi público me conoce especialmente por verme en una pantalla.'),
 ('popular-karlos-arguinano','Mi público me conoce especialmente por verme en una pantalla.'),
 ('popular-alberto-chicote','Mi público me conoce especialmente por verme en una pantalla.'),
 ('popular-jose-mota','Provocar una reacción en los demás forma parte de mi trabajo.'),
 ('popular-cristina-pedroche','Mi público me conoce especialmente por verme en una pantalla.'),
 ('popular-florentino-fernandez','Mi público me conoce especialmente por verme en una pantalla.'),
 ('popular-chiquito-calzada','Provocar una reacción en los demás forma parte de mi trabajo.')
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
