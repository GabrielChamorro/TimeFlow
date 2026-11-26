import { useEffect, useState } from "react";
import { ENDPOINTS, apiFetch } from "../config/api_interaccion_backend.js";
import { getSessionEpoch } from "../config/session.js";
import { validPresence } from "../utils/presence.js";

export default function useTeamPresence(enabled, userId, refresh) {
  const [snapshot, setSnapshot] = useState(null);
  useEffect(() => {
    if (!enabled || userId == null) return;
    let cancelled = false, busy = false, activeController;
    const epoch = getSessionEpoch();
    const update = async () => {
      if (cancelled || busy) return;
      busy = true;
      activeController = new AbortController();
      const timeout = window.setTimeout(() => activeController.abort(), 10000);
      try {
        const response = await apiFetch(`${ENDPOINTS.JORNADAS}/presencia`, { signal: activeController.signal });
        const data = await response.json();
        if (!response.ok || !validPresence(data)) throw new Error();
        if (!cancelled && epoch === getSessionEpoch()) setSnapshot({ ...data, userId, available: true, receivedAt: performance.now() });
      } catch {
        if (!cancelled && epoch === getSessionEpoch()) setSnapshot({ userId, available: false, members: [] });
      } finally { window.clearTimeout(timeout); busy = false; }
    };
    update();
    const interval = window.setInterval(update, 5000);
    const visible = () => { if (!document.hidden) update(); };
    document.addEventListener("visibilitychange", visible);
    return () => { cancelled = true; activeController?.abort(); window.clearInterval(interval); document.removeEventListener("visibilitychange", visible); };
  }, [enabled, userId, refresh]);
  return enabled && snapshot?.userId === userId ? snapshot : null;
}
