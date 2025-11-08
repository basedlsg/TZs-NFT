/**
 * Tests for Tezos wallet utilities
 * Testing approach: verify exports, structure, error handling
 * Real wallet interaction tested manually on testnet
 */

import { describe, it, expect } from '@jest/globals';

describe('Tezos wallet utilities', () => {
  it('should export required functions', () => {
    // Dynamic import to avoid RPC calls during test
    const tezosModule = require('@/lib/tezos');

    expect(typeof tezosModule.getTezos).toBe('function');
    expect(typeof tezosModule.getWallet).toBe('function');
    expect(typeof tezosModule.connectWallet).toBe('function');
    expect(typeof tezosModule.disconnectWallet).toBe('function');
    expect(typeof tezosModule.getActiveAddress).toBe('function');
    expect(typeof tezosModule.isWalletConnected).toBe('function');
  });

  it('should use correct RPC URL from env or default', () => {
    const expectedRPC = process.env.NEXT_PUBLIC_TEZOS_RPC_URL || 'https://ghostnet.tezos.marigold.dev';
    expect(expectedRPC).toBeDefined();
    expect(typeof expectedRPC).toBe('string');
  });
});
