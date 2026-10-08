import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Check, Cpu, Crown, HardDrive, MemoryStick, Monitor, Pencil, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppShell, { useAppUi } from "@/components/app/AppShell";
import { errorDetail } from "@/lib/api";
import { collectHardwareSignals } from "@/lib/hardwareProbe";
import {
  useDetectHardware,
  useHardwareProfile,
  useMe,
  useSaveHardwareProfile,
  useToggleTweak,
  useTweaksState,
} from "@/lib/queries";
import type { HardwareProfile } from "@/lib/types";

const TIER_LABEL: Record<string, string> = {
  entrada: "Entrada",
  intermediario: "Intermediário",
  avancado: "Avançado",
  topo: "Topo de linha",
};

const CONFIDENCE_STYLE: Record<string, string> = {
  alta: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  media: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  baixa: "border-red-500/30 bg-red-500/10 text-red-300",
};

function SpecRow({
  icon: Icon,
  label,
  value,
  testid,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
  testid: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-[#0B0E15] p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-bold" data-testid={testid}>
          {value}
        </p>
      </div>
    </div>
  );
}

function ConfirmForm({
  profile,
  onDone,
}: {
  profile: HardwareProfile;
  onDone: () => void;
}) {
  const save = useSaveHardwareProfile();
  const [cpu, setCpu] = useState(profile.cpu ?? "");
  const [gpu, setGpu] = useState(profile.gpu ?? "");
  const [ram, setRam] = useState(profile.ram_gb ? String(profile.ram_gb) : "");
  const [storage, setStorage] = useState(
    profile.storage === "Desconhecido" ? "SSD NVMe" : profile.storage,
  );

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(
          {
            cpu: cpu.trim() || null,
            gpu: gpu.trim() || null,
            cpu_vendor: null,
            gpu_vendor: null,
            ram_gb: ram ? Number(ram) : null,
            storage: storage || null,
          },
          {
            onSuccess: () => {
              toast.success("Perfil de hardware confirmado");
              onDone();
            },
            onError: (e2) => toast.error(errorDetail(e2, "Não foi possível salvar o perfil.")),
          },
        );
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="hw-cpu">Processador (CPU)</Label>
        <Input
          id="hw-cpu"
          placeholder="ex.: Ryzen 5 5600X"
          value={cpu}
          onChange={(e) => setCpu(e.target.value)}
          data-testid="hardware-cpu-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hw-gpu">Placa de vídeo (GPU)</Label>
        <Input
          id="hw-gpu"
          placeholder="ex.: RTX 3060 12GB"
          value={gpu}
          onChange={(e) => setGpu(e.target.value)}
          data-testid="hardware-gpu-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hw-ram">Memória RAM (GB)</Label>
        <Input
          id="hw-ram"
          type="number"
          min={2}
          max={256}
          placeholder="16"
          value={ram}
          onChange={(e) => setRam(e.target.value)}
          data-testid="hardware-ram-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hw-storage">Armazenamento</Label>
        <Input
          id="hw-storage"
          placeholder="SSD NVMe"
          value={storage}
          onChange={(e) => setStorage(e.target.value)}
          data-testid="hardware-storage-input"
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={save.isPending} data-testid="hardware-save-button">
          <Check className="size-4" />
          {save.isPending ? "Salvando…" : "Confirmar meu hardware"}
        </Button>
      </div>
    </form>
  );
}

