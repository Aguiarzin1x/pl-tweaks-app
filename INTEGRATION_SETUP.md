# PL Tweaks — integrações

## Observação sobre a arquitetura

O arquivo enviado usa **Vite + React + React Router** no frontend (não Next.js), e **FastAPI** no backend. As integrações foram implementadas nessa arquitetura existente.

## Clerk

1. Crie uma aplicação no Clerk.
2. No `frontend/.env`, configure `VITE_CLERK_PUBLISHABLE_KEY=pk_...`.
3. No `backend/.env`, configure `CLERK_SECRET_KEY=sk_...`.
4. O backend valida o JWT Clerk pela chave JWKS do `iss` do token. Se necessário, informe explicitamente `CLERK_JWKS_URL`.
5. `/app` e todas as operações de usuário retornam `401` sem Bearer token Clerk; não existe mais provisionamento de convidado.

O cliente injeta automaticamente `Authorization: Bearer <token>` nas chamadas `/api`. O componente oficial `SignIn` do Clerk é usado em `/login`.

## Supabase

1. Execute `backend/supabase_schema.sql` no SQL Editor.
2. No backend, prefira:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

A chave `service_role` deve ficar **somente no backend**. As variáveis públicas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` são aceitas como fallback de compatibilidade, mas não são suficientes para gravar em tabelas com RLS habilitado; para produção use a service role.

O módulo `backend/lib/supabase.py` sincroniza:

- usuários e status de assinatura;
- estado atual e eventos de tweaks;
- registros de referrals.

O armazenamento JSON local continua como fallback operacional quando Supabase não está configurado.

## Referral

- `/app` exibe o link único `/ref/{ID}` e o botão **Copiar Link**.
- `/ref/{ID}` registra o clique e guarda o código para o pós-login.
- Após o login Clerk, o referral é reivindicado como `registered` e contabilizado no painel.

## Admin

Configure:

```env
ADMIN_EMAIL=plfca11@gmail.com
```

A proteção é feita no backend comparando o e-mail verificado pelo Clerk. `/admin` exibe a tabela de usuários, o toggle de PRO/VIP e o leaderboard de indicações. Usuários não administradores recebem `403` mesmo que naveguem diretamente para a URL.

## Variáveis do projeto enviado

As credenciais recebidas na solicitação são placeholders (`[COLE_SUA_CHAVE_AQUI]`, `[COLE_SUA_URL_AQUI]`). Portanto, o código está pronto para conexão, mas a conexão real só ocorrerá depois que as chaves reais forem preenchidas nos arquivos `.env` do ambiente de implantação.
