import { createContext, useContext, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  CalendarClock,
  Crown,
  Gamepad2,
  Gauge,
  History,
  LayoutDashboard,
  LogIn,
  LogOut,
  Cpu,
  SlidersHorizontal,
  Timer,
  Users,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isApiError } from "@/lib/api";
import { useMe, useRestore, useTweaksState } from "@/lib/queries";
import { endSession } from "@/lib/session";
import PremiumModal from "@/components/app/PremiumModal";
import RipModeModal from "@/components/app/RipModeModal";

// Small UI context so any screen can pop the VIP or RIP Mode modal owned by the shell.
interface AppUi {
  openPremium: () => void;
  openRip: () => void;
}

const AppUiContext = createContext<AppUi | null>(null);

export function useAppUi(): AppUi {
  const ctx = useContext(AppUiContext);
  if (!ctx) throw new Error("useAppUi must be used inside AppShell");
  return ctx;
}

const NAV = [
  { to: "/app", label: "Início", icon: LayoutDashboard },
  { to: "/app/ajustes", label: "Todos os Ajustes", icon: SlidersHorizontal },
  { to: "/app/jogos", label: "Presets de Jogos", icon: Gamepad2 },
  { to: "/app/hardware", label: "Hardware", icon: Cpu },
  { to: "/app/benchmark", label: "Benchmark", icon: Timer },
  { to: "/app/historico", label: "Histórico", icon: History },
  { to: "/app/limpeza", label: "Limpeza", icon: CalendarClock },
  { to: "/app/sobre", label: "Sobre Nós", icon: Users },
];

