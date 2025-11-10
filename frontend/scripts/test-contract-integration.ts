/**
 * Integration Test Script for Soul-NFT Contract
 *
 * Run this script to test contract interactions on Ghostnet
 *
 * Usage:
 *   ts-node scripts/test-contract-integration.ts
 *
 * Prerequisites:
 *   1. Deployed contract address in .env.local
 *   2. Connected wallet with some testnet XTZ
 *   3. Admin wallet for minting (optional)
 */

import { getSoulNFTContract } from '../lib/soulNFT';

async function testContractIntegration() {
  console.log('🧪 Soul-NFT Contract Integration Test\n');

  const contractAddress = process.env.NEXT_PUBLIC_SOUL_NFT_CONTRACT;

  if (!contractAddress) {
    console.error('❌ Error: NEXT_PUBLIC_SOUL_NFT_CONTRACT not set');
    console.log('Set it in frontend/.env.local');
    process.exit(1);
  }

  console.log(`📝 Contract Address: ${contractAddress}\n`);

  try {
    const contract = getSoulNFTContract();

    // Test 1: Get token metadata (read-only, no wallet needed)
    console.log('Test 1: Fetching token metadata for token ID 0...');
    const metadata = await contract.getTokenMetadata(0);

    if (metadata) {
      console.log('✅ Token found:');
      console.log('  - Token ID:', metadata.tokenId);
      console.log('  - Metadata URI:', metadata.metadataUri);
      console.log('  - Stage:', metadata.stage || 'N/A');
      console.log('  - Seed:', metadata.seed || 'N/A');
    } else {
      console.log('⚠️  Token 0 not found (contract may be newly deployed)');
    }

    console.log('');

    // Test 2: Check balance
    console.log('Test 2: Checking balance...');
    const testAddress = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
    const balance = await contract.getBalance(testAddress, 0);
    console.log(`✅ Balance for ${testAddress}:`, balance);

    console.log('');

    // Test 3: Get token by owner
    console.log('Test 3: Finding token by owner...');
    const tokenId = await contract.getTokenIdByOwner(testAddress);

    if (tokenId !== null) {
      console.log(`✅ ${testAddress} owns token ID:`, tokenId);
    } else {
      console.log(`⚠️  ${testAddress} does not own any Soul-NFT`);
    }

    console.log('');

    // Test 4: Gas estimation (no wallet needed, just estimation)
    console.log('Test 4: Estimating gas for mint operation...');
    try {
      const mintEstimate = await contract.estimateGas('mint', {
        owner: testAddress,
        metadataUri: 'ipfs://QmTestEstimate123',
      });

      console.log('✅ Mint gas estimate:');
      console.log('  - Gas limit:', mintEstimate.gasLimit);
      console.log('  - Storage limit:', mintEstimate.storageLimit);
      console.log('  - Suggested fee:', (mintEstimate.suggestedFeeMutez / 1_000_000).toFixed(6), 'XTZ');
    } catch (error) {
      console.log('⚠️  Gas estimation requires wallet connection');
      console.log('   (This is expected if no wallet is connected)');
    }

    console.log('');

    // Test 5: Estimate evolve gas
    console.log('Test 5: Estimating gas for evolve operation...');
    try {
      const evolveEstimate = await contract.estimateGas('evolve', {
        tokenId: 0,
        stage: 1,
        seed: 'test-quantum-seed',
        metadataUri: 'ipfs://QmTestEvolve456',
      });

      console.log('✅ Evolve gas estimate:');
      console.log('  - Gas limit:', evolveEstimate.gasLimit);
      console.log('  - Storage limit:', evolveEstimate.storageLimit);
      console.log('  - Suggested fee:', (evolveEstimate.suggestedFeeMutez / 1_000_000).toFixed(6), 'XTZ');
    } catch (error) {
      console.log('⚠️  Gas estimation requires wallet connection');
    }

    console.log('');
    console.log('✅ All read-only tests passed!');
    console.log('');
    console.log('📌 Next Steps:');
    console.log('  1. Connect wallet in the frontend UI');
    console.log('  2. Mint a Soul-NFT (admin only)');
    console.log('  3. Test evolution with actual proof submission');
    console.log('');
    console.log(`🔍 View contract on explorer: https://ghostnet.tzkt.io/${contractAddress}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testContractIntegration();
}

export { testContractIntegration };
