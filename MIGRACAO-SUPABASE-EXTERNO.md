# Migração do banco: Lovable Cloud → Supabase externo

Arquivos gerados:

- `supabase/export/schema-completo.sql` — recria toda a estrutura (enum, tabelas, GRANTs, RLS, índices, funções e triggers).
- `supabase/export/dados-atuais.sql` — os 30 registros existentes hoje (especialidades, áreas, setores e unidades críticas), com os `user_id` originais.

---

## Passo 1 — Criar o projeto no Supabase

1. Acesse `supabase.com` → **New project**.
2. Escolha a região mais próxima (ex.: `South America (São Paulo)`).
3. Guarde a **senha do banco** (usada pelo CLI e por `psql`).
4. Em **Project Settings → API**, anote:
   - `Project URL`
   - `anon / publishable key`

## Passo 2 — Criar a estrutura

No painel do novo projeto: **SQL Editor → New query** → cole todo o conteúdo de
`supabase/export/schema-completo.sql` → **Run**.

O script é idempotente (`IF NOT EXISTS` / `DROP ... IF EXISTS`), então pode ser
reexecutado sem quebrar nada.

Alternativa via CLI:

```bash
supabase link --project-ref SEU_REF
psql "postgresql://postgres:SENHA@db.SEU_REF.supabase.co:5432/postgres" \
  -f supabase/export/schema-completo.sql
```

## Passo 3 — Recriar os usuários (obrigatório antes dos dados)

As tabelas têm FK para `auth.users`. Como os dados atuais pertencem ao usuário
`8c6cab07-04a8-446f-95f6-1b0f88801d1a`, você tem duas opções:

**Opção A (recomendada) — recadastrar e reapontar**
1. Crie o usuário no novo projeto (**Authentication → Users → Add user**, com
   "Auto Confirm" marcado) ou cadastre-se pela própria aplicação.
2. Copie o novo UUID e substitua no arquivo de dados:
   ```bash
   sed -i 's/8c6cab07-04a8-446f-95f6-1b0f88801d1a/NOVO-UUID/g' \
     supabase/export/dados-atuais.sql
   ```

**Opção B — preservar o mesmo UUID**
Crie o usuário via Admin API informando o `id` original:

```bash
curl -X POST "https://SEU_REF.supabase.co/auth/v1/admin/users" \
  -H "apikey: SERVICE_ROLE_KEY" -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id":"8c6cab07-04a8-446f-95f6-1b0f88801d1a","email":"seu@email.com","password":"SenhaForte123","email_confirm":true}'
```

## Passo 4 — Importar os dados

SQL Editor → cole `supabase/export/dados-atuais.sql` → **Run**. Ou:

```bash
psql "postgresql://postgres:SENHA@db.SEU_REF.supabase.co:5432/postgres" \
  -f supabase/export/dados-atuais.sql
```

Os perfis são criados automaticamente pelo trigger `on_auth_user_created`.

## Passo 5 — Configurar Auth (campo a campo)

### 5.1 URL Configuration
**Authentication → URL Configuration**

| Campo | Valor |
|---|---|
| Site URL | `https://seu-dominio.vercel.app` (sem barra no final) |
| Redirect URLs | `https://seu-dominio.vercel.app/**` |
| Redirect URLs (adicionar) | `https://*-seu-projeto.vercel.app/**` (previews da Vercel) |
| Redirect URLs (adicionar) | `http://localhost:8080/**` (desenvolvimento) |

Clique em **Add URL** para cada linha e depois em **Save changes**.

### 5.2 Provider Email
**Authentication → Providers → Email**

| Campo | Valor recomendado |
|---|---|
| Enable Email provider | ativado |
| Confirm email | ativado (desative só se quiser login imediato após cadastro) |
| Secure email change | ativado |
| Minimum password length | `8` |
| Prevent use of leaked passwords | ativado |

**Authentication → Providers → Anonymous Sign-Ins**: **desativado**.

### 5.3 Provider Google — parte A: Google Cloud Console
1. `console.cloud.google.com` → crie/selecione um projeto.
2. **APIs & Services → OAuth consent screen**
   - User type: **External** → Create
   - App name: `AGHUse — Estrutura Assistencial`
   - User support email / Developer contact: seu e-mail
   - **Authorized domains**: `supabase.co` e `vercel.app` (e seu domínio próprio, se houver)
   - **Scopes** → Add or remove scopes → marque:
     `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`
   - Salve e (opcional) **Publish app** para sair do modo de teste.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `AGHUse Web`
   - **Authorized JavaScript origins**:
     `https://seu-dominio.vercel.app` e `http://localhost:8080`
   - **Authorized redirect URIs** (exatamente este):
     `https://SEU_REF.supabase.co/auth/v1/callback`
   - Create → copie **Client ID** e **Client Secret**.

