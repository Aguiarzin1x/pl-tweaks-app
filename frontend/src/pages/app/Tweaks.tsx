import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppShell, { useAppUi } from "@/components/app/AppShell";
import TweakCard from "@/components/app/TweakCard";
import { errorDetail } from "@/lib/api";
import { useCatalog, useMe, useToggleTweak, useTweaksState } from "@/lib/queries";
import type { Tweak } from "@/lib/types";

type CategoryFilter = string; // "todas" or category id
type StateFilter = "todos" | "gratuitos" | "premium" | "aplicados";

const STATE_FILTERS: { id: StateFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "gratuitos", label: "Gratuitos" },
  { id: "premium", label: "Premium" },
  { id: "aplicados", label: "Aplicados" },
];

function TweaksContent() {
  const me = useMe();
  const state = useTweaksState(me.isSuccess);
  const catalog = useCatalog();
  const toggle = useToggleTweak();
  const ui = useAppUi();

  const [searchParams, setSearchParams] = useSearchParams();
  const cat = searchParams.get("cat") ?? "todas";
  const [stateFilter, setStateFilter] = useState<StateFilter>("todos");
  const [query, setQuery] = useState("");

  const appliedSet = useMemo(() => new Set(state.data?.applied ?? []), [state.data]);
  const isPremium = me.data?.is_premium ?? false;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (catalog.data?.tweaks ?? []).filter((t) => {
      if (cat !== "todas" && t.category !== cat) return false;
      if (stateFilter === "gratuitos" && t.premium) return false;
      if (stateFilter === "premium" && !t.premium) return false;
      if (stateFilter === "aplicados" && !appliedSet.has(t.key)) return false;
      if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)))
        return false;
      return true;
    });
  }, [catalog.data, cat, stateFilter, appliedSet, query]);

  const handleToggle = (tweak: Tweak, applied: boolean) => {
    toggle.mutate(
      { key: tweak.key, applied },
      {
        onSuccess: () =>
          toast.success(applied ? `${tweak.name} aplicado` : `${tweak.name} desfeito`),
        onError: (e) => toast.error(errorDetail(e, "Não foi possível aplicar o ajuste.")),
      },
    );
  };

  const handleLocked = (tweak: Tweak) => {
    if (isPremium) {
      // VIP should never see locked tweaks — treat as a normal toggle fallback.
      handleToggle(tweak, !appliedSet.has(tweak.key));
      return;
    }
    toast.info("Este ajuste é exclusivo do Premium");
    ui.openPremium();
  };

  const setCategory = (id: string) => {
    if (id === "todas") searchParams.delete("cat");
    else searchParams.set("cat", id);
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight" data-testid="tweaks-heading">
            Todos os Ajustes
          </h1>
          <p className="text-sm text-muted-foreground">
            {catalog.data ? `${catalog.data.tweaks.length} ajustes reversíveis — ligue e desligue com um clique.` : "Carregando catálogo…"}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar ajuste…"
            className="pl-9"
            data-testid="tweak-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Category rail */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0" data-testid="category-rail">
            <button
              onClick={() => setCategory("todas")}
              data-testid="category-pill-todas"
              className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                cat === "todas"
                  ? "bg-primary/10 font-bold text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              Todas as categorias
            </button>
            {(catalog.data?.categories ?? []).map((c) => {
              const total = (catalog.data?.tweaks ?? []).filter((t) => t.category === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  data-testid={`category-pill-${c.id}`}
                  className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    cat === c.id
                      ? "bg-primary/10 font-bold text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {c.name}
                  <span className="ml-1.5 font-mono text-xs opacity-70">{total}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {STATE_FILTERS.map((f) => (
              <Badge
                key={f.id}
                variant="outline"
                onClick={() => setStateFilter(f.id)}
                data-testid={`tweak-filter-${f.id}`}
                className={`cursor-pointer px-3 py-1 transition-colors ${
                  stateFilter === f.id
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </Badge>
            ))}
            <span className="ml-auto font-mono text-xs text-muted-foreground" data-testid="tweaks-shown-count">
              {filtered.length} ajustes
            </span>
          </div>

          {catalog.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nenhum ajuste encontrado para esse filtro.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="tweaks-grid">
              {filtered.map((t) => (
                <TweakCard
                  key={t.key}
                  tweak={t}
                  applied={appliedSet.has(t.key)}
                  locked={t.premium && !isPremium}
                  pending={toggle.isPending && toggle.variables?.key === t.key}
                  onToggle={handleToggle}
                  onLockedClick={handleLocked}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {catalog.isError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Não foi possível carregar o catálogo de ajustes — tente recarregar a página.
          <Button variant="link" size="sm" className="text-amber-300" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
        </div>
      )}
    </div>
  );
}

export default function Tweaks() {
  return (
    <AppShell>
      <TweaksContent />
    </AppShell>
  );
}
