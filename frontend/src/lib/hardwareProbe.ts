// Reads the real signals a browser is willing to expose about the machine. The messy
// strings go to the backend, where Claude turns them into a clean hardware profile.
import type { HardwareSignals } from "@/lib/types";

function readWebglRenderer(): { renderer: string | null; vendor: string | null } {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl2") as WebGL2RenderingContext | null) ??
      (canvas.getContext("webgl") as WebGLRenderingContext | null);
    if (!gl) return { renderer: null, vendor: null };

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      return {
        renderer: (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string) ?? null,
        vendor: (gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string) ?? null,
      };
    }
    // Some browsers block the unmasked extension — the generic strings are still a hint.
    return {
      renderer: (gl.getParameter(gl.RENDERER) as string) ?? null,
      vendor: (gl.getParameter(gl.VENDOR) as string) ?? null,
    };
  } catch {
    return { renderer: null, vendor: null };
  }
}

export function collectHardwareSignals(): HardwareSignals {
  const { renderer, vendor } = readWebglRenderer();
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    gpu_renderer: renderer,
    gpu_vendor_raw: vendor,
    cpu_cores: typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null,
    device_memory_gb: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    user_agent: nav.userAgent ?? null,
    platform: nav.platform ?? null,
    screen: `${window.screen.width}x${window.screen.height}@${window.devicePixelRatio}x`,
  };
}
