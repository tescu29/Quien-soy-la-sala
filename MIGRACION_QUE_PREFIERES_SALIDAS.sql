-- Actualización incremental para salas ¿Qué prefieres? ya desplegadas.
-- Protege la rotación cuando el lector abandona durante votos o resultados.
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
 SELECT array_agg(p.id ORDER BY p.joined_at,p.id) INTO old_people
 FROM public.qp_players p WHERE p.room_id=r.id;
 old_position:=array_position(old_people,me);
 DELETE FROM public.qp_players WHERE id=me AND room_id=r.id;
 SELECT array_agg(p.id ORDER BY p.joined_at,p.id) INTO people
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
