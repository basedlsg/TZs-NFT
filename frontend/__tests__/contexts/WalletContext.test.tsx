/**
 * Tests for WalletContext
 * Test-first approach: define expected behavior before implementation
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';

// Mock Tezos utilities
jest.mock('@/lib/tezos', () => ({
  connectWallet: jest.fn(),
  disconnectWallet: jest.fn(),
  getActiveAddress: jest.fn(),
  isWalletConnected: jest.fn(),
}));

import { WalletProvider, useWallet } from '@/contexts/WalletContext';
import * as tezosLib from '@/lib/tezos';

describe('WalletContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide initial state (disconnected)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletProvider>{children}</WalletProvider>
    );

    const { result } = renderHook(() => useWallet(), { wrapper });

    expect(result.current.address).toBeNull();
    expect(result.current.connected).toBe(false);
    expect(result.current.connecting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should provide connect function', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletProvider>{children}</WalletProvider>
    );

    const { result } = renderHook(() => useWallet(), { wrapper });

    expect(typeof result.current.connect).toBe('function');
  });

  it('should provide disconnect function', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletProvider>{children}</WalletProvider>
    );

    const { result } = renderHook(() => useWallet(), { wrapper });

    expect(typeof result.current.disconnect).toBe('function');
  });

  it('should set connecting state during connection', async () => {
    const mockAddress = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';

    // Mock slow connection
    (tezosLib.connectWallet as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockAddress), 100))
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletProvider>{children}</WalletProvider>
    );

    const { result } = renderHook(() => useWallet(), { wrapper });

    act(() => {
      result.current.connect();
    });

    // Should be connecting
    expect(result.current.connecting).toBe(true);

    await waitFor(() => expect(result.current.connecting).toBe(false));
  });

  it('should update state on successful connection', async () => {
    const mockAddress = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
    (tezosLib.connectWallet as jest.Mock).mockResolvedValue(mockAddress);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletProvider>{children}</WalletProvider>
    );

    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.connected).toBe(true);
    expect(result.current.address).toBe(mockAddress);
    expect(result.current.error).toBeNull();
  });

  it('should handle connection error gracefully', async () => {
    const mockError = new Error('User rejected permissions');
    (tezosLib.connectWallet as jest.Mock).mockRejectedValue(mockError);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletProvider>{children}</WalletProvider>
    );

    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.connected).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.error).toBe('User rejected permissions');
  });

  it('should disconnect wallet and clear state', async () => {
    const mockAddress = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
    (tezosLib.connectWallet as jest.Mock).mockResolvedValue(mockAddress);
    (tezosLib.disconnectWallet as jest.Mock).mockResolvedValue(undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletProvider>{children}</WalletProvider>
    );

    const { result } = renderHook(() => useWallet(), { wrapper });

    // First connect
    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.connected).toBe(true);

    // Then disconnect
    await act(async () => {
      await result.current.disconnect();
    });

    expect(result.current.connected).toBe(false);
    expect(result.current.address).toBeNull();
  });

  it('should restore connection on mount if wallet already connected', async () => {
    const mockAddress = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
    (tezosLib.getActiveAddress as jest.Mock).mockResolvedValue(mockAddress);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletProvider>{children}</WalletProvider>
    );

    const { result } = renderHook(() => useWallet(), { wrapper });

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
      expect(result.current.address).toBe(mockAddress);
    });
  });
});
