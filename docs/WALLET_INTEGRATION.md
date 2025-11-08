# Wallet Integration Documentation

## Overview

Proof of Becoming uses **Taquito** and **Beacon SDK** for Tezos wallet integration. The wallet connection is **client-side only** - no wallet data is sent to servers.

## Architecture

```
┌─────────────────┐
│  WalletButton   │ ← UI Component
└────────┬────────┘
         │
┌────────▼────────┐
│ WalletContext   │ ← Global State (React Context)
└────────┬────────┘
         │
┌────────▼────────┐
│  lib/tezos.ts   │ ← Taquito/Beacon Wrapper
└────────┬────────┘
         │
┌────────▼────────┐
│ Beacon SDK      │ ← Communicates with Temple/Kukai
└─────────────────┘
```

## Components

### `lib/tezos.ts`
Low-level Tezos utilities (singleton pattern).

**Functions:**
- `getTezos()` - Returns TezosToolkit instance
- `getWallet()` - Returns BeaconWallet instance
- `connectWallet()` - Prompts user for wallet connection
- `disconnectWallet()` - Clears active account
- `getActiveAddress()` - Retrieves current address (if any)
- `isWalletConnected()` - Boolean check for connection

**Key Details:**
- Uses environment variable `NEXT_PUBLIC_TEZOS_RPC_URL` (default: Ghostnet)
- Singleton instances prevent multiple Beacon popups
- Network type from `NEXT_PUBLIC_NETWORK` (`mainnet` | `ghostnet`)

### `contexts/WalletContext.tsx`
React Context for app-wide wallet state.

**State:**
- `address: string | null` - Connected Tezos address
- `connected: boolean` - Connection status
- `connecting: boolean` - Loading state
- `error: string | null` - Error message (if any)

**Methods:**
- `connect()` - Async function to connect wallet
- `disconnect()` - Async function to disconnect

**Features:**
- Auto-restores connection on mount (checks `getActiveAddress()`)
- Graceful error handling (rejects are caught, not thrown)
- Updates state reactively via `useState`

### `components/WalletButton.tsx`
UI component that consumes `WalletContext`.

**States:**
- **Disconnected:** Shows "Connect Wallet" button
- **Connecting:** Shows "Connecting..." (disabled button)
- **Connected:** Shows truncated address + "Disconnect" button
- **Error:** Shows error message below button

**UI Details:**
- Address truncation: `tz1VSU...Cjcjb` (first 8 chars + last 5)
- Green dot indicator when connected
- Error messages in red text below button

## Supported Wallets

- **Temple Wallet** (recommended)
- **Kukai Wallet**
- Any Beacon-compatible wallet

## Network Configuration

### Ghostnet (Testnet)
```bash
# .env.local
NEXT_PUBLIC_TEZOS_RPC_URL=https://ghostnet.tezos.marigold.dev
NEXT_PUBLIC_NETWORK=ghostnet
```

### Mainnet (Production)
```bash
# .env.local
NEXT_PUBLIC_TEZOS_RPC_URL=https://mainnet.tezos.marigold.dev
NEXT_PUBLIC_NETWORK=mainnet
```

## Security Considerations

### ✅ Client-Side Only
- Wallet connection happens **entirely in the browser**
- No wallet data sent to backend
- Private keys never leave user's wallet extension

### ✅ No Secret Storage
- No private keys stored in localStorage
- Beacon SDK handles session persistence securely
- Only public address stored in React state

### ✅ Least Privilege
- Permissions requested: `operation_request` (default)
- No blanket permissions requested
- User approves each transaction individually (in future PRs)

### ⚠️ RPC Endpoint Trust
- Default RPC: `ghostnet.tezos.marigold.dev` (trusted)
- Users can override with custom RPC (at own risk)
- Consider warning if custom RPC is not in allowlist

### ⚠️ Network Mismatch
- **Current:** No warning if user's wallet is on wrong network
- **To-Do:** Detect network mismatch and warn user (Week 3)

## Error Handling

| Error | Cause | User Message |
|-------|-------|--------------|
| User rejects permissions | User clicks "Cancel" in wallet | "User rejected permissions" |
| No active account | Wallet locked or no accounts | "No active account after permissions granted" |
| Network error | RPC unreachable | "Failed to connect wallet" (generic) |

## Testing

### Unit Tests
- `__tests__/lib/tezos.test.ts` - Tezos utils exports
- `__tests__/contexts/WalletContext.test.tsx` - Context state management
- `__tests__/components/WalletButton.test.tsx` - UI interactions

### Manual Testing
See `frontend/MANUAL_TEST_WALLET.md` for step-by-step guide.

**Key Test Cases:**
1. Connect wallet (happy path)
2. Disconnect wallet
3. Reject connection (error handling)
4. Page refresh persistence
5. Multiple browser tabs

## Performance

- **Connection latency:** ~2-3 seconds (includes user interaction)
- **Page load impact:** +300KB (Taquito + Beacon SDK)
- **Memory:** ~5MB additional (Beacon SDK)

**Optimization Notes:**
- Taquito/Beacon loaded on-demand (not SSR)
- Singleton pattern prevents multiple Beacon instances
- No polling (event-driven updates only)

## Future Enhancements (Post-PR #2)

- [ ] Network mismatch detection and warning
- [ ] Display wallet balance (XTZ)
- [ ] "Copy address" button
- [ ] Multi-wallet support (remember preference)
- [ ] Hardware wallet support (Ledger)
- [ ] Switch account detection
- [ ] Sign message for proof-of-ownership

## References

- [Taquito Docs](https://tezostaquito.io/)
- [Beacon SDK Docs](https://docs.walletbeacon.io/)
- [TZIP-10: Wallet Interaction Standard](https://tzip.tezosagora.org/proposal/tzip-10/)

## Troubleshooting

**Q: Wallet button does nothing when clicked**
A: Check browser console for errors. Verify Temple Wallet is installed and unlocked.

**Q: Connection lost after page refresh**
A: Beacon SDK should persist sessions. Check if localStorage is being cleared by browser extensions.

**Q: "No active account" error despite wallet being connected**
A: Ensure wallet is unlocked and has at least one account. Try disconnecting and reconnecting.

**Q: Wrong address displayed**
A: Check that `getActiveAddress()` returns the expected format. Verify no address truncation bugs.
