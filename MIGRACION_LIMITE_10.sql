-- ¿Una partidita? / ¿Quién soy?
-- Migración de la sala existente a un máximo real de 10 jugadores.
-- Ejecutar UNA VEZ en SQL Editor del Supabase original.
-- El frontend ya muestra 10, pero la aplicación debe imponer el límite en servidor.
CREATE OR REPLACE FUNCTION public.join_room(p_code text, p_name text, p_token text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r rooms; existing players; n text:=_clean_name(p_name); pid uuid; g_status text;
BEGIN
 IF p_token IS NULL OR length(p_token)<16 OR length(p_token)>128 THEN
  RAISE EXCEPTION 'Sesión no válida';
 END IF;
 SELECT * INTO r FROM rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'No existe ninguna sala con ese código'; END IF;
 SELECT * INTO existing FROM players WHERE room_id=r.id AND token_hash=_hash(p_token);
 IF EXISTS (SELECT 1 FROM players WHERE room_id=r.id AND lower(name)=lower(n)
 AND (existing.id IS NULL OR id<>existing.id)) THEN
  RAISE EXCEPTION 'Ya hay alguien llamado "%" en la sala. Elige otro nombre', n;
 END IF;
 IF existing.id IS NOT NULL THEN
   UPDATE players SET name=n,last_seen=clock_timestamp() WHERE id=existing.id;
 ELSE
   SELECT status INTO g_status FROM turn_sessions WHERE room_id=r.id;
   IF coalesce(g_status,'lobby')<>'playing' THEN
     DELETE FROM players WHERE room_id=r.id AND id<>r.host_player_id
       AND last_seen < clock_timestamp() - interval '30 minutes';
   END IF;
   IF (SELECT count(*) FROM players WHERE room_id=r.id)>=10 THEN
     RAISE EXCEPTION 'La sala está llena (máximo 10 personas)';
   END IF;
   INSERT INTO players(room_id,name,token_hash)
    VALUES(r.id,n,_hash(p_token)) RETURNING id INTO pid;
   IF r.host_player_id IS NULL THEN
     UPDATE rooms SET host_player_id=pid WHERE id=r.id;
   END IF;
 END IF;
 PERFORM _bump(r.id);
 RETURN r.code;
END $function$;
