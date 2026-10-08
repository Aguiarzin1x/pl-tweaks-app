// Simulated live hardware telemetry — eye-candy for the dashboard shell. The real numbers
// that matter (optimization %, FPS/ping/input-lag gains) are always computed by the backend.
import { useEffect, useState } from "react";

export interface TelemetrySample {
  cpu: { usage: number; clock: number; temp: number };
  gpu: { usage: number; temp: number; clock: number };
  ram: { used: number; total: number };
}

function jitter(base: number, amp: number): number {
  return base + (Math.random() * 2 - 1) * amp;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function sampleTelemetry(optimizationPct: number): TelemetrySample {
  const relief = clamp(optimizationPct / 100, 0, 1); // more tweaks applied → quieter background, cooler machine
  return {
    cpu: {
      usage: Math.round(clamp(jitter(38 - 20 * relief, 6), 3, 98)),
      clock: Number(jitter(4.1 + 0.4 * relief, 0.12).toFixed(2)),
      temp: Math.round(clamp(jitter(67 - 9 * relief, 2.5), 32, 95)),
    },
    gpu: {
      usage: Math.round(clamp(jitter(52 - 8 * relief, 9), 2, 99)),
      temp: Math.round(clamp(jitter(64 - 6 * relief, 2.5), 30, 92)),
      clock: Math.round(clamp(jitter(2400 + 160 * relief, 70), 300, 2800)),
    },
    ram: {
      used: Number(clamp(jitter(14.6 - 5.2 * relief, 0.7), 2.1, 30).toFixed(1)),
      total: 32,
    },
  };
}

const REFRESH_MS = 3500;

export function useTelemetry(optimizationPct: number): TelemetrySample {
  const [t, setT] = useState<TelemetrySample>(() => sampleTelemetry(optimizationPct));
  useEffect(() => {
    setT(sampleTelemetry(optimizationPct));
    const id = setInterval(() => setT(sampleTelemetry(optimizationPct)), REFRESH_MS);
    return () => clearInterval(id);
  }, [optimizationPct]);
  return t;
}
