/**
 * Soul-NFT Contract Interaction Wrapper
 *
 * Provides TypeScript interface for interacting with Soul-NFT smart contract
 * Includes validation, error handling, and gas estimation
 */

import { TezosToolkit, ContractAbstraction, Wallet } from '@taquito/taquito';
import { getTezos } from './tezos';

// Types
export interface EvolutionParams {
  tokenId: number;
  stage: number;
  seed: string;
  metadataUri: string;
}

export interface TokenMetadata {
  tokenId: number;
  metadataUri: string;
  stage?: number;
  seed?: string;
}

export interface OperationResult {
  hash: string;
  confirmation: () => Promise<unknown>;
}

export interface GasEstimate {
  gasLimit: number;
  storageLimit: number;
  suggestedFeeMutez: number;
}

// Contract storage types (simplified)
interface TokenMetadataValue {
  token_id: number;
  token_info: Map<string, Uint8Array>;
}

interface ContractStorage {
  admin: string;
  next_token_id: number;
  ledger: Map<string, number>;
  token_metadata: Map<number, TokenMetadataValue>;
  metadata: Map<string, Uint8Array>;
}

// Error messages mapping
const ERROR_MESSAGES: Record<string, string> = {
  'NOT_ADMIN': 'Only the contract admin can mint Soul-NFTs',
  'ALREADY_MINTED': 'This address already has a Soul-NFT',
  'TOKEN_UNDEFINED': 'Token does not exist',
  'NOT_OWNER': 'You do not own this token',
  'TRANSFER_DISABLED': 'Soul-NFTs cannot be transferred',
};

/**
 * SoulNFT Contract Wrapper
 */
export class SoulNFT {
  public readonly address: string;
  private tezos: TezosToolkit;
  private contractPromise: Promise<ContractAbstraction<Wallet>> | null = null;

  constructor(contractAddress: string) {
    // Validate contract address
    if (!contractAddress || !contractAddress.startsWith('KT1')) {
      throw new Error('Invalid contract address: must start with KT1');
    }

    this.address = contractAddress;
    this.tezos = getTezos();
  }

  /**
   * Get contract instance (cached)
   */
  private async getContract(): Promise<ContractAbstraction<Wallet>> {
    if (!this.contractPromise) {
      this.contractPromise = this.tezos.wallet.at(this.address);
    }
    return this.contractPromise;
  }

  /**
   * Get contract instance for reading (doesn't require wallet)
   */
  private async getContractForReading(): Promise<ContractAbstraction<Wallet>> {
    return this.tezos.contract.at(this.address) as Promise<ContractAbstraction<Wallet>>;
  }

