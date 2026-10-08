import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { motion } from "motion/react";

import { Card, CardContent } from "@/components/ui/card";

interface GameResult {
  name: string;
  before: number;
  gainPct: number;
  desc: string;
}

const RESULTS: GameResult[] = [
  { name: "Fortnite", before: 95, gainPct: 115, desc: "Construções e edições registrando na hora, sem quedas no endgame." },
  { name: "Valorant", before: 165, gainPct: 125, desc: "Movimentos do mouse rápidos e precisos — o acerto registra no clique." },
  { name: "Roblox", before: 60, gainPct: 155, desc: "Taxa de quadros liberada para movimento absurdamente suave." },
  { name: "Minecraft", before: 75, gainPct: 125, desc: "Fim das travadas ao carregar áreas e dos picos de lag no PvP." },
  { name: "Warzone", before: 90, gainPct: 135, desc: "Fluido mesmo em explosões intensas e tiroteio de perto." },
  { name: "Counter-Strike 2", before: 145, gainPct: 115, desc: "Todo flick shot registrado na hora, com zero atraso de tela." },
];

function SliderSection() {
  const [t, setT] = useState(100);
  const fps = Math.round(95 + (215 - 95) * (t / 100));
  const lag = (17.4 + (2.1 - 17.4) * (t / 100)).toFixed(1);

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-6 sm:p-8" data-testid="fps-comparison">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Antes / depois — arraste para comparar
      </p>
      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <div>
          <p className="font-heading text-sm text-muted-foreground">FPS médio</p>
          <p className="font-mono text-6xl font-bold text-primary text-glow-cyan" data-testid="fps-comparison-value">
            {fps}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            de 95 para 215 FPS no Fortnite (RTX 3060)
          </p>
        </div>
        <div>
          <p className="font-heading text-sm text-muted-foreground">Input lag</p>
          <p className="font-mono text-6xl font-bold text-foreground" data-testid="lag-comparison-value">
            {lag}
            <span className="text-2xl text-muted-foreground"> ms</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">de 17.4 ms para 2.1 ms do clique à tela</p>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={t}
        onChange={(e) => setT(Number(e.target.value))}
        className="mt-8 w-full accent-[#00F0FF]"
        aria-label="Comparar antes e depois"
        data-testid="fps-comparison-slider"
      />
      <div className="flex justify-between font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <span>PC padrão</span>
        <span>RIP Tweaks</span>
      </div>
    </div>
  );
}

export default function Results() {
  return (
    <section id="resultados" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Benchmarks</p>
        <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Resultados reais
        </h2>
        <p className="mt-3 text-muted-foreground">
          Sinta a diferença entre um PC padrão e uma máquina ajustada pelo RIP Tweaks. Vamos além
          de empurrar o FPS máximo — estabilizamos seus 1% lows para eliminar os travamentos.
        </p>
      </div>

      <div className="mt-10" data-testid="interactive-comparison">
        <SliderSection />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="results-grid">
        {RESULTS.map((r, i) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Card className="h-full border-white/10 bg-card transition-colors hover:border-primary/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-bold">{r.name}</h3>
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-950/60 px-2 py-0.5 font-mono text-xs font-bold text-emerald-300">
                    <TrendingUp className="size-3" />
                    +{r.gainPct}%
                  </span>
                </div>
                <p className="mt-4 font-mono text-4xl font-bold text-foreground">
                  {Math.round(r.before * (1 + r.gainPct / 100))}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">FPS</span>
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  de {r.before} FPS • {r.gainPct}% de aumento
                </p>
                <p className="mt-3 text-sm text-muted-foreground">{r.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
