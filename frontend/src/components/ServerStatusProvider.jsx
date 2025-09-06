import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../api.js';

const Ctx = createContext({ ready: true, dbConnected: true, skipDb: false, lastCheck: null });

export function useServerStatus() {
  return useContext(Ctx);
}

export default function ServerStatusProvider({ children, pollMs = 15000 }) {
  const [state, setState] = useState({ ready: false, dbConnected: true, skipDb: false, lastCheck: null });

  useEffect(() => {
    let timer;
    async function check() {
      try {
        const health = await fetch(`${API_BASE}/health`).then(r => r.json()).catch(() => null);
        const readyResp = await fetch(`${API_BASE}/ready`).then(async r => ({ ok: r.ok, body: await r.json().catch(() => ({})) })).catch(() => null);
        const ok = Boolean(health);
        const dbConnected = readyResp?.ok === true;
        const skipDb = readyResp?.ok === false && readyResp?.body?.db === 'disconnected';
        setState({ ready: ok, dbConnected, skipDb, lastCheck: Date.now() });
      } catch {
        setState({ ready: false, dbConnected: false, skipDb: false, lastCheck: Date.now() });
      }
    }
    check();
    timer = setInterval(check, pollMs);
    return () => clearInterval(timer);
  }, [pollMs]);

  const value = useMemo(() => state, [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
