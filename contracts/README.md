# Soul-NFT Smart Contract

FA2-compliant Soul-NFT contract for Proof of Becoming.

## Features

- **One per address**: Each address can mint exactly one Soul-NFT
- **Non-transferable**: Transfer and operator updates are disabled
- **Evolvable**: Metadata can be updated via `evolve()` entrypoint
- **Events**: Emits evolution events for off-chain indexing
- **FA2 compliant**: Implements required FA2 interfaces (balance_of, etc.)

## Contract Entrypoints

### `Mint_soul(owner: address, metadata_uri: string)`
Mints a new Soul-NFT for the specified owner.

- **Access**: Admin only
- **Constraint**: One NFT per address (enforces uniqueness)
- **Parameters**:
  - `owner`: Address to receive the NFT
  - `metadata_uri`: IPFS URI or URL pointing to initial metadata

### `Evolve(params: evolution_params)`
Updates the metadata of an existing Soul-NFT.

- **Access**: Token owner only
- **Parameters**:
  - `token_id`: ID of the token to evolve
  - `stage`: Evolution stage number (increments with each proof)
  - `seed`: Quantum or cryptographic seed for generative art
  - `metadata_uri`: New IPFS URI with updated metadata and art

**Event emitted**: `evolved_event` with token_id, stage, seed, metadata_uri, timestamp

### `Balance_of(params: balance_of_param)`
FA2-compliant balance query.

### `Transfer(txs: transfer list)` ❌ DISABLED
Transfers are disabled for Soul-NFTs (always fails).

### `Update_operators(ops: update_operators)` ❌ DISABLED
Operator management is disabled (always fails).

## Storage Schema

```ocaml
{
  admin: address;                                      (* Contract admin *)
  next_token_id: nat;                                  (* Auto-increment ID *)
  ledger: big_map(address, nat);                       (* owner -> token_id *)
  token_metadata: big_map(nat, tokenMetadataData);     (* token_id -> metadata *)
  metadata: big_map(string, bytes);                    (* Contract metadata (TZIP-16) *)
  operators: big_map((address * (address * nat)), unit); (* Not used, but required by FA2 *)
}
```

## Error Codes

- `0`: Token undefined
- `1`: Not owner
- `2`: Already minted (address already has a Soul-NFT)
- `3`: Transfer disabled
- `4`: Not admin

## Compilation

### Install LIGO

```bash
# Linux
curl https://gitlab.com/ligolang/ligo/-/releases/1.6.0/downloads/ligo-static-linux -o ligo
chmod +x ligo

# macOS
brew install ligolang/ligo/ligo
```

### Compile Contract

```bash
./ligo compile contract soul_nft.mligo > soul_nft.tz
```

## Testing

Unit tests are in `soul_nft.test.mligo` (to be created).

```bash
./ligo run test soul_nft.test.mligo
```

## Deployment (Testnet)

### Using Tezos CLI

```bash
# Import admin key
tezos-client import secret key admin <secret-key>

# Originate contract
tezos-client originate contract soul_nft \
  transferring 0 from admin \
  running soul_nft.tz \
  --init '(Pair "tz1..." (Pair 0 (Pair {} (Pair {} (Pair {} {})))))' \
  --burn-cap 1
```

### Using Taquito (JavaScript)

See `../frontend/scripts/deploy_contract.ts` for deployment script.

## Security Considerations

1. **Admin privilege**: Only admin can mint. Plan to implement multi-sig or DAO governance.
2. **No transfer**: Prevents secondary markets, enforces "Soul-bound" nature.
3. **Metadata immutability**: Only owner can evolve their NFT; past stages stored off-chain.
4. **Gas limits**: `evolve()` is lightweight (updates big_map entry only).

## On-Chain Events

Evolution events allow off-chain indexers to track:
- NFT evolution history
- Stage progression
- Seed values for reproducible art generation
- Timestamps for ritual tracking

## Contract Metadata (TZIP-16)

To be added in `metadata` big_map:

```json
{
  "name": "Proof of Becoming Soul-NFT",
  "description": "Non-transferable NFTs that evolve through verified personal rituals",
  "version": "1.0.0",
  "license": { "name": "MIT" },
  "authors": ["Proof of Becoming Team"],
  "interfaces": ["TZIP-012", "TZIP-016"]
}
```

## Next Steps

- [ ] Write LIGO unit tests (mint, evolve, transfer failure)
- [ ] Deploy to Ghostnet
- [ ] Create Taquito TypeScript bindings
- [ ] Implement metadata schema (stage history, art generation params)
- [ ] Set up indexer for evolution events
