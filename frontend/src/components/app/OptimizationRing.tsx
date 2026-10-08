interface Props {
  pct: number;
  applied: number;
  total: number;
}

const R = 78;
const CIRC = 2 * Math.PI * R;

export default function OptimizationRing({ pct, applied, total }: Props) {
  const clamped = Math.min(100, Math.max(0, pct));
  const offset = CIRC * (1 - clamped / 100);

  return (
    <div className="relative flex items-center justify-center" data-testid="optimization-score-ring">
      <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={R} fill="none" stroke="#1E293B" strokeWidth="14" />
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="url(#ring-gradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-4xl font-bold text-foreground text-glow-cyan">
          {Math.round(clamped)}%
        </span>
        <span className="mt-1 max-w-28 text-center font-heading text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Nível de otimização
        </span>
        <span className="mt-1 font-mono text-xs text-primary">
          {applied}/{total} ajustes
        </span>
      </div>
    </div>
  );
}
