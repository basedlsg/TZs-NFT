/**
 * Tezos wallet connection and contract interaction utilities
 * Uses Taquito + Beacon for wallet connect
 */

import { TezosToolkit } from '@taquito/taquito';
import { BeaconWallet } from '@taquito/beacon-wallet';
import { NetworkType } from '@airgap/beacon-dapp';

const RPC_URL = process.env.NEXT_PUBLIC_TEZOS_RPC_URL || 'https://ghostnet.tezos.marigold.dev';
const NETWORK = (process.env.NEXT_PUBLIC_NETWORK || 'ghostnet') as 'mainnet' | 'ghostnet';

// Singleton Tezos toolkit instance
let tezosInstance: TezosToolkit | null = null;
let walletInstance: BeaconWallet | null = null;

/**
 * Get or create TezosToolkit instance
 */
export function getTezos(): TezosToolkit {
  if (!tezosInstance) {
    tezosInstance = new TezosToolkit(RPC_URL);
  }
  return tezosInstance;
}

/**
 * Get or create BeaconWallet instance
 */
export function getWallet(): BeaconWallet {
  if (!walletInstance) {
    walletInstance = new BeaconWallet({
      name: 'Proof of Becoming',
      preferredNetwork: NETWORK === 'mainnet' ? NetworkType.MAINNET : NetworkType.GHOSTNET,
    });

    // Set wallet provider on Tezos instance
    const tezos = getTezos();
    tezos.setWalletProvider(walletInstance);
  }
  return walletInstance;
}

/**
 * Connect wallet and request permissions
 */
export async function connectWallet(): Promise<string> {
  const wallet = getWallet();

  await wallet.requestPermissions({
    network: {
      type: NETWORK === 'mainnet' ? NetworkType.MAINNET : NetworkType.GHOSTNET,
    },
  });

  const activeAccount = await wallet.client.getActiveAccount();
  if (!activeAccount) {
    throw new Error('No active account after permissions granted');
  }

  return activeAccount.address;
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet(): Promise<void> {
  const wallet = getWallet();
  await wallet.clearActiveAccount();
}

/**
 * Get current connected address (if any)
 */
export async function getActiveAddress(): Promise<string | null> {
  const wallet = getWallet();
  const activeAccount = await wallet.client.getActiveAccount();
  return activeAccount?.address || null;
}

/**
 * Check if wallet is connected
 */
export async function isWalletConnected(): Promise<boolean> {
  const address = await getActiveAddress();
  return address !== null;
}
