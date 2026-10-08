import { Activity, Cpu, MemoryStick, Monitor } from "lucide-react";

import { useTelemetry } from "@/lib/telemetry";

interface Props {
  optimizationPct: number;
}

function tempColor(t: number): string {
  if (t < 60) return "text-emerald-400";
  if (t < 78) return "text-amber-400";
  return "text-red-400";
}

function GaugeCard({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: typeof Cpu;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      data-testid={id}
      className="flex-1 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <p className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        <Activity className="ml-auto size-3.5 animate-telemetry-pulse text-emerald-400" />
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function HardwareGauges({ optimizationPct }: Props) {
  const t = useTelemetry(optimizationPct);

  return (
    <div className="flex flex-col gap-3 sm:flex-row" data-testid="hardware-gauges">
      <GaugeCard id="telemetry-cpu" icon={Cpu} title="CPU">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-2xl font-bold">{t.cpu.usage}%</span>
          <span className="font-mono text-xs text-muted-foreground">{t.cpu.clock} GHz</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700"
            style={{ width: `${t.cpu.usage}%` }}
          />
        </div>
        <p className={`mt-2 font-mono text-xs ${tempColor(t.cpu.temp)}`}>{t.cpu.temp}°C</p>
      </GaugeCard>

      <GaugeCard id="telemetry-gpu" icon={Monitor} title="GPU">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-2xl font-bold">{t.gpu.usage}%</span>
          <span className="font-mono text-xs text-muted-foreground">{t.gpu.clock} MHz</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700"
            style={{ width: `${t.gpu.usage}%` }}
          />
        </div>
        <p className={`mt-2 font-mono text-xs ${tempColor(t.gpu.temp)}`}>{t.gpu.temp}°C</p>
      </GaugeCard>

      <GaugeCard id="telemetry-ram" icon={MemoryStick} title="Memória RAM">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-2xl font-bold">{t.ram.used} GB</span>
          <span className="font-mono text-xs text-muted-foreground">de {t.ram.total} GB</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700"
            style={{ width: `${(t.ram.used / t.ram.total) * 100}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {(t.ram.total - t.ram.used).toFixed(1)} GB livres
        </p>
      </GaugeCard>
    </div>
  );
}
