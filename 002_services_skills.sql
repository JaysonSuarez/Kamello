-- ============================================================
-- MIGRACIÓN 002: Categorías, Habilidades y Habilidades del Técnico
-- ============================================================

-- ── 1. TABLA: categories ───────────────────────────────────
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. TABLA: skills ───────────────────────────────────────
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. TABLA: kamellador_skills ────────────────────────────
CREATE TABLE public.kamellador_skills (
  kamellador_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  experience_years INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (kamellador_id, skill_id)
);

-- ── 4. SEGURIDAD (RLS) ─────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kamellador_skills ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver categorías
CREATE POLICY "categories_read_all" ON public.categories FOR SELECT TO authenticated USING (true);

-- Todos pueden ver skills
CREATE POLICY "skills_read_all" ON public.skills FOR SELECT TO authenticated USING (true);

-- Todos pueden ver las skills de los kamelladores
CREATE POLICY "k_skills_read_all" ON public.kamellador_skills FOR SELECT TO authenticated USING (true);

-- Los kamelladores pueden gestionar sus propias skills
CREATE POLICY "k_skills_insert_own" ON public.kamellador_skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = kamellador_id);
CREATE POLICY "k_skills_update_own" ON public.kamellador_skills FOR UPDATE TO authenticated USING (auth.uid() = kamellador_id) WITH CHECK (auth.uid() = kamellador_id);
CREATE POLICY "k_skills_delete_own" ON public.kamellador_skills FOR DELETE TO authenticated USING (auth.uid() = kamellador_id);
