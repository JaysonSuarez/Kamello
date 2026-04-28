-- ============================================================
-- MIGRACIÓN 003: Operaciones (Trabajos / Solicitudes)
-- ============================================================

CREATE TYPE public.operation_status AS ENUM ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled');

-- ── 1. TABLA: operations ───────────────────────────────────
CREATE TABLE public.operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kamellador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id),
  description TEXT NOT NULL,
  status public.operation_status NOT NULL DEFAULT 'pending',
  proposed_price DECIMAL(10, 2),
  agreed_price DECIMAL(10, 2),
  scheduled_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER operations_set_updated_at
  BEFORE UPDATE ON public.operations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── 2. SEGURIDAD (RLS) ─────────────────────────────────────
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

-- Select: Clientes y kamelladores pueden ver operaciones en las que participan
CREATE POLICY "ops_select_participants" ON public.operations
  FOR SELECT TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = kamellador_id);

-- Insert: Solo clientes pueden crear operaciones (y el client_id debe ser ellos mismos)
CREATE POLICY "ops_insert_client" ON public.operations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);

-- Update: 
-- Clientes pueden cancelar si está pending.
-- Kamelladores pueden accept/reject si está pending, y marcar como complete si in_progress.
CREATE POLICY "ops_update_participants" ON public.operations
  FOR UPDATE TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = kamellador_id)
  WITH CHECK (auth.uid() = client_id OR auth.uid() = kamellador_id);
