-- =============================================================
-- AGHUse | Cadastro da Estrutura Assistencial
-- Script completo de recriação do banco em um projeto Supabase novo
-- Execute TUDO de uma vez no SQL Editor do novo projeto (é idempotente).
-- =============================================================

-- -------------------------------------------------------------
-- PASSO 1 — Extensões (normalmente já existem no Supabase)
-- -------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- -------------------------------------------------------------
-- PASSO 2 — Tipo enumerado das empresas (hospitais)
-- -------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'empresa_codigo') THEN
    CREATE TYPE public.empresa_codigo AS ENUM (
      'dom-luiz-gonzaga',
      'humberto-lucena',
      'distrital-belem',
      'guarabira',
      'solanea',
      'mamanguape',
      'arlinda-marques'
    );
  END IF;
END $$;

-- -------------------------------------------------------------
-- PASSO 3 — Funções utilitárias
-- -------------------------------------------------------------

-- 3.1 Atualiza automaticamente a coluna updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3.2 Cria o perfil quando um usuário se cadastra no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- -------------------------------------------------------------
-- PASSO 4 — Tabela profiles
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       text,
  email      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_own ON public.profiles;
CREATE POLICY profiles_own ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------
-- PASSO 5 — Tabela especialidades (Emergência)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.especialidades (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa    public.empresa_codigo NOT NULL DEFAULT 'dom-luiz-gonzaga',
  nome       text NOT NULL,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.especialidades TO authenticated;
GRANT ALL ON public.especialidades TO service_role;

ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS especialidades_own ON public.especialidades;
CREATE POLICY especialidades_own ON public.especialidades
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_especialidades_user_empresa
  ON public.especialidades (user_id, empresa);

DROP TRIGGER IF EXISTS trg_esp_updated ON public.especialidades;
CREATE TRIGGER trg_esp_updated
  BEFORE UPDATE ON public.especialidades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------
-- PASSO 6 — Tabela areas_emergencia
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.areas_emergencia (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa    public.empresa_codigo NOT NULL DEFAULT 'dom-luiz-gonzaga',
  tipo       text NOT NULL,
  descricao  text NOT NULL DEFAULT '',
  leitos     integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.areas_emergencia TO authenticated;
GRANT ALL ON public.areas_emergencia TO service_role;

ALTER TABLE public.areas_emergencia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS areas_own ON public.areas_emergencia;
CREATE POLICY areas_own ON public.areas_emergencia
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_areas_emergencia_user_empresa
  ON public.areas_emergencia (user_id, empresa);

DROP TRIGGER IF EXISTS trg_areas_updated ON public.areas_emergencia;
CREATE TRIGGER trg_areas_updated
  BEFORE UPDATE ON public.areas_emergencia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------
-- PASSO 7 — Tabela setores_internacao
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.setores_internacao (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa           public.empresa_codigo NOT NULL DEFAULT 'dom-luiz-gonzaga',
  nome              text NOT NULL,
  quartos           integer NOT NULL DEFAULT 0,
  leitos_por_quarto integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.setores_internacao TO authenticated;
GRANT ALL ON public.setores_internacao TO service_role;

ALTER TABLE public.setores_internacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS setores_own ON public.setores_internacao;
CREATE POLICY setores_own ON public.setores_internacao
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_setores_internacao_user_empresa
  ON public.setores_internacao (user_id, empresa);

DROP TRIGGER IF EXISTS trg_setores_updated ON public.setores_internacao;
CREATE TRIGGER trg_setores_updated
  BEFORE UPDATE ON public.setores_internacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------
-- PASSO 8 — Tabela unidades_criticas (UTI/UCI)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.unidades_criticas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa    public.empresa_codigo NOT NULL DEFAULT 'dom-luiz-gonzaga',
  tipo       text NOT NULL,
  perfil     text NOT NULL,
  nome       text NOT NULL,
  leitos     integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.unidades_criticas TO authenticated;
GRANT ALL ON public.unidades_criticas TO service_role;

ALTER TABLE public.unidades_criticas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS unidades_own ON public.unidades_criticas;
CREATE POLICY unidades_own ON public.unidades_criticas
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_unidades_criticas_user_empresa
  ON public.unidades_criticas (user_id, empresa);

DROP TRIGGER IF EXISTS trg_unidades_updated ON public.unidades_criticas;
CREATE TRIGGER trg_unidades_updated
  BEFORE UPDATE ON public.unidades_criticas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------
-- PASSO 9 — Trigger de criação automática de perfil no Auth
-- (precisa ser executado pelo owner do projeto: use o SQL Editor)
-- -------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------
-- PASSO 10 — Verificação final
-- -------------------------------------------------------------
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public';
-- SELECT trigger_name, event_object_table FROM information_schema.triggers;
