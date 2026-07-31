DO $$ BEGIN
  CREATE TYPE public.empresa_codigo AS ENUM ('dom-luiz-gonzaga','humberto-lucena','distrital-belem');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.especialidades ADD COLUMN IF NOT EXISTS empresa public.empresa_codigo NOT NULL DEFAULT 'dom-luiz-gonzaga';
ALTER TABLE public.areas_emergencia ADD COLUMN IF NOT EXISTS empresa public.empresa_codigo NOT NULL DEFAULT 'dom-luiz-gonzaga';
ALTER TABLE public.setores_internacao ADD COLUMN IF NOT EXISTS empresa public.empresa_codigo NOT NULL DEFAULT 'dom-luiz-gonzaga';
ALTER TABLE public.unidades_criticas ADD COLUMN IF NOT EXISTS empresa public.empresa_codigo NOT NULL DEFAULT 'dom-luiz-gonzaga';

UPDATE public.especialidades SET empresa = 'dom-luiz-gonzaga' WHERE empresa IS NULL;
UPDATE public.areas_emergencia SET empresa = 'dom-luiz-gonzaga' WHERE empresa IS NULL;
UPDATE public.setores_internacao SET empresa = 'dom-luiz-gonzaga' WHERE empresa IS NULL;
UPDATE public.unidades_criticas SET empresa = 'dom-luiz-gonzaga' WHERE empresa IS NULL;

CREATE INDEX IF NOT EXISTS idx_especialidades_user_empresa ON public.especialidades (user_id, empresa);
CREATE INDEX IF NOT EXISTS idx_areas_emergencia_user_empresa ON public.areas_emergencia (user_id, empresa);
CREATE INDEX IF NOT EXISTS idx_setores_internacao_user_empresa ON public.setores_internacao (user_id, empresa);
CREATE INDEX IF NOT EXISTS idx_unidades_criticas_user_empresa ON public.unidades_criticas (user_id, empresa);