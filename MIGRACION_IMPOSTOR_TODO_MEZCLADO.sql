-- ¿Una partidita? · Impostor sin selector de categorías
-- Actualización segura para salas existentes: mezcla las 175 palabras
-- sin filtrar por ninguna temática previamente guardada.
-- No cambia las identidades, salas, palabras ni votos existentes.

CREATE OR REPLACE FUNCTION public.im_start(p_code text,p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE r public.im_rooms%ROWTYPE; total integer; imp uuid; starter uuid; secret_word text;
BEGIN
 SELECT * INTO r FROM public.im_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sala no encontrada'; END IF;
 IF public.im_auth(p_code,p_token) IS DISTINCT FROM r.host_id THEN RAISE EXCEPTION 'Solo el anfitrión puede repartir'; END IF;
 IF r.status<>'lobby' THEN RAISE EXCEPTION 'La partida ya está comenzada'; END IF;
 SELECT count(*) INTO total FROM public.im_players WHERE room_id=r.id;
 IF total NOT BETWEEN 3 AND 10 THEN RAISE EXCEPTION 'Se necesitan entre 3 y 10 jugadores'; END IF;
 SELECT p.id INTO imp FROM public.im_players p WHERE p.room_id=r.id ORDER BY random() LIMIT 1;
 SELECT p.id INTO starter FROM public.im_players p WHERE p.room_id=r.id ORDER BY random() LIMIT 1;
 SELECT w.word INTO secret_word FROM public.im_words w
 WHERE NOT(w.word=ANY(r.recent_words))
 ORDER BY random() LIMIT 1;
 IF secret_word IS NULL THEN
  SELECT w.word INTO secret_word FROM public.im_words w ORDER BY random() LIMIT 1;
 END IF;
 IF secret_word IS NULL THEN RAISE EXCEPTION 'No hay palabras disponibles'; END IF;
 UPDATE public.im_players SET ready=false,vote_target=null WHERE room_id=r.id;
 UPDATE public.im_rooms SET status='reveal',round=round+1,impostor_id=imp,opening_id=starter,word=secret_word,
  recent_words=(SELECT coalesce(array_agg(word),'{}'::text[]) FROM (SELECT word FROM unnest(r.recent_words || secret_word) WITH ORDINALITY AS t(word,n) ORDER BY n DESC LIMIT 16) recent),
  version=version+1,updated_at=now() WHERE id=r.id;
 RETURN public.im_state(p_code,p_token);
END $$;
