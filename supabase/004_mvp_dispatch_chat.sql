-- ============================================================
-- MIGRACION 004: MVP despacho por especialidad + chat
-- Proyecto: Kamello
-- ============================================================
-- Ejecutar despues de 001_init_profiles.sql, 002_services_skills.sql
-- y 003_operations.sql.
-- ============================================================

-- 1. Campos que el frontend MVP ya usa en profiles.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS specialty TEXT,
  ADD COLUMN IF NOT EXISTS age INT,
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS current_lng NUMERIC;

-- 2. Campos necesarios para solicitudes pendientes y tracking.
ALTER TABLE public.operations
  ALTER COLUMN kamellador_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS service_code TEXT,
  ADD COLUMN IF NOT EXISTS client_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS client_lng NUMERIC;

-- 3. Catalogo simple para Supabase Studio y futuras pantallas API.
INSERT INTO public.categories (name, description, icon)
VALUES
  ('Linea blanca', 'Lavadoras, refrigeradores y electrodomesticos grandes.', 'washing-machine'),
  ('Hardware', 'Mantenimiento y reparacion de laptops, PCs y tablets.', 'laptop'),
  ('Moviles', 'Cambio de pantallas, baterias y diagnostico de celulares.', 'smartphone'),
  ('Soporte tecnico y ciberseguridad', 'Eliminacion de malware y recuperacion de datos.', 'shield-alert'),
  ('Domotica y seguridad', 'Camaras IP, cerraduras inteligentes y sensores.', 'camera'),
  ('Climatizacion', 'Mantenimiento de aires acondicionados.', 'air-vent'),
  ('Electricista', 'Electricidad residencial e industrial.', 'zap'),
  ('Fontanero', 'Fontaneria y plomeria.', 'droplets'),
  ('Albanil', 'Reparaciones locativas, muros y acabados.', 'hammer'),
  ('Pintor', 'Pintura interior, exterior y retoques.', 'paintbrush'),
  ('General', 'Mantenimiento general del hogar o negocio.', 'wrench')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    icon = EXCLUDED.icon;

-- 4. Indices para los caminos calientes del MVP.
CREATE INDEX IF NOT EXISTS idx_profiles_specialty_online
  ON public.profiles (specialty, is_online)
  WHERE role = 'kamellador' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_operations_pending_category_created
  ON public.operations (category, created_at DESC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_operations_client_active
  ON public.operations (client_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_operations_kamellador_active
  ON public.operations (kamellador_id, status, created_at DESC)
  WHERE kamellador_id IS NOT NULL;

-- 5. RLS para que kamelladores vean y acepten solicitudes pendientes
-- de su especialidad sin abrir datos de otros flujos.
DROP POLICY IF EXISTS "ops_select_pending_by_specialty" ON public.operations;
CREATE POLICY "ops_select_pending_by_specialty" ON public.operations
  FOR SELECT TO authenticated
  USING (
    status = 'pending'
    AND kamellador_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'kamellador'
        AND p.is_active = true
        AND (
          p.specialty = operations.category
          OR (p.specialty IN ('Albañil', 'AlbaÃ±il') AND operations.category = 'Albanil')
        )
    )
  );

DROP POLICY IF EXISTS "ops_update_accept_pending_by_specialty" ON public.operations;
CREATE POLICY "ops_update_accept_pending_by_specialty" ON public.operations
  FOR UPDATE TO authenticated
  USING (
    status = 'pending'
    AND kamellador_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'kamellador'
        AND p.is_active = true
        AND (
          p.specialty = operations.category
          OR (p.specialty IN ('Albañil', 'AlbaÃ±il') AND operations.category = 'Albanil')
        )
    )
  )
  WITH CHECK (
    kamellador_id = auth.uid()
    AND status IN ('accepted', 'in_progress')
  );

-- 6. Chat simple por operacion.
CREATE TABLE IF NOT EXISTS public.operation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 1200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.operation_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_operation_messages_operation_created
  ON public.operation_messages (operation_id, created_at);

DROP POLICY IF EXISTS "operation_messages_select_participants" ON public.operation_messages;
CREATE POLICY "operation_messages_select_participants" ON public.operation_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.operations o
      WHERE o.id = operation_messages.operation_id
        AND (o.client_id = auth.uid() OR o.kamellador_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "operation_messages_insert_participants" ON public.operation_messages;
CREATE POLICY "operation_messages_insert_participants" ON public.operation_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.operations o
      WHERE o.id = operation_messages.operation_id
        AND o.status IN ('pending', 'accepted', 'in_progress')
        AND (o.client_id = auth.uid() OR o.kamellador_id = auth.uid())
    )
  );

-- 7. Realtime para despacho y mensajes. Estos bloques evitan error si las
-- tablas ya fueron agregadas a la publicacion.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'operations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.operations;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'operation_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.operation_messages;
  END IF;
END $$;
