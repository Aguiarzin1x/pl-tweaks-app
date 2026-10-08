import { toast } from "sonner";
import {
  Crown,
  History as HistoryIcon,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppShell from "@/components/app/AppShell";
import { errorDetail } from "@/lib/api";
import { useHistory, useMe, useRestoreToEntry, useTweaksState } from "@/lib/queries";

const KIND_STYLE: Record<string, { icon: typeof Plus; cls: string; ring: string }> = {
  toggle_on: { icon: Plus, cls: "text-emerald-300", ring: "border-emerald-500/40 bg-emerald-950/60" },
  toggle_off: { icon: Minus, cls: "text-slate-300", ring: "border-slate-500/40 bg-slate-800/60" },
  preset: { icon: Sparkles, cls: "text-cyan-300", ring: "border-cyan-500/40 bg-cyan-950/60" },
  rip_mode_on: { icon: Zap, cls: "text-red-300", ring: "border-red-500/40 bg-red-950/60" },
  rip_mode_off: { icon: Zap, cls: "text-slate-300", ring: "border-slate-500/40 bg-slate-800/60" },
  restore: { icon: RotateCcw, cls: "text-amber-300", ring: "border-amber-500/40 bg-amber-950/60" },
  history_restore: { icon: HistoryIcon, cls: "text-violet-300", ring: "border-violet-500/40 bg-violet-950/60" },
  cleanup: { icon: Trash2, cls: "text-blue-300", ring: "border-blue-500/40 bg-blue-950/60" },
  vip: { icon: Crown, cls: "text-amber-300", ring: "border-amber-500/40 bg-amber-950/60" },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffMin < 1440) return `há ${Math.round(diffMin / 60)} h`;
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function HistoryContent() {
  const me = useMe();
  const history = useHistory(me.isSuccess);
  const state = useTweaksState(me.isSuccess);
  const restore = useRestoreToEntry();

  const entries = history.data?.entries ?? [];
  const current = state.data?.metrics.applied ?? 0;

  const handleRestore = (id: string, label: string, count: number) => {
    restore.mutate(id, {
      onSuccess: () =>
        toast.success(`Voltou ao estado de "${label}" — ${count} ajustes ativos`),
      onError: (e) => toast.error(errorDetail(e, "Não foi possível restaurar esse ponto.")),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight" data-testid="history-heading">
          Histórico de Ações
        </h1>
        <p className="text-sm text-muted-foreground">
          Tudo que foi aplicado e desfeito, em ordem. Volte a qualquer ponto com um clique.
        </p>
      </div>

      <Card className="border-white/10 bg-card">
        <CardContent className="p-6">
          {history.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : history.isError ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
              Não foi possível carregar o histórico — tente recarregar a página.
            </p>
          ) : entries.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma ação registrada ainda. Aplique um ajuste e ele aparece aqui.
            </p>
          ) : (
            <ol className="relative space-y-4 pl-8" data-testid="history-timeline">
              <span className="absolute left-[15px] top-2 bottom-2 w-px bg-border" aria-hidden />
              {entries.map((e, i) => {
                const style = KIND_STYLE[e.kind] ?? KIND_STYLE.toggle_on;
                const isCurrent = i === 0;
                return (
                  <li key={e.id} className="relative" data-testid={`history-entry-${e.id}`}>
                    <span
                      className={`absolute -left-8 flex size-8 items-center justify-center rounded-full border ${style.ring}`}
                    >
                      <style.icon className={`size-4 ${style.cls}`} />
                    </span>
                    <div
                      className={`rounded-xl border p-4 transition-colors ${
                        isCurrent ? "border-primary/40 bg-primary/5" : "border-border bg-[#0B0E15]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-heading text-sm font-bold">{e.label}</p>
                            {isCurrent && (
                              <Badge variant="outline" className="border-primary/40 text-primary">
                                estado atual
                              </Badge>
                            )}
                          </div>
                          {e.detail && (
                            <p className="mt-1 text-sm text-muted-foreground">{e.detail}</p>
                          )}
                          <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                            {formatWhen(e.created_at)} · {e.applied_count} ajustes ·{" "}
                            {e.optimization_pct}% otimizado
                          </p>
                        </div>
                        {!isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            disabled={restore.isPending}
                            data-testid={`history-restore-${e.id}`}
                            onClick={() => handleRestore(e.id, e.label, e.applied_count)}
                          >
                            <RotateCcw className="size-3.5" />
                            Restaurar aqui
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      <p className="text-center font-mono text-xs text-muted-foreground">
        Estado atual: {current} ajustes aplicados · restaurar um ponto devolve exatamente os
        ajustes que estavam ativos naquele momento
      </p>
    </div>
  );
}

export default function History() {
  return (
    <AppShell>
      <HistoryContent />
    </AppShell>
  );
}
