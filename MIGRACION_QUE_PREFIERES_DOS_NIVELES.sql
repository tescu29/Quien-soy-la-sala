-- ¿Una partidita? · Dos intensidades (Tranquilo y Sin miedo al éxito).
-- Aplicación incremental, también para salas existentes.
-- Conserva los 180 dilemas: tranquilo utiliza nivel 1; sin miedo mezcla 2 y 3.
ALTER TABLE public.qp_rooms DROP CONSTRAINT IF EXISTS qp_rooms_intensity_check;
UPDATE public.qp_rooms SET intensity='sinmiedo',version=version+1,updated_at=now()
 WHERE intensity IN ('picante','sinfiltro');
ALTER TABLE public.qp_rooms ALTER COLUMN intensity SET DEFAULT 'sinmiedo';
ALTER TABLE public.qp_rooms ADD CONSTRAINT qp_rooms_intensity_check
 CHECK (intensity IN ('suave','sinmiedo'));

CREATE OR REPLACE FUNCTION public.qp_pick(p_intensity text,p_recent text[]) RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path=public,extensions AS $$
 SELECT d.id FROM public.qp_dilemmas d
 WHERE (CASE WHEN p_intensity='suave' THEN d.level=1 ELSE d.level>=2 END)
 ORDER BY (d.id=ANY(coalesce(p_recent,'{}'::text[]))),random()
 LIMIT 1
$$;

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
