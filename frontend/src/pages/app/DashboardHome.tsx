import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import { ArrowRight, Crown, History, Zap, Copy, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppShell, { useAppUi } from "@/components/app/AppShell";
import HardwareGauges from "@/components/app/HardwareGauges";
import OptimizationRing from "@/components/app/OptimizationRing";
import { useCatalog, useMe, useRestore, useTweaksState, useReferral } from "@/lib/queries";
import { apiPost } from "@/lib/api";
import { clerkConfigured } from "@/lib/clerk";

function ReferralCard() {
  const referral = useReferral();
  const copy = async () => {
    if (!referral.data?.link) return;
    await navigator.clipboard.writeText(referral.data.link);
    toast.success("Link de indicação copiado");
  };
  return (
    <Card className="border-primary/25 bg-primary/5">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15"><Users className="size-5 text-primary" /></div>
          <div><p className="font-heading font-bold">Indique e acompanhe</p><p className="text-sm text-muted-foreground">Compartilhe seu link único e veja quantos amigos entraram.</p></div>
        </div>
        <div className="flex items-center gap-2">
          <code className="max-w-[220px] truncate rounded-md border border-border bg-background px-3 py-2 text-xs">{referral.data?.link ?? "Gerando link…"}</code>
          <Button size="sm" variant="outline" onClick={() => void copy()} disabled={!referral.data?.link}><Copy className="size-4" /> Copiar Link</Button>
          <Badge variant="outline" className="whitespace-nowrap">{referral.data?.count ?? 0} indicações</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminAccessCard() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const configuredAdmin = (import.meta.env.VITE_ADMIN_EMAIL || "plfca11@gmail.com").toLowerCase();
  const isAdmin = email === configuredAdmin;
  if (!isAdmin) return null;
  return (
    <Card className="border-amber-500/30 bg-amber-500/10">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div><p className="font-heading font-bold text-amber-200">Acesso de administrador</p><p className="text-sm text-amber-100/70">Sua conta tem acesso ao painel de gestão.</p></div>
        <Link to="/admin" className="inline-flex h-9 items-center rounded-md border border-amber-400/40 px-4 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-400/10 hover:text-amber-100">Abrir /admin</Link>
      </CardContent>
    </Card>
  );
}

function HomeContent() {
  const me = useMe();
  const state = useTweaksState(me.isSuccess);
  const catalog = useCatalog();
  const restore = useRestore();
  const ui = useAppUi();
  useEffect(() => {
    const code = localStorage.getItem("pl_referral_code");
    if (me.isSuccess && code) {
      void apiPost(`/referrals/claim/${encodeURIComponent(code)}`).then(() => localStorage.removeItem("pl_referral_code"));
    }
  }, [me.isSuccess]);

  const metrics = state.data?.metrics;
  const pct = metrics?.optimization_pct ?? 0;
  const appliedSet = new Set(state.data?.applied ?? []);

  const stats = [
    { label: "FPS estimado a mais", value: `+${Math.round(metrics?.fps_gain ?? 0)}`, testid: "stat-fps" },
    { label: "Ping a menos", value: `-${(metrics?.ping_reduction ?? 0).toFixed(0)} ms`, testid: "stat-ping" },
    { label: "Input lag a menos", value: `-${(metrics?.input_lag_reduction ?? 0).toFixed(1)} ms`, testid: "stat-lag" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight" data-testid="home-heading">
          Início
        </h1>
        <p className="text-sm text-muted-foreground">
          Telemetria ao vivo do seu PC e nível geral de otimização.
        </p>
      </div>
      <ReferralCard />
      {clerkConfigured && <AdminAccessCard />}

      <HardwareGauges optimizationPct={pct} />

      {state.isError && !state.isLoading && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Não foi possível carregar o estado da otimização — tente recarregar a página.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="border-white/10 bg-card">
          <CardContent className="flex flex-col items-center p-6">
            {state.isLoading ? (
              <div className="flex size-[200px] animate-pulse items-center justify-center rounded-full border-[14px] border-border" />
            ) : (
              <>
                <OptimizationRing
                  pct={pct}
                  applied={metrics?.applied ?? 0}
                  total={metrics?.total ?? 50}
                />
                <div className="mt-4 grid w-full grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
                  {stats.map((s) => (
                    <div key={s.label}>
                      <p className="font-mono text-lg font-bold text-primary" data-testid={s.testid}>
                        {s.value}
                      </p>
                      <p className="text-[11px] leading-tight text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border-white/10 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base">Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="destructive"
                size="lg"
                data-testid="home-rip-mode-button"
                onClick={ui.openRip}
                className="glow-accent"
              >
                <Zap className="size-4" />
                Ativar RIP Mode
              </Button>
              <Button
                variant="outline"
                size="lg"
                data-testid="home-restore-button"
                disabled={restore.isPending}
                onClick={() =>
                  restore.mutate(undefined, {
                    onSuccess: () =>
                      toast.success("Ponto de restauração aplicado — PC de volta ao estado original."),
                    onError: () => toast.error("Não foi possível restaurar agora. Tente novamente."),
                  })
                }
              >
                <History className="size-4" />
                Ponto de Restauração
              </Button>
              {!(me.data?.is_premium ?? false) && (
                <Button
                  variant="outline"
                  size="lg"
                  className="border-amber-500/40 text-amber-300 hover:text-amber-200"
                  data-testid="home-vip-button"
                  onClick={ui.openPremium}
                >
                  <Crown className="size-4" />
                  Desbloquear Premium
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-card">
            <CardContent className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {catalog.isLoading
                ? [0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                  ))
                : (catalog.data?.categories ?? []).map((c) => {
                    const catTweaks = (catalog.data?.tweaks ?? []).filter((t) => t.category === c.id);
                    const appliedInCat = catTweaks.filter((t) => appliedSet.has(t.key)).length;
                    const pctCat = Math.round((appliedInCat / Math.max(1, catTweaks.length)) * 100);
                    return (
                      <Link
                        key={c.id}
                        to={`/app/ajustes?cat=${c.id}`}
                        data-testid={`category-card-${c.id}`}
                        className="group rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-heading text-sm font-bold">{c.name}</p>
                          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                        </div>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {appliedInCat}/{catTweaks.length} aplicados
                        </p>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                          <div
                            className="h-full rounded-full bg-primary transition-[width] duration-500"
                            style={{ width: `${pctCat}%` }}
                          />
                        </div>
                      </Link>
                    );
                  })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  return (
    <AppShell>
      <HomeContent />
    </AppShell>
  );
}
