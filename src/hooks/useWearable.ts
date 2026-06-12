import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { WearableActuals, WearableProvider } from '../lib/wearables/types';

interface WearableState {
  connected: boolean;
  provider: WearableProvider | null;
  actuals: WearableActuals | null;
  /** True when the actuals shown are from a previous day (provider unreachable). */
  stale: boolean;
  /** Which OAuth providers have credentials configured server-side. */
  available: { whoop: boolean; strava: boolean };
}

// Client-side wearable state: fetches today's normalized actuals from
// /api/wearables/actuals, and exposes connect/disconnect. OAuth providers
// connect via full-page redirect; the demo provider connects in the
// background (no reload).
export const useWearable = () => {
  const { status } = useSession();
  const [state, setState] = useState<WearableState>({
    connected: false,
    provider: null,
    actuals: null,
    stale: false,
    available: { whoop: false, strava: false },
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
      setState((prev) => ({
        connected: !!data.connected,
        provider: data.provider ?? null,
        actuals: data.actuals ?? null,
        stale: !!data.stale,
        available: data.available ?? prev.available,
      }));
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

  // Demo data needs no OAuth — connect it in place without a page reload.
  // Resolves to null on success, or a user-facing error message.
  const connectDemo = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/wearables/connect?provider=demo&json=1');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return data.error || 'Demo data couldn’t connect right now — try again.';
      }
      await fetchActuals();
      return null;
    } catch {
      return 'Demo data couldn’t connect right now — try again.';
    }
  }, [fetchActuals]);

  const disconnect = useCallback(async () => {
    try {
      const res = await fetch('/api/wearables/disconnect', { method: 'POST' });
      if (res.ok) {
        // Re-fetch instead of zeroing state so `available` stays accurate
        await fetchActuals();
      }
    } catch {
      // Leave state as-is; user can retry
    }
  }, [fetchActuals]);

  return { ...state, isLoading, connect, connectDemo, disconnect, refresh: fetchActuals };
};