function statusPill(pct: number, applied: number, total: number) {
  if (applied === 0) return { label: "PC Padrão", cls: "border-slate-500/30 bg-slate-500/10 text-slate-300" };
  if (pct < 40) return { label: "Otimização inicial", cls: "border-amber-500/30 bg-amber-500/10 text-amber-300" };
  if (pct < 75) return { label: "Bem otimizado", cls: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" };
  return { label: "Otimizado ao Máximo", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" };
}

export default function AppShell({ children }: { children: ReactNode }) {
  const me = useMe();
  const state = useTweaksState(me.isSuccess);
  const restore = useRestore();
  const navigate = useNavigate();
  const location = useLocation();

  const [premiumOpen, setPremiumOpen] = useState(false);
  const [ripOpen, setRipOpen] = useState(false);

  if (me.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <span className="flex size-12 animate-pulse items-center justify-center rounded-xl bg-primary font-heading text-sm font-black text-primary-foreground">
            PL
          </span>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Conectando ao seu PC…
          </p>
        </div>
      </div>
    );
  }

  if (me.isError && !(isApiError(me.error) && me.error.status === 401)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
        <div className="max-w-lg space-y-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
          <p className="font-heading font-bold text-amber-200">Não foi possível carregar o seu painel</p>
          <p className="text-sm text-muted-foreground">A sessão Clerk ou a API demorou demasiado a responder. Verifique o console do navegador e tente novamente.</p>
          <Button variant="outline" onClick={() => void me.refetch()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  if (me.isError && isApiError(me.error) && me.error.status === 401) {
    return <Navigate to="/login" replace />;
  }

  const isPremium = me.data?.is_premium ?? false;
  const isGuest = me.data?.is_guest ?? false;
  const metrics = state.data?.metrics;
  const pill = statusPill(metrics?.optimization_pct ?? 0, metrics?.applied ?? 0, metrics?.total ?? 50);

  const ui: AppUi = { openPremium: () => setPremiumOpen(true), openRip: () => setRipOpen(true) };

  const handleRestore = () => {
    restore.mutate(undefined, {
      onSuccess: () => toast.success("Ponto de restauração aplicado — PC de volta ao estado original."),
      onError: () => toast.error("Não foi possível restaurar agora. Tente novamente."),
    });
  };

  return (
    <AppUiContext.Provider value={ui}>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
          <Link to="/" className="flex h-16 items-center gap-2.5 border-b border-border px-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-heading text-xs font-black text-primary-foreground">
              PL
            </span>
            <span className="font-heading font-bold tracking-tight">
              PL <span className="text-primary">TWEAKS</span>
            </span>
          </Link>
          <nav className="flex-1 space-y-1 p-3" data-testid="app-sidebar">
            {NAV.map((n) => {
              const active = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 font-bold text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <n.icon className="size-4.5" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          {!isPremium && (
            <div className="m-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
              <div className="flex items-center gap-2">
                <Crown className="size-4 text-amber-400" />
                <p className="font-heading text-sm font-bold">PL Premium</p>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Libere os ajustes avançados de GPU, BIOS e rede.
              </p>
              <Button
                size="sm"
                className="mt-3 w-full"
                data-testid="sidebar-vip-button"
                onClick={() => setPremiumOpen(true)}
              >
                Desbloquear
              </Button>
            </div>
          )}
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-[#090A0F]/85 px-4 backdrop-blur-xl sm:px-6">
            <Link to="/app" className="flex items-center gap-2 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-heading text-xs font-black text-primary-foreground">
                PL
              </span>
            </Link>

            <Badge variant="outline" className={pill.cls} data-testid="system-status-pill">
              <span className="size-1.5 animate-telemetry-pulse rounded-full bg-current" />
              {pill.label}
              {metrics && (
                <span className="ml-1 font-mono text-xs opacity-80">
                  {metrics.applied}/{metrics.total}
                </span>
              )}
            </Badge>

            <div className="ml-auto flex items-center gap-2">
              {isPremium ? (
                <Badge className="hidden border border-amber-500/40 bg-amber-500/10 text-amber-300 sm:inline-flex" data-testid="vip-badge">
                  <Crown className="size-3.5" />
                  VIP
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden border-amber-500/40 text-amber-300 hover:text-amber-200 sm:inline-flex"
                  data-testid="header-vip-button"
                  onClick={() => setPremiumOpen(true)}
                >
                  <Crown className="size-4" />
                  Seja VIP
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                data-testid="restore-point-button"
                disabled={restore.isPending}
                onClick={handleRestore}
              >
                <History className="size-4" />
                <span className="hidden md:inline">Ponto de Restauração</span>
              </Button>

              <Button
                size="sm"
                variant="destructive"
                data-testid="rip-mode-button"
                onClick={() => setRipOpen(true)}
                className="glow-accent"
              >
                <Zap className="size-4" />
                RIP Mode
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  data-testid="user-menu-button"
                  className="flex size-9 items-center justify-center rounded-full border border-border bg-card font-heading text-xs font-bold text-primary transition-colors hover:border-primary/40"
                >
                  {isGuest ? "CV" : (me.data?.email ?? "?").slice(0, 2).toUpperCase()}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="border-b border-border px-3 py-2">
                    <p className="truncate text-sm font-bold" data-testid="user-menu-email">
                      {isGuest ? "Convidado" : me.data?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isPremium
                        ? "Assinante Premium"
                        : isGuest
                          ? "Progresso salvo neste navegador"
                          : "Conta gratuita"}
                    </p>
                  </div>
                  {isGuest ? (
                    <DropdownMenuItem
                      data-testid="guest-signin-button"
                      onClick={() => navigate("/login")}
                    >
                      <LogIn className="size-4" />
                      Entrar ou criar conta
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      data-testid="logout-button"
                      className="text-red-300"
                      onClick={() => {
                        void endSession("/login");
                      }}
                    >
                      <LogOut className="size-4" />
                      Sair da conta
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Mobile nav */}
          <nav className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2 lg:hidden">
            {NAV.map((n) => {
              const active = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                    active ? "bg-primary/10 font-bold text-primary" : "text-muted-foreground"
                  }`}
                >
                  <n.icon className="size-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          {me.isError && (
            <div className="border-b border-amber-500/30 bg-amber-500/10 px-6 py-2 text-sm text-amber-300">
              Sem conexão com o servidor — as métricas podem estar desatualizadas.
            </div>
          )}

          <main className="flex-1 p-4 sm:p-6">{children}</main>

          <footer className="border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">
            <Gauge className="mr-1 inline size-3.5 text-primary" />
            PL Tweaks — 100% reversível • Ponto de restauração sempre ativo
          </footer>
        </div>

        <PremiumModal open={premiumOpen} onOpenChange={setPremiumOpen} />
        <RipModeModal open={ripOpen} onOpenChange={setRipOpen} active={state.data?.rip_mode_active ?? false} />
      </div>
    </AppUiContext.Provider>
  );
}
