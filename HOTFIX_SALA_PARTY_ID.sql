-- Corrige el error PostgreSQL «column reference party_id is ambiguous».
-- Redeclara gu_attach sin variable local homónima al índice UNIQUE.
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
