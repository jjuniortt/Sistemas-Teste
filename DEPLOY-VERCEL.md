# Deploy na Vercel com Supabase próprio

## 1. Variáveis de ambiente (Vercel > Settings > Environment Variables)

Copie os nomes de `.env.example` e preencha com os dados do seu projeto Supabase
(Project Settings > API):

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID`

Aplique em Production, Preview e Development. Depois faça **Redeploy** — variáveis
`VITE_*` são inseridas no bundle em tempo de build.

## 2. Build

- Framework preset: **Other** (ou Vite)
- Build command: `npm run build`
- Output: gerado pelo Nitro com preset `vercel` (detectado automaticamente pela
  variável `VERCEL` que a plataforma define). Para forçar: `NITRO_PRESET=vercel`.

## 3. Autenticação

- Supabase > Authentication > URL Configuration:
  - Site URL: `https://SEU-APP.vercel.app`
  - Redirect URLs: `https://SEU-APP.vercel.app/**`
- Google: habilite o provider em Supabase > Authentication > Providers > Google
  com Client ID/Secret do Google Cloud, e adicione
  `https://SEU-PROJETO.supabase.co/auth/v1/callback` como Authorized redirect URI.
  Fora do Lovable o app usa o OAuth nativo do Supabase (o broker do Lovable só é
  usado no preview do Lovable).

## 4. Imagens

As logos agora ficam em `public/aghuse-logo.png` e `public/logos-rodape.png`,
versionadas no repositório (não dependem mais do CDN do Lovable).

## 5. Banco de dados

Aplique as migrações de `supabase/migrations` no seu projeto:

```bash
supabase link --project-ref SEU-PROJETO
supabase db push
```

## Checklist de validação

- [ ] `/` carrega com as duas logos visíveis
- [ ] Login por e-mail/senha funciona
- [ ] Login com Google redireciona e retorna autenticado
- [ ] Cadastro salva e recarrega dados por empresa
- [ ] Exportar CSV/JSON/PDF funcionam
