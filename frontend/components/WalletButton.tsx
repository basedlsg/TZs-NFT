'use client';

/**
 * WalletButton - UI component for wallet connection
 * Shows connect/disconnect based on wallet state
 */

import React from 'react';
import { useWallet } from '@/contexts/WalletContext';

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 8)}...${address.slice(-5)}`;
}

export default function WalletButton() {
  const { connected, connecting, address, error, connect, disconnect } = useWallet();

  // Disconnected state
  if (!connected && !connecting) {
    return (
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={connect}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Connect Wallet
        </button>
        {error && (
          <p className="text-sm text-red-600 max-w-xs text-right">{error}</p>
        )}
      </div>
    );
  }

  // Connecting state
  if (connecting) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed"
      >
        Connecting...
      </button>
    );
  }

  // Connected state
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-mono text-gray-700">
          {address ? truncateAddress(address) : 'Connected'}
        </span>
      </div>
      <button
        onClick={disconnect}
        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}
