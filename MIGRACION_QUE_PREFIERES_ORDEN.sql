-- Orden garantizado: anfitrión primero; después, jugadores según entrada.
-- Corrige partidas iniciadas con usuarios incorporados simultáneamente.

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
