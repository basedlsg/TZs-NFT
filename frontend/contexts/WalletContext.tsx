'use client';

/**
 * WalletContext - App-wide Tezos wallet state management
 * Provides connect/disconnect functions and wallet state
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  connectWallet,
  disconnectWallet,
  getActiveAddress,
} from '@/lib/tezos';

interface WalletState {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    connected: false,
    connecting: false,
    error: null,
  });

  // Restore connection on mount if wallet already connected
  useEffect(() => {
    const restoreConnection = async () => {
      try {
        const address = await getActiveAddress();
        if (address) {
          setState({
            address,
            connected: true,
            connecting: false,
            error: null,
          });
        }
      } catch (err) {
        // Silent fail - wallet not connected on mount is normal
        console.debug('No active wallet connection on mount');
      }
    };

    restoreConnection();
  }, []);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, connecting: true, error: null }));

    try {
      const address = await connectWallet();

      setState({
        address,
        connected: true,
        connecting: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';

      setState({
        address: null,
        connected: false,
        connecting: false,
        error: errorMessage,
      });
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await disconnectWallet();

      setState({
        address: null,
        connected: false,
        connecting: false,
        error: null,
      });
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
      // Still clear state even if disconnect fails
      setState({
        address: null,
        connected: false,
        connecting: false,
        error: null,
      });
    }
  }, []);

  const value: WalletContextValue = {
    ...state,
    connect,
    disconnect,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
