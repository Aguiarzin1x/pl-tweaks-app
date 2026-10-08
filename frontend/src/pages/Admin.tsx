import { Crown, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppShell from "@/components/app/AppShell";
import { useAdminUsers, useMe, useToggleAdminSubscription } from "@/lib/queries";
import { toast } from "sonner";

function AdminContent() {
  const me = useMe();
  const users = useAdminUsers(me.isSuccess);
  const toggle = useToggleAdminSubscription();
  if (users.isError) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">Acesso negado. Esta área é exclusiva do administrador.</div>;
  const leaderboard = [...(users.data ?? [])].sort((a, b) => b.referral_count - a.referral_count).slice(0, 5);
  return <div className="space-y-6">
    <div><h1 className="font-heading text-2xl font-bold">Administração</h1><p className="text-sm text-muted-foreground">Gestão de planos e acompanhamento das indicações.</p></div>
    <Card className="border-white/10 bg-card"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /> Usuários</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-muted-foreground"><th className="p-3">E-mail</th><th className="p-3">Indicações</th><th className="p-3">Plano</th><th className="p-3 text-right">Ação</th></tr></thead><tbody>{users.isLoading ? <tr><td colSpan={4} className="p-6 text-center">Carregando…</td></tr> : (users.data ?? []).map((user) => <tr key={user.id} className="border-b border-border/60"><td className="p-3 font-medium">{user.email}</td><td className="p-3">{user.referral_count}</td><td className="p-3">{user.is_premium ? <Badge className="bg-amber-500/15 text-amber-300"><Crown className="mr-1 size-3" /> PRO/VIP</Badge> : <Badge variant="outline">FREE</Badge>}</td><td className="p-3 text-right"><Button size="sm" variant="outline" disabled={toggle.isPending} onClick={() => toggle.mutate({ userId: user.id, active: !user.is_premium }, { onSuccess: () => toast.success("Plano atualizado"), onError: () => toast.error("Não foi possível atualizar o plano") })}>{user.is_premium ? "Desativar" : "Ativar PRO/VIP"}</Button></td></tr>)}</tbody></table></CardContent></Card>
    <Card className="border-white/10 bg-card"><CardHeader><CardTitle className="flex items-center gap-2"><Users className="size-5 text-primary" /> Leaderboard de indicações</CardTitle></CardHeader><CardContent className="space-y-3">{leaderboard.map((user, index) => <div key={user.id} className="flex items-center justify-between rounded-lg border border-border bg-[#0B0E15] p-4"><div><span className="mr-3 font-mono text-primary">#{index + 1}</span><span className="font-medium">{user.email}</span></div><Badge variant="outline">{user.referral_count} amigos</Badge></div>)}</CardContent></Card>
  </div>;
}
export default function Admin() { return <AppShell><AdminContent /></AppShell>; }
