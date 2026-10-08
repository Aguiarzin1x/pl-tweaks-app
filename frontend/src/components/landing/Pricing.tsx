import { Link } from "react-router-dom";
import { Check, Crown, Quote } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const PLANS = [
  {
    name: "Mensal",
    price: "R$ 39,90",
    period: "/ mês",
    note: "Cobrado todo mês, cancele quando quiser",
    badge: null as string | null,
    cta: "Obter Premium",
  },
  {
    name: "Anual",
    price: "R$ 24,90",
    period: "/ mês",
    note: "Cobrado R$ 299,00 uma vez por ano",
    badge: "Melhor oferta · economize 37%",
    cta: "Obter Premium",
  },
  {
    name: "Vitalício",
    price: "R$ 499,00",
    period: "",
    note: "Seu para sempre, sem renovações",
    badge: null as string | null,
    cta: "Obter Vitalício",
  },
];

const PLAN_FEATURES = [
  "Todos os ajustes de CPU & SSD",
  "Todos os ajustes de Rede & Input Lag",
  "Todos os ajustes de Energia & Windows",
  "Todos os ajustes de GPU",
  "Todos os ajustes de BIOS",
  "Todos os ajustes de Debloat",
  "Ferramentas de RAM & Limpeza",
  "Agendamento de Limpeza Inteligente",
  "Atualizações & suporte prioritários",
];

const TESTIMONIALS = [
  {
    name: "Lucas “Fzinn” M.",
    role: "Jogador de Valorant — Imortal 3",
    quote:
      "Passei de 165 para 340 FPS e o input lag sumiu. O flick ficou instantâneo, parece que joguei em outro PC.",
  },
  {
    name: "Bielz1n",
    role: "Criador de conteúdo — 380k inscritos",
    quote:
      "Testei com benchmark gravado: +118% no Fortnite com o mesmo hardware. O preset de 1 clique vende o app sozinho.",
  },
  {
    name: "KaueFPS",
    role: "Competidor de CS2",
    quote:
      "O que me ganhou foi o ponto de restauração. Apliquei 40 ajustes, desfiz 3 no outro dia, zero susto.",
  },
];

export default function Pricing() {
  return (
    <>
      <section id="planos" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Planos</p>
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Libere todos os ajustes
          </h2>
          <p className="mt-3 text-muted-foreground">
            Comece grátis no navegador. Quando quiser os ajustes avançados, escolha um plano —
            cancelamento a qualquer momento.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {PLANS.map((p) => (
            <Card
              key={p.name}
              className={`relative border-white/10 bg-card ${p.badge ? "border-primary/50 glow-accent" : ""}`}
            >
              {p.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-0 bg-primary font-heading text-xs font-bold text-primary-foreground">
                  {p.badge}
                </Badge>
              )}
              <CardContent className="p-6">
                <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  {p.name}
                </h3>
                <p className="mt-3">
                  <span className="font-heading text-4xl font-extrabold tracking-tight">
                    {p.price}
                  </span>
                  <span className="text-muted-foreground">{p.period}</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{p.note}</p>
                <Link
                  to="/app"
                  data-testid={`plan-cta-${p.name.toLowerCase()}`}
                  className={`${buttonVariants({ variant: p.badge ? "default" : "outline" })} mt-6 w-full`}
                >
                  {p.cta}
                </Link>
                <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-5">
                  {PLAN_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0B0E15]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Comunidade</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Quem joga sério, otimiza
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="border-white/10 bg-card">
                <CardContent className="p-6">
                  <Quote className="size-5 text-primary/60" />
                  <p className="mt-3 text-sm leading-relaxed text-foreground/90">{t.quote}</p>
                  <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 font-heading text-xs font-bold text-primary">
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                    <Crown className="ml-auto size-4 text-amber-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