  /**
   * Mint a Soul-NFT (admin only)
   *
   * @param owner - Address to receive the NFT
   * @param metadataUri - IPFS URI or URL pointing to metadata
   * @returns Operation result with hash
   */
  async mintSoul(owner: string, metadataUri: string): Promise<OperationResult> {
    // Validate inputs
    if (!owner || !owner.startsWith('tz')) {
      throw new Error('Invalid owner address: must start with tz1, tz2, or tz3');
    }

    if (!metadataUri || metadataUri.trim() === '') {
      throw new Error('Metadata URI is required');
    }

    try {
      const contract = await this.getContract();
      const operation = await contract.methods.mint_soul(owner, metadataUri).send();

      return {
        hash: operation.hash,
        confirmation: () => operation.confirmation(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Evolve a Soul-NFT (owner only)
   *
   * @param params - Evolution parameters
   * @returns Operation result with hash
   */
  async evolve(params: EvolutionParams): Promise<OperationResult> {
    // Validate inputs
    if (params.tokenId < 0 || !Number.isInteger(params.tokenId)) {
      throw new Error('Invalid token ID: must be a non-negative integer');
    }

    if (params.stage < 0 || !Number.isInteger(params.stage)) {
      throw new Error('Invalid stage number: must be a non-negative integer');
    }

    if (!params.seed || params.seed.trim() === '') {
      throw new Error('Seed is required');
    }

    if (!params.metadataUri || params.metadataUri.trim() === '') {
      throw new Error('Metadata URI is required');
    }

    try {
      const contract = await this.getContract();

      // Contract expects snake_case parameter names
      const contractParams = {
        token_id: params.tokenId,
        stage: params.stage,
        seed: params.seed,
        metadata_uri: params.metadataUri,
      };

      const operation = await contract.methods.evolve(contractParams).send();

      return {
        hash: operation.hash,
        confirmation: () => operation.confirmation(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get token metadata
   *
   * @param tokenId - Token ID to query
   * @returns Token metadata or null if not found
   */
  async getTokenMetadata(tokenId: number): Promise<TokenMetadata | null> {
    try {
      const contract = await this.getContractForReading();
      const storage = await contract.storage<ContractStorage>();

      const metadata = await storage.token_metadata.get(tokenId);

      if (!metadata) {
        return null;
      }

      // Decode metadata from bytes
      const metadataUri = this.decodeBytes(metadata.token_info.get('') || new Uint8Array());
      const stageBytes = metadata.token_info.get('stage');
      const seedBytes = metadata.token_info.get('seed');

      const result: TokenMetadata = {
        tokenId: metadata.token_id,
        metadataUri,
      };

      if (stageBytes) {
        result.stage = parseInt(this.decodeBytes(stageBytes), 10);
      }

      if (seedBytes) {
        result.seed = this.decodeBytes(seedBytes);
      }

      return result;
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return null;
    }
  }

  /**
   * Get balance for an address and token ID
   *
   * @param owner - Address to check
   * @param tokenId - Token ID to check
   * @returns 0 or 1 (Soul-NFTs are unique)
   */
  async getBalance(owner: string, tokenId: number): Promise<number> {
    try {
      const contract = await this.getContractForReading();
      const storage = await contract.storage<ContractStorage>();

      const ownerTokenId = await storage.ledger.get(owner);

      if (ownerTokenId === undefined) {
        return 0;
      }

      return ownerTokenId === tokenId ? 1 : 0;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  /**
   * Get the token ID owned by an address
   *
   * @param owner - Address to check
   * @returns Token ID or null if address has no Soul-NFT
   */
  async getTokenIdByOwner(owner: string): Promise<number | null> {
    try {
      const contract = await this.getContractForReading();
      const storage = await contract.storage<ContractStorage>();

      const tokenId = await storage.ledger.get(owner);

      return tokenId !== undefined ? tokenId : null;
    } catch (error) {
      console.error('Error fetching token ID:', error);
      return null;
    }
  }

  /**
   * Estimate gas for an operation
   *
   * @param operation - Operation type ('mint' or 'evolve')
   * @param params - Operation parameters
   * @returns Gas estimate
   */
  async estimateGas(
    operation: 'mint' | 'evolve',
    params: { owner?: string; metadataUri?: string } | EvolutionParams
  ): Promise<GasEstimate> {
    try {
      const contract = await this.getContract();

      let transferParams;

      if (operation === 'mint') {
        const { owner, metadataUri } = params as { owner?: string; metadataUri?: string };
        if (!owner || !metadataUri) {
          throw new Error('Owner and metadataUri required for mint estimation');
        }
        transferParams = contract.methods.mint_soul(owner, metadataUri).toTransferParams();
      } else {
        const evolveParams = params as EvolutionParams;
        const contractParams = {
          token_id: evolveParams.tokenId,
          stage: evolveParams.stage,
          seed: evolveParams.seed,
          metadata_uri: evolveParams.metadataUri,
        };
        transferParams = contract.methods.evolve(contractParams).toTransferParams();
      }

      const estimate = await this.tezos.estimate.transfer(transferParams);

      return {
        gasLimit: estimate.gasLimit,
        storageLimit: estimate.storageLimit,
        suggestedFeeMutez: estimate.suggestedFeeMutez,
      };
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw new Error('Failed to estimate gas');
    }
  }

  /**
   * Decode bytes to string
   */
  private decodeBytes(bytes: Uint8Array): string {
    try {
      const decoder = new TextDecoder();
      return decoder.decode(bytes);
    } catch {
      return '';
    }
  }

  /**
   * Handle contract errors and convert to user-friendly messages
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      // Check if error message contains a known contract error
      for (const [contractError, userMessage] of Object.entries(ERROR_MESSAGES)) {
        if (error.message.includes(contractError)) {
          return new Error(userMessage);
        }
      }

      // Return original error if no mapping found
      return error;
    }

    return new Error('Unknown error occurred');
  }
}

/**
 * Get Soul-NFT contract instance
 *
 * @param contractAddress - Optional contract address (uses env var if not provided)
 * @returns SoulNFT instance
 */
export function getSoulNFTContract(contractAddress?: string): SoulNFT {
  const address = contractAddress || process.env.NEXT_PUBLIC_SOUL_NFT_CONTRACT;

  if (!address) {
    throw new Error(
      'Contract address not provided. Set NEXT_PUBLIC_SOUL_NFT_CONTRACT or pass address explicitly.'
    );
  }

  return new SoulNFT(address);
}
