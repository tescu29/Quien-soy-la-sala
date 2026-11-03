-- ¿Una partidita? — ¿Qué prefieres? multijugador con turnos rotativos
-- Ejecutar una vez sobre la base Supabase del proyecto.
-- Después ejecutar MIGRACION_QUE_PREFIERES_DILEMAS.sql para cargar los 180 dilemas.
-- Las tablas no admiten lectura directa anónima; la API utiliza RPC con tokens privados.

CREATE TABLE IF NOT EXISTS public.qp_rooms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 code text NOT NULL UNIQUE CHECK (code ~ '^[A-F0-9]{6}$'),
 host_id uuid,
 status text NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','voting','results')),
 round_no integer NOT NULL DEFAULT 0,
 reader_id uuid,
 dilemma_id text,
 intensity text NOT NULL DEFAULT 'sinmiedo' CHECK (intensity IN ('suave','sinmiedo')),
 recent_ids text[] NOT NULL DEFAULT '{}'::text[],
 version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.qp_players (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 room_id uuid NOT NULL REFERENCES public.qp_rooms(id) ON DELETE CASCADE,
 nick text NOT NULL CHECK (char_length(nick) BETWEEN 1 AND 20),
 token_hash text NOT NULL,
 vote text CHECK (vote IN ('A','B')),
 joined_at timestamptz NOT NULL DEFAULT now(),
 last_seen timestamptz NOT NULL DEFAULT now(),
 UNIQUE(room_id,token_hash)
);
CREATE INDEX IF NOT EXISTS qp_players_room_idx ON public.qp_players(room_id);
CREATE TABLE IF NOT EXISTS public.qp_dilemmas (
 id text PRIMARY KEY,
 category text NOT NULL,
 level integer NOT NULL CHECK (level BETWEEN 1 AND 3),
 a text NOT NULL,
 b text NOT NULL
);
ALTER TABLE public.qp_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qp_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qp_dilemmas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.qp_rooms, public.qp_players, public.qp_dilemmas FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA public TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.qp_auth(p_code text,p_token text) RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path=public,extensions AS $$
 SELECT p.id FROM public.qp_players p JOIN public.qp_rooms r ON r.id=p.room_id
 WHERE r.code=upper(trim(p_code))
 AND p.token_hash=encode(extensions.digest(coalesce(p_token,''),'sha256'),'hex')
 LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.qp_auth(text,text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.qp_pick(p_intensity text,p_recent text[]) RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path=public,extensions AS $$
 SELECT d.id FROM public.qp_dilemmas d
 WHERE (CASE WHEN p_intensity='suave' THEN d.level=1 ELSE d.level>=2 END)
 ORDER BY (d.id=ANY(coalesce(p_recent,'{}'::text[]))),random()
 LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.qp_pick(text,text[]) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.qp_create(p_name text,p_token text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE c text; rid uuid; pid uuid; tries integer;
BEGIN
 IF char_length(trim(coalesce(p_name,''))) NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Introduce un nombre de 1 a 20 caracteres'; END IF;
 IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Sesión no válida'; END IF;
 FOR tries IN 1..30 LOOP
  c:=upper(substr(md5(gen_random_uuid()::text),1,6));
  BEGIN
   INSERT INTO public.qp_rooms(code) VALUES(c) RETURNING id INTO rid;
   EXIT;
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
 END LOOP;
 IF rid IS NULL THEN RAISE EXCEPTION 'No se ha podido crear la sala. Reinténtalo'; END IF;
 INSERT INTO public.qp_players(room_id,nick,token_hash)
 VALUES(rid,trim(p_name),encode(extensions.digest(p_token,'sha256'),'hex')) RETURNING id INTO pid;
 UPDATE public.qp_rooms SET host_id=pid WHERE id=rid;
 RETURN c;
END $$;

CREATE OR REPLACE FUNCTION public.qp_join(p_code text,p_name text,p_token text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.qp_rooms%ROWTYPE; existing uuid; n integer; clean_name text:=trim(coalesce(p_name,''));
BEGIN
 IF char_length(clean_name) NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Introduce un nombre de 1 a 20 caracteres'; END IF;
 IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Sesión no válida'; END IF;
 SELECT * INTO r FROM public.qp_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'No existe esa sala'; END IF;
 SELECT id INTO existing FROM public.qp_players
 WHERE room_id=r.id AND token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
 IF EXISTS(SELECT 1 FROM public.qp_players WHERE room_id=r.id AND lower(nick)=lower(clean_name)
           AND (existing IS NULL OR id<>existing)) THEN RAISE EXCEPTION 'Ese nombre ya está ocupado'; END IF;
 IF existing IS NOT NULL THEN
  UPDATE public.qp_players SET nick=clean_name,last_seen=now() WHERE id=existing;
  UPDATE public.qp_rooms SET version=version+1 WHERE id=r.id;
  RETURN r.code;
 END IF;
 IF r.status<>'lobby' THEN RAISE EXCEPTION 'La ronda ya ha comenzado. Entra cuando finalice la partida'; END IF;
 SELECT count(*) INTO n FROM public.qp_players WHERE room_id=r.id;
 IF n>=10 THEN RAISE EXCEPTION 'Sala llena (10 participantes)'; END IF;
 INSERT INTO public.qp_players(room_id,nick,token_hash)
 VALUES(r.id,clean_name,encode(extensions.digest(p_token,'sha256'),'hex'));
 UPDATE public.qp_rooms SET version=version+1,updated_at=now() WHERE id=r.id;
 RETURN r.code;
END $$;

CREATE OR REPLACE FUNCTION public.qp_state(p_code text,p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.qp_rooms%ROWTYPE; me uuid; players_json jsonb; q public.qp_dilemmas%ROWTYPE;
 v_a integer:=0;v_b integer:=0;my_vote text;
BEGIN
 SELECT * INTO r FROM public.qp_rooms WHERE code=upper(trim(p_code));
 IF NOT FOUND THEN RAISE EXCEPTION 'No se encuentra esa sala'; END IF;
 me:=public.qp_auth(p_code,p_token);
 IF me IS NULL THEN RAISE EXCEPTION 'No tienes acceso a esta sala'; END IF;
 UPDATE public.qp_players SET last_seen=now() WHERE id=me AND room_id=r.id;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'id',p.id,'name',p.nick,'host',p.id=r.host_id,'reader',p.id=r.reader_id,
  'voted',p.vote IS NOT NULL,'online',p.last_seen>now()-interval '35 seconds'
 ) ORDER BY CASE WHEN p.id=r.host_id THEN 0 ELSE 1 END,p.joined_at,p.id),'[]'::jsonb)
 INTO players_json FROM public.qp_players p WHERE p.room_id=r.id;
 SELECT vote INTO my_vote FROM public.qp_players WHERE id=me;
 IF r.dilemma_id IS NOT NULL THEN
  SELECT * INTO q FROM public.qp_dilemmas WHERE id=r.dilemma_id;
 END IF;
 IF r.status='results' THEN
  SELECT count(*) FILTER (WHERE vote='A'),count(*) FILTER (WHERE vote='B')
  INTO v_a,v_b FROM public.qp_players WHERE room_id=r.id AND id<>r.reader_id;
 END IF;
 RETURN jsonb_build_object(
  'code',r.code,'status',r.status,'version',r.version,'round',r.round_no,
  'host',r.host_id,'reader',r.reader_id,'me',me,'intensity',r.intensity,
  'players',players_json,'my_vote',my_vote,
  'dilemma',CASE WHEN r.status='lobby' THEN NULL ELSE jsonb_build_object(
       'id',q.id,'a',q.a,'b',q.b,'level',q.level) END,
  'results',CASE WHEN r.status='results' THEN jsonb_build_object('a',v_a,'b',v_b)
                 ELSE NULL END
 );
END $$;

CREATE OR REPLACE FUNCTION public.qp_settings(p_code text,p_token text,p_intensity text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.qp_rooms%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.qp_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sala no encontrada'; END IF;
 IF public.qp_auth(p_code,p_token) IS DISTINCT FROM r.host_id THEN RAISE EXCEPTION 'Solo el anfitrión puede modificar la sala'; END IF;
 IF r.status<>'lobby' THEN RAISE EXCEPTION 'La partida ya ha comenzado'; END IF;
 IF p_intensity NOT IN ('suave','sinmiedo') OR p_intensity IS NULL THEN RAISE EXCEPTION 'Intensidad no válida'; END IF;
 UPDATE public.qp_rooms SET intensity=p_intensity,version=version+1,updated_at=now() WHERE id=r.id;
 RETURN public.qp_state(p_code,p_token);
END $$;

CREATE OR REPLACE FUNCTION public.qp_start(p_code text,p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.qp_rooms%ROWTYPE; reader uuid; q text; n integer;
BEGIN
 SELECT * INTO r FROM public.qp_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sala no encontrada'; END IF;
 IF public.qp_auth(p_code,p_token) IS DISTINCT FROM r.host_id THEN RAISE EXCEPTION 'Solo el anfitrión puede empezar'; END IF;
 IF r.status<>'lobby' THEN RAISE EXCEPTION 'La partida ya ha comenzado'; END IF;
 SELECT count(*) INTO n FROM public.qp_players WHERE room_id=r.id;
 IF n NOT BETWEEN 2 AND 10 THEN RAISE EXCEPTION 'Se necesitan entre 2 y 10 jugadores'; END IF;
 reader:=r.host_id;
 q:=public.qp_pick(r.intensity,r.recent_ids);
 IF q IS NULL THEN RAISE EXCEPTION 'No hay dilemas disponibles'; END IF;
 UPDATE public.qp_players SET vote=NULL WHERE room_id=r.id;
 UPDATE public.qp_rooms SET reader_id=reader,dilemma_id=q,status='voting',round_no=r.round_no+1,
  recent_ids=(SELECT coalesce(array_agg(id ORDER BY ord),'{}'::text[])
              FROM (SELECT id,ord FROM unnest(r.recent_ids || q) WITH ORDINALITY t(id,ord)
                    ORDER BY ord DESC LIMIT 175) recent),
  version=version+1,updated_at=now() WHERE id=r.id;
 RETURN public.qp_state(p_code,p_token);
END $$;

CREATE OR REPLACE FUNCTION public.qp_vote(p_code text,p_token text,p_choice text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.qp_rooms%ROWTYPE; me uuid; total integer; cast_count integer; old_vote text;
BEGIN
 SELECT * INTO r FROM public.qp_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sala no encontrada'; END IF;
 me:=public.qp_auth(p_code,p_token);
 IF me IS NULL THEN RAISE EXCEPTION 'No tienes acceso a esta sala'; END IF;
 IF r.status<>'voting' THEN RAISE EXCEPTION 'La votación está cerrada'; END IF;
 IF me=r.reader_id THEN RAISE EXCEPTION 'Esta ronda te toca leer. Solo votan los demás'; END IF;
 IF p_choice NOT IN ('A','B') OR p_choice IS NULL THEN RAISE EXCEPTION 'Elige A o B'; END IF;
 SELECT vote INTO old_vote FROM public.qp_players WHERE id=me AND room_id=r.id;
 IF old_vote IS NOT NULL THEN RAISE EXCEPTION 'Ya has votado en esta ronda'; END IF;
 UPDATE public.qp_players SET vote=p_choice WHERE id=me AND room_id=r.id;
 SELECT count(*) FILTER (WHERE id<>r.reader_id),
        count(*) FILTER (WHERE id<>r.reader_id AND vote IS NOT NULL)
 INTO total,cast_count FROM public.qp_players WHERE room_id=r.id;
 UPDATE public.qp_rooms
 SET status=CASE WHEN total>0 AND cast_count>=total THEN 'results' ELSE status END,
     version=version+1,updated_at=now() WHERE id=r.id;
 RETURN public.qp_state(p_code,p_token);
END $$;

CREATE OR REPLACE FUNCTION public.qp_next(p_code text,p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.qp_rooms%ROWTYPE; me uuid; people uuid[]; pos integer; reader uuid; q text;
BEGIN
 SELECT * INTO r FROM public.qp_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sala no encontrada'; END IF;
 me:=public.qp_auth(p_code,p_token);
 IF me IS NULL THEN RAISE EXCEPTION 'No tienes acceso a esta sala'; END IF;
 IF me IS DISTINCT FROM r.reader_id AND me IS DISTINCT FROM r.host_id THEN
  RAISE EXCEPTION 'El lector o el anfitrión deben pasar al siguiente dilema';
 END IF;
 IF r.status<>'results' THEN RAISE EXCEPTION 'Esperad a que terminen los votos'; END IF;
 SELECT array_agg(p.id ORDER BY CASE WHEN p.id=r.host_id THEN 0 ELSE 1 END,p.joined_at,p.id) INTO people
 FROM public.qp_players p WHERE p.room_id=r.id;
 IF cardinality(people)<2 THEN RAISE EXCEPTION 'Se necesitan dos jugadores'; END IF;
 pos:=array_position(people,r.reader_id);
 reader:=people[CASE WHEN pos IS NULL THEN 1 ELSE pos%cardinality(people)+1 END];
 q:=public.qp_pick(r.intensity,r.recent_ids);
 IF q IS NULL THEN RAISE EXCEPTION 'No hay más dilemas disponibles'; END IF;
 UPDATE public.qp_players SET vote=NULL WHERE room_id=r.id;
 UPDATE public.qp_rooms SET reader_id=reader,dilemma_id=q,status='voting',round_no=r.round_no+1,
  recent_ids=(SELECT coalesce(array_agg(id ORDER BY ord),'{}'::text[])
              FROM (SELECT id,ord FROM unnest(r.recent_ids || q) WITH ORDINALITY t(id,ord)
                    ORDER BY ord DESC LIMIT 175) recent),
  version=version+1,updated_at=now() WHERE id=r.id;
 RETURN public.qp_state(p_code,p_token);
END $$;

CREATE OR REPLACE FUNCTION public.qp_skip(p_code text,p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.qp_rooms%ROWTYPE; me uuid; q text;
BEGIN
 SELECT * INTO r FROM public.qp_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sala no encontrada'; END IF;
 me:=public.qp_auth(p_code,p_token);
 IF me IS NULL THEN RAISE EXCEPTION 'No tienes acceso a esta sala'; END IF;
 IF me IS DISTINCT FROM r.reader_id AND me IS DISTINCT FROM r.host_id THEN
  RAISE EXCEPTION 'Solo el lector o el anfitrión pueden cambiar el dilema';
 END IF;
 IF r.status<>'voting' THEN RAISE EXCEPTION 'La ronda ya está cerrada'; END IF;
 q:=public.qp_pick(r.intensity,r.recent_ids);
 IF q IS NULL THEN RAISE EXCEPTION 'No hay dilemas disponibles'; END IF;
 UPDATE public.qp_players SET vote=NULL WHERE room_id=r.id;
 UPDATE public.qp_rooms SET dilemma_id=q,
   recent_ids=(SELECT coalesce(array_agg(id ORDER BY ord),'{}'::text[])
              FROM (SELECT id,ord FROM unnest(r.recent_ids || q) WITH ORDINALITY t(id,ord)
                    ORDER BY ord DESC LIMIT 175) recent),
   version=version+1,updated_at=now() WHERE id=r.id;
 RETURN public.qp_state(p_code,p_token);
END $$;

CREATE OR REPLACE FUNCTION public.qp_leave(p_code text,p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE
 r public.qp_rooms%ROWTYPE; me uuid; old_people uuid[]; people uuid[];
 old_position integer; next_reader uuid; q text; n integer; cast_count integer;
BEGIN
 SELECT * INTO r FROM public.qp_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('left',true); END IF;
 me:=public.qp_auth(p_code,p_token);
 IF me IS NULL THEN RAISE EXCEPTION 'No tienes acceso a esta sala'; END IF;
 SELECT array_agg(p.id ORDER BY CASE WHEN p.id=r.host_id THEN 0 ELSE 1 END,p.joined_at,p.id) INTO old_people
 FROM public.qp_players p WHERE p.room_id=r.id;
 old_position:=array_position(old_people,me);
 DELETE FROM public.qp_players WHERE id=me AND room_id=r.id;
 SELECT array_agg(p.id ORDER BY CASE WHEN p.id=r.host_id THEN 0 ELSE 1 END,p.joined_at,p.id) INTO people
 FROM public.qp_players p WHERE p.room_id=r.id;
 n:=coalesce(cardinality(people),0);
 IF n=0 THEN DELETE FROM public.qp_rooms WHERE id=r.id; RETURN jsonb_build_object('left',true); END IF;
 IF n<2 THEN
  UPDATE public.qp_players SET vote=NULL WHERE room_id=r.id;
  UPDATE public.qp_rooms SET host_id=CASE WHEN r.host_id=me THEN people[1] ELSE r.host_id END,
    status='lobby',reader_id=NULL,dilemma_id=NULL,version=version+1,updated_at=now() WHERE id=r.id;
  RETURN jsonb_build_object('left',true);
 END IF;
 IF me=r.reader_id AND r.status IN ('voting','results') THEN
  next_reader:=people[CASE WHEN old_position IS NULL OR old_position>n THEN 1 ELSE old_position END];
  q:=public.qp_pick(r.intensity,r.recent_ids);
  IF q IS NULL THEN RAISE EXCEPTION 'No hay más dilemas disponibles'; END IF;
  UPDATE public.qp_players SET vote=NULL WHERE room_id=r.id;
  UPDATE public.qp_rooms SET host_id=CASE WHEN r.host_id=me THEN people[1] ELSE r.host_id END,
   reader_id=next_reader,dilemma_id=q,status='voting',round_no=r.round_no+1,
   recent_ids=(SELECT coalesce(array_agg(id ORDER BY ord),'{}'::text[])
               FROM (SELECT id,ord FROM unnest(r.recent_ids || q) WITH ORDINALITY t(id,ord)
                     ORDER BY ord DESC LIMIT 175) recent),
   version=version+1,updated_at=now() WHERE id=r.id;
 ELSE
  SELECT count(*) FILTER (WHERE vote IS NOT NULL) INTO cast_count
  FROM public.qp_players WHERE room_id=r.id AND id<>r.reader_id;
  UPDATE public.qp_rooms SET
   host_id=CASE WHEN r.host_id=me THEN people[1] ELSE r.host_id END,
   status=CASE WHEN r.status='voting' AND cast_count=n-1 THEN 'results' ELSE r.status END,
   version=version+1,updated_at=now() WHERE id=r.id;
 END IF;
 RETURN jsonb_build_object('left',true);
END $$;
REVOKE ALL ON FUNCTION public.qp_create(text,text),
 public.qp_join(text,text,text),public.qp_state(text,text),
 public.qp_settings(text,text,text),public.qp_start(text,text),
 public.qp_vote(text,text,text),public.qp_next(text,text),
 public.qp_skip(text,text),public.qp_leave(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.qp_create(text,text),
 public.qp_join(text,text,text),public.qp_state(text,text),
 public.qp_settings(text,text,text),public.qp_start(text,text),
 public.qp_vote(text,text,text),public.qp_next(text,text),
 public.qp_skip(text,text),public.qp_leave(text,text) TO anon,authenticated;
