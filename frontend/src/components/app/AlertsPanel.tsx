import { toast } from "sonner";
import { AlertTriangle, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { errorDetail } from "@/lib/api";
import { useAlerts, useDismissAlert, useMe, useReapplyAlert } from "@/lib/queries";
import { useAppUi } from "@/components/app/AppShell";

function describeLoss(fps: number, ping: number, lag: number): string {
  const parts: string[] = [];
  if (fps > 0) parts.push(`-${fps} FPS`);
  if (ping > 0) parts.push(`+${ping} ms de ping`);
  if (lag > 0) parts.push(`+${lag} ms de input lag`);
  return parts.length ? parts.join(" · ") : "impacto alto no desempenho";
}

function sourceLabel(source: string): string {
  if (source === "restore") return "ponto de restauração";
  if (source === "history_restore") return "volta no histórico";
  return "desfeito manualmente";
}

export default function AlertsPanel() {
  const me = useMe();
  const alerts = useAlerts(me.isSuccess);
  const reapply = useReapplyAlert();
  const dismiss = useDismissAlert();
  const ui = useAppUi();

  const items = alerts.data?.alerts ?? [];
  if (alerts.isLoading || items.length === 0) return null;

  const totalFps = items.reduce((acc, a) => acc + a.fps_lost, 0);

  return (
    <Card className="border-amber-500/40 bg-amber-500/5" data-testid="alerts-panel">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 font-heading text-base text-amber-300">
          <AlertTriangle className="size-4" />
          Queda de desempenho detectada
          <Badge
            variant="outline"
            className="border-amber-500/40 font-mono text-amber-300"
            data-testid="alerts-count-badge"
          >
            {items.length}
          </Badge>
        </CardTitle>
        {totalFps > 0 && (
          <p className="font-mono text-xs text-amber-300/80" data-testid="alerts-total-fps">
            até -{Math.round(totalFps)} FPS no total
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-[#0B0E15] p-3"
            data-testid={`alert-item-${a.tweak_key}`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{a.tweak_name}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {describeLoss(a.fps_lost, a.ping_lost, a.lag_lost)} · {sourceLabel(a.source)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                disabled={reapply.isPending}
                data-testid={`alert-reapply-${a.tweak_key}`}
                onClick={() =>
                  reapply.mutate(a.id, {
                    onSuccess: () => toast.success(`${a.tweak_name} reaplicado`),
                    onError: (e) => {
                      const msg = errorDetail(e, "Não foi possível reaplicar o ajuste.");
                      toast.error(msg);
                      if (msg.includes("Premium")) ui.openPremium();
                    },
                  })
                }
              >
                <RotateCcw className="size-3.5" />
                Reaplicar agora
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`Ignorar alerta de ${a.tweak_name}`}
                data-testid={`alert-dismiss-${a.tweak_key}`}
                disabled={dismiss.isPending}
                onClick={() => dismiss.mutate(a.id)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
