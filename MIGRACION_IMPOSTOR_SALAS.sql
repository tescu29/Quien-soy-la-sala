-- Impostor por sala, PostgreSQL / Supabase
-- Ejecutar en SQL Editor del Supabase compartido con ¿Una partidita?.
-- No modifica el backend de ¿Quién soy? ni de Cromazo.
-- NO publicar el service_role ni las tablas privadas en la interfaz.

CREATE TABLE IF NOT EXISTS public.im_rooms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 code text UNIQUE NOT NULL CHECK (code ~ '^[A-F0-9]{6}$'),
 host_id uuid,
 status text NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','reveal','debate','vote','result')),
 round integer NOT NULL DEFAULT 0,
 version integer NOT NULL DEFAULT 1,
 categories text[] NOT NULL DEFAULT ARRAY['lugares','comida','ocio','objetos','pop']::text[],
 word text,
 impostor_id uuid,
 opening_id uuid,
 recent_words text[] NOT NULL DEFAULT '{}'::text[],
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.im_players (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 room_id uuid NOT NULL REFERENCES public.im_rooms(id) ON DELETE CASCADE,
 name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 20),
 token_hash text NOT NULL,
 ready boolean NOT NULL DEFAULT false,
 vote_target uuid,
 joined_at timestamptz NOT NULL DEFAULT now(),
 last_seen timestamptz NOT NULL DEFAULT now(),
 UNIQUE(room_id,token_hash)
);
CREATE INDEX IF NOT EXISTS im_players_room_index ON public.im_players(room_id);
CREATE TABLE IF NOT EXISTS public.im_words (
 category text NOT NULL,
 word text NOT NULL,
 PRIMARY KEY (category, word)
);
INSERT INTO public.im_words(category,word) VALUES
('lugares','Parque de atracciones'),
('lugares','Aeropuerto'),
('lugares','Cine'),
('lugares','Discoteca'),
('lugares','Piscina'),
('lugares','Supermercado'),
('lugares','Gimnasio'),
('lugares','Hospital'),
('lugares','Camping'),
('lugares','Playa'),
('lugares','Estadio de fútbol'),
('lugares','Biblioteca'),
('lugares','Gasolinera'),
('lugares','Restaurante'),
('lugares','Hotel'),
('lugares','Museo'),
('lugares','Peluquería'),
('lugares','Boda'),
('lugares','Universidad'),
('lugares','Parque acuático'),
('lugares','Zoo'),
('lugares','Estación de tren'),
('lugares','Centro comercial'),
('lugares','Feria'),
('lugares','Bolera'),
('lugares','Karaoke'),
('lugares','Mercadillo'),
('lugares','Pista de patinaje'),
('lugares','Escape room'),
('lugares','Concierto'),
('lugares','Ascensor'),
('lugares','Oficina'),
('lugares','Terraza de bar'),
('lugares','Tienda de ropa'),
('lugares','Sala de espera'),
('comida','Pizza'),
('comida','Paella'),
('comida','Sushi'),
('comida','Hamburguesa'),
('comida','Tortilla de patatas'),
('comida','Croquetas'),
('comida','Ramen'),
('comida','Tacos'),
('comida','Kebab'),
('comida','Helado'),
('comida','Churros'),
('comida','Patatas bravas'),
('comida','Nachos'),
('comida','Cereales'),
('comida','Gofres'),
('comida','Palomitas'),
('comida','Donuts'),
('comida','Chocolate'),
('comida','Galletas'),
('comida','Macarrones'),
('comida','Ensaladilla rusa'),
('comida','Gazpacho'),
('comida','Bocadillo'),
('comida','Pancakes'),
('comida','Fideuá'),
('comida','Nuggets'),
('comida','Tarta de queso'),
('comida','Arroz a la cubana'),
('comida','Sandía'),
('comida','Café con leche'),
('comida','Lasaña'),
('comida','Guacamole'),
('comida','Aceitunas'),
('comida','Burrito'),
('comida','Empanada'),
('ocio','Videojuegos'),
('ocio','Bicicleta'),
('ocio','Karaoke'),
('ocio','Juegos de mesa'),
('ocio','Senderismo'),
('ocio','Viaje por carretera'),
('ocio','Ir de compras'),
('ocio','Fotografía'),
('ocio','Pescar'),
('ocio','Bailar'),
('ocio','Ir de fiesta'),
('ocio','Patinar'),
('ocio','Ver una serie'),
('ocio','Jugar al pádel'),
('ocio','Dibujar'),
('ocio','Ir al gimnasio'),
('ocio','Hacer una barbacoa'),
('ocio','Montar en moto'),
('ocio','Jugar al fútbol'),
('ocio','Hacer un puzle'),
('ocio','Leer manga'),
('ocio','Dormir la siesta'),
('ocio','Acampar'),
('ocio','Cocinar'),
('ocio','Ir al cine'),
('ocio','Tocar la guitarra'),
('ocio','Hacer un TikTok'),
('ocio','Hacer una escapada'),
('ocio','Bañarse en el mar'),
('ocio','Ir a un festival'),
('ocio','Jugar a los bolos'),
('ocio','Ver anime'),
('ocio','Escape room'),
('ocio','Montar un LEGO'),
('ocio','Hacer snorkel'),
('objetos','Teléfono móvil'),
('objetos','Cargador'),
('objetos','Llaves'),
('objetos','Paraguas'),
('objetos','Mochila'),
('objetos','Auriculares'),
('objetos','Gafas de sol'),
('objetos','Mando de televisión'),
('objetos','Air fryer'),
('objetos','Consola'),
('objetos','Patinete'),
('objetos','Silla gamer'),
('objetos','Cepillo de dientes'),
('objetos','Batería externa'),
('objetos','Impresora 3D'),
('objetos','Bolígrafo'),
('objetos','Ventilador'),
('objetos','Pelota'),
('objetos','Espejo'),
('objetos','Reloj'),
('objetos','Ordenador portátil'),
('objetos','Almohada'),
('objetos','Botella de agua'),
('objetos','Monopatín'),
('objetos','Tostadora'),
('objetos','Cámara de fotos'),
('objetos','Sudadera'),
('objetos','Anillo'),
('objetos','Linterna'),
('objetos','Microondas'),
('objetos','Bañador'),
('objetos','Nevera'),
('objetos','Teclado'),
('objetos','Altavoz'),
('objetos','Libro'),
('pop','Pikachu'),
('pop','Mario Bros'),
('pop','Shrek'),
('pop','Bob Esponja'),
('pop','Spider-Man'),
('pop','Batman'),
('pop','Homer Simpson'),
('pop','Darth Vader'),
('pop','Harry Potter'),
('pop','Goku'),
('pop','Luffy'),
('pop','Naruto'),
('pop','Stitch'),
('pop','Sonic'),
('pop','Elsa de Frozen'),
('pop','Barbie'),
('pop','Iron Man'),
('pop','Wednesday Addams'),
('pop','Ronaldo'),
('pop','Messi'),
('pop','Bad Bunny'),
('pop','Rosalía'),
('pop','Taylor Swift'),
('pop','Doraemon'),
('pop','Mickey Mouse'),
('pop','Saitama'),
('pop','Deadpool'),
('pop','Wolverine'),
('pop','Charizard'),
('pop','Godzilla'),
('pop','Grogu'),
('pop','Mr. Bean'),
('pop','Jack Sparrow'),
('pop','Minions'),
('pop','Buzz Lightyear')
ON CONFLICT DO NOTHING;
ALTER TABLE public.im_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.im_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.im_words ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.im_rooms, public.im_players, public.im_words FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.im_auth(p_code text,p_token text) RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path=public,extensions AS $$
 SELECT p.id FROM public.im_players p JOIN public.im_rooms r ON r.id=p.room_id
 WHERE r.code=upper(trim(p_code))
   AND p.token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
 LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.im_auth(text,text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.im_create(p_name text,p_token text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE code_new text; rid uuid; pid uuid; i integer;
BEGIN
 IF char_length(trim(coalesce(p_name,''))) NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Escribe un apodo de 1 a 20 caracteres'; END IF;
 IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'La sesión no es válida'; END IF;
 FOR i IN 1..30 LOOP
   code_new:=upper(substr(md5(gen_random_uuid()::text),1,6));
   BEGIN
     INSERT INTO public.im_rooms(code) VALUES(code_new) RETURNING id INTO rid;
     EXIT;
   EXCEPTION WHEN unique_violation THEN NULL;
   END;
 END LOOP;
 IF rid IS NULL THEN RAISE EXCEPTION 'No se pudo crear la sala. Inténtalo de nuevo'; END IF;
 INSERT INTO public.im_players(room_id,name,token_hash)
 VALUES(rid,trim(p_name),encode(extensions.digest(p_token,'sha256'),'hex')) RETURNING id INTO pid;
 UPDATE public.im_rooms SET host_id=pid WHERE id=rid;
 RETURN code_new;
END $$;

CREATE OR REPLACE FUNCTION public.im_join(p_code text,p_name text,p_token text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.im_rooms%ROWTYPE; pid uuid; total integer; clean_name text := trim(p_name);
BEGIN
 IF char_length(trim(coalesce(p_name,''))) NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Escribe un apodo de 1 a 20 caracteres'; END IF;
 IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'La sesión no es válida'; END IF;
 SELECT * INTO r FROM public.im_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'No existe esa sala de Impostor'; END IF;
 SELECT id INTO pid FROM public.im_players WHERE room_id=r.id AND token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
 IF EXISTS(SELECT 1 FROM public.im_players WHERE room_id=r.id AND lower(name)=lower(clean_name) AND (pid IS NULL OR id<>pid)) THEN
   RAISE EXCEPTION 'Ese nombre ya está en uso. Elige otro';
 END IF;
 IF pid IS NOT NULL THEN
   UPDATE public.im_players SET name=clean_name,last_seen=now() WHERE id=pid;
   RETURN r.code;
 END IF;
 IF r.status<>'lobby' THEN RAISE EXCEPTION 'La partida ya ha empezado. Entra en la siguiente ronda'; END IF;
 SELECT count(*) INTO total FROM public.im_players WHERE room_id=r.id;
 IF total>=10 THEN RAISE EXCEPTION 'La sala está completa (10 jugadores)'; END IF;
 INSERT INTO public.im_players(room_id,name,token_hash)
 VALUES(r.id,clean_name,encode(extensions.digest(p_token,'sha256'),'hex'));
 UPDATE public.im_rooms SET version=version+1,updated_at=now() WHERE id=r.id;
 RETURN r.code;
END $$;

CREATE OR REPLACE FUNCTION public.im_state(p_code text,p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.im_rooms%ROWTYPE; me uuid; player_list jsonb; outcome jsonb := NULL; chosen_word text; own_role text;
BEGIN
 SELECT * INTO r FROM public.im_rooms WHERE code=upper(trim(p_code));
 IF NOT FOUND THEN RAISE EXCEPTION 'La sala no existe'; END IF;
 me:=public.im_auth(p_code,p_token);
 IF me IS NULL THEN RAISE EXCEPTION 'No tienes acceso a esta sala'; END IF;
 UPDATE public.im_players SET last_seen=now() WHERE id=me AND room_id=r.id;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'id',p.id,'name',p.name,'host',p.id=r.host_id,'ready',p.ready,
  'voted',p.vote_target IS NOT NULL,
  'online',p.last_seen>now()-interval '35 seconds'
 ) ORDER BY p.joined_at,p.id),'[]'::jsonb)
 INTO player_list FROM public.im_players p WHERE p.room_id=r.id;
 IF r.status<>'lobby' THEN
    own_role:=CASE WHEN r.impostor_id=me THEN 'impostor' ELSE 'grupo' END;
    chosen_word:=CASE WHEN r.status='result' OR r.impostor_id<>me THEN r.word ELSE NULL END;
 END IF;
 IF r.status='result' THEN
   SELECT jsonb_build_object('impostor',r.impostor_id,'word',r.word,
    'votes',coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'count',
      (SELECT count(*) FROM public.im_players v WHERE v.room_id=r.id AND v.vote_target=p.id)
     ) ORDER BY p.joined_at,p.id),'[]'::jsonb))
   INTO outcome FROM public.im_players p WHERE p.room_id=r.id;
 END IF;
 RETURN jsonb_build_object(
  'code',r.code,'status',r.status,'version',r.version,'round',r.round,
  'host',r.host_id,'me',me,'players',player_list,
  'categories',r.categories,'opening',r.opening_id,
  'my_role',own_role,'word',chosen_word,'outcome',outcome);
