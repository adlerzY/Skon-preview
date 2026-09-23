export interface ProxyMaintenanceState {
  enabled: boolean;
  title: string;
  description: string;
}

interface ProxyMaintenanceStore {
  cache: { expiresAt: number; state: ProxyMaintenanceState } | null;
}

const GLOBAL_KEY = Symbol.for("arena2battle.proxy.maintenance-state");
const globalState = globalThis as typeof globalThis & {
  [GLOBAL_KEY]?: ProxyMaintenanceStore;
};
const store =
  globalState[GLOBAL_KEY] ??
  (globalState[GLOBAL_KEY] = {
    cache: null,
  });

export function getFreshProxyMaintenanceState(now = Date.now()): ProxyMaintenanceState | null {
  if (!store.cache || store.cache.expiresAt <= now) return null;
  return store.cache.state;
}

export function getLastKnownProxyMaintenanceState(): ProxyMaintenanceState | null {
  return store.cache?.state ?? null;
}

export function setProxyMaintenanceState(state: ProxyMaintenanceState, ttlMs = 60_000): void {
  store.cache = {
    state,
    expiresAt: Date.now() + ttlMs,
  };
}