function HardwareContent() {
  const me = useMe();
  const profileQuery = useHardwareProfile(me.isSuccess);
  const detect = useDetectHardware();
  const state = useTweaksState(me.isSuccess);
  const toggle = useToggleTweak();
  const ui = useAppUi();
  const [editing, setEditing] = useState(false);

  const profile = profileQuery.data ?? null;
  const isPremium = me.data?.is_premium ?? false;
  const appliedSet = new Set(state.data?.applied ?? []);

  // Auto-detect once per visit when no profile exists yet.
  useEffect(() => {
    if (!me.isSuccess || !profileQuery.isSuccess || profileQuery.data || detect.isPending) return;
    detect.mutate(collectHardwareSignals(), {
      onError: (e) => toast.error(errorDetail(e, "Não foi possível detectar o hardware.")),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.isSuccess, profileQuery.isSuccess, profileQuery.data]);

  const rerun = () => {
    detect.mutate(collectHardwareSignals(), {
      onSuccess: () => toast.success("Hardware detectado novamente pela IA"),
      onError: (e) => toast.error(errorDetail(e, "Não foi possível detectar o hardware.")),
    });
  };

  const applyRecommended = (key: string, name: string, premium: boolean) => {
    if (premium && !isPremium) {
      toast.info("Este ajuste é exclusivo do Premium");
      ui.openPremium();
      return;
    }
    toggle.mutate(
      { key, applied: true },
      {
        onSuccess: () => toast.success(`${name} aplicado`),
        onError: (e) => toast.error(errorDetail(e, "Não foi possível aplicar o ajuste.")),
      },
    );
  };

  const pending = detect.isPending;
  const notApplied = (profile?.recommended ?? []).filter((r) => !appliedSet.has(r.key));

  const applyAll = () => {
    const allowed = notApplied.filter((r) => isPremium || !r.premium);
    if (allowed.length === 0) {
      toast.info("Nada novo para aplicar nas recomendações");
      return;
    }
    allowed.forEach((r) => toggle.mutate({ key: r.key, applied: true }));
    toast.success(`${allowed.length} ajustes recomendados aplicados`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight" data-testid="hardware-heading">
            Perfil de Hardware
          </h1>
          <p className="text-sm text-muted-foreground">
            A IA lê os sinais do seu navegador, identifica as peças e recomenda só os ajustes que
            valem para a sua máquina.
          </p>
        </div>
        <Button variant="outline" onClick={rerun} disabled={pending} data-testid="hardware-detect-button">
          <Sparkles className="size-4 text-primary" />
          {pending ? "Detectando…" : "Detectar novamente"}
        </Button>
      </div>

      {/* Detected specs */}
      <Card className="border-white/10 bg-card">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="font-heading text-base">Máquina detectada</CardTitle>
          <div className="flex items-center gap-2">
            {profile && (
              <>
                <Badge
                  variant="outline"
                  className={CONFIDENCE_STYLE[profile.confidence] ?? CONFIDENCE_STYLE.media}
                  data-testid="hardware-confidence-badge"
                >
                  Confiança {profile.confidence}
                </Badge>
                <Badge variant="secondary" data-testid="hardware-tier-badge">
                  {TIER_LABEL[profile.tier] ?? profile.tier}
                </Badge>
                <Badge variant="outline" className="border-primary/40 text-primary">
                  {profile.detected_via === "ia"
                    ? "Detectado por IA"
                    : profile.detected_via === "manual"
                      ? "Confirmado por você"
                      : "Detecção por regras"}
                </Badge>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pending && !profile ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm text-primary">
                <Sparkles className="size-4 animate-pulse" />
                Lendo os sinais do seu PC e consultando a IA…
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            </div>
          ) : profile ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SpecRow
                  icon={Cpu}
                  label="Processador"
                  value={profile.cpu ?? "Não identificado"}
                  testid="hardware-cpu-value"
                />
                <SpecRow
                  icon={Monitor}
                  label="Placa de vídeo"
                  value={profile.gpu ?? "Não identificada"}
                  testid="hardware-gpu-value"
                />
                <SpecRow
                  icon={MemoryStick}
                  label="Memória RAM"
                  value={profile.ram_gb ? `${profile.ram_gb} GB` : "Não identificada"}
                  testid="hardware-ram-value"
                />
                <SpecRow
                  icon={HardDrive}
                  label="Armazenamento"
                  value={profile.storage}
                  testid="hardware-storage-value"
                />
              </div>

              {profile.summary && (
                <p className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground/90">
                  {profile.summary}
                </p>
              )}

              {(profile.needs_confirmation || editing) && (
                <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
                  <p className="mb-3 text-sm font-bold text-amber-300">
                    Confirme ou complete as peças para recomendações mais precisas
                  </p>
                  <ConfirmForm profile={profile} onDone={() => setEditing(false)} />
                </div>
              )}

              {!profile.needs_confirmation && !editing && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 px-0"
                  onClick={() => setEditing(true)}
                  data-testid="hardware-edit-button"
                >
                  <Pencil className="size-3.5" />
                  Corrigir manualmente
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum perfil ainda. Use "Detectar novamente" para a IA analisar a sua máquina.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-white/10 bg-card">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="font-heading text-base">
            Recomendado para a sua máquina
            {profile && (
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                {profile.recommended.length} ajustes
              </span>
            )}
          </CardTitle>
          {notApplied.length > 0 && (
            <Button size="sm" onClick={applyAll} data-testid="hardware-apply-missing-button">
              Aplicar os {notApplied.filter((r) => isPremium || !r.premium).length} que faltam
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!profile ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : profile.recommended.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem recomendações no momento — rode a detecção novamente.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2" data-testid="hardware-recommendations">
              {profile.recommended.map((r) => {
                const applied = appliedSet.has(r.key);
                const locked = r.premium && !isPremium;
                return (
                  <div
                    key={r.key}
                    className={`flex items-start justify-between gap-3 rounded-lg border p-4 transition-colors ${
                      applied ? "border-emerald-500/40 bg-emerald-950/10" : "border-border bg-[#0B0E15]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-heading text-sm font-bold">{r.name}</p>
                        {r.premium && (
                          <Badge className="shrink-0 border-0 bg-[#7C3AED] text-[10px] font-bold text-white">
                            <Crown className="size-3" />
                            PREMIUM
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{r.reason}</p>
                    </div>
                    {applied ? (
                      <Badge className="shrink-0 border border-emerald-500/30 bg-emerald-950/60 text-emerald-300">
                        <Check className="size-3" />
                        Aplicado
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant={locked ? "outline" : "default"}
                        className="shrink-0"
                        data-testid={`hardware-apply-${r.key}`}
                        onClick={() => applyRecommended(r.key, r.name, r.premium)}
                      >
                        {locked ? "Desbloquear" : "Aplicar"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Quer ver tudo?{" "}
            <Link to="/app/ajustes" className="text-primary hover:underline">
              Abrir o catálogo completo de ajustes
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Hardware() {
  return (
    <AppShell>
      <HardwareContent />
    </AppShell>
  );
}
