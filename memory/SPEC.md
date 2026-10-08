# RIP Tweaks — Especificação do App

Clone web do **RIP Tweaks** (riptweaks.com): otimizador de PC gamer para Windows. Toda a UI em
**pt-BR**, tema **escuro gamer** (obsidiana #090A0F, acento ciano #00F0FF), fontes Sora (heading),
DM Sans (sans), JetBrains Mono (mono). Dark por default (`class="dark"` no index.html).

## Estado atual (mudança arquitetural recente)

**SEM MongoDB.** O backend usa camada de persistência local própria (`backend/lib/db.py`):
armazenamento em memória com flush atômico para `backend/data/store.json`. Sobrevive a
reinícios do servidor. A API da camada é idêntica à do motor (find_one/find+sort+to_list/
insert_one/insert_many/update_one(upsert)/update_many/delete_one), então os routers não mudaram.
**Ponto de troca Supabase**: só `backend/lib/db.py` conhece persistência — substituir esse
módulo por uma implementação Supabase não toca nenhum router.

**SEM muro de login.** `GET /api/auth/me` (e qualquer rota com `Depends(get_current_user)`)
provisiona automaticamente uma **conta convidado + cookie httpOnly** na primeira visita —
`/app` abre o painel direto, sem redirecionar para login. `/login` continua funcional
(e-mail+senha) e tem botão "Entrar com a conta demo".

**Ponto de troca Clerk**: substituir `get_current_user` em `backend/routers/auth.py` por
verificação de sessão Clerk retornando o mesmo dict `{"id", "email", "is_premium"}` —
nenhum outro módulo lê users/sessions.

## Páginas

1. **Landing `/`** — página de vendas: hero, comparação antes/depois de FPS, recursos, planos,
   FAQ, footer. Navbar linka para `/app` (sem login).
2. **Login `/login`** — entrar/criar conta por e-mail + senha (cookie httpOnly). Botão
   "Entrar com a conta demo" (`POST /auth/login` com demo@riptweaks.app/ripdemo123 — a conta
   demo é criada sob demanda no primeiro login).
3. **App `/app`** — shell com sidebar (Início, Todos os Ajustes, Presets de Jogos, Hardware,
   Benchmark, Histórico, Limpeza); Início mostra telemetria simulada ao vivo (CPU/GPU/RAM),
   anel de otimização (SVG, % = aplicados/50), ganhos estimados, ações rápidas (RIP Mode,
   Ponto de Restauração, VIP) e cards por categoria.
4. **Ajustes `/app/ajustes`** — 50 tweaks em 5 categorias; toggle aplicar/desfazer persistido;
   busca + filtros; Premium bloqueado (403 → modal VIP → `POST /api/vip/activate` simula).
5. **Jogos `/app/jogos`** — presets de 1 clique (Fortnite, Valorant, CS2, Warzone, Roblox,
   Minecraft) + RIP Mode (modal com contagem regressiva, aplica pacote de 12 tweaks).
6. **Hardware `/app/hardware`** — sinais reais do navegador (WebGL, cores, memória) +
   **Claude Sonnet 5.5** (`backend/lib/llm.py`, chave `EMERGENT_LLM_KEY` no .env) devolvem
   perfil + 8-14 recomendações. Fallback por regras se a IA falhar (marca `needs_confirmation`).
7. **Benchmark `/app/benchmark`** — teste simulado ~4s; FPS calculado no backend (baseline do
   jogo + ganhos dos tweaks aplicados, preset do jogo pesa 2x). Histórico em tabela.
8. **Histórico `/app/historico`** — linha do tempo de TODAS as ações; cada entrada tem
   snapshot completo + "Restaurar aqui" (`POST /api/history/restore/{id}`).
9. **Limpeza `/app/limpeza`** — agendamento simulado (diária/semanal, dia, horário); catch-up
   materializa limpezas vencidas na leitura de `GET /api/cleanup` (máx. 12).

## Regras de negócio

- Toda mutação passa por `lib/state.save_and_log` → entra no histórico com snapshot pós-ação
  (é o que faz "Restaurar aqui" funcionar). Queda de tweak de impacto alto levanta alerta em
  `alerts` (mostrado no Início, com "reaplicar").
- Métricas (otimização %, +FPS, -ping, -lag) calculadas **no backend**, devolvidas em toda
  resposta de estado.
- Preset aplica só tweaks gratuitos para conta free; Premium bloqueados voltam em `blocked`.
- RIP Mode desativar NÃO desfaz tweaks. "Ponto de Restauração" zera applied + RIP off.
- Guest = conta free; `POST /api/vip/activate` concede `is_premium` na hora (simulação).

## API (todas sob /api, prefixo api_router em server.py)

- `POST /auth/signup` (201) · `POST /auth/login` · `GET /auth/me` (auto-convidado, nunca 401)
  · `POST /auth/logout` (204) — cookie `rip_session` httpOnly, 30 dias, na collection `sessions`.
- `GET /tweaks/catalog` (público) · `GET /tweaks/state` · `POST /tweaks/toggle {key, applied}`
  · `POST /tweaks/preset {game_id}` · `POST /tweaks/rip-mode {active}` · `POST /tweaks/restore`
  · `POST /vip/activate`.
- `GET /hardware/profile` · `POST /hardware/detect {sinais}` (IA, timeout 45s → fallback regras)
  · `PUT /hardware/profile` (correção manual).
- `GET /benchmark` · `POST /benchmark/run {game_id}` · `GET /benchmark/compare/{game_id}`.
- `GET /history` · `POST /history/restore/{entry_id}`.
- `GET /cleanup` · `PUT /cleanup/schedule` · `POST /cleanup/run`.
- `GET /alerts` · `POST /alerts/{id}/reapply` · `POST /alerts/{id}/dismiss`.
- `GET /status` + `POST /status` — sonda de conectividade da Home.tsx.

## Dados (backend/data/store.json via lib/db.py — coleções)

- `users`: id (uuid str), email (único), password (bcrypt ou None p/ convidado), is_premium,
  guest (bool), created_at
- `sessions`: token (único), user_id, expires_at (30d)
- `user_states`: user_id (único), applied [keys], rip_mode_active
- `history`: id, user_id, kind, label, detail, applied_after, rip_after, applied_count,
  optimization_pct, created_at
- `hardware_profiles`: user_id (único), cpu/gpu/ram_gb/storage/tier/confidence/summary,
  needs_confirmation, detected_via, recommended [{key, reason}], signals
- `benchmark_runs`: id, user_id, game_id, baseline_fps, result_fps, gain_pct, lag_before/after
- `cleanup_schedules`: user_id (único), enabled, frequency, hour, weekday, last_run_at, anchor_at
- `cleanup_runs`: id, user_id, ran_at, trigger, ram_freed_gb, mb_freed, files_removed
- `alerts`: id, user_id, tweak_key, tweak_name, fps_lost, ping_lost, lag_lost, source,
  dismissed, created_at
- Catálogo de tweaks é estático em `backend/lib/catalog.py` (não vai ao banco).

## Frontend

- Vite + React 19 + TS strict; chamadas só via `src/lib/api.ts` (relativas /api); TanStack
  Query; rotas em `src/App.tsx`; shell em `src/components/app/AppShell.tsx` (exibe
  "Conectando ao seu PC…" só enquanto `useMe` resolve — agora instantâneo).
- `queryClient.clear()` via `lib/session.ts` (beginSession/endSession) ao trocar de conta.
