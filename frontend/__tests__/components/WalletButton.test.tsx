/**
 * Tests for WalletButton component
 * Test-first approach: UI behavior and interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';

// Mock WalletContext
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();

jest.mock('@/contexts/WalletContext', () => ({
  useWallet: jest.fn(),
}));

import WalletButton from '@/components/WalletButton';
import { useWallet } from '@/contexts/WalletContext';

describe('WalletButton', () => {
  it('should display "Connect Wallet" when disconnected', () => {
    (useWallet as jest.Mock).mockReturnValue({
      connected: false,
      connecting: false,
      address: null,
      connect: mockConnect,
      disconnect: mockDisconnect,
      error: null,
    });

    render(<WalletButton />);

    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('should display "Connecting..." when connecting', () => {
    (useWallet as jest.Mock).mockReturnValue({
      connected: false,
      connecting: true,
      address: null,
      connect: mockConnect,
      disconnect: mockDisconnect,
      error: null,
    });

    render(<WalletButton />);

    expect(screen.getByText(/Connecting/i)).toBeInTheDocument();
  });

  it('should display truncated address when connected', () => {
    const mockAddress = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
    (useWallet as jest.Mock).mockReturnValue({
      connected: true,
      connecting: false,
      address: mockAddress,
      connect: mockConnect,
      disconnect: mockDisconnect,
      error: null,
    });

    render(<WalletButton />);

    // Should show truncated address (e.g., "tz1VSU...Cjcjb")
    expect(screen.getByText(/tz1VSU.*Cjcjb/)).toBeInTheDocument();
  });

  it('should call connect() when clicked in disconnected state', () => {
    (useWallet as jest.Mock).mockReturnValue({
      connected: false,
      connecting: false,
      address: null,
      connect: mockConnect,
      disconnect: mockDisconnect,
      error: null,
    });

    render(<WalletButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('should call disconnect() when disconnect button clicked', () => {
    const mockAddress = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
    (useWallet as jest.Mock).mockReturnValue({
      connected: true,
      connecting: false,
      address: mockAddress,
      connect: mockConnect,
      disconnect: mockDisconnect,
      error: null,
    });

    render(<WalletButton />);

    const disconnectButton = screen.getByText(/Disconnect/i);
    fireEvent.click(disconnectButton);

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('should display error message when error exists', () => {
    (useWallet as jest.Mock).mockReturnValue({
      connected: false,
      connecting: false,
      address: null,
      connect: mockConnect,
      disconnect: mockDisconnect,
      error: 'User rejected permissions',
    });

    render(<WalletButton />);

    expect(screen.getByText(/User rejected permissions/i)).toBeInTheDocument();
  });

  it('should be disabled when connecting', () => {
    (useWallet as jest.Mock).mockReturnValue({
      connected: false,
      connecting: true,
      address: null,
      connect: mockConnect,
      disconnect: mockDisconnect,
      error: null,
    });

    render(<WalletButton />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
