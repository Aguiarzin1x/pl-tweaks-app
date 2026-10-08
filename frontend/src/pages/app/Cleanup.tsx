import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, HardDrive, MemoryStick, Play, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { useCleanup, useMe, useRunCleanup, useSaveCleanupSchedule } from "@/lib/queries";

const FREQ_LABELS: Record<string, string> = { diaria: "Todos os dias", semanal: "Uma vez por semana" };
const WEEKDAYS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countdown(iso: string | null): string {
  if (!iso) return "";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "a qualquer momento";
  const h = Math.floor(diff / 3600000);
  const m = Math.round((diff % 3600000) / 60000);
  if (h >= 24) return `em ${Math.floor(h / 24)} d ${h % 24} h`;
  if (h > 0) return `em ${h} h ${m} min`;
  return `em ${m} min`;
}

function CleanupContent() {
  const me = useMe();
  const cleanup = useCleanup(me.isSuccess);
  const save = useSaveCleanupSchedule();
  const runNow = useRunCleanup();

  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState("diaria");
  const [hour, setHour] = useState(20);
  const [weekday, setWeekday] = useState(0);

  // Hydrate the form from the server once the schedule arrives.
  useEffect(() => {
    if (!cleanup.data) return;
    setEnabled(cleanup.data.enabled);
    setFrequency(cleanup.data.frequency);
    setHour(cleanup.data.hour);
    setWeekday(cleanup.data.weekday);
  }, [cleanup.data]);

  const data = cleanup.data;
  const runs = data?.runs ?? [];

  const persist = (next: Partial<{ enabled: boolean; frequency: string; hour: number; weekday: number }>) => {
    const body = { enabled, frequency, hour, weekday, ...next };
    setEnabled(body.enabled);
    setFrequency(body.frequency);
    setHour(body.hour);
    setWeekday(body.weekday);
    save.mutate(body, {
      onSuccess: (res) =>
        toast.success(
          res.enabled
            ? `Limpeza agendada — próxima ${countdown(res.next_run_at)}`
            : "Agendamento desativado",
        ),
      onError: (e) => toast.error(errorDetail(e, "Não foi possível salvar o agendamento.")),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight" data-testid="cleanup-heading">
          Limpeza Inteligente
        </h1>
        <p className="text-sm text-muted-foreground">
          Libere RAM e arquivos temporários automaticamente no horário que você escolher.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Schedule */}
        <Card className="border-white/10 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base">
              <CalendarClock className="mr-1 inline size-4 text-primary" />
              Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-[#0B0E15] p-4">
              <Checkbox
                id="cleanup-enabled"
                checked={enabled}
                onCheckedChange={(checked) => persist({ enabled: checked === true })}
                data-testid="cleanup-enabled-checkbox"
              />
              <div>
                <Label htmlFor="cleanup-enabled" className="font-heading text-sm font-bold">
                  Ativar limpeza automática
                </Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  A limpeza roda sozinha no horário escolhido e aparece no histórico quando você
                  abrir o app.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Frequência
                </p>
                <Select
                  value={frequency}
                  onValueChange={(v: string) => persist({ frequency: v })}
                >
                  <SelectTrigger data-testid="cleanup-frequency-select" disabled={!enabled}>
                    <SelectValue>{(v) => FREQ_LABELS[v as string] ?? "Todos os dias"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diaria">Todos os dias</SelectItem>
                    <SelectItem value="semanal">Uma vez por semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {frequency === "semanal" && (
                <div>
                  <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Dia da semana
                  </p>
                  <Select
                    value={String(weekday)}
                    onValueChange={(v: string) => persist({ weekday: Number(v) })}
                  >
                    <SelectTrigger data-testid="cleanup-weekday-select" disabled={!enabled}>
                      <SelectValue>{(v) => WEEKDAYS[Number(v)] ?? "Segunda-feira"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map((d, i) => (
                        <SelectItem key={d} value={String(i)}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Horário
                </p>
                <Select value={String(hour)} onValueChange={(v: string) => persist({ hour: Number(v) })}>
                  <SelectTrigger data-testid="cleanup-hour-select" disabled={!enabled}>
                    <SelectValue>{(v) => `${String(v).padStart(2, "0")}:00`}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {String(h).padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <Button
                onClick={() =>
                  runNow.mutate(undefined, {
                    onSuccess: (res) => {
                      const last = res.runs[0];
                      toast.success(
                        last
                          ? `Limpeza concluída — ${last.ram_freed_gb} GB de RAM e ${last.mb_freed} MB liberados`
                          : "Limpeza concluída",
                      );
                    },
                    onError: (e) => toast.error(errorDetail(e, "Não foi possível limpar agora.")),
                  })
                }
                disabled={runNow.isPending}
                data-testid="cleanup-run-now-button"
              >
                <Play className="size-4" />
                {runNow.isPending ? "Limpando…" : "Limpar agora"}
              </Button>
              {data?.enabled && data.next_run_at && (
                <Badge variant="outline" className="border-primary/40 text-primary" data-testid="cleanup-next-run">
                  Próxima limpeza {countdown(data.next_run_at)} · {formatDateTime(data.next_run_at)}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card className="border-white/10 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base">Total liberado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border bg-[#0B0E15] p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <HardDrive className="mr-1 inline size-3.5" />
                Espaço em disco
              </p>
              <p className="mt-1 font-mono text-3xl font-bold text-primary" data-testid="cleanup-total-mb">
                {((data?.total_mb_freed ?? 0) / 1024).toFixed(1)}
                <span className="ml-1 text-base font-normal text-muted-foreground">GB</span>
              </p>
            </div>
            <div className="rounded-lg border border-border bg-[#0B0E15] p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <MemoryStick className="mr-1 inline size-3.5" />
                Limpezas executadas
              </p>
              <p className="mt-1 font-mono text-3xl font-bold text-foreground" data-testid="cleanup-total-runs">
                {data?.total_runs ?? 0}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Última: {formatDateTime(data?.last_run_at ?? null)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Run history */}
      <Card className="border-white/10 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-base">
            <Trash2 className="mr-1 inline size-4 text-primary" />
            Limpezas executadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cleanup.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma limpeza ainda — use "Limpar agora" ou ative o agendamento.
            </p>
          ) : (
            <Table data-testid="cleanup-runs-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>RAM liberada</TableHead>
                  <TableHead>Disco liberado</TableHead>
                  <TableHead>Arquivos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((r) => (
                  <TableRow key={r.id} data-testid={`cleanup-row-${r.id}`}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDateTime(r.ran_at)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          r.trigger === "agendada"
                            ? "border-cyan-500/30 text-cyan-300"
                            : "border-slate-500/30 text-slate-300"
                        }
                      >
                        {r.trigger === "agendada" ? "Agendada" : "Manual"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-emerald-300">{r.ram_freed_gb} GB</TableCell>
                    <TableCell className="font-mono text-primary">{r.mb_freed} MB</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {r.files_removed}
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

export default function Cleanup() {
  return (
    <AppShell>
      <CleanupContent />
    </AppShell>
  );
}
