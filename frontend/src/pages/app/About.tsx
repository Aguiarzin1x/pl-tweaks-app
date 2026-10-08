import { Crown, Gauge, Heart, MessageCircle, Quote, ShieldCheck, Star, Timer, Users, Zap } from "lucide-react";
import { SiDiscord, SiTiktok } from "@icons-pack/react-simple-icons";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppShell from "@/components/app/AppShell";

const DISCORD_URL = "https://discord.gg/jpHaNTfJH5";
const TIKTOK_HANDLE = "@plotimizacao";
const TIKTOK_URL = "https://www.tiktok.com/@plotimizacao";

const PILLARS = [
  {
    icon: Timer,
    title: "Input Lag Nunca Mais!",
    text: "Timer resolution, polling rate e fila de pré-renderização: atacamos cada milissegundo entre o seu clique e o que aparece na tela.",
  },
  {
    icon: Zap,
    title: "Alta performance de verdade",
    text: "Núcleos desestacionados, energia sem limite e rede sem throttling — a máquina entrega o que o hardware promete.",
  },
  {
    icon: ShieldCheck,
    title: "100% reversível, zero risco",
    text: "Nada de tocar nos arquivos do jogo ou em driver de kernel. Ponto de restauração antes de qualquer mudança.",
  },
];

const REVIEWS = [
  {
    name: "Caio M.",
    handle: "@caiozl",
    stars: 5,
    text: "Fortnite saiu de 90 pra 140 de FPS no meu PC. O negócio do input lag é real, build ficou instantânea.",
  },
  {
    name: "Ana Beatriz",
    handle: "@anabia.fps",
    stars: 5,
    text: "Joguei Valorant a semana toda sem um stutter. O preset competitivo fez diferença no peek, sério.",
  },
  {
    name: "Rodrigo P.",
    handle: "@rodplays",
    stars: 5,
    text: "Notebook velho rodando Roblox liso pela primeira vez. Suporte no Discord respondeu em minutos.",
  },
  {
    name: "Lucas Ferraz",
    handle: "@ferrazcs",
    stars: 4,
    text: "CS2 com spray muito mais consistente. Só queria mais presets de jogos antigos, mas tá excelente.",
  },
];

const STATS = [
  { id: "pcs", icon: Users, value: "3k+", label: "PC Otimizados" },
  { id: "rating", icon: Heart, value: "4,9/5", label: "média de avaliação" },
  { id: "fps", icon: Gauge, value: "+126%", label: "ganho médio de FPS" },
];

function Stars({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-3.5 ${i <= count ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
        />
      ))}
    </span>
  );
}

