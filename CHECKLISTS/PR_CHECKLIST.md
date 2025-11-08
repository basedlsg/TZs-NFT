# Pull Request Review Checklist

Use this checklist before submitting any PR for Proof of Becoming.

## 📋 Pre-Submit Checks

### Code Quality
- [ ] Changes are ≤ 200–300 LOC (if larger, explain why in PR description)
- [ ] Code follows existing patterns in the repo (no new frameworks/abstractions without approval)
- [ ] All TypeScript types are strict (no `any` without explicit reason)
- [ ] No unused imports or variables
- [ ] Code is readable and well-commented where complex logic exists

### Testing
- [ ] **Tests written FIRST** before implementation
- [ ] Unit tests cover success path
- [ ] Unit tests cover failure/edge cases
- [ ] Integration tests for cross-module interactions (if applicable)
- [ ] E2E test for user-facing flows (if applicable)
- [ ] All tests pass locally: `npm test`
- [ ] Test coverage maintains or improves (check `npm run test:coverage`)

### Security & Privacy
- [ ] Client-side encryption uses AES-GCM (no plaintext diary data exposed)
- [ ] No secrets/keys committed to repo
- [ ] Input validation on all user inputs (file type, size, content)
- [ ] No SQL injection, XSS, or command injection vectors
- [ ] Rate limiting on API endpoints (if backend changes)
- [ ] Only hash/commitment stored on-chain (never PII)

### Contract & Blockchain
- [ ] Contract changes maintain FA2 compliance
- [ ] Transfer restrictions enforced (1 Soul-NFT per user)
- [ ] Gas usage estimated and documented
- [ ] Contract tests cover invariants (no transfer, 1-per-address)
- [ ] Testnet deployment tested (Ghostnet or Etherlink testnet)
- [ ] Explorer link included for verification

### Documentation
- [ ] README updated with new features/setup steps
- [ ] Environment variables documented in `.env.example`
- [ ] Threat model updated if security boundaries changed
- [ ] Test steps added (how to run this feature locally)
- [ ] Known limitations documented

### PR Description Requirements
- [ ] Title follows format: `feat(module):` or `fix(module):` or `refactor(module):`
- [ ] **What changed** and **why** (reference line in `Proof-of-Becoming.claudemd`)
- [ ] **Test evidence**: commands + outputs/screenshots
- [ ] **Security/Privacy considerations** and mitigations
- [ ] **Rollback plan** (how to revert if issues arise)
- [ ] **Performance note** (latencies, gas impact if relevant)
- [ ] **Sources cited** if best practice informed the change (link to `SOURCES/` doc)

### CI/CD
- [ ] Lint passes: `npm run lint`
- [ ] Type check passes: `npm run typecheck`
- [ ] Build succeeds: `npm run build`
- [ ] No CI failures on push

### Working End-to-End
- [ ] Feature can be run locally following README in <20 minutes
- [ ] Real wallet connect works (not mocked)
- [ ] Real contract calls work on testnet (not mocked)
- [ ] Real IPFS pin/retrieve works (if applicable)
- [ ] Real AI verification works (if applicable)

### Git Hygiene
- [ ] Branch name is descriptive (e.g., `feat/wallet-connect`, `fix/encryption-key-rotation`)
- [ ] Commit messages are clear and atomic
- [ ] No merge conflicts with target branch
- [ ] Sensitive files in `.gitignore` (`.env`, `*.key`, etc.)

---

## 🚫 Red Flags (Auto-Reject)

- Mock data or mock APIs in production code (tests OK)
- Secrets committed (API keys, private keys, passwords)
- Framework swaps without ADR (Architectural Decision Record)
- Speculative features not in `Proof-of-Becoming.claudemd`
- No tests included
- Breaking changes without migration plan
- Plaintext diary data sent to server or on-chain

---

## ✅ Ready to Merge When:

1. All checkboxes above are ✅
2. At least 1 reviewer approved
3. CI green
4. Maintainer confirms alignment with current milestone
