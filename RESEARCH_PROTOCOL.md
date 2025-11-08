# Research Protocol for Proof of Becoming

**Purpose:** Ensure all technical decisions are traceable, well-sourced, and documented.

---

## 🎯 Research Workflow

### 1. When to Research
Research is required when:
- Choosing between multiple technical approaches
- Integrating a new library or framework
- Implementing security-sensitive features (encryption, contracts, verification)
- Unclear on best practices for Tezos/Etherlink/FA2
- Performance or cost optimization decisions

### 2. Source Hierarchy (Use in Order)

#### Tier 1: Official Documentation
- [Tezos Developer Docs](https://tezos.com/developers)
- [Taquito SDK Docs](https://tezostaquito.io/)
- [FA2/TZIP-12 Token Standard](https://tzip.tezosagora.org/proposal/tzip-12/)
- [Etherlink Docs](https://docs.etherlink.com/)
- [LIGO Contract Language](https://ligolang.org/docs)
- Web3 security standards (OWASP, ConsenSys best practices)

#### Tier 2: Reputable Community Resources
- Tezos Stack Exchange / Forums
- OpenZeppelin contract patterns (for security inspiration)
- Academic papers on encryption (AES-GCM) and privacy
- QRNG provider docs (ANU, Azure Quantum)

#### Tier 3: General Engineering
- MDN Web Docs (for browser APIs like IndexedDB, crypto)
- IPFS documentation
- Next.js/React official docs

### 3. Capture Format

All research must be logged in `SOURCES/<topic>.md` with:
- **Date**: When research was conducted
- **Context**: What decision/question prompted this research
- **Source URL**: Full link
- **Summary**: 2–3 line takeaway (what we learned, how it applies)
- **Decision**: What we chose and why
- **Alternatives**: What we rejected and why

**Example:**
```markdown
## AES-GCM Encryption for Client-Side Diary

**Date:** 2025-11-08
**Context:** Need to encrypt user diary locally before optional IPFS upload.

**Source:** [MDN Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt)
**Summary:** AES-GCM provides authenticated encryption (prevents tampering), natively supported in modern browsers via Web Crypto API. Requires IV/nonce management (must be unique per encryption).

**Decision:** Use AES-GCM with 256-bit key, random IV stored alongside ciphertext.
**Alternatives:** AES-CBC (no authentication, rejected); ChaCha20-Poly1305 (not in Web Crypto, rejected).
```

---

## 📂 File Organization

- `SOURCES/` — Research summaries organized by topic
  - `tezos-contracts.md` — FA2, LIGO, contract patterns
  - `encryption.md` — AES-GCM, key management
  - `verification.md` — AI vision models, heuristics
  - `ipfs.md` — Pinning, retrieval, privacy
  - `quantum.md` — QRNG APIs, seed generation

- `DECISIONS/` — Architectural Decision Records (ADRs)
  - `ADR-001-tezos-vs-etherlink.md`
  - `ADR-002-client-side-encryption.md`
  - `ADR-003-verification-strategy.md`

---

## 🧭 ADR Template

When making a significant architectural choice, create an ADR in `DECISIONS/`:

```markdown
# ADR-XXX: [Title]

**Status:** Proposed | Accepted | Rejected | Superseded
**Date:** YYYY-MM-DD
**Deciders:** [Names/Roles]
**Tags:** [contracts, privacy, performance, etc.]

## Context
[What problem are we solving? What constraints exist?]

## Decision
[What did we decide to do?]

## Alternatives Considered
1. **Option A**: [pros/cons]
2. **Option B**: [pros/cons]

## Consequences
- **Pros**: [benefits of this decision]
- **Cons**: [drawbacks, technical debt, limitations]
- **Risks**: [what could go wrong]

## Validation
[How will we test this decision works? Metrics to track?]

## References
- [Link to source 1]
- [Link to source 2]
```

---

## ✅ Definition of "Well-Researched"

A technical choice is well-researched when:
1. At least 2 official sources consulted (Tier 1)
2. Alternatives documented with pros/cons
3. Decision captured in `SOURCES/` or `DECISIONS/`
4. Security implications considered (especially for crypto, contracts, storage)
5. Performance/cost impact estimated
6. Rollback plan exists if choice proves wrong

---

## 🚫 Anti-Patterns (Avoid)

- "I found this blog post" without vetting author credibility
- Copying code from Stack Overflow without understanding
- Choosing a library because "it has lots of stars" without evaluating fit
- No ADR for major framework/protocol decisions
- Research done but not documented (knowledge lost)

---

## 🔄 Review Cadence

- **Weekly:** Review `SOURCES/` additions for quality
- **Per PR:** Check if research is cited in PR description for non-trivial changes
- **Per Milestone:** Update ADRs if assumptions changed

---

## 📌 Quick Reference Commands

```bash
# Create new source doc
touch SOURCES/topic-name.md

# Create new ADR
cp DECISIONS/ADR-template.md DECISIONS/ADR-XXX-title.md

# Review all ADRs
ls -l DECISIONS/
```

---

**Remember:** We build Proof of Becoming on solid foundations, not guesswork. Research = quality = trust.
