import { useEffect, useState } from "react";
import { ENDPOINTS, apiFetch } from "../config/api_interaccion_backend.js";
import { getSessionEpoch } from "../config/session.js";
import { clockAnchor, validTaskSync } from "../utils/taskClock.js";

export default function useTaskSync(enabled, userId, refresh) {
  const [snapshot, setSnapshot] = useState(null);
  useEffect(() => {
    if (!enabled || userId == null) return;
    let cancelled = false, busy = false, controller;
    const epoch = getSessionEpoch();
    const update = async () => {
      if (cancelled || busy) return;
      busy = true; controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      const sent = performance.now();
      try {
        const response = await apiFetch(`${ENDPOINTS.TAREAS}/sincronizacion`, { signal: controller.signal });
        const data = await response.json(), receivedMono = performance.now();
        if (!response.ok || !validTaskSync(data)) throw new Error();
        if (!cancelled && epoch === getSessionEpoch()) setSnapshot({ ...data, userId, available: true, receivedMono, anchor: clockAnchor(data.serverNowMs, sent, receivedMono) });
      } catch {
        if (!cancelled && epoch === getSessionEpoch()) setSnapshot(previous => previous?.userId === userId ? { ...previous, available: false } : null);
      } finally { window.clearTimeout(timeout); busy = false; }
    };
    update();
    const interval = window.setInterval(update, 5000);
    const visible = () => { if (!document.hidden) update(); };
    document.addEventListener("visibilitychange", visible);
    return () => { cancelled = true; controller?.abort(); window.clearInterval(interval); document.removeEventListener("visibilitychange", visible); };
  }, [enabled, userId, refresh]);
  return enabled && snapshot?.userId === userId ? snapshot : null;
}
