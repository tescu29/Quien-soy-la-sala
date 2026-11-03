-- Enlace permanente para salas de grupo, independientemente del juego activo.
-- `?grupo=ABC123` resuelve a Impostor o ¿Qué prefieres? sin revelar información privada.
CREATE OR REPLACE FUNCTION public.gp_resolve(p_code text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE c text:=upper(trim(p_code)); current_game text; im_exists boolean; qp_exists boolean;
BEGIN
 IF c IS NULL OR c !~ '^[A-F0-9]{6}$' THEN RAISE EXCEPTION 'Código de sala inválido'; END IF;
 SELECT game INTO current_game FROM public.gp_switches WHERE code=c;
 IF current_game IS NULL THEN
  SELECT EXISTS(SELECT 1 FROM public.im_rooms WHERE code=c) INTO im_exists;
  SELECT EXISTS(SELECT 1 FROM public.qp_rooms WHERE code=c) INTO qp_exists;
  IF im_exists AND NOT qp_exists THEN current_game:='impostor';
  ELSIF qp_exists AND NOT im_exists THEN current_game:='queprefieres';
  ELSIF im_exists AND qp_exists THEN RAISE EXCEPTION 'El código pertenece a varias salas; pide un enlace actualizado';
  ELSE RAISE EXCEPTION 'No existe ninguna sala con ese código';
  END IF;
 END IF;
 RETURN jsonb_build_object('code',c,'game',current_game);
END $$;
REVOKE ALL ON FUNCTION public.gp_resolve(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gp_resolve(text) TO anon,authenticated;
