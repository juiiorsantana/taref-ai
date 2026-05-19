-- Migration: Fix infinite recursion in RLS policies
-- Cria função SECURITY DEFINER que busca role sem disparar RLS,
-- depois reescreve todas as policies usando essa função.

-- 1. Função helper: retorna o role do usuário autenticado bypassando RLS
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Permitir que usuários autenticados chamem a função
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO anon;

-- ─── profiles policies (reescritas sem recursão) ─────────────────────────────

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR public.current_user_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = public.current_user_role()
  );

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ─── clients policies ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients
  FOR SELECT USING (
    created_by = auth.uid()
    OR public.current_user_role() IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "clients_insert" ON public.clients;
CREATE POLICY "clients_insert" ON public.clients
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND public.current_user_role() IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "clients_update" ON public.clients;
CREATE POLICY "clients_update" ON public.clients
  FOR UPDATE USING (
    created_by = auth.uid()
    OR public.current_user_role() IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "clients_delete" ON public.clients;
CREATE POLICY "clients_delete" ON public.clients
  FOR DELETE USING (
    created_by = auth.uid()
    OR public.current_user_role() IN ('admin', 'super_admin')
  );

-- ─── projects policies ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    created_by = auth.uid()
    OR public.current_user_role() IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (
    created_by = auth.uid()
    OR public.current_user_role() IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE USING (
    created_by = auth.uid()
    OR public.current_user_role() IN ('admin', 'super_admin')
  );

-- ─── tasks policies ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
      AND (
        p.created_by = auth.uid()
        OR public.current_user_role() IN ('admin', 'super_admin')
      )
    )
  );

DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id
    )
  );

DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
      AND (
        p.created_by = auth.uid()
        OR public.current_user_role() IN ('admin', 'super_admin')
      )
    )
  );

DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
      AND (
        p.created_by = auth.uid()
        OR public.current_user_role() IN ('admin', 'super_admin')
      )
    )
  );
