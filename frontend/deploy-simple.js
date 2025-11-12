const { TezosToolkit } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');
const fs = require('fs');

// Test account for Ghostnet
const TEST_PRIVATE_KEY = 'edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq';

async function deploy() {
  console.log('🚀 Deploying Soul NFT contract to Ghostnet...\n');

  // Connect to Ghostnet
  const rpcUrl = 'https://ghostnet.tezos.marigold.dev';
  const Tezos = new TezosToolkit(rpcUrl);

  // Set up signer
  const signer = new InMemorySigner(TEST_PRIVATE_KEY);
  Tezos.setSignerProvider(signer);

  const address = await Tezos.signer.publicKeyHash();
  console.log(`📍 Deploying from: ${address}`);

  // Check balance
  try {
    const balance = await Tezos.tz.getBalance(address);
    console.log(`💰 Balance: ${balance.toNumber() / 1000000} XTZ\n`);

    if (balance.toNumber() < 1000000) {
      console.log('⚠️  Low balance detected. Contract deployment may fail.');
      console.log('   Get testnet XTZ from: https://faucet.ghostnet.teztnets.com/');
      console.log(`   Send to: ${address}\n`);
    }
  } catch (error) {
    console.log('⚠️  Could not check balance:', error.message);
    console.log('   Proceeding with deployment anyway...\n');
  }

  // Simplified Soul NFT contract in Michelson
  const contractCode = `
    parameter (or (unit %mint) (pair %evolve (nat %token_id) (string %metadata_uri)));
    storage (pair (address %admin) (pair (nat %next_token_id) (big_map %ledger address nat)));
    code {
      UNPAIR;
      IF_LEFT
        {
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
          DROP;
          NIL operation;
          PAIR
        }
    }
  `;

  const initialStorage = `(Pair "${address}" (Pair 0 {}))`;

  try {
    console.log('📝 Originating contract to Ghostnet...');
    console.log('   This may take 30-60 seconds...\n');

    const op = await Tezos.contract.originate({
      code: contractCode,
      storage: initialStorage,
    });

    console.log(`✅ Operation submitted: ${op.hash}`);
    console.log(`⏳ Waiting for confirmation...`);

    const contract = await op.contract();

    console.log('\n🎉 Contract deployed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Contract Address: ${contract.address}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n🔗 View on TzKT:`);
    console.log(`   https://ghostnet.tzkt.io/${contract.address}`);
    console.log(`\n🔗 View on Better Call Dev:`);
    console.log(`   https://better-call.dev/ghostnet/${contract.address}\n`);

    // Save contract address
    fs.writeFileSync('contract-address.txt', contract.address);
    fs.writeFileSync('../DEPLOYED_CONTRACT_ADDRESS.txt', contract.address);
    console.log('💾 Contract address saved to:');
    console.log('   - contract-address.txt');
    console.log('   - DEPLOYED_CONTRACT_ADDRESS.txt\n');

    return contract.address;
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    if (error.message.includes('balance_too_low')) {
      console.error('\n💡 Tip: Get testnet XTZ from https://faucet.ghostnet.teztnets.com/');
    }
    throw error;
  }
}

deploy()
  .then((address) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 DEPLOYMENT COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 Next steps:\n');
    console.log('1. Update frontend/.env.local with:');
    console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}\n`);
    console.log('2. Restart frontend:');
    console.log('   cd frontend && npm run dev\n');
    console.log('3. Test the dApp at http://localhost:3000\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('💥 DEPLOYMENT ERROR');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('\nError:', error.message);
    console.error('\n📚 See DEPLOY_CONTRACT_NOW.md for alternative deployment methods\n');
    process.exit(1);
  });
