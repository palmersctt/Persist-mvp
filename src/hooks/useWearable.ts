import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { WearableActuals, WearableProvider } from '../lib/wearables/types';

interface WearableState {
  connected: boolean;
  provider: WearableProvider | null;
  actuals: WearableActuals | null;
  /** True when the actuals shown are from a previous day (provider unreachable). */
  stale: boolean;
}

// Client-side wearable state: fetches today's normalized actuals from
// /api/wearables/actuals, and exposes connect/disconnect. Connecting is a
// full-page redirect (OAuth), so there's no client mutation for it.
export const useWearable = () => {
  const { status } = useSession();
  const [state, setState] = useState<WearableState>({
    connected: false,
    provider: null,
    actuals: null,
    stale: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchActuals = useCallback(async () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(
        `/api/wearables/actuals?timezone=${encodeURIComponent(timezone)}&_t=${Date.now()}`,
        {
          cache: 'no-cache',
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      setState({
        connected: !!data.connected,
        provider: data.provider ?? null,
        actuals: data.actuals ?? null,
        stale: !!data.stale,
      });
    } catch {
      // Network error — keep whatever we had
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchActuals();
  }, [status, fetchActuals]);

  const connect = useCallback((provider: WearableProvider) => {
    window.location.href = `/api/wearables/connect?provider=${provider}`;
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const res = await fetch('/api/wearables/disconnect', { method: 'POST' });
      if (res.ok) {
        setState({ connected: false, provider: null, actuals: null, stale: false });
      }
    } catch {
      // Leave state as-is; user can retry
    }
  }, []);

  return { ...state, isLoading, connect, disconnect, refresh: fetchActuals };
};
