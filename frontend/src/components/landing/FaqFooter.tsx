import { Link } from "react-router-dom";
import { ChevronDown, MessageCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

const FAQS = [
  {
    q: "Os ajustes são realmente reversíveis?",
    a: "Sim. Cada ajuste liga e desliga com um clique, e o app cria um ponto de restauração do Windows antes da primeira mudança. Você pode devolver o PC ao estado original quando quiser.",
  },
  {
    q: "Posso ser banido nos jogos?",
    a: "Não. O PL Tweaks não injeta código nos jogos, não modifica arquivos de jogo e não usa drivers de kernel — zero interação com Vanguard, EasyAntiCheat e BattlEye.",
  },
  {
    q: "Funciona no meu PC?",
    a: "Funciona em qualquer PC com Windows 10 ou 11. O ganho é maior em sistemas acumulados com programas de fundo e notebooks cheios de utilitários do fabricante.",
  },
  {
    q: "Quanto de FPS eu ganho?",
    a: "Depende do hardware, do jogo e do estado do sistema. A maioria vê ganho real — o jeito honesto de descobrir é medir o seu FPS antes e depois com o benchmark integrado.",
  },
  {
    q: "O app precisa ficar rodando?",
    a: "Não. Depois que os ajustes são aplicados, eles continuam valendo mesmo com o app fechado. O RIP Mode é a única coisa que você ativa na hora de jogar.",
  },
  {
    q: "Tem versão gratuita?",
    a: "Tem — você está nela. A versão web libera o catálogo gratuito completo no navegador, e o plano Premium desbloqueia os ajustes avançados de GPU, BIOS e rede.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-white/10 bg-card transition-colors open:border-primary/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-heading text-sm font-bold [&::-webkit-details-marker]:hidden">
        {q}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <p className="border-t border-white/10 p-5 pt-4 text-sm text-muted-foreground">{a}</p>
    </details>
  );
}

export default function FaqFooter() {
  return (
    <>
      <section id="faq" className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">FAQs</p>
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Tem dúvidas?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Cobrimos segurança e anti-cheat, FPS e ping, preços, dispositivos e solução de
            problemas.
          </p>
        </div>
        <div className="mt-10 space-y-3" data-testid="faq-list">
          {FAQS.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/app" className={buttonVariants({ size: "lg" })}>
            Começar agora — é grátis
          </Link>
          <a
            href="#resultados"
            className={`${buttonVariants({ variant: "outline", size: "lg" })} gap-2`}
          >
            <MessageCircle className="size-4" />
            Falar no Discord
          </a>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#07080C]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex flex-col justify-between gap-8 md:flex-row">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-heading text-xs font-black text-primary-foreground">
                  PL
                </span>
                <span className="font-heading font-bold">
                  PL <span className="text-primary">TWEAKS</span>
                </span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Mais de 250 ajustes reversíveis em um só app, para Windows 10 e 11. Mais FPS, menos
                ping, menos input lag.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
              <div>
                <p className="font-heading font-bold">Produto</p>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  <li><a href="#recursos" className="hover:text-foreground">Recursos</a></li>
                  <li><a href="#planos" className="hover:text-foreground">Planos</a></li>
                  <li><Link to="/app" className="hover:text-foreground">Versão web</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-heading font-bold">Suporte</p>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
                  <li><a href="#faq" className="hover:text-foreground">Discord</a></li>
                  <li><a href="#faq" className="hover:text-foreground">Guia de primeiros passos</a></li>
                </ul>
              </div>
              <div>
                <p className="font-heading font-bold">Status</p>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    Servidores operacionais
                  </li>
                  <li>PT-BR · Brasil</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-6 text-xs leading-relaxed text-muted-foreground">
            <p>
              Clone educacional do PL Tweaks. Não afiliado à Riot Games, Epic Games, Activision,
              Valve, Microsoft ou Mojang. Fortnite, Valorant, Counter-Strike, Warzone, Roblox e
              Minecraft pertencem aos seus respectivos proprietários.
            </p>
            <p className="mt-2">© 2026 PL Tweaks — demonstração de produto.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
