import { Link } from "react-router-dom";
import { Download, Gauge, MousePointerClick, ShieldCheck, MonitorPlay } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const GAMES = ["FORTNITE", "VALORANT", "CS2", "WARZONE", "ROBLOX", "MINECRAFT"];

// Static preview of the app's tweak list, shown inside the hero mock panel
const MOCK_TWEAKS = [
  { name: "Desestacionar núcleos da CPU", on: true },
  { name: "TCP NoDelay (Nagle off)", on: true },
  { name: "Polling rate do mouse 1000Hz", on: true },
  { name: "Telemetria do Windows off", on: true },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?crop=entropy&cs=srgb&fm=jpg&q=85')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#090A0F]/80 via-[#090A0F]/90 to-[#090A0F]" />
      <div className="absolute inset-0 tactical-grid opacity-60" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-28 lg:pt-24">
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
              <ShieldCheck className="size-3.5" />
              100% reversível • sem risco de ban
            </Badge>
            <Badge variant="secondary">Windows 10 &amp; 11</Badge>
          </div>

          <h1 className="font-heading text-4xl font-extrabold tracking-tighter sm:text-5xl lg:text-[56px] lg:leading-[1.05]">
            Otimizador de PC e <span className="text-primary text-glow-cyan">acelerador de FPS</span>{" "}
            para jogos
          </h1>

          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Ajuste CPU, GPU e rede com segurança: mais FPS, menos ping e menos input lag. Mais de
            250 ajustes reversíveis em um só app —{" "}
            <span className="text-foreground">experimente agora mesmo no navegador</span>.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/app"
              data-testid="cta-optimize-hero"
              className="glow-accent inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-heading text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <Gauge className="size-4" />
              Testar no Navegador
            </Link>
            <a
              href="#planos"
              data-testid="cta-download-hero"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-card/60 px-6 font-heading text-sm font-bold backdrop-blur transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Download className="size-4" />
              Baixar para Windows
            </a>
          </div>

          <div className="mt-10">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Com a confiança de 250.000+ jogadores em
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2" data-testid="game-logos-bar">
              {GAMES.map((g) => (
                <span
                  key={g}
                  className="font-heading text-sm font-bold tracking-wider text-slate-400"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Benchmark mock panel */}
        <div className="relative" data-testid="hero-benchmark-card">
          <div className="rounded-2xl border border-white/10 bg-card/80 p-5 backdrop-blur-xl glow-accent">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <MonitorPlay className="size-4 text-primary" />
                Benchmark ao vivo
              </div>
              <Badge className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                +126% FPS
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 py-4">
              <div className="rounded-lg border border-white/10 bg-[#0B0E15] p-4">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Antes
                </p>
                <p className="mt-1 font-mono text-3xl font-bold text-slate-300">95 FPS</p>
                <p className="mt-1 font-mono text-xs text-slate-500">17.4 ms de input lag</p>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="font-mono text-xs uppercase tracking-widest text-primary">Depois</p>
                <p className="mt-1 font-mono text-3xl font-bold text-primary text-glow-cyan">
                  215 FPS
                </p>
                <p className="mt-1 font-mono text-xs text-primary/70">2.1 ms de input lag</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-white/10 pt-4">
              {MOCK_TWEAKS.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-[#0B0E15] px-3 py-2"
                >
                  <span className="text-sm text-slate-300">{t.name}</span>
                  <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-emerald-500/90">
                    <span className="ml-auto mr-0.5 size-4 rounded-full bg-white transition-transform" />
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                <MousePointerClick className="size-3.5 text-primary" />
                Cada ajuste liga e desliga com um clique — nada é permanente.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
