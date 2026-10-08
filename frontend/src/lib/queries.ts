// TanStack Query hooks over the typed fetch layer. Every call is a relative /api path.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  AlertsList,
  BenchmarkList,
  BenchmarkRun,
  Catalog,
  CleanupOut,
  CleanupScheduleIn,
  Comparison,
  HardwareProfile,
  HardwareSignals,
  HistoryList,
  PresetResult,
  ProfileUpdate,
  TweaksState,
  User,
  VipOut,
} from "@/lib/types";
import { queryClient } from "@/lib/queryClient";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<User>("/auth/me"),
    retry: false,
    staleTime: 60_000,
  });
}

export function useCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    queryFn: () => apiGet<Catalog>("/tweaks/catalog"),
    staleTime: Infinity,
    retry: 1,
  });
}

export function useTweaksState(enabled: boolean) {
  return useQuery({
    queryKey: ["tweaks-state"],
    queryFn: () => apiGet<TweaksState>("/tweaks/state"),
    enabled,
    retry: false,
  });
}

export function useToggleTweak() {
  return useMutation({
    mutationFn: (v: { key: string; applied: boolean }) =>
      apiPost<TweaksState>("/tweaks/toggle", v),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tweaks-state"] }),
  });
}

export function useApplyPreset() {
  return useMutation({
    mutationFn: (gameId: string) =>
      apiPost<PresetResult>("/tweaks/preset", { game_id: gameId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tweaks-state"] }),
  });
}

export function useRipMode() {
  return useMutation({
    mutationFn: (active: boolean) =>
      apiPost<PresetResult>("/tweaks/rip-mode", { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tweaks-state"] }),
  });
}

export function useRestore() {
  return useMutation({
    mutationFn: () => apiPost<TweaksState>("/tweaks/restore"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tweaks-state"] }),
  });
}

export function useActivateVip() {
  return useMutation({
    mutationFn: () => apiPost<VipOut>("/vip/activate"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["tweaks-state"] });
    },
  });
}

// ---------- Hardware profile ----------
export function useHardwareProfile(enabled: boolean) {
  return useQuery({
    queryKey: ["hardware-profile"],
    queryFn: () => apiGet<HardwareProfile | null>("/hardware/profile"),
    enabled,
    retry: false,
  });
}

export function useDetectHardware() {
  return useMutation({
    mutationFn: (signals: HardwareSignals) =>
      apiPost<HardwareProfile>("/hardware/detect", signals),
    onSuccess: (data) => queryClient.setQueryData(["hardware-profile"], data),
  });
}

export function useSaveHardwareProfile() {
  return useMutation({
    mutationFn: (body: ProfileUpdate) => apiPut<HardwareProfile>("/hardware/profile", body),
    onSuccess: (data) => queryClient.setQueryData(["hardware-profile"], data),
  });
}

// ---------- Benchmark ----------
export function useBenchmarks(enabled: boolean) {
  return useQuery({
    queryKey: ["benchmarks"],
    queryFn: () => apiGet<BenchmarkList>("/benchmark"),
    enabled,
    retry: false,
  });
}

export function useRunBenchmark() {
  return useMutation({
    mutationFn: (gameId: string) => apiPost<BenchmarkRun>("/benchmark/run", { game_id: gameId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["benchmarks"] }),
  });
}

// ---------- History ----------
export function useHistory(enabled: boolean) {
  return useQuery({
    queryKey: ["history"],
    queryFn: () => apiGet<HistoryList>("/history"),
    enabled,
    retry: false,
  });
}

export function useRestoreToEntry() {
  return useMutation({
    mutationFn: (entryId: string) => apiPost<TweaksState>(`/history/restore/${entryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tweaks-state"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

// ---------- Cleanup ----------
export function useCleanup(enabled: boolean) {
  return useQuery({
    queryKey: ["cleanup"],
    queryFn: () => apiGet<CleanupOut>("/cleanup"),
    enabled,
    retry: false,
  });
}

export function useSaveCleanupSchedule() {
  return useMutation({
    mutationFn: (body: CleanupScheduleIn) => apiPut<CleanupOut>("/cleanup/schedule", body),
    onSuccess: (data) => queryClient.setQueryData(["cleanup"], data),
  });
}

export function useRunCleanup() {
  return useMutation({
    mutationFn: () => apiPost<CleanupOut>("/cleanup/run"),
    onSuccess: (data) => {
      queryClient.setQueryData(["cleanup"], data);
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

// ---------- Performance-drop alerts ----------
export function useAlerts(enabled: boolean) {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: () => apiGet<AlertsList>("/alerts"),
    enabled,
    retry: false,
  });
}

export function useReapplyAlert() {
  return useMutation({
    mutationFn: (alertId: string) => apiPost<TweaksState>(`/alerts/${alertId}/reapply`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["tweaks-state"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useDismissAlert() {
  return useMutation({
    mutationFn: (alertId: string) => apiPost<void>(`/alerts/${alertId}/dismiss`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

// ---------- Machine comparison ----------
export function useComparison(gameId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["comparison", gameId],
    queryFn: () => apiGet<Comparison>(`/benchmark/compare/${gameId}`),
    enabled,
    retry: false,
  });
}
