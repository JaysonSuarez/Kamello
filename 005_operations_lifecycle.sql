-- ============================================================
-- MIGRACION 005: Ciclo de vida, rating, historial y expiracion
-- Proyecto: Kamello
-- ============================================================
-- Ejecutar despues de 004_mvp_dispatch_chat.sql.
-- ============================================================

-- 1. Estados validos. La tabla original usa ENUM; para poder evolucionar
-- el MVP con menos friccion lo convertimos a TEXT con CHECK explicito.
ALTER TABLE public.operations
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.operations
  ALTER COLUMN status TYPE TEXT USING status::TEXT;

ALTER TABLE public.operations
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.operations
  DROP CONSTRAINT IF EXISTS operations_status_check;

ALTER TABLE public.operations
  ADD CONSTRAINT operations_status_check
  CHECK (status IN (
    'pending',
    'accepted',
    'rejected',
    'in_progress',
    'completed',
    'rated',
    'cancelled',
    'expired'
  ));

-- 2. Campos de lifecycle, expiracion y rating agregado.
ALTER TABLE public.operations
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '20 minutes');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  ADD COLUMN IF NOT EXISTS rating_count INT NOT NULL DEFAULT 0 CHECK (rating_count >= 0);

-- 3. Rating por operacion. En el MVP solo el cliente califica al proveedor.
CREATE TABLE IF NOT EXISTS public.operation_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT CHECK (comment IS NULL OR char_length(comment) <= 800),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (operation_id, reviewer_id)
);

ALTER TABLE public.operation_ratings ENABLE ROW LEVEL SECURITY;

-- 4. Indices para estados, historial, ratings y expiracion.
CREATE INDEX IF NOT EXISTS idx_operations_status
  ON public.operations (status);

CREATE INDEX IF NOT EXISTS idx_operations_status_updated
  ON public.operations (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_operations_pending_expires
  ON public.operations (expires_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_operation_ratings_operation
  ON public.operation_ratings (operation_id);

CREATE INDEX IF NOT EXISTS idx_operation_ratings_reviewed_created
  ON public.operation_ratings (reviewed_id, created_at DESC);

-- 5. RLS de operaciones para transiciones nuevas.
DROP POLICY IF EXISTS "ops_update_provider_lifecycle" ON public.operations;
CREATE POLICY "ops_update_provider_lifecycle" ON public.operations
  FOR UPDATE TO authenticated
  USING (
    kamellador_id = auth.uid()
    AND status IN ('accepted', 'in_progress')
  )
  WITH CHECK (
    kamellador_id = auth.uid()
    AND status IN ('in_progress', 'completed')
  );

DROP POLICY IF EXISTS "ops_update_client_rate_state" ON public.operations;
CREATE POLICY "ops_update_client_rate_state" ON public.operations
  FOR UPDATE TO authenticated
  USING (
    client_id = auth.uid()
    AND status = 'completed'
  )
  WITH CHECK (
    client_id = auth.uid()
    AND status = 'rated'
  );

-- 6. RLS de ratings.
DROP POLICY IF EXISTS "operation_ratings_select_participants" ON public.operation_ratings;
CREATE POLICY "operation_ratings_select_participants" ON public.operation_ratings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.operations o
      WHERE o.id = operation_ratings.operation_id
        AND (o.client_id = auth.uid() OR o.kamellador_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "operation_ratings_insert_client_after_completed" ON public.operation_ratings;
CREATE POLICY "operation_ratings_insert_client_after_completed" ON public.operation_ratings
  FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.operations o
      WHERE o.id = operation_ratings.operation_id
        AND o.client_id = auth.uid()
        AND o.kamellador_id = operation_ratings.reviewed_id
        AND o.status = 'completed'
    )
  );

-- 7. RPC atomico para calificar y actualizar promedio. Esto evita que el
-- cliente necesite permisos directos para editar rating_avg en profiles.
CREATE OR REPLACE FUNCTION public.rate_operation(
  p_operation_id UUID,
  p_rating INT,
  p_comment TEXT DEFAULT NULL
)
RETURNS public.operation_ratings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operation public.operations%ROWTYPE;
  v_rating public.operation_ratings%ROWTYPE;
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_operation
  FROM public.operations
  WHERE id = p_operation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'operation not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_operation.client_id <> auth.uid() THEN
    RAISE EXCEPTION 'only the client can rate this operation'
      USING ERRCODE = '42501';
  END IF;

  IF v_operation.kamellador_id IS NULL THEN
    RAISE EXCEPTION 'operation has no provider'
      USING ERRCODE = '23514';
  END IF;

  IF v_operation.status <> 'completed' THEN
    RAISE EXCEPTION 'operation must be completed before rating'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.operation_ratings (
    operation_id,
    reviewer_id,
    reviewed_id,
    rating,
    comment
  )
  VALUES (
    v_operation.id,
    auth.uid(),
    v_operation.kamellador_id,
    p_rating,
    NULLIF(trim(p_comment), '')
  )
  RETURNING * INTO v_rating;

  UPDATE public.operations
  SET status = 'rated'
  WHERE id = v_operation.id;

  UPDATE public.profiles p
  SET rating_avg = provider_rating.avg_rating,
      rating_count = provider_rating.rating_count
  FROM (
    SELECT
      reviewed_id,
      round(avg(rating)::numeric, 2) AS avg_rating,
      count(*)::int AS rating_count
    FROM public.operation_ratings
    WHERE reviewed_id = v_operation.kamellador_id
    GROUP BY reviewed_id
  ) AS provider_rating
  WHERE p.id = provider_rating.reviewed_id;

  RETURN v_rating;
END;
$$;

REVOKE ALL ON FUNCTION public.rate_operation(UUID, INT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rate_operation(UUID, INT, TEXT) TO authenticated;

-- 8. Expiracion automatica de solicitudes pendientes.
CREATE OR REPLACE FUNCTION public.expire_pending_operations()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE public.operations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_pending_operations() FROM PUBLIC;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $cron_setup$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'kamello-expire-pending-operations'
  ) THEN
    PERFORM cron.unschedule('kamello-expire-pending-operations');
  END IF;

  PERFORM cron.schedule(
    'kamello-expire-pending-operations',
    '*/5 * * * *',
    $$SELECT public.expire_pending_operations();$$
  );
END
$cron_setup$;
