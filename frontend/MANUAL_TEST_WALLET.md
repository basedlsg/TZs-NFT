# Manual Testing Guide: Wallet Connect

This guide walks through manually testing the wallet connection feature with Temple Wallet on Ghostnet.

## Prerequisites

1. **Install Temple Wallet**
   - Chrome/Brave: [Temple Wallet Extension](https://chrome.google.com/webstore/detail/temple-tezos-wallet/ookjlbkiijinhpmnjffcofjonbfbgaoc)
   - Firefox: [Temple Wallet Add-on](https://addons.mozilla.org/en-US/firefox/addon/temple-wallet/)

2. **Set up Ghostnet**
   - Open Temple Wallet
   - Click Settings → Network → Select "Ghostnet"
   - Get testnet XTZ from [Ghostnet Faucet](https://faucet.ghostnet.teztnets.com/)

3. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Set Environment Variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local if needed (defaults work for Ghostnet)
   ```

## Test Cases

### Test 1: Connect Wallet (Happy Path)

**Steps:**
1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Click "Connect Wallet" button in top-right
4. Temple Wallet popup should appear
5. Select your Ghostnet account
6. Click "Connect"

**Expected Results:**
- ✅ Button shows "Connecting..." briefly
- ✅ After connection, button displays truncated address (e.g., "tz1VSU...Cjcjb")
- ✅ Green dot indicator appears next to address
- ✅ "Disconnect" button is visible
- ✅ No error messages displayed

**Evidence:**
- Screenshot showing connected state
- Browser console should show no errors

---

### Test 2: Disconnect Wallet

**Steps:**
1. With wallet connected from Test 1
2. Click "Disconnect" button
3. Observe UI update

**Expected Results:**
- ✅ Button reverts to "Connect Wallet"
- ✅ Address disappears
- ✅ No error messages

**Evidence:**
- Screenshot showing disconnected state

---

### Test 3: Reject Connection (Error Handling)

**Steps:**
1. Ensure wallet is disconnected
2. Click "Connect Wallet"
3. When Temple Wallet popup appears, click "Cancel" or close the popup

**Expected Results:**
- ✅ Error message appears below button (e.g., "User rejected permissions")
- ✅ Button remains in "Connect Wallet" state
- ✅ Can retry connection by clicking button again

**Evidence:**
- Screenshot showing error state

---

### Test 4: Page Refresh Persistence

**Steps:**
1. Connect wallet (Test 1)
2. Refresh the page (F5 or Cmd+R)
3. Wait for page to load

**Expected Results:**
- ✅ Wallet remains connected after refresh
- ✅ Address displays immediately without re-prompting
- ✅ No "Connect Wallet" prompt appears

**Evidence:**
- Screenshot showing persistent connection
- Browser console logs (should show "No active wallet connection on mount" is NOT logged)

---

### Test 5: Multiple Browser Tabs

**Steps:**
1. Connect wallet in Tab 1
2. Open http://localhost:3000 in Tab 2
3. Observe Tab 2 state

**Expected Results:**
- ✅ Tab 2 also shows wallet as connected
- ✅ Same address displays in both tabs
- ✅ Disconnecting in one tab affects both (may require refresh)

---

### Test 6: Network Mismatch Warning (Future)

**Steps:**
1. Connect wallet with Temple set to Mainnet
2. (This test requires network detection - to be implemented)

**Expected Results (Future):**
- ⚠️ Warning should appear: "Wrong network - please switch to Ghostnet"
- ⚠️ Contract interactions should be disabled

**Status:** Not yet implemented (acceptable for PR #2)

---

## Console Commands (Developer Testing)

Open browser DevTools (F12) and test programmatically:

```javascript
// Check wallet state
const walletState = {
  connected: document.querySelector('[data-wallet-connected]'),
  address: document.querySelector('[data-wallet-address]')?.textContent,
};
console.log(walletState);

// Test localStorage (if implemented)
localStorage.getItem('wallet_connected');
```

---

## Performance Checks

1. **Connection Latency**
   - Time from "Connect Wallet" click to connected state
   - **Target:** < 3 seconds (includes user interaction)

2. **Page Load**
   - Time to first meaningful paint
   - **Target:** < 2 seconds

3. **Memory**
   - Check Chrome DevTools → Performance → Memory
   - **Target:** No memory leaks on connect/disconnect cycles

---

## Security Checks

1. **No Secrets in Console**
   - Open DevTools → Console
   - Search for "private" or "key"
   - **Expected:** No private keys or secrets logged

2. **No Secrets in Network Tab**
   - Open DevTools → Network
   - **Expected:** No wallet-related data sent to server (connection is client-side only)

3. **CSP Headers** (Future)
   - Check for Content Security Policy
   - **Status:** To be implemented in production build

---

## Accessibility Checks

1. **Keyboard Navigation**
   - Tab to "Connect Wallet" button
   - Press Enter to activate
   - **Expected:** Wallet connects without mouse

2. **Screen Reader** (Optional)
   - Use NVDA/JAWS on Windows or VoiceOver on Mac
   - **Expected:** Button state announced correctly

---

## Known Limitations (Acceptable for PR #2)

- ✅ No network mismatch warning yet (Week 3 task)
- ✅ No wallet balance display (Week 3 task)
- ✅ No loading spinner animation (polish task)
- ✅ No "Copy address" feature (nice-to-have)

---

## Checklist Summary

Before marking PR #2 as "Done":

- [ ] Test 1 (Connect) passes
- [ ] Test 2 (Disconnect) passes
- [ ] Test 3 (Error handling) passes
- [ ] Test 4 (Persistence) passes
- [ ] Test 5 (Multiple tabs) passes
- [ ] No console errors during normal flow
- [ ] No secrets logged or transmitted
- [ ] TypeScript compiles with no errors
- [ ] Jest tests pass (unit tests for components)

---

## Troubleshooting

**Problem:** "Connect Wallet" button does nothing

**Solutions:**
- Check browser console for errors
- Verify Temple Wallet is installed and unlocked
- Check network tab for failed RPC requests
- Try clearing browser cache

**Problem:** Address shows "undefined" or wrong format

**Solutions:**
- Check `getActiveAddress()` implementation in `lib/tezos.ts`
- Verify Taquito/Beacon SDK versions are compatible
- Check Ghostnet RPC URL is reachable

**Problem:** Page refresh loses connection

**Solutions:**
- Verify `getActiveAddress()` is called in useEffect
- Check Beacon SDK localStorage is not cleared
- Ensure Temple Wallet keeps session active

---

**Date Tested:** [Fill in after manual testing]
**Tester:** [Your name]
**Temple Wallet Version:** [e.g., 1.19.0]
**Browser:** [e.g., Chrome 120]
**OS:** [e.g., macOS 14]