### 5.4 Provider Google — parte B: Supabase
**Authentication → Providers → Google**

| Campo | Valor |
|---|---|
| Enable Sign in with Google | ativado |
| Client IDs | cole o Client ID do Google |
| Client Secret (for OAuth) | cole o Client Secret |
| Skip nonce check | desativado |
| Callback URL (for OAuth) | apenas copie — é o valor que já foi colado no Google |

Clique em **Save**.

### 5.5 Ajuste no código (importante fora do Lovable)
Em `src/routes/index.tsx` o login Google é híbrido: em `.lovable.app`/`localhost`
usa o broker do Lovable; em qualquer outro domínio usa
`supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`,
que é justamente o fluxo configurado acima. Nada precisa ser alterado — só
garanta que o domínio da Vercel esteja nas **Redirect URLs** (5.1).

### 5.6 Validação
1. Abra `https://seu-dominio.vercel.app`, clique em **Entrar com Google**.
2. Erro `redirect_uri_mismatch` → o redirect URI no Google não é exatamente
   `https://SEU_REF.supabase.co/auth/v1/callback`.
3. Erro `Unsupported provider` → o provider Google não foi salvo como ativo (5.4).
4. Login funciona mas volta para a tela de login → a URL de retorno não está nas
   **Redirect URLs** (5.1).
5. Confira em **Authentication → Users** se o usuário foi criado e em
   **Table Editor → profiles** se o perfil foi gerado pelo trigger.


## Passo 6 — Apontar a aplicação para o novo banco

Atualize as variáveis (no `.env` local, no `vercel.json` e nas Environment
Variables da Vercel):

```
VITE_SUPABASE_URL=https://SEU_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key
VITE_SUPABASE_PROJECT_ID=SEU_REF
```

Refaça o deploy depois de salvar.

## Passo 7 — Validar

```sql
select tablename, rowsecurity from pg_tables where schemaname='public';
select tablename, policyname, cmd, roles from pg_policies where schemaname='public';
select count(*) from especialidades;   -- esperado: 4
select count(*) from areas_emergencia; -- esperado: 10
select count(*) from setores_internacao; -- esperado: 5
select count(*) from unidades_criticas;  -- esperado: 11
```

Depois, faça login na aplicação e confirme que cada hospital mostra apenas os
seus registros.

---

## Boas práticas

- **Ordem importa**: enum → funções → tabelas → GRANTs → RLS → policies → índices → triggers.
- **GRANT não é opcional**: sem `GRANT` para `authenticated`, a API retorna erro
  de permissão mesmo com RLS correto. O script já inclui todos.
- **Nunca exponha a `service_role key`** no front-end nem em repositório; use-a só
  em terminal/servidor.
- **Versione as mudanças futuras** em `supabase/migrations/` e aplique com
  `supabase db push`, em vez de editar direto pelo painel.
- **Backups**: ative Point-in-Time Recovery (planos pagos) ou agende
  `pg_dump` periódico do schema `public`.
- **Teste em staging** antes de trocar a produção: crie um projeto de teste,
  rode os mesmos dois scripts e valide login + CRUD.
- **Rollback**: mantenha o Lovable Cloud ativo até a validação completa no novo
  ambiente; a troca é só uma mudança de variáveis de ambiente.

---

## Passo 8 — Arquivos e imagens

Este projeto **não usa Storage** (não há buckets no backend atual). Todas as
imagens são estáticas e ficam versionadas no próprio repositório:

- `public/aghuse-logo.png` — logo da tela de login
- `public/logos-rodape.png` — faixa de logos institucionais
- `public/favicon.ico`

Como são servidas pelo próprio deploy (Vercel/Lovable), **nada precisa ser
migrado**: basta manter a pasta `public/` no repositório. Referencie sempre por
caminho absoluto (`/aghuse-logo.png`), nunca por URL do Lovable.

### Se no futuro você usar Storage

1. No projeto novo: **Storage → New bucket** com o mesmo nome e visibilidade
   (público/privado) do original.
2. Baixe e reenvie os objetos:
   ```bash
   supabase storage cp -r ss://BUCKET ./backup-bucket --experimental   # origem
   supabase storage cp -r ./backup-bucket ss://BUCKET --experimental   # destino
   ```
3. Recrie as policies de `storage.objects` (leitura/escrita por `auth.uid()`).
4. Atualize no código qualquer URL fixa que contenha o ref antigo do projeto.
