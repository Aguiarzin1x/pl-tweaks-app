import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

const LINKS = [
  { label: "Resultados", href: "#resultados" },
  { label: "Recursos", href: "#recursos" },
  { label: "Jogos", href: "#jogos" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
];

export default function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090A0F]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" data-testid="landing-logo-link">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-heading text-sm font-black tracking-tighter text-primary-foreground glow-cyan">
            RIP
          </span>
          <span className="font-heading text-lg font-bold tracking-tight">
            PL <span className="text-primary">TWEAKS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/app"
            data-testid="cta-optimize-navbar"
            className={buttonVariants({ size: "sm" })}
          >
            <Zap className="size-4" />
            Otimizar Meu PC
          </Link>
        </div>
      </div>
    </header>
  );
}
