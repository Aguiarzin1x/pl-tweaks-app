// Hand-written mirrors of the backend Pydantic models — keep in sync in the same edit
// as backend/models/*.py (TEMPLATE.md §4).

export interface User {
  id: string;
  email: string;
  is_premium: boolean;
  is_guest: boolean;
}

export interface TweakCategory {
  id: string;
  name: string;
  description: string;
}

export interface Tweak {
  key: string;
  name: string;
  description: string;
  category: string;
  impact: string; // "alto" | "medio" | "baixo"
  premium: boolean;
  fps_gain: number;
  ping_reduction: number;
  input_lag_reduction: number;
}

export interface GamePreset {
  id: string;
  name: string;
  gain_pct: number;
  baseline_fps: number;
  keys: string[];
  banner: string;
  tagline: string;
}

export interface Catalog {
  categories: TweakCategory[];
  tweaks: Tweak[];
  games: GamePreset[];
}

export interface Metrics {
  applied: number;
  total: number;
  optimization_pct: number;
  fps_gain: number;
  ping_reduction: number;
  input_lag_reduction: number;
}

export interface TweaksState {
  applied: string[];
  rip_mode_active: boolean;
  metrics: Metrics;
}

export interface PresetResult extends TweaksState {
  applied_now: string[];
  blocked: string[];
}

export interface VipOut {
  is_premium: boolean;
}

// ---------- Hardware profile (mirrors backend/models/profile.py) ----------
export interface HardwareSignals {
  gpu_renderer: string | null;
  gpu_vendor_raw: string | null;
  cpu_cores: number | null;
  device_memory_gb: number | null;
  user_agent: string | null;
  platform: string | null;
  screen: string | null;
}

export interface TweakRecommendation {
  key: string;
  name: string;
  category: string;
  premium: boolean;
  reason: string;
}

export interface HardwareProfile {
  cpu: string | null;
  cpu_vendor: string;
  gpu: string | null;
  gpu_vendor: string;
  ram_gb: number | null;
  storage: string;
  tier: string;
  confidence: string;
  summary: string;
  needs_confirmation: boolean;
  detected_via: string;
  recommended: TweakRecommendation[];
}

export interface ProfileUpdate {
  cpu: string | null;
  cpu_vendor: string | null;
  gpu: string | null;
  gpu_vendor: string | null;
  ram_gb: number | null;
  storage: string | null;
}

// ---------- Benchmark ----------
export interface BenchmarkRun {
  id: string;
  game_id: string;
  game_name: string;
  baseline_fps: number;
  result_fps: number;
  gain_pct: number;
  lag_before: number;
  lag_after: number;
  applied_count: number;
  optimization_pct: number;
  created_at: string;
}

export interface BenchmarkList {
  runs: BenchmarkRun[];
  best_gain_pct: number;
}

// ---------- History ----------
export interface HistoryEntry {
  id: string;
  kind: string;
  label: string;
  detail: string;
  applied_count: number;
  optimization_pct: number;
  created_at: string;
}

export interface HistoryList {
  entries: HistoryEntry[];
}

// ---------- Cleanup ----------
export interface CleanupScheduleIn {
  enabled: boolean;
  frequency: string;
  hour: number;
  weekday: number;
}

export interface CleanupRun {
  id: string;
  ran_at: string;
  trigger: string;
  ram_freed_gb: number;
  mb_freed: number;
  files_removed: number;
}

export interface CleanupOut {
  enabled: boolean;
  frequency: string;
  hour: number;
  weekday: number;
  next_run_at: string | null;
  last_run_at: string | null;
  total_runs: number;
  total_mb_freed: number;
  runs: CleanupRun[];
}

// ---------- Performance-drop alerts ----------
export interface PerfAlert {
  id: string;
  tweak_key: string;
  tweak_name: string;
  fps_lost: number;
  ping_lost: number;
  lag_lost: number;
  source: string;
  created_at: string;
}

export interface AlertsList {
  alerts: PerfAlert[];
}

// ---------- Machine comparison ----------
export interface CohortPoint {
  percentile: number;
  fps: number;
}

export interface Comparison {
  game_id: string;
  game_name: string;
  tier: string;
  tier_label: string;
  your_fps: number;
  percentile: number;
  median_fps: number;
  top_fps: number;
  curve: CohortPoint[];
  verdict: string;
  measured_at: string | null;
}