END $$;

CREATE OR REPLACE FUNCTION public.im_settings(p_code text,p_token text,p_categories text[]) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.im_rooms%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.im_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sala no encontrada'; END IF;
 IF public.im_auth(p_code,p_token)<>r.host_id THEN RAISE EXCEPTION 'Solo el anfitrión puede elegir temáticas'; END IF;
 IF r.status<>'lobby' THEN RAISE EXCEPTION 'Las temáticas solo se cambian antes de empezar'; END IF;
 IF p_categories IS NULL OR cardinality(p_categories)<1 OR cardinality(p_categories)>5
    OR NOT(p_categories <@ ARRAY['lugares','comida','ocio','objetos','pop']::text[])
    THEN RAISE EXCEPTION 'Elige al menos una temática válida'; END IF;
 UPDATE public.im_rooms SET categories=p_categories,version=version+1,updated_at=now() WHERE id=r.id;
 RETURN public.im_state(p_code,p_token);
END $$;

CREATE OR REPLACE FUNCTION public.im_start(p_code text,p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.im_rooms%ROWTYPE; total integer; imp uuid; starter uuid; secret_word text;
BEGIN
 SELECT * INTO r FROM public.im_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sala no encontrada'; END IF;
 IF public.im_auth(p_code,p_token)<>r.host_id THEN RAISE EXCEPTION 'Solo el anfitrión puede repartir'; END IF;
 IF r.status<>'lobby' THEN RAISE EXCEPTION 'La partida ya está comenzada'; END IF;
 SELECT count(*) INTO total FROM public.im_players WHERE room_id=r.id;
 IF total NOT BETWEEN 3 AND 10 THEN RAISE EXCEPTION 'Se necesitan entre 3 y 10 jugadores'; END IF;
 SELECT p.id INTO imp FROM public.im_players p WHERE p.room_id=r.id ORDER BY random() LIMIT 1;
 SELECT p.id INTO starter FROM public.im_players p WHERE p.room_id=r.id ORDER BY random() LIMIT 1;
 SELECT w.word INTO secret_word FROM public.im_words w
 WHERE w.category=ANY(r.categories) AND NOT(w.word=ANY(r.recent_words))
 ORDER BY random() LIMIT 1;
 IF secret_word IS NULL THEN
  SELECT w.word INTO secret_word FROM public.im_words w WHERE w.category=ANY(r.categories) ORDER BY random() LIMIT 1;
 END IF;
 IF secret_word IS NULL THEN RAISE EXCEPTION 'No hay palabras disponibles'; END IF;
 UPDATE public.im_players SET ready=false,vote_target=null WHERE room_id=r.id;
 UPDATE public.im_rooms SET status='reveal',round=round+1,impostor_id=imp,opening_id=starter,word=secret_word,
  recent_words=(SELECT coalesce(array_agg(word),'{}'::text[]) FROM (SELECT word FROM unnest(r.recent_words || secret_word) WITH ORDINALITY AS t(word,n) ORDER BY n DESC LIMIT 16) recent),
  version=version+1,updated_at=now() WHERE id=r.id;
 RETURN public.im_state(p_code,p_token);
END $$;

CREATE OR REPLACE FUNCTION public.im_ready(p_code text,p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.im_rooms%ROWTYPE; me uuid;
BEGIN
 SELECT * INTO r FROM public.im_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 me:=public.im_auth(p_code,p_token);
 IF r.id IS NULL OR me IS NULL THEN RAISE EXCEPTION 'Sala no disponible'; END IF;
 IF r.status<>'reveal' THEN RAISE EXCEPTION 'No es momento de confirmar el papel'; END IF;
 UPDATE public.im_players SET ready=true WHERE id=me AND room_id=r.id;
 UPDATE public.im_rooms SET version=version+1,updated_at=now() WHERE id=r.id;
 RETURN public.im_state(p_code,p_token);
END $$;

CREATE OR REPLACE FUNCTION public.im_advance(p_code text,p_token text,p_next text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.im_rooms%ROWTYPE; votes integer;
BEGIN
 SELECT * INTO r FROM public.im_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sala no encontrada'; END IF;
 IF public.im_auth(p_code,p_token)<>r.host_id THEN RAISE EXCEPTION 'Solo el anfitrión puede cambiar de fase'; END IF;
 IF NOT ((r.status='reveal' AND p_next='debate') OR
         (r.status='debate' AND p_next='vote') OR
         (r.status='vote' AND p_next='result')) THEN RAISE EXCEPTION 'Cambio de fase no permitido'; END IF;
 IF r.status='vote' THEN
   SELECT count(*) INTO votes FROM public.im_players WHERE room_id=r.id AND vote_target IS NOT NULL;
   IF votes<2 THEN RAISE EXCEPTION 'Se necesitan al menos dos votos para mostrar resultados'; END IF;
 END IF;
 UPDATE public.im_rooms SET status=p_next,version=version+1,updated_at=now() WHERE id=r.id;
 RETURN public.im_state(p_code,p_token);
END $$;

CREATE OR REPLACE FUNCTION public.im_vote(p_code text,p_token text,p_target uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.im_rooms%ROWTYPE; me uuid; my_vote uuid; total integer; voted integer;
BEGIN
 SELECT * INTO r FROM public.im_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sala no encontrada'; END IF;
 me:=public.im_auth(p_code,p_token);
 IF me IS NULL THEN RAISE EXCEPTION 'No tienes acceso a la sala'; END IF;
 IF r.status<>'vote' THEN RAISE EXCEPTION 'La votación no está abierta'; END IF;
 IF p_target IS NULL OR p_target=me OR NOT EXISTS(SELECT 1 FROM public.im_players WHERE room_id=r.id AND id=p_target) THEN
   RAISE EXCEPTION 'Elige otro jugador de la sala';
 END IF;
 SELECT vote_target INTO my_vote FROM public.im_players WHERE id=me AND room_id=r.id;
 IF my_vote IS NOT NULL THEN RAISE EXCEPTION 'Ya has votado'; END IF;
 UPDATE public.im_players SET vote_target=p_target WHERE id=me;
 SELECT count(*),count(vote_target) INTO total,voted FROM public.im_players WHERE room_id=r.id;
 UPDATE public.im_rooms SET status=CASE WHEN voted>=total THEN 'result' ELSE status END,
  version=version+1,updated_at=now() WHERE id=r.id;
 RETURN public.im_state(p_code,p_token);
END $$;

CREATE OR REPLACE FUNCTION public.im_next(p_code text,p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.im_rooms%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.im_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sala no encontrada'; END IF;
 IF public.im_auth(p_code,p_token)<>r.host_id THEN RAISE EXCEPTION 'Solo el anfitrión puede preparar otra partida'; END IF;
 IF r.status<>'result' THEN RAISE EXCEPTION 'La ronda todavía no ha terminado'; END IF;
 UPDATE public.im_players SET ready=false,vote_target=null WHERE room_id=r.id;
 UPDATE public.im_rooms SET status='lobby',word=null,impostor_id=null,opening_id=null,
   version=version+1,updated_at=now() WHERE id=r.id;
 RETURN public.im_state(p_code,p_token);
END $$;

CREATE OR REPLACE FUNCTION public.im_leave(p_code text,p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.im_rooms%ROWTYPE; me uuid; remaining uuid[]; new_status text;
BEGIN
 SELECT * INTO r FROM public.im_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('left',true); END IF;
 me:=public.im_auth(p_code,p_token);
 IF me IS NULL THEN RAISE EXCEPTION 'No tienes acceso a esta sala'; END IF;
 DELETE FROM public.im_players WHERE id=me AND room_id=r.id;
 SELECT array_agg(id ORDER BY joined_at,id) INTO remaining FROM public.im_players WHERE room_id=r.id;
 IF remaining IS NULL THEN
  DELETE FROM public.im_rooms WHERE id=r.id;
  RETURN jsonb_build_object('left',true);
 END IF;
 new_status:=r.status;
 IF r.status NOT IN ('lobby','result') THEN
   IF cardinality(remaining)<3 OR r.impostor_id=me THEN new_status:='result';
   ELSIF r.status='vote' AND (SELECT count(*) FROM public.im_players WHERE room_id=r.id AND vote_target IS NOT NULL)=cardinality(remaining) THEN new_status:='result'; END IF;
 END IF;
 UPDATE public.im_rooms SET host_id=CASE WHEN r.host_id=me THEN remaining[1] ELSE r.host_id END,
  status=new_status,version=version+1,updated_at=now() WHERE id=r.id;
 RETURN jsonb_build_object('left',true);
END $$;

REVOKE ALL ON FUNCTION public.im_create(text,text),public.im_join(text,text,text),
 public.im_state(text,text),public.im_settings(text,text,text[]),
 public.im_start(text,text),public.im_ready(text,text),
 public.im_advance(text,text,text),public.im_vote(text,text,uuid),
 public.im_next(text,text),public.im_leave(text,text)
 FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.im_create(text,text),public.im_join(text,text,text),
 public.im_state(text,text),public.im_settings(text,text,text[]),
 public.im_start(text,text),public.im_ready(text,text),
 public.im_advance(text,text,text),public.im_vote(text,text,uuid),
 public.im_next(text,text),public.im_leave(text,text)
 TO anon,authenticated;
