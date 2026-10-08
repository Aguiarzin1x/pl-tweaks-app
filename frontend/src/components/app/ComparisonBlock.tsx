import { BarChart3, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useComparison, useMe } from "@/lib/queries";

interface Props {
  gameId: string;
}

export default function ComparisonBlock({ gameId }: Props) {
  const me = useMe();
  const comparison = useComparison(gameId, me.isSuccess && Boolean(gameId));
  const data = comparison.data;

  return (
    <Card className="border-white/10 bg-card" data-testid="comparison-block">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 font-heading text-base">
          <BarChart3 className="size-4 text-primary" />
          Como você se compara
        </CardTitle>
        {data && (
          <Badge variant="secondary" data-testid="comparison-tier-badge">
            {data.tier_label}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {comparison.isLoading ? (
          <div className="space-y-3">
            <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-16 animate-pulse rounded bg-muted" />
          </div>
        ) : comparison.isError || !data ? (
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar a comparação agora. Rode um benchmark e tente novamente.
          </p>
        ) : (
          <>
            <p className="font-heading text-lg font-bold" data-testid="comparison-headline">
              Você está acima de{" "}
              <span className="text-primary text-glow-cyan">{Math.round(data.percentile)}%</span>{" "}
              dos {data.tier_label.toLowerCase()} no {data.game_name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground" data-testid="comparison-verdict">
              {data.verdict}
            </p>

            {/* Cohort bar: your marker against the tier's percentile curve */}
            <div className="mt-6">
              <div className="relative h-10 rounded-lg border border-border bg-[#0B0E15]">
                <div
                  className="absolute inset-y-0 left-0 rounded-l-lg bg-gradient-to-r from-cyan-500/15 to-primary/35"
                  style={{ width: `${Math.min(100, Math.max(2, data.percentile))}%` }}
                />
                {/* median marker */}
                <div className="absolute inset-y-0 left-1/2 w-px bg-border" aria-hidden />
                <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                  mediana {data.median_fps} FPS
                </span>
                {/* your marker */}
                <div
                  className="absolute -top-1 bottom-[-4px] w-0.5 bg-primary glow-cyan"
                  style={{ left: `${Math.min(99, Math.max(1, data.percentile))}%` }}
                  aria-hidden
                />
                <span
                  className="absolute -top-6 -translate-x-1/2 whitespace-nowrap font-mono text-xs font-bold text-primary"
                  style={{ left: `${Math.min(92, Math.max(8, data.percentile))}%` }}
                  data-testid="comparison-your-marker"
                >
                  você · {data.your_fps} FPS
                </span>
              </div>
              <div className="mt-7 flex justify-between font-mono text-[11px] text-muted-foreground">
                {data.curve
                  .filter((p) => [10, 50, 90].includes(p.percentile))
                  .map((p) => (
                    <span key={p.percentile}>
                      p{p.percentile}: {p.fps} FPS
                    </span>
                  ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-[#0B0E15] p-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Seu FPS
                </p>
                <p className="mt-0.5 font-mono text-xl font-bold text-primary">{data.your_fps}</p>
              </div>
              <div className="rounded-lg border border-border bg-[#0B0E15] p-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Mediana da categoria
                </p>
                <p className="mt-0.5 font-mono text-xl font-bold">{data.median_fps}</p>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-300">
                  <Trophy className="mr-1 inline size-3" />
                  Top 10% da categoria
                </p>
                <p className="mt-0.5 font-mono text-xl font-bold text-emerald-300">
                  {data.top_fps}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              {data.measured_at
                ? "Baseado na sua última medição deste jogo."
                : "Estimativa pelos ajustes ativos — rode o benchmark para medir de verdade."}{" "}
              A categoria vem do seu Perfil de Hardware.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
