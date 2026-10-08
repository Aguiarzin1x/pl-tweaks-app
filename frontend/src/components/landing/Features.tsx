import { AppWindow, Cpu, HardDrive, History, MousePointer2, ShieldCheck, Wifi, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Cpu,
    title: "Hardware & CPU Unparking",
    desc: "Núcleos desestacionados, prioridade de agendamento, XMP/EXPO e curvas de ventoinha — tudo pelo app.",
  },
  {
    icon: AppWindow,
    title: "Windows & Debloat",
    desc: "Telemetria off, bloatware removido, plano de energia Extreme e inicialização enxuta.",
  },
  {
    icon: Wifi,
    title: "Rede & Ping Baixo",
    desc: "TCP NoDelay, limitação de rede liberada e DNS otimizado para latência estável.",
  },
  {
    icon: MousePointer2,
    title: "Input Lag & Periféricos",
    desc: "Polling rate 1000Hz, resolução de timer 0.5ms e aceleração do ponteiro desligada.",
  },
];

const SAFETY = [
  {
    icon: ShieldCheck,
    title: "Nunca mexe nos seus jogos",
    desc: "Nada é injetado nos jogos nem um único arquivo é modificado. Só Windows e hardware.",
  },
  {
    icon: History,
    title: "Toda mudança é reversível",
    desc: "Desfaça qualquer ajuste com um clique e devolva o PC ao estado original quando quiser.",
  },
  {
    icon: Zap,
    title: "Sem risco de anti-cheat",
    desc: "Sem drivers de kernel e zero interação com Vanguard, EAC e BattlEye. Impossível dar ban.",
  },
  {
    icon: HardDrive,
    title: "Backup antes de começar",
    desc: "Um ponto de restauração do Windows é criado antes de aplicar as mudanças.",
  },
];

export default function Features() {
  return (
    <>
      <section id="recursos" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Recursos</p>
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            FPS é só metade da batalha
          </h2>
          <p className="mt-3 text-muted-foreground">
            FPS alto não significa nada se os cliques atrasam. O PL Tweaks remove o lixo que segura
            o seu hardware e derruba a latência do sistema ao mínimo absoluto.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card
              key={f.title}
              className="border-white/10 bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40"
            >
              <CardContent className="p-5">
                <div className="flex size-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
                  <f.icon className="size-5 text-primary" />
                </div>
                <h3 className="mt-4 font-heading text-base font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* RIP Mode highlight band */}
        <div className="relative mt-4 overflow-hidden rounded-2xl border border-red-500/25 bg-gradient-to-r from-red-950/50 via-card to-card p-6 sm:p-8">
          <div className="absolute inset-0 tactical-grid opacity-40" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-red-500/15">
                <Zap className="size-6 text-red-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-xl font-bold">RIP Mode Turbo</h3>
                  <Badge className="border border-red-500/40 bg-red-500/15 text-red-300">
                    EXCLUSIVO
                  </Badge>
                </div>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  Um botão que suspende os processos de segundo plano e entrega o sistema inteiro ao
                  jogo, segundos antes de você entrar na partida.
                </p>
              </div>
            </div>
            <p className="font-mono text-sm text-red-300/90">+12 ajustes com 1 clique</p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0B0E15]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative overflow-hidden rounded-2xl border border-white/10">
            <img
              src="https://images.unsplash.com/photo-1632749042303-7f7a18ed6ff0?crop=entropy&cs=srgb&fm=jpg&q=85"
              alt="Hardware de PC — motherboard e GPU de alto desempenho"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090A0F]/85 to-transparent" />
            <p className="absolute bottom-4 left-4 font-mono text-xs uppercase tracking-[0.2em] text-primary">
              100% seguro &amp; reversível
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Segurança</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Seguro por design
            </h2>
            <p className="mt-3 text-muted-foreground">
              O PL Tweaks ajusta o Windows e o seu hardware, nunca os seus jogos. Sem hacks
              arriscados, sem surpresas e nada que você não possa desfazer.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {SAFETY.map((s) => (
                <div key={s.title} className="flex gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-950/50">
                    <s.icon className="size-4.5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
