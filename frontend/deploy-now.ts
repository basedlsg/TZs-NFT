import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';
import * as fs from 'fs';

// Test account for Ghostnet (publicly known test key - DO NOT USE IN PRODUCTION)
const TEST_PRIVATE_KEY = 'edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq';

async function deploy() {
  console.log('🚀 Deploying Soul NFT contract to Ghostnet...\n');

  // Connect to Ghostnet
  const Tezos = new TezosToolkit('https://ghostnet.tezos.marigold.dev');

  // Set up signer with test key
  const signer = new InMemorySigner(TEST_PRIVATE_KEY);
  Tezos.setSignerProvider(signer);

  const address = await Tezos.signer.publicKeyHash();
  console.log(`📍 Deploying from: ${address}`);

  // Check balance
  const balance = await Tezos.tz.getBalance(address);
  console.log(`💰 Balance: ${balance.toNumber() / 1000000} XTZ\n`);

  if (balance.toNumber() < 1000000) {
    console.log('⚠️  Low balance! Get testnet XTZ from: https://faucet.ghostnet.teztnets.com/');
    console.log(`   Send to: ${address}\n`);
  }

  // Simplified contract in Michelson (minimal Soul NFT)
  const contractCode = `
    parameter (or (unit %mint) (pair %evolve (nat %token_id) (string %metadata_uri)));
    storage (pair (address %admin) (pair (nat %next_token_id) (big_map %ledger address nat)));
    code {
      UNPAIR;
      IF_LEFT
        {
          # Mint
          DROP;
          DUP;
          SENDER;
          DIG 2;
          UNPAIR;
          UNPAIR;
          DIG 2;
          DUP;
          DUG 3;
          GET;
          IF_NONE
            {
              DIG 2;
              PUSH nat 1;
              ADD;
              DIG 2;
              SOME;
              DIG 3;
              UPDATE;
              PAIR;
              PAIR;
              NIL operation;
              PAIR
            }
            {
              DROP 4;
              PUSH string "Already minted";
              FAILWITH
            }
        }
        {
          # Evolve
          DROP;
          NIL operation;
          PAIR
        }
    }
  `;

  const initialStorage = `(Pair "${address}" (Pair 0 {}))`;

  try {
    console.log('📝 Originating contract...');

    const op = await Tezos.contract.originate({
      code: contractCode,
      storage: initialStorage,
    });

    console.log(`⏳ Waiting for confirmation... (operation: ${op.hash})`);
    const contract = await op.contract();

    console.log('\n✅ Contract deployed successfully!');
    console.log(`📍 Contract Address: ${contract.address}`);
    console.log(`🔗 View on TzKT: https://ghostnet.tzkt.io/${contract.address}`);
    console.log(`🔗 View on Better Call Dev: https://better-call.dev/ghostnet/${contract.address}\n`);

    // Save contract address
    fs.writeFileSync('contract-address.txt', contract.address);
    console.log('💾 Contract address saved to contract-address.txt');

    return contract.address;
  } catch (error: any) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

deploy()
  .then((address) => {
    console.log('\n🎉 Deployment complete!');
    console.log(`\nNext steps:`);
    console.log(`1. Update frontend/.env.local with:`);
    console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
    console.log(`2. Restart frontend: npm run dev`);
    console.log(`3. Test the dApp!\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Deployment error:', error);
    process.exit(1);
  });
