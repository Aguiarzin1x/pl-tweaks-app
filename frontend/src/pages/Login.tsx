import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Gauge, History, ShieldCheck, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiPost, errorDetail, isApiError } from "@/lib/api";
import { useMe } from "@/lib/queries";
import { beginSession } from "@/lib/session";
import type { User } from "@/lib/types";

const BULLETS = [
  { icon: Zap, text: "Mais de 250 ajustes reversíveis de CPU, GPU e rede" },
  { icon: Gauge, text: "Mais FPS, menos ping e menos input lag com segurança" },
  { icon: History, text: "Ponto de restauração antes de qualquer mudança" },
  { icon: ShieldCheck, text: "Zero risco de ban — sem tocar nos seus jogos" },
];

export default function Login() {
  const me = useMe();
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  // A guest session is auto-provisioned for everyone (so /app needs no login), so it must
  // NOT count as "already signed in" — only a real account redirects away from /login.
  if (me.isSuccess && !me.data.is_guest) return <Navigate to="/app" replace />;

  const submit = async (mode: "login" | "signup") => {
    setPending(true);
    try {
      await apiPost<User>(mode === "login" ? "/auth/login" : "/auth/signup", { email, password });
      beginSession();
      navigate("/app");
    } catch (e) {
      if (isApiError(e) && e.status === 401) toast.error("E-mail ou senha incorretos");
      else if (isApiError(e) && e.status === 409) toast.error("Este e-mail já está cadastrado — faça login");
      else toast.error(errorDetail(e));
    } finally {
      setPending(false);
    }
  };

  const onSubmit = (e: FormEvent, mode: "login" | "signup") => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha e-mail e senha");
      return;
    }
    void submit(mode);
  };

  const loginDemo = async () => {
    setPending(true);
    try {
      await apiPost<User>("/auth/login", { email: "demo@riptweaks.app", password: "ripdemo123" });
      beginSession();
      navigate("/app");
    } catch (e) {
      toast.error(errorDetail(e));
      setPending(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Branding panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?crop=entropy&cs=srgb&fm=jpg&q=85')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090A0F] via-[#090A0F]/80 to-[#090A0F]/40" />
        <div className="absolute inset-0 tactical-grid opacity-50" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-heading text-sm font-black text-primary-foreground">
              PL
            </span>
            <span className="font-heading text-lg font-bold">
              PL <span className="text-primary">TWEAKS</span>
            </span>
          </div>
          <div>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight">
              Seu PC, no máximo.
              <br />
              <span className="text-primary text-glow-cyan">Sua partida, sem lag.</span>
            </h2>
            <ul className="mt-8 space-y-4">
              {BULLETS.map((b) => (
                <li key={b.text} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="flex size-8 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
                    <b.icon className="size-4 text-primary" />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Com a confiança de 250.000+ jogadores
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-heading text-sm font-black text-primary-foreground">
              PL
            </span>
            <span className="font-heading text-lg font-bold">PL TWEAKS</span>
          </div>

          <h1 className="font-heading text-2xl font-bold tracking-tight" data-testid="auth-heading">
            Bem-vindo de volta
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entre para sincronizar a otimização do seu PC.
          </p>

          <Tabs value={tab} onValueChange={setTab} className="mt-6" data-testid="auth-tabs">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={(e) => onSubmit(e, "login")} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-mail</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    data-testid="login-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    data-testid="login-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={pending}
                  data-testid="login-submit-button"
                >
                  {pending ? "Entrando…" : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={(e) => onSubmit(e, "signup")} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    data-testid="signup-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="mínimo de 6 caracteres"
                    autoComplete="new-password"
                    data-testid="signup-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={pending}
                  data-testid="signup-submit-button"
                >
                  {pending ? "Criando conta…" : "Criar conta grátis"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Grátis para sempre nos ajustes livres. Sem cartão de crédito.
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 border-t border-border pt-6">
            <Button
              variant="outline"
              className="w-full"
              disabled={pending}
              onClick={() => void loginDemo()}
              data-testid="demo-login-button"
            >
              <Gauge className="size-4 text-primary" />
              Entrar com a conta demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
