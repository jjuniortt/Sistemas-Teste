# Deploy na Vercel mantendo o Supabase do Lovable

Este guia explica como publicar a aplicação na Vercel usando o backend (Supabase) gerenciado pelo Lovable.

## O que já está pronto no código

- `vercel.json` com as variáveis de ambiente do Supabase do Lovable.
- Build configurado para o preset `vercel` do Nitro.
- Imagens em `public/` (não dependem mais do CDN do Lovable).
- Login por e-mail/senha e Google funcionando no preview Lovable.
- Login Google com fallback nativo do Supabase para domínios fora do Lovable.

## Opção 1: deploy via GitHub (recomendada)

### 1. Conectar o projeto Lovable ao GitHub

1. No editor do Lovable, clique no menu **+** (canto inferior esquerdo).
2. Escolha **GitHub → Connect project**.
3. Autorize o aplicativo do Lovable no GitHub.
4. Selecione a conta/organização onde o repositório será criado.
5. Clique em **Create Repository**.

Isso cria um repositório público ou privado no seu GitHub e sincroniza o código automaticamente.

### 2. Importar o repositório na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login.
2. Clique em **Add New Project**.
3. Em **Import Git Repository**, selecione o repositório criado pelo Lovable.
4. A Vercel detectará automaticamente:
   - **Framework Preset**: Other
   - **Build Command**: `bun run build`
   - **Install Command**: `bun install`
   - **Output Directory**: gerado pelo Nitro (não precisa preencher)
5. As variáveis de ambiente já estão em `vercel.json`, então não é obrigatório adicionar manualmente em **Environment Variables**.
6. Clique em **Deploy**.

### 3. Configurar domínio e redirecionamentos do Google

Após o primeiro deploy, a Vercel fornecerá uma URL do tipo `https://<nome-do-projeto>.vercel.app`.

O login por e-mail/senha já funcionará imediatamente.

Para o login com Google funcionar na URL da Vercel, é necessário que o domínio esteja autorizado no Supabase:

- Entre em contato com o suporte do Lovable solicitando a inclusão da URL da Vercel em **Authentication → URL Configuration → Redirect URLs** do projeto Supabase.
- Ou, se tiver acesso ao painel do Supabase, adicione manualmente:
  - `https://<nome-do-projeto>.vercel.app`
  - `https://<nome-do-projeto>.vercel.app/auth/callback`

> O login Google no preview Lovable continuará funcionando normalmente.

## Opção 2: deploy via Vercel CLI

Use esta opção se não quiser expor o código no GitHub ou precisar publicar rapidamente.

1. Instale a Vercel CLI:

   ```bash
   bun add -g vercel
   ```

2. Autentique-se:

   ```bash
   vercel login
   ```

3. Execute o script de deploy:

   ```bash
   bun run deploy:vercel
   # ou
   ./scripts/deploy-vercel.sh
   ```

4. A primeira execução perguntará algumas configurações do projeto. Nas próximas, use `--prod` para publicar em produção.

## Variáveis de ambiente

As variáveis abaixo já estão em `vercel.json`. Se preferir cadastrá-las manualmente no painel da Vercel, remova ou mantenha o `vercel.json` conforme desejado:

```bash
VITE_SUPABASE_URL=https://pmgjturepkodvsoxubkg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_RS6MhIGUfRqmd4PHr6Yu4w_P_ooMISw
VITE_SUPABASE_PROJECT_ID=pmgjturepkodvsoxubkg
SUPABASE_URL=https://pmgjturepkodvsoxubkg.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_RS6MhIGUfRqmd4PHr6Yu4w_P_ooMISw
SUPABASE_PROJECT_ID=pmgjturepkodvsoxubkg
```

Não é necessário `SUPABASE_SERVICE_ROLE_KEY`: o app usa autenticação de usuário e RLS.

## Checklist de validação

- [ ] `/` carrega com a logo AGHUse visível
- [ ] Login por e-mail/senha funciona
- [ ] Login com Google redireciona e retorna autenticado (após autorizar o domínio no Supabase)
- [ ] Cadastro salva e recarrega dados por empresa
- [ ] Exportar CSV/JSON/PDF funcionam

## Solução de problemas

### Logos não aparecem

Verifique se os arquivos `public/aghuse-logo.png` e `public/logos-rodape.png` estão no repositório e se o `.gitignore` não os exclui.

### Banco não conecta

Verifique se as variáveis de ambiente do Supabase foram aplicadas. Na Vercel, vá em **Project Settings → Environment Variables** e confirme que `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` estão presentes.

### Login com Google falha

Verifique se o domínio da Vercel foi adicionado aos **Redirect URLs** do Supabase. O erro comum é `redirect_uri_mismatch`.