function AboutContent() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6" data-testid="about-page">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight" data-testid="about-heading">
          Sobre Nós
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quem está por trás da PL Otimização e onde encontrar a nossa comunidade.
        </p>
      </div>

      {/* Apresentação */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="relative p-6 sm:p-8">
          <div className="absolute inset-0 tactical-grid opacity-30" />
          <div className="relative max-w-3xl">
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
              <Zap className="size-3.5" />
              PL Otimização
            </Badge>
            <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
              Alta performance e{" "}
              <span className="text-primary text-glow-cyan">input lag quase zero</span> no seu PC
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              A <strong className="text-foreground">PL Otimização</strong> nasceu de uma frustração
              simples: PC bom, jogo travando. Em vez de vender milagre, fomos atrás do que realmente
              segura o desempenho no Windows — núcleos estacionados, telemetria rodando no meio da
              partida, limitação de pacotes de rede e aquele atraso invisível entre o clique e o tiro.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Hoje são mais de <strong className="text-foreground">250 ajustes reversíveis</strong> de
              CPU, GPU, rede e periféricos, organizados em presets por jogo para você aplicar com um
              clique. Tudo auditável, tudo com ponto de restauração — porque desempenho sem segurança
              não é otimização, é sorte.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {STATS.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-border bg-background/60 p-4 backdrop-blur"
                  data-testid={`about-stat-${s.id}`}
                >
                  <s.icon className="size-4 text-primary" />
                  <p className="mt-2 font-mono text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pilares */}
      <div className="grid gap-4 md:grid-cols-3">
        {PILLARS.map((p) => (
          <Card key={p.title} className="border-white/10 transition-colors hover:border-primary/30">
            <CardContent className="p-5">
              <span className="flex size-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                <p.icon className="size-5 text-primary" />
              </span>
              <h3 className="mt-4 font-heading text-base font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comunidade: Discord + TikTok */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Discord */}
        <Card className="relative overflow-hidden border-[#5865F2]/35 bg-gradient-to-br from-[#5865F2]/18 via-card to-card">
          <CardContent className="relative p-6">
            <SiDiscord className="absolute -right-6 -top-6 size-32 text-[#5865F2]/10" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[#5865F2]">
                  <SiDiscord className="size-6 text-white" />
                </span>
                <div>
                  <h3 className="font-heading text-lg font-bold">Comunidade no Discord</h3>
                  <p className="font-mono text-xs text-muted-foreground">discord.gg/jpHaNTfJH5</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Suporte direto com a equipe, ajuda para montar o preset da sua máquina, avisos de
                novos ajustes e um canal só para comparar benchmarks com outros jogadores.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {[
                  "Suporte técnico humano, sem robô",
                  "Ajuda personalizada por hardware",
                  "Primeiro a saber de novos presets",
                ].map((b) => (
                  <li key={b} className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircle className="size-3.5 shrink-0 text-[#5865F2]" />
                    {b}
                  </li>
                ))}
              </ul>
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="about-discord-link"
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#5865F2] font-heading text-sm font-bold text-white transition-colors hover:bg-[#4752c4]"
              >
                <SiDiscord className="size-4" />
                Entrar no Discord
              </a>
            </div>
          </CardContent>
        </Card>

        {/* TikTok */}
        <Card className="relative overflow-hidden border-[#FE2C55]/35 bg-gradient-to-br from-[#FE2C55]/14 via-card to-card">
          <CardContent className="relative p-6">
            <SiTiktok className="absolute -right-6 -top-6 size-32 text-[#FE2C55]/10" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#25F4EE] to-[#FE2C55]">
                  <SiTiktok className="size-6 text-white" />
                </span>
                <div>
                  <h3 className="font-heading text-lg font-bold">TikTok oficial</h3>
                  <p className="font-mono text-xs text-primary" data-testid="about-tiktok-handle">
                    {TIKTOK_HANDLE}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Antes e depois reais, testes de FPS ao vivo e os feedbacks de quem já otimizou o PC
                com a gente. É lá que a comunidade mostra resultado.
              </p>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-bold text-amber-400">4,9</span>
                  <span className="font-mono text-xs text-muted-foreground">/5</span>
                </div>
                <div>
                  <Stars count={5} />
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    avaliações da comunidade
                  </p>
                </div>
              </div>

              <a
                href={TIKTOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="about-tiktok-link"
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#FE2C55]/50 bg-[#FE2C55]/10 font-heading text-sm font-bold text-[#FF5C7A] transition-colors hover:bg-[#FE2C55]/20"
              >
                <SiTiktok className="size-4" />
                Seguir {TIKTOK_HANDLE}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedbacks */}
      <div>
        <h2 className="font-heading text-lg font-bold tracking-tight">
          O que os jogadores falam
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Comentários da comunidade no TikTok e no Discord.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {REVIEWS.map((r) => (
            <Card
              key={r.handle}
              className="border-white/10 transition-colors hover:border-primary/25"
              data-testid={`about-review-${r.handle.replace("@", "")}`}
            >
              <CardContent className="p-5">
                <Quote className="size-5 text-primary/40" />
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">"{r.text}"</p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <div>
                    <p className="text-sm font-bold">{r.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{r.handle}</p>
                  </div>
                  <Stars count={r.stars} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-amber-500/25 bg-amber-500/5">
        <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
          <Crown className="size-6 shrink-0 text-amber-400" />
          <div className="flex-1">
            <p className="font-heading text-sm font-bold">Quer o pacote completo?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Os ajustes avançados de GPU, BIOS e rede competitiva ficam no PL Premium.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-amber-500/40 text-amber-300"
            data-testid="about-premium-link"
            onClick={() => navigate("/app/ajustes?filter=premium")}
          >
            Ver ajustes Premium
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function About() {
  return (
    <AppShell>
      <AboutContent />
    </AppShell>
  );
}
