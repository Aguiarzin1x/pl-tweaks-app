import { Crown, Flame, Lock, Minus, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Tweak } from "@/lib/types";

interface Props {
  tweak: Tweak;
  applied: boolean;
  locked: boolean;
  pending: boolean;
  onToggle: (tweak: Tweak, applied: boolean) => void;
  onLockedClick: (tweak: Tweak) => void;
}

const IMPACT = {
  alto: { label: "Impacto alto", icon: Flame, cls: "border-red-500/30 bg-red-500/10 text-red-300" },
  medio: { label: "Impacto médio", icon: Zap, cls: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  baixo: { label: "Impacto baixo", icon: Minus, cls: "border-slate-500/30 bg-slate-500/10 text-slate-300" },
} as const;

export default function TweakCard({ tweak, applied, locked, pending, onToggle, onLockedClick }: Props) {
  const impact = IMPACT[(tweak.impact as keyof typeof IMPACT) ?? "baixo"] ?? IMPACT.baixo;

  const handleClick = () => {
    if (locked) onLockedClick(tweak);
    else onToggle(tweak, !applied);
  };

  return (
    <Card
      className={`border-white/10 bg-card transition-all hover:-translate-y-0.5 ${
        applied ? "border-emerald-500/40" : "hover:border-primary/40"
      } ${locked ? "opacity-90" : ""}`}
    >
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-sm font-bold leading-snug">{tweak.name}</h3>
          {tweak.premium && (
            <Badge
              className="shrink-0 border-0 bg-[#7C3AED] font-heading text-[10px] font-bold text-white"
              data-testid={`tweak-premium-badge-${tweak.key}`}
            >
              <Crown className="size-3" />
              PREMIUM
            </Badge>
          )}
        </div>

        <p className="mt-2 flex-1 text-sm text-muted-foreground">{tweak.description}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 ${impact.cls}`}>
            <impact.icon className="size-3" />
            {impact.label}
          </span>
          {tweak.fps_gain > 0 && (
            <span className="rounded-md border border-emerald-500/30 bg-emerald-950/50 px-1.5 py-0.5 text-emerald-300">
              +{tweak.fps_gain} FPS
            </span>
          )}
          {tweak.ping_reduction > 0 && (
            <span className="rounded-md border border-cyan-500/30 bg-cyan-950/50 px-1.5 py-0.5 text-cyan-300">
              -{tweak.ping_reduction} ms ping
            </span>
          )}
          {tweak.input_lag_reduction > 0 && (
            <span className="rounded-md border border-blue-500/30 bg-blue-950/50 px-1.5 py-0.5 text-blue-300">
              -{tweak.input_lag_reduction} ms lag
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <span className={`text-xs ${applied ? "font-bold text-emerald-400" : "text-muted-foreground"}`}>
            {locked ? "Bloqueado — Premium" : applied ? "Aplicado" : "Não aplicado"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={applied}
            aria-label={applied ? `Desfazer ${tweak.name}` : `Aplicar ${tweak.name}`}
            data-testid={`tweak-toggle-${tweak.key}`}
            disabled={pending}
            onClick={handleClick}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60 ${
              applied ? "bg-emerald-500" : "bg-slate-600"
            } ${locked ? "bg-[#7C3AED]/60" : ""}`}
          >
            <span
              className={`mx-1 flex size-4 items-center justify-center rounded-full bg-white transition-transform duration-200 ${
                applied ? "translate-x-5" : "translate-x-0"
              }`}
              style={{ transform: applied ? "translateX(20px)" : "translateX(0)" }}
            >
              {locked && <Lock className="size-2.5 text-[#7C3AED]" />}
            </span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
