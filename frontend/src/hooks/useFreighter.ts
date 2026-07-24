"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isConnected as freighterIsConnected,
  requestAccess,
  getAddress,
} from "@stellar/freighter-api";

interface UseFreighterResult {
  address: string | null;
  isConnected: boolean;
  isInstalled: boolean;
  error: string | null;
  connect: () => Promise<void>;
}

/**
 * Thin wrapper around the Freighter wallet extension API.
 * Handles the "not installed" and "user rejected" cases explicitly
 * so the UI can show a helpful message instead of a silent failure.
 */
export function useFreighter(): UseFreighterResult {
  const [address, setAddress] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    freighterIsConnected()
      .then((result) => setIsInstalled(!!result?.isConnected))
      .catch(() => setIsInstalled(false));
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    try {
      const access = await requestAccess();
      if (access.error) {
        setError(access.error);
        return;
      }
      const addr = await getAddress();
      if (addr.error) {
        setError(addr.error);
        return;
      }
      setAddress(addr.address);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to Freighter"
      );
    }
  }, []);

  return {
    address,
    isConnected: !!address,
    isInstalled,
    error,
    connect,
  };
}
