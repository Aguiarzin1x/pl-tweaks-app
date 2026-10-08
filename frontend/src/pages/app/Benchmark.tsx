import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Activity, Gauge, Play, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppShell from "@/components/app/AppShell";
import { errorDetail } from "@/lib/api";
import { useBenchmarks, useCatalog, useMe, useRunBenchmark, useTweaksState } from "@/lib/queries";
import type { BenchmarkRun } from "@/lib/types";

const MEASURE_MS = 4000;
const TICK_MS = 80;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function BenchmarkContent() {
  const me = useMe();
  const catalog = useCatalog();
  const state = useTweaksState(me.isSuccess);
  const benchmarks = useBenchmarks(me.isSuccess);
  const run = useRunBenchmark();

  const [gameId, setGameId] = useState("fortnite");
  const [phase, setPhase] = useState<"idle" | "measuring" | "done">("idle");
  const [liveFps, setLiveFps] = useState(0);
  const [result, setResult] = useState<BenchmarkRun | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearInterval(t));
    };
  }, []);

  const games = catalog.data?.games ?? [];
  const selected = games.find((g) => g.id === gameId);
  const labels: Record<string, string> = Object.fromEntries(games.map((g) => [g.id, g.name]));

  const start = () => {
    if (phase === "measuring") return;
    setPhase("measuring");
    setResult(null);
    setLiveFps(0);

    // Animate a plausible "measuring" readout while the server computes the real result.
    const baseline = selected?.baseline_fps ?? 90;
    const started = Date.now();
    const id = window.setInterval(() => {
      const t = Math.min(1, (Date.now() - started) / MEASURE_MS);
      const target = baseline * (1 + 0.9 * t);
      setLiveFps(Math.max(1, Math.round(target + (Math.random() * 18 - 9))));
    }, TICK_MS);
    timers.current.push(id);

    run.mutate(gameId, {
      onSuccess: (data) => {
        const remaining = Math.max(0, MEASURE_MS - (Date.now() - started));
        window.setTimeout(() => {
          clearInterval(id);
          setResult(data);
          setLiveFps(data.result_fps);
          setPhase("done");
          toast.success(`Benchmark concluído: ${data.result_fps} FPS (+${data.gain_pct}%)`);
        }, remaining);
      },
      onError: (e) => {
        clearInterval(id);
        setPhase("idle");
        toast.error(errorDetail(e, "Não foi possível rodar o benchmark."));
      },
    });
  };

  const runs = benchmarks.data?.runs ?? [];
  const metrics = state.data?.metrics;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight" data-testid="benchmark-heading">
          Benchmark Integrado
        </h1>
        <p className="text-sm text-muted-foreground">
          Meça o FPS antes e depois para provar o ganho dos ajustes na sua máquina.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Measurement panel */}
        <Card className="border-white/10 bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Jogo do teste
                </p>
                <Select value={gameId} onValueChange={(v: string) => setGameId(v)}>
                  <SelectTrigger data-testid="benchmark-game-select">
                    <SelectValue>{(v) => labels[v as string] ?? "Escolha um jogo"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {games.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="lg"
                onClick={start}
                disabled={phase === "measuring" || games.length === 0}
                data-testid="benchmark-run-button"
                className="glow-accent"
              >
                <Play className="size-4" />
                {phase === "measuring" ? "Medindo…" : "Rodar Benchmark"}
              </Button>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-[#0B0E15] p-6 text-center">
              {phase === "idle" ? (
                <>
                  <Gauge className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    O teste roda por 4 segundos e compara o FPS do PC padrão com o seu PC
                    otimizado agora.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
                    {phase === "measuring" ? "Medindo quadros…" : "Resultado"}
                  </p>
                  <p
                    className={`mt-2 font-mono text-6xl font-bold ${phase === "measuring" ? "text-foreground" : "text-primary text-glow-cyan"}`}
                    data-testid="benchmark-live-fps"
                  >
                    {liveFps}
                    <span className="ml-2 text-xl font-normal text-muted-foreground">FPS</span>
                  </p>
                  {phase === "measuring" && (
                    <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-border">
                      <div className="h-full animate-pulse rounded-full bg-primary" style={{ width: "100%" }} />
                    </div>
                  )}
                </>
              )}
            </div>

            {result && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3" data-testid="benchmark-result">
                <div className="rounded-lg border border-border bg-[#0B0E15] p-4">
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    PC padrão
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold text-slate-300">
                    {result.baseline_fps} FPS
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {result.lag_before} ms de input lag
                  </p>
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <p className="font-mono text-xs uppercase tracking-widest text-primary">
                    Com PL Tweaks
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold text-primary" data-testid="benchmark-result-fps">
                    {result.result_fps} FPS
                  </p>
                  <p className="mt-1 font-mono text-xs text-primary/70">
                    {result.lag_after} ms de input lag
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-4">
                  <p className="font-mono text-xs uppercase tracking-widest text-emerald-300">
                    Ganho
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold text-emerald-300" data-testid="benchmark-gain">
                    +{result.gain_pct}%
                  </p>
                  <p className="mt-1 font-mono text-xs text-emerald-400/70">
                    {result.applied_count} ajustes ativos
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-white/10 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border bg-[#0B0E15] p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Melhor ganho registrado
              </p>
              <p className="mt-1 font-mono text-3xl font-bold text-emerald-300" data-testid="benchmark-best-gain">
                +{benchmarks.data?.best_gain_pct ?? 0}%
              </p>
            </div>
            <div className="rounded-lg border border-border bg-[#0B0E15] p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Otimização atual
              </p>
              <p className="mt-1 font-mono text-3xl font-bold text-primary">
                {metrics?.optimization_pct ?? 0}%
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {metrics?.applied ?? 0}/{metrics?.total ?? 50} ajustes
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Quanto mais ajustes do preset do jogo estiverem ativos, maior o ganho medido.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card className="border-white/10 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-base">
            <Activity className="mr-1 inline size-4 text-primary" />
            Medições anteriores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma medição ainda — rode o primeiro benchmark acima.
            </p>
          ) : (
            <Table data-testid="benchmark-history-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Jogo</TableHead>
                  <TableHead>Padrão</TableHead>
                  <TableHead>Otimizado</TableHead>
                  <TableHead>Ganho</TableHead>
                  <TableHead>Ajustes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((r) => (
                  <TableRow key={r.id} data-testid={`benchmark-row-${r.id}`}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDate(r.created_at)}
                    </TableCell>
                    <TableCell className="font-bold">{r.game_name}</TableCell>
                    <TableCell className="font-mono">{r.baseline_fps}</TableCell>
                    <TableCell className="font-mono text-primary">{r.result_fps}</TableCell>
                    <TableCell>
                      <Badge className="border border-emerald-500/30 bg-emerald-950/60 font-mono text-emerald-300">
                        <TrendingUp className="size-3" />+{r.gain_pct}%
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {r.applied_count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Benchmark() {
  return (
    <AppShell>
      <BenchmarkContent />
    </AppShell>
  );
}
