import { toast } from "sonner";
import { Crosshair, TrendingUp, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppShell, { useAppUi } from "@/components/app/AppShell";
import { errorDetail } from "@/lib/api";
import { useApplyPreset, useCatalog, useMe, useTweaksState } from "@/lib/queries";

const GRADIENTS = [
  "from-purple-600/40 to-blue-600/20",
  "from-red-600/40 to-rose-600/20",
  "from-orange-500/40 to-amber-600/20",
  "from-emerald-600/40 to-teal-600/20",
  "from-sky-600/40 to-cyan-600/20",
  "from-lime-600/40 to-green-600/20",
];

function GamesContent() {
  const me = useMe();
  const state = useTweaksState(me.isSuccess);
  const catalog = useCatalog();
  const applyPreset = useApplyPreset();
  const ui = useAppUi();

  const appliedSet = new Set(state.data?.applied ?? []);
  const tweaksByKey = new Map((catalog.data?.tweaks ?? []).map((t) => [t.key, t]));

  const handleApply = (gameId: string, gameName: string) => {
    applyPreset.mutate(gameId, {
      onSuccess: (res) => {
        if (res.blocked.length > 0) {
          toast.warning(
            `${res.applied_now.length} ajustes aplicados — ${res.blocked.length} exclusivos do Premium ficaram de fora`,
          );
          ui.openPremium();
        } else if (res.applied_now.length === 0) {
          toast.info(`O preset do ${gameName} já estava aplicado`);
        } else {
          toast.success(`Preset do ${gameName} aplicado — ${res.applied_now.length} ajustes ativados`);
        }
      },
      onError: (e) => toast.error(errorDetail(e, "Não foi possível aplicar o preset agora.")),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight" data-testid="games-heading">
          Presets de Jogos
        </h1>
        <p className="text-sm text-muted-foreground">
          Um clique aplica o pacote completo de otimização do seu jogo.
        </p>
      </div>

      {/* RIP Mode band */}
      <div className="relative overflow-hidden rounded-2xl border border-red-500/25 bg-gradient-to-r from-red-950/50 via-card to-card p-6">
        <div className="absolute inset-0 tactical-grid opacity-40" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-red-500/15">
              <Zap className="size-6 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-xl font-bold">RIP Mode</h2>
                {state.data?.rip_mode_active && (
                  <Badge className="border border-red-500/40 bg-red-500/15 text-red-300" data-testid="rip-active-badge">
                    ATIVO
                  </Badge>
                )}
              </div>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Suspende os processos de segundo plano e aplica o pacote máximo de FPS segundos
                antes de você entrar na partida.
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="lg"
            data-testid="games-rip-mode-button"
            onClick={ui.openRip}
            className="glow-accent shrink-0"
          >
            <Zap className="size-4" />
            {state.data?.rip_mode_active ? "Gerenciar RIP Mode" : "Ativar RIP Mode"}
          </Button>
        </div>
      </div>

      {state.isError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Não foi possível carregar o estado da otimização — os números abaixo podem estar
          desatualizados.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="games-grid">
        {(catalog.data?.games ?? []).map((g, i) => {
          const presetApplied = g.keys.filter((k) => appliedSet.has(k)).length;
          const currentFps = Math.round(
            g.baseline_fps +
              g.keys.reduce((acc, k) => acc + (appliedSet.has(k) ? (tweaksByKey.get(k)?.fps_gain ?? 0) : 0), 0),
          );
          return (
            <Card key={g.id} className="overflow-hidden border-white/10 bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40">
              <div className={`relative h-24 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`}>
                <div className="absolute inset-0 tactical-grid opacity-50" />
                <Crosshair className="absolute right-4 top-4 size-6 text-white/40" />
                <div className="absolute bottom-3 left-4">
                  <h3 className="font-heading text-xl font-extrabold tracking-tight text-white" data-testid={`game-name-${g.id}`}>
                    {g.name}
                  </h3>
                </div>
                <Badge className="absolute right-3 bottom-3 border border-white/20 bg-black/40 font-mono text-[11px] text-emerald-300">
                  <TrendingUp className="size-3" />
                  +{g.gain_pct}% FPS
                </Badge>
              </div>
              <CardContent className="p-5">
                <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                  <span data-testid={`game-preset-progress-${g.id}`}>
                    {presetApplied}/{g.keys.length} do preset aplicado
                  </span>
                  <span className="text-foreground" data-testid={`game-fps-${g.id}`}>
                    ~{currentFps} FPS agora
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${(presetApplied / g.keys.length) * 100}%` }}
                  />
                </div>
                <Button
                  className="mt-4 w-full"
                  variant={presetApplied === g.keys.length ? "outline" : "default"}
                  disabled={applyPreset.isPending && applyPreset.variables === g.id}
                  data-testid={`game-preset-apply-${g.id}`}
                  onClick={() => handleApply(g.id, g.name)}
                >
                  {applyPreset.isPending && applyPreset.variables === g.id
                    ? "Aplicando…"
                    : presetApplied === g.keys.length
                      ? "Preset completo — reaplicar"
                      : "Aplicar Preset Completo"}
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {catalog.isLoading &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
          ))}
      </div>
    </div>
  );
}

export default function Games() {
  return (
    <AppShell>
      <GamesContent />
    </AppShell>
  );
}
