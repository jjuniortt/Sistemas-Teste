# Deploy na Vercel com Supabase próprio

## 1. Variáveis de ambiente

As variáveis públicas necessárias para conectar este aplicativo ao backend já
estão definidas em `vercel.json` e serão aplicadas automaticamente pela Vercel:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID`

Não é necessário adicionar uma chave administrativa: o aplicativo usa a sessão
do usuário e as regras de isolamento de dados do banco.

## 2. Build

- Framework preset: **Other**
- Build command: `bun run build`
- Install command: `bun install`
- Output: gerado pelo Nitro com preset `vercel` (detectado automaticamente pela
  variável `VERCEL` que a plataforma define). Para forçar: `NITRO_PRESET=vercel`.

## 3. Autenticação

- E-mail/senha e Google já estão habilitados no backend.
- O login Google usa o provedor gerenciado e envia como retorno a origem atual
  (`window.location.origin`), funcionando tanto no preview quanto na Vercel.
- Não é necessário criar ou copiar Client ID/Secret do Google.

## 4. Imagens

As logos agora ficam em `public/aghuse-logo.png` e `public/logos-rodape.png`,
versionadas no repositório (não dependem mais do CDN do Lovable).

## 5. Banco de dados

O backend conectado já contém as tabelas, regras de acesso e migrações deste
repositório. Os arquivos em `supabase/migrations` permanecem versionados para
recuperação e auditoria.

```bash
# Apenas para restaurar em outro projeto de banco:
supabase link --project-ref SEU-PROJETO
supabase db push
```

## Checklist de validação

- [ ] `/` carrega com as duas logos visíveis
- [ ] Login por e-mail/senha funciona
- [ ] Login com Google redireciona e retorna autenticado
- [ ] Cadastro salva e recarrega dados por empresa
- [ ] Exportar CSV/JSON/PDF funcionam
