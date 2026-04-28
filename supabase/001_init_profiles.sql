-- ============================================================
-- MIGRACIÓN 001: Tabla profiles + Trigger + RLS
-- Proyecto: Kamello
-- ============================================================
-- INSTRUCCIONES:
-- Ejecutar en Supabase SQL Editor o via Supabase CLI:
--   supabase db push
-- ============================================================


-- ── 1. ENUM para el rol de usuario ──────────────────────────
-- Solo dos roles posibles en el sistema. El ENUM garantiza
-- integridad a nivel de base de datos sin validación extra.
CREATE TYPE public.user_role AS ENUM ('client', 'kamellador');


-- ── 2. TABLA: profiles ──────────────────────────────────────
-- Extiende auth.users (gestionado por Supabase) con datos
-- propios de la aplicación Kamello.
CREATE TABLE public.profiles (
  -- PK ligada 1:1 a auth.users. ON DELETE CASCADE garantiza
  -- que si el usuario se borra del sistema de auth, su perfil
  -- también desaparece automáticamente.
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  role          public.user_role NOT NULL,
  full_name     TEXT        NOT NULL CHECK (char_length(full_name) >= 2),

  -- El teléfono es UNIQUE para evitar cuentas duplicadas.
  -- Es NULLABLE porque en desarrollo podemos usar email OTP.
  phone         TEXT        UNIQUE,

  avatar_url    TEXT,

  -- Soft delete: nunca borramos un perfil, lo desactivamos.
  is_active     BOOLEAN     NOT NULL DEFAULT true,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentario de tabla (visible en Supabase Studio)
COMMENT ON TABLE public.profiles IS
  'Perfil público de cada usuario. Extiende auth.users con datos de Kamello.';


-- ── 3. TRIGGER: updated_at automático ───────────────────────
-- Función reutilizable que actualiza updated_at en cualquier tabla.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- ── 4. TRIGGER: auto-crear perfil al registrarse ────────────
-- Cuando Supabase crea un usuario en auth.users (después de
-- verificar OTP), este trigger lee los user_metadata que
-- enviamos desde la app y crea la fila en public.profiles.
--
-- Los datos esperados en raw_user_meta_data:
--   { "role": "client"|"kamellador", "full_name": "..." }
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Se ejecuta con permisos del owner (postgres)
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (
    NEW.id,
    -- Castea el string del metadata al tipo ENUM. Si el valor
    -- no es válido, PostgreSQL lanzará un error controlado.
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario Kamello'),
    -- El teléfono puede venir nulo si usamos auth por email
    NEW.phone
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ── 5. ROW LEVEL SECURITY (RLS) ─────────────────────────────
-- CRÍTICO: Sin RLS, cualquier usuario autenticado puede leer
-- todos los perfiles. Activamos RLS y definimos políticas
-- explícitas para cada operación.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ── POLICY: SELECT ──────────────────────────────────────────

-- Un usuario SIEMPRE puede leer su propio perfil.
CREATE POLICY "profiles: leer perfil propio"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Un usuario autenticado puede leer perfiles de KAMELLADORES
-- activos (para que los clientes puedan buscar técnicos).
-- Los perfiles de otros clientes NO son visibles entre sí.
CREATE POLICY "profiles: leer kamelladores activos"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'kamellador'
    AND is_active = true
  );

-- ── POLICY: INSERT ──────────────────────────────────────────
-- El perfil solo lo puede crear el propio usuario.
-- En la práctica, esto lo hace el trigger handle_new_user,
-- pero la política protege contra inserciones directas a la API.
CREATE POLICY "profiles: insertar perfil propio"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ── POLICY: UPDATE ──────────────────────────────────────────
-- Solo el dueño del perfil puede modificarlo.
-- El role NO puede cambiarse una vez asignado (ver constraint abajo).
CREATE POLICY "profiles: actualizar perfil propio"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── POLICY: DELETE ──────────────────────────────────────────
-- Borrado físico deshabilitado. Se usa is_active = false.
-- No existe política de DELETE → nadie puede borrar.


-- ── 6. ÍNDICES de performance ───────────────────────────────
-- Para las búsquedas por rol y estado (muy frecuentes en el muro
-- de proyectos y el mapa de servicios).
CREATE INDEX idx_profiles_role_active
  ON public.profiles (role, is_active);
