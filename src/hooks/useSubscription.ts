import { useCallback, useEffect, useState } from "react";
import { apiSubscription, type SubscriptionInfo } from "../lib/api";

export function useSubscription() {
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const sub = await apiSubscription();
      setInfo(sub);
      setError(false);
    } catch {
      setError(true);
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { info, loading, error, refresh };
}
