/**
 * Deploy Soul-NFT contract to Tezos testnet
 *
 * Usage:
 *   npx ts-node scripts/deploy-contract.ts --network ghostnet --admin <admin-address>
 *
 * Prerequisites:
 *   1. DEPLOYER_PRIVATE_KEY in .env (for testnet deployment)
 *   2. Compiled contract in ../contracts/build/soul_nft.tz
 */

import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const NETWORKS = {
  ghostnet: 'https://ghostnet.tezos.marigold.dev',
  mainnet: 'https://mainnet.tezos.marigold.dev',
};

interface DeployOptions {
  network: 'ghostnet' | 'mainnet';
  adminAddress: string;
  privateKey?: string;
}

// Initial storage generator
function generateInitialStorage(adminAddress: string): string {
  return `(Pair "${adminAddress}" (Pair 0 (Pair {} (Pair {} {}))))`;
}

async function deployContract(options: DeployOptions): Promise<string> {
  const { network, adminAddress, privateKey } = options;

  // Validate inputs
  if (!adminAddress || !adminAddress.startsWith('tz')) {
    throw new Error('Invalid admin address');
  }

  if (!privateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY environment variable required');
  }

  // Initialize Tezos toolkit
  const rpcUrl = NETWORKS[network];
  const Tezos = new TezosToolkit(rpcUrl);

  // Set signer
  const signer = new InMemorySigner(privateKey);
  Tezos.setSignerProvider(signer);

  console.log(`Deploying to ${network}...`);
  console.log(`Admin address: ${adminAddress}`);

  // Read compiled contract
  const contractPath = path.join(__dirname, '../../contracts/build/soul_nft.tz');

  if (!fs.existsSync(contractPath)) {
    throw new Error(
      `Contract not found at ${contractPath}\n` +
      'Please compile the contract first:\n' +
      '  cd contracts && npm run compile'
    );
  }

  const contractCode = fs.readFileSync(contractPath, 'utf-8');

  // Generate initial storage
  const initialStorage = generateInitialStorage(adminAddress);

  console.log('Originating contract...');
  console.log(`Initial storage: ${initialStorage}`);

  try {
    // Originate contract
    const originationOp = await Tezos.contract.originate({
      code: contractCode,
      storage: initialStorage,
    });

    console.log(`Waiting for confirmation...`);
    console.log(`Operation hash: ${originationOp.hash}`);

    const contract = await originationOp.contract();
    const contractAddress = contract.address;

    console.log('\n✅ Contract deployed successfully!');
    console.log(`Contract address: ${contractAddress}`);
    console.log(`Explorer: https://${network}.tzkt.io/${contractAddress}`);

    return contractAddress;
  } catch (error) {
    console.error('Deployment failed:', error);
    throw error;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const networkIndex = args.indexOf('--network');
  const adminIndex = args.indexOf('--admin');

  const network = networkIndex >= 0 ? args[networkIndex + 1] as 'ghostnet' | 'mainnet' : 'ghostnet';
  const adminAddress = adminIndex >= 0 ? args[adminIndex + 1] : process.env.ADMIN_ADDRESS;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

  if (!adminAddress) {
    console.error('Error: --admin <address> required or set ADMIN_ADDRESS env var');
    process.exit(1);
  }

  if (!privateKey) {
    console.error('Error: DEPLOYER_PRIVATE_KEY environment variable required');
    console.error('Example: DEPLOYER_PRIVATE_KEY=edsk... npx ts-node scripts/deploy-contract.ts --admin tz1...');
    process.exit(1);
  }

  try {
    const contractAddress = await deployContract({
      network,
      adminAddress,
      privateKey,
    });

    // Save to .env.local
    const envPath = path.join(__dirname, '../.env.local');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Update or add contract address
    const contractEnvKey = 'NEXT_PUBLIC_SOUL_NFT_CONTRACT';
    const contractEnvLine = `${contractEnvKey}=${contractAddress}`;

    if (envContent.includes(contractEnvKey)) {
      envContent = envContent.replace(
        new RegExp(`${contractEnvKey}=.*`, 'g'),
        contractEnvLine
      );
    } else {
      envContent += `\n${contractEnvLine}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`\n✅ Contract address saved to .env.local`);

  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { deployContract, generateInitialStorage };
