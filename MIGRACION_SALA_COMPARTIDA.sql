-- ¿Una partidita? · Sala compartida entre Impostor y ¿Qué prefieres?
-- Conservar el MISMO código, apodos y tokens al cambiar de juego.
-- Los clientes de ambos juegos consultan gp_status y redirigen automáticamente.
-- Esta migración requiere MIGRACION_IMPOSTOR_SALAS.sql y
-- MIGRACION_QUE_PREFIERES_SALAS.sql, que ya deben existir.

CREATE TABLE IF NOT EXISTS public.gp_switches (
 code text PRIMARY KEY CHECK (code ~ '^[A-F0-9]{6}$'),
 game text NOT NULL CHECK (game IN ('impostor','queprefieres')),
 version integer NOT NULL DEFAULT 1,
 changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gp_switches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gp_switches FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.gp_status(p_code text,p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE c text:=upper(trim(p_code)); active_game text; version_now integer;
BEGIN
 IF c !~ '^[A-F0-9]{6}$' THEN RAISE EXCEPTION 'Código de sala inválido'; END IF;
 IF public.im_auth(c,p_token) IS NULL AND public.qp_auth(c,p_token) IS NULL THEN
  RAISE EXCEPTION 'No tienes acceso a esta sala';
 END IF;
 SELECT game,version INTO active_game,version_now FROM public.gp_switches WHERE code=c;
 RETURN jsonb_build_object('code',c,'game',active_game,'version',version_now);
END $$;

CREATE OR REPLACE FUNCTION public.gp_change(p_code text,p_token text,p_game text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE
 c text:=upper(trim(p_code));
 active_game text; source_game text;
 im public.im_rooms%ROWTYPE; qp public.qp_rooms%ROWTYPE;
 source_host uuid; authenticated uuid;
 target_room uuid; target_host uuid; target_count integer;
 copied integer;
BEGIN
 IF c !~ '^[A-F0-9]{6}$' THEN RAISE EXCEPTION 'Código de sala inválido'; END IF;
 IF p_game NOT IN ('impostor','queprefieres') OR p_game IS NULL THEN
  RAISE EXCEPTION 'Juego no compatible con la sala compartida';
 END IF;
 -- Bloquear cambios simultáneos sobre una sala ya compartida.
 SELECT game INTO active_game FROM public.gp_switches WHERE code=c FOR UPDATE;
 IF active_game IS NOT NULL THEN
  source_game:=active_game;
 ELSE
  -- Primera transferencia: identificar el juego por la pertenencia a la sala,
  -- sin exponer detalles internos de otros participantes.
  IF public.im_auth(c,p_token) IS NOT NULL THEN source_game:='impostor';
  ELSIF public.qp_auth(c,p_token) IS NOT NULL THEN source_game:='queprefieres';
  ELSE RAISE EXCEPTION 'No perteneces a esta sala'; END IF;
 END IF;
 IF source_game=p_game THEN RAISE EXCEPTION 'Ya estáis jugando a ese juego'; END IF;

 IF source_game='impostor' THEN
  SELECT * INTO im FROM public.im_rooms WHERE code=c FOR UPDATE;
  authenticated:=public.im_auth(c,p_token);
  IF im.id IS NULL OR authenticated IS DISTINCT FROM im.host_id THEN
   RAISE EXCEPTION 'Solo el anfitrión puede cambiar el juego';
  END IF;
  IF im.status<>'result' THEN
   RAISE EXCEPTION 'Esperad a que termine la ronda para cambiar de juego';
  END IF;
  SELECT * INTO qp FROM public.qp_rooms WHERE code=c FOR UPDATE;
  IF qp.id IS NOT NULL AND active_game IS NULL THEN
   RAISE EXCEPTION 'El código ya existe en otro juego. Usa una nueva sala';
  END IF;
  IF qp.id IS NULL THEN
   INSERT INTO public.qp_rooms(code) VALUES(c) RETURNING id INTO target_room;
  ELSE target_room:=qp.id;
  END IF;
  -- Los miembros del otro juego se sincronizan íntegramente y conservan
  -- el hash de su token local, no se distribuyen tokens ajenos.
  DELETE FROM public.qp_players WHERE room_id=target_room;
  INSERT INTO public.qp_players(room_id,nick,token_hash,joined_at,last_seen)
    SELECT target_room,p.name,p.token_hash,p.joined_at,now()
    FROM public.im_players p WHERE p.room_id=im.id
    ORDER BY CASE WHEN p.id=im.host_id THEN 0 ELSE 1 END,p.joined_at,p.id;
  SELECT p.id INTO target_host FROM public.qp_players p
   JOIN public.im_players i ON i.room_id=im.id AND i.token_hash=p.token_hash
   WHERE p.room_id=target_room AND i.id=im.host_id LIMIT 1;
  SELECT count(*) INTO copied FROM public.qp_players WHERE room_id=target_room;
  IF copied<2 OR target_host IS NULL THEN
   RAISE EXCEPTION 'No hay suficientes jugadores para pasar de juego';
  END IF;
  UPDATE public.qp_rooms SET host_id=target_host,status='lobby',
   reader_id=NULL,dilemma_id=NULL,version=version+1,updated_at=now()
   WHERE id=target_room;

 ELSIF source_game='queprefieres' THEN
  SELECT * INTO qp FROM public.qp_rooms WHERE code=c FOR UPDATE;
  authenticated:=public.qp_auth(c,p_token);
  IF qp.id IS NULL OR authenticated IS DISTINCT FROM qp.host_id THEN
   RAISE EXCEPTION 'Solo el anfitrión puede cambiar el juego';
  END IF;
  IF qp.status<>'results' THEN
   RAISE EXCEPTION 'Esperad a que termine la ronda para cambiar de juego';
  END IF;
  SELECT * INTO im FROM public.im_rooms WHERE code=c FOR UPDATE;
  IF im.id IS NOT NULL AND active_game IS NULL THEN
   RAISE EXCEPTION 'El código ya existe en otro juego. Usa una nueva sala';
  END IF;
  IF im.id IS NULL THEN
   INSERT INTO public.im_rooms(code) VALUES(c) RETURNING id INTO target_room;
  ELSE target_room:=im.id;
  END IF;
  DELETE FROM public.im_players WHERE room_id=target_room;
  INSERT INTO public.im_players(room_id,name,token_hash,joined_at,last_seen)
   SELECT target_room,p.nick,p.token_hash,p.joined_at,now()
   FROM public.qp_players p WHERE p.room_id=qp.id
   ORDER BY CASE WHEN p.id=qp.host_id THEN 0 ELSE 1 END,p.joined_at,p.id;
  SELECT p.id INTO target_host FROM public.im_players p
   JOIN public.qp_players q ON q.room_id=qp.id AND q.token_hash=p.token_hash
   WHERE p.room_id=target_room AND q.id=qp.host_id LIMIT 1;
  SELECT count(*) INTO copied FROM public.im_players WHERE room_id=target_room;
  IF copied<3 OR target_host IS NULL THEN
   RAISE EXCEPTION 'Impostor necesita al menos tres jugadores';
  END IF;
  UPDATE public.im_rooms SET host_id=target_host,status='lobby',
   word=NULL,impostor_id=NULL,opening_id=NULL,
   version=version+1,updated_at=now() WHERE id=target_room;
 END IF;

 INSERT INTO public.gp_switches(code,game,version,changed_at)
 VALUES(c,p_game,1,now())
 ON CONFLICT(code) DO UPDATE SET
  game=excluded.game,version=public.gp_switches.version+1,changed_at=now();
 RETURN jsonb_build_object('code',c,'game',p_game,'players',copied);
END $$;

REVOKE ALL ON FUNCTION public.gp_status(text,text),
 public.gp_change(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gp_status(text,text),
 public.gp_change(text,text,text) TO anon,authenticated;
