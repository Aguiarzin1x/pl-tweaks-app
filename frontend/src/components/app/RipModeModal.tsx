import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { errorDetail } from "@/lib/api";
import { useRipMode } from "@/lib/queries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  active: boolean;
}

const STEPS = [
  "Suspendendo processos em segundo plano…",
  "Isolando memória para o jogo…",
  "Prioridade máxima concedida ao processo em foco…",
];

export default function RipModeModal({ open, onOpenChange, active }: Props) {
  const [count, setCount] = useState(3);
  const [phase, setPhase] = useState<"countdown" | "ready">("countdown");
  const rip = useRipMode();

  useEffect(() => {
    if (!open) return;
    setPhase("countdown");
    setCount(3);
    const id = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(id);
          setPhase("ready");
          return 0;
        }
        return c - 1;
      });
    }, 700);
    return () => clearInterval(id);
  }, [open]);

  const handleActivate = () => {
    rip.mutate(!active, {
      onSuccess: (res) => {
        if (active) {
          toast.success("RIP Mode desativado. Os ajustes aplicados continuam valendo.");
        } else if (res.applied_now.length > 0) {
          toast.success(`RIP Mode ativado — ${res.applied_now.length} ajustes aplicados. Sistema liberado!`);
        } else {
          toast.success("RIP Mode ativado — sistema liberado para o jogo!");
        }
        onOpenChange(false);
      },
      onError: (e) => toast.error(errorDetail(e, "Não foi possível ativar o RIP Mode agora.")),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-red-500/30 bg-popover">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <Zap className="size-5 text-red-400" />
            {active ? "RIP Mode está ativo" : "Ativar RIP Mode"}
          </DialogTitle>
          <DialogDescription>
            {active
              ? "O pacote máximo de FPS está aplicado. Desative para voltar ao modo normal."
              : "Aplica o pacote máximo de FPS com um clique — 12 ajustes de CPU, GPU, rede e input lag."}
          </DialogDescription>
        </DialogHeader>

        {!active && (
          <div className="rounded-xl border border-red-500/25 bg-red-950/20 p-6 text-center">
            {phase === "countdown" ? (
              <>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-red-300">
                  Isolando processos…
                </p>
                <p className="mt-2 font-mono text-6xl font-bold text-red-400 text-glow-cyan" data-testid="rip-countdown">
                  {count}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{STEPS[3 - count] ?? STEPS[2]}</p>
              </>
            ) : (
              <>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">
                  Sistema pronto
                </p>
                <p className="mt-2 font-heading text-2xl font-bold">
                  Processos isolados<span className="text-red-400">.</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  É só abrir o jogo — tudo pronto para a partida.
                </p>
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
          <span>Pacote: 12 ajustes de alto impacto</span>
          {active && (
            <Badge className="border border-red-500/40 bg-red-500/15 text-red-300">ATIVO</Badge>
          )}
        </div>

        <Button
          variant={active ? "outline" : "destructive"}
          size="lg"
          className="w-full"
          data-testid="rip-mode-confirm"
          disabled={phase === "countdown" || rip.isPending}
          onClick={handleActivate}
        >
          <Zap className="size-4" />
          {rip.isPending
            ? "Aplicando…"
            : active
              ? "Desativar RIP Mode"
              : phase === "countdown"
                ? `Ativando em ${count}s…`
                : "Confirmar Ativação"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
