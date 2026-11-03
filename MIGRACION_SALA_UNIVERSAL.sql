-- ¿Una partidita? · Sala de grupo transversal a TODOS los juegos multijugador.
-- ¿Quién soy?, Cromazo, Impostor (modo sala) y ¿Qué prefieres?.
-- Una única invitación pública de grupo; cada motor tiene un código interno propio.
-- No se copian tokens entre usuarios, cada dispositivo conserva únicamente el suyo.
-- Las salas internas se crean mediante las RPC originales desde el dispositivo anfitrión.

CREATE TABLE IF NOT EXISTS public.gu_parties (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 code text UNIQUE NOT NULL CHECK (code ~ '^[A-Z0-9]{6}$'),
 host_token_hash text NOT NULL,
 active_game text NOT NULL CHECK (active_game IN ('quien','cromazo','impostor','queprefieres')),
 active_code text NOT NULL,
 phase text NOT NULL DEFAULT 'ready' CHECK (phase IN ('ready','switching')),
 target_game text CHECK (target_game IS NULL OR target_game IN ('quien','cromazo','impostor','queprefieres')),
 version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.gu_links (
 party_id uuid NOT NULL REFERENCES public.gu_parties(id) ON DELETE CASCADE,
 game text NOT NULL CHECK (game IN ('quien','cromazo','impostor','queprefieres')),
 game_code text NOT NULL,
 PRIMARY KEY(game,game_code)
);
CREATE INDEX IF NOT EXISTS gu_links_party_idx ON public.gu_links(party_id);
CREATE TABLE IF NOT EXISTS public.gu_members (
 party_id uuid NOT NULL REFERENCES public.gu_parties(id) ON DELETE CASCADE,
 token_hash text NOT NULL,
 nick text NOT NULL CHECK (char_length(nick) BETWEEN 1 AND 20),
 joined_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(party_id,token_hash)
);
CREATE INDEX IF NOT EXISTS gu_members_party_idx ON public.gu_members(party_id);
ALTER TABLE public.gu_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gu_parties,public.gu_links,public.gu_members FROM PUBLIC,anon,authenticated;

-- Estado nativo: verifica en el propio servidor que el token realmente
-- pertenece al juego de origen; nunca confía solamente en el código compartido.
CREATE OR REPLACE FUNCTION public.gu_native_state(p_game text,p_code text,p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE d jsonb;
BEGIN
 CASE p_game
  WHEN 'quien' THEN d:=public.ts_state(p_code,p_token);
  WHEN 'cromazo' THEN d:=public.cp_state(p_code,p_token);
  WHEN 'impostor' THEN d:=public.im_state(p_code,p_token);
  WHEN 'queprefieres' THEN d:=public.qp_state(p_code,p_token);
  ELSE RAISE EXCEPTION 'Juego no compatible';
 END CASE;
 RETURN d;
END $$;
REVOKE ALL ON FUNCTION public.gu_native_state(text,text,text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.gu_is_host(p_game text,p_state jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT CASE WHEN p_game='quien'
 THEN (p_state->'me'->>'id')=(p_state->'room'->>'host_player_id')
 ELSE (p_state->>'me')=(p_state->>'host') END
$$;
REVOKE ALL ON FUNCTION public.gu_is_host(text,jsonb) FROM PUBLIC,anon,authenticated;

-- Los miembros se registran automáticamente tras entrar en su primer juego.
-- Si el anfitrión todavía no ha registrado el hub, se devuelve NULL y
-- el cliente reintenta en el siguiente sondeo.
CREATE OR REPLACE FUNCTION public.gu_attach(p_game text,p_code text,p_token text,p_name text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE
 d jsonb; orig text:=upper(trim(p_code)); leader boolean; member_hash text;
 party public.gu_parties%ROWTYPE; candidate text; n integer;
BEGIN
 IF p_game NOT IN ('quien','cromazo','impostor','queprefieres') OR p_game IS NULL THEN
  RAISE EXCEPTION 'Juego no compatible';
 END IF;
 IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Identidad inválida'; END IF;
 IF char_length(trim(coalesce(p_name,''))) NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Nombre inválido'; END IF;
 d:=public.gu_native_state(p_game,orig,p_token);
 leader:=public.gu_is_host(p_game,d);
 member_hash:=encode(extensions.digest(p_token,'sha256'),'hex');
 SELECT gp.* INTO party FROM public.gu_parties gp
 JOIN public.gu_links gl ON gl.party_id=gp.id
 WHERE gl.game=p_game AND gl.game_code=orig;
 IF party.id IS NULL THEN
  IF NOT leader THEN RETURN NULL; END IF;
  -- Creación de hub idempotente, serializada por el juego y el código.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_game||':'||orig,0));
  SELECT gp.* INTO party FROM public.gu_parties gp
  JOIN public.gu_links gl ON gl.party_id=gp.id
  WHERE gl.game=p_game AND gl.game_code=orig;
  IF party.id IS NULL THEN
   candidate:=CASE WHEN orig~'^[A-Z0-9]{6}$'
     AND NOT EXISTS(SELECT 1 FROM public.gu_parties WHERE code=orig) THEN orig ELSE NULL END;
   IF candidate IS NULL THEN
    FOR n IN 1..50 LOOP
     candidate:=upper(substr(md5(gen_random_uuid()::text),1,6));
     EXIT WHEN NOT EXISTS(SELECT 1 FROM public.gu_parties WHERE code=candidate);
    END LOOP;
   END IF;
   INSERT INTO public.gu_parties(code,host_token_hash,active_game,active_code)
    VALUES(candidate,member_hash,p_game,orig) RETURNING * INTO party;
   INSERT INTO public.gu_links(party_id,game,game_code)
    VALUES(party.id,p_game,orig);
  END IF;
 END IF;
 IF party.active_game<>p_game OR party.active_code<>orig THEN
  RAISE EXCEPTION 'El grupo ya se ha trasladado a otro juego';
 END IF;
 INSERT INTO public.gu_members(party_id,token_hash,nick)
 VALUES(party.id,member_hash,trim(p_name))
 ON CONFLICT (party_id,token_hash) DO UPDATE SET nick=EXCLUDED.nick;
 RETURN jsonb_build_object('code',party.code,'game',party.active_game,
  'game_code',party.active_code,'phase',party.phase,'target_game',party.target_game,
  'version',party.version,'is_host',member_hash=party.host_token_hash);
END $$;

CREATE OR REPLACE FUNCTION public.gu_status(p_code text,p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE party public.gu_parties%ROWTYPE; member_digest text;
BEGIN
 SELECT * INTO party FROM public.gu_parties WHERE code=upper(trim(p_code));
 IF party.id IS NULL THEN RAISE EXCEPTION 'No se encuentra el grupo'; END IF;
 member_digest:=encode(extensions.digest(coalesce(p_token,''),'sha256'),'hex');
 IF NOT EXISTS(SELECT 1 FROM public.gu_members gm
    WHERE gm.party_id=party.id AND gm.token_hash=member_digest) THEN
  RAISE EXCEPTION 'No tienes acceso a este grupo';
 END IF;
 RETURN jsonb_build_object('code',party.code,'game',party.active_game,
  'game_code',party.active_code,'phase',party.phase,'target_game',party.target_game,
  'version',party.version,'is_host',member_digest=party.host_token_hash);
END $$;

-- Solo se devuelve destino de una invitación cuyo código ya se conoce.
-- Sirve tanto para invitados nuevos como para antiguos miembros.
CREATE OR REPLACE FUNCTION public.gu_public(p_code text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE party public.gu_parties%ROWTYPE;
BEGIN
 SELECT * INTO party FROM public.gu_parties WHERE code=upper(trim(p_code));
 IF party.id IS NULL THEN RAISE EXCEPTION 'El grupo no existe'; END IF;
 RETURN jsonb_build_object('code',party.code,'game',party.active_game,
  'game_code',party.active_code,'phase',party.phase,'target_game',party.target_game);
END $$;

-- El anfitrión pide el cambio SOLO cuando la ronda actual terminó.
CREATE OR REPLACE FUNCTION public.gu_open(p_code text,p_token text,p_target text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE party public.gu_parties%ROWTYPE; d jsonb; status_now text; total integer;
BEGIN
 SELECT * INTO party FROM public.gu_parties WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF party.id IS NULL THEN RAISE EXCEPTION 'No se encuentra el grupo'; END IF;
 IF encode(extensions.digest(coalesce(p_token,''),'sha256'),'hex')
    IS DISTINCT FROM party.host_token_hash THEN
  RAISE EXCEPTION 'Solo el anfitrión puede cambiar el juego';
 END IF;
 IF party.phase<>'ready' THEN RAISE EXCEPTION 'El cambio de juego ya está en curso'; END IF;
 IF p_target IS NULL OR p_target NOT IN ('quien','cromazo','impostor','queprefieres')
    OR p_target=party.active_game THEN
  RAISE EXCEPTION 'Elige otro juego de la biblioteca';
 END IF;
 d:=public.gu_native_state(party.active_game,party.active_code,p_token);
 IF NOT public.gu_is_host(party.active_game,d) THEN
  RAISE EXCEPTION 'Ya no eres anfitrión del juego activo';
 END IF;
 status_now:=CASE WHEN party.active_game='quien' THEN d->'room'->>'status'
                  ELSE d->>'status' END;
 IF status_now NOT IN ('ended','result','results') THEN
  RAISE EXCEPTION 'Espera a que termine la ronda para cambiar de juego';
 END IF;
 total:=CASE WHEN party.active_game='quien' THEN jsonb_array_length(d->'players')
             ELSE jsonb_array_length(d->'players') END;
 IF p_target='impostor' AND total<3 THEN
  RAISE EXCEPTION 'Impostor necesita al menos tres jugadores';
 END IF;
 IF total<2 THEN RAISE EXCEPTION 'Se necesitan dos jugadores para cambiar'; END IF;
 UPDATE public.gu_parties SET phase='switching',target_game=p_target,
  version=version+1,updated_at=now() WHERE id=party.id;
 RETURN jsonb_build_object('code',party.code,'target_game',p_target,'phase','switching');
END $$;

-- El anfitrión crea la nueva partida nativa mediante RPC y confirma al hub.
-- El resto del grupo la sigue y se incorpora sin tener que escribir nombres.
CREATE OR REPLACE FUNCTION public.gu_activate(p_code text,p_token text,p_game_code text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE party public.gu_parties%ROWTYPE; d jsonb; target_code text:=upper(trim(p_game_code));
BEGIN
 SELECT * INTO party FROM public.gu_parties WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF party.id IS NULL THEN RAISE EXCEPTION 'No se encuentra el grupo'; END IF;
 IF encode(extensions.digest(coalesce(p_token,''),'sha256'),'hex')
   IS DISTINCT FROM party.host_token_hash THEN
  RAISE EXCEPTION 'Solo el anfitrión puede completar el cambio';
 END IF;
 IF party.phase<>'switching' OR party.target_game IS NULL THEN
  RAISE EXCEPTION 'No hay ningún cambio pendiente';
 END IF;
 d:=public.gu_native_state(party.target_game,target_code,p_token);
 IF NOT public.gu_is_host(party.target_game,d) THEN
  RAISE EXCEPTION 'La nueva sala debe pertenecer al mismo anfitrión';
 END IF;
 IF EXISTS(SELECT 1 FROM public.gu_links WHERE game=party.target_game
    AND game_code=target_code AND party_id<>party.id) THEN
  RAISE EXCEPTION 'La nueva sala está ocupada por otro grupo';
 END IF;
 INSERT INTO public.gu_links(party_id,game,game_code) VALUES(party.id,party.target_game,target_code)
  ON CONFLICT(game,game_code) DO NOTHING;
 UPDATE public.gu_parties SET active_game=party.target_game,
  active_code=target_code,phase='ready',target_game=NULL,
  version=version+1,updated_at=now() WHERE id=party.id;
 RETURN jsonb_build_object('code',party.code,'game',party.target_game,'game_code',target_code,'phase','ready');
END $$;

REVOKE ALL ON FUNCTION public.gu_attach(text,text,text,text),
 public.gu_status(text,text),public.gu_public(text),
 public.gu_open(text,text,text),public.gu_activate(text,text,text)
 FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gu_attach(text,text,text,text),
 public.gu_status(text,text),public.gu_public(text),
 public.gu_open(text,text,text),public.gu_activate(text,text,text)
 TO anon,authenticated;
