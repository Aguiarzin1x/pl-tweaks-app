import { Check, Crown } from "lucide-react";
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
import { useActivateVip } from "@/lib/queries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLANS = [
  { name: "Mensal", price: "R$ 39,90", period: "/mês", highlight: false },
  { name: "Anual", price: "R$ 24,90", period: "/mês", highlight: true },
  { name: "Vitalício", price: "R$ 499,00", period: "", highlight: false },
];

const BENEFITS = [
  "Todos os ajustes de GPU, BIOS e rede avançada",
  "Presets competitivos por jogo",
  "Isolamento de processos e pré-alocação de RAM",
  "Atualizações e suporte prioritários",
];

export default function PremiumModal({ open, onOpenChange }: Props) {
  const activate = useActivateVip();

  const handleActivate = () => {
    activate.mutate(undefined, {
      onSuccess: () => {
        toast.success("VIP ativado! Todos os ajustes estão liberados.");
        onOpenChange(false);
      },
      onError: (e) => toast.error(errorDetail(e, "Não foi possível ativar o VIP agora.")),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-primary/30 bg-popover">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <Crown className="size-5 text-amber-400" />
            Desbloquear o RIP Tweaks Premium
          </DialogTitle>
          <DialogDescription>
            Ajustes avançados de GPU, BIOS, rede e isolamento competitivo — tudo liberado na hora.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-xl border p-3 text-center ${
                p.highlight ? "border-primary/50 bg-primary/5 glow-accent" : "border-border bg-card"
              }`}
            >
              {p.highlight && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 border-0 bg-primary px-2 text-[10px] font-bold text-primary-foreground">
                  Melhor oferta
                </Badge>
              )}
              <p className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {p.name}
              </p>
              <p className="mt-1 font-mono text-lg font-bold">{p.price}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{p.period}</p>
            </div>
          ))}
        </div>

        <ul className="space-y-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              {b}
            </li>
          ))}
        </ul>

        <Button
          className="w-full"
          size="lg"
          data-testid="vip-activate-button"
          disabled={activate.isPending}
          onClick={handleActivate}
        >
          <Crown className="size-4" />
          {activate.isPending ? "Ativando…" : "Simular Ativação VIP Imediata"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Simulação — nenhum valor será cobrado.
        </p>
      </DialogContent>
    </Dialog>
  );
}
