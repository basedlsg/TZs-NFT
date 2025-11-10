/**
 * Tests for Soul-NFT contract interaction wrapper
 * Test-first approach: define expected behavior before implementation
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Taquito
const mockContractAt = jest.fn();
const mockWallet = jest.fn();
const mockEstimate = {
  transfer: jest.fn(),
};

jest.mock('@/lib/tezos', () => ({
  getTezos: jest.fn(() => ({
    wallet: {
      at: mockContractAt,
    },
    contract: {
      at: mockContractAt,
    },
    estimate: mockEstimate,
  })),
}));

import { SoulNFT } from '@/lib/soulNFT';

describe('SoulNFT Contract Wrapper', () => {
  const contractAddress = 'KT1TestContractAddress123456789';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with valid contract address', () => {
      const soulNFT = new SoulNFT(contractAddress);
      expect(soulNFT).toBeDefined();
      expect(soulNFT.address).toBe(contractAddress);
    });

    it('should throw error for invalid contract address', () => {
      expect(() => new SoulNFT('invalid')).toThrow('Invalid contract address');
    });

    it('should accept KT1 addresses only', () => {
      const validAddress = 'KT1VqarPDicMFn1ejmQqqshUkUXTCTXwmkCN';
      const soulNFT = new SoulNFT(validAddress);
      expect(soulNFT.address).toBe(validAddress);
    });
  });

  describe('mintSoul()', () => {
    it('should call mint_soul entrypoint with correct parameters', async () => {
      const mockMethodsObject = jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue({
          hash: 'opHash123',
          confirmation: jest.fn().mockResolvedValue({ completed: true }),
        }),
      });

      const mockContract = {
        methods: {
          mint_soul: mockMethodsObject,
        },
      };

      mockContractAt.mockResolvedValue(mockContract);

      const soulNFT = new SoulNFT(contractAddress);
      const owner = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
      const metadataUri = 'ipfs://QmTest123';

      const result = await soulNFT.mintSoul(owner, metadataUri);

      expect(mockMethodsObject).toHaveBeenCalledWith(owner, metadataUri);
      expect(result.hash).toBe('opHash123');
    });

    it('should validate owner address format', async () => {
      const soulNFT = new SoulNFT(contractAddress);

      await expect(
        soulNFT.mintSoul('invalid', 'ipfs://test')
      ).rejects.toThrow('Invalid owner address');
    });

    it('should validate metadata URI is not empty', async () => {
      const soulNFT = new SoulNFT(contractAddress);
      const owner = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';

      await expect(
        soulNFT.mintSoul(owner, '')
      ).rejects.toThrow('Metadata URI is required');
    });

    it('should return operation hash on success', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        hash: 'opHash123',
        confirmation: jest.fn().mockResolvedValue({ completed: true }),
      });

      const mockContract = {
        methods: {
          mint_soul: jest.fn().mockReturnValue({ send: mockSend }),
        },
      };

      mockContractAt.mockResolvedValue(mockContract);

      const soulNFT = new SoulNFT(contractAddress);
      const result = await soulNFT.mintSoul('tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb', 'ipfs://test');

      expect(result).toHaveProperty('hash');
      expect(result.hash).toBe('opHash123');
    });
  });

  describe('evolve()', () => {
    it('should call evolve entrypoint with correct parameters', async () => {
      const mockMethodsObject = jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue({
          hash: 'opHash456',
          confirmation: jest.fn().mockResolvedValue({ completed: true }),
        }),
      });

      const mockContract = {
        methods: {
          evolve: mockMethodsObject,
        },
      };

      mockContractAt.mockResolvedValue(mockContract);

      const soulNFT = new SoulNFT(contractAddress);
      const params = {
        tokenId: 0,
        stage: 1,
        seed: 'quantum-seed-abc123',
        metadataUri: 'ipfs://QmEvolved456',
      };

      const result = await soulNFT.evolve(params);

      expect(mockMethodsObject).toHaveBeenCalledWith({
        token_id: 0,
        stage: 1,
        seed: 'quantum-seed-abc123',
        metadata_uri: 'ipfs://QmEvolved456',
      });
      expect(result.hash).toBe('opHash456');
    });

    it('should validate evolution parameters', async () => {
      const soulNFT = new SoulNFT(contractAddress);

      await expect(
        soulNFT.evolve({
          tokenId: -1,
          stage: 1,
          seed: 'test',
          metadataUri: 'ipfs://test',
        })
      ).rejects.toThrow('Invalid token ID');

      await expect(
        soulNFT.evolve({
          tokenId: 0,
          stage: -1,
          seed: 'test',
          metadataUri: 'ipfs://test',
        })
      ).rejects.toThrow('Invalid stage number');

      await expect(
        soulNFT.evolve({
          tokenId: 0,
          stage: 1,
          seed: '',
          metadataUri: 'ipfs://test',
        })
      ).rejects.toThrow('Seed is required');
    });
  });

  describe('getTokenMetadata()', () => {
    it('should fetch token metadata from storage', async () => {
      const mockStorage = {
        token_metadata: {
          get: jest.fn().mockResolvedValue({
            token_id: 0,
            token_info: new Map([
              ['', Buffer.from('ipfs://QmTest123')],
              ['stage', Buffer.from('1')],
              ['seed', Buffer.from('quantum-seed-abc')],
            ]),
          }),
        },
      };

      const mockContract = {
        storage: jest.fn().mockResolvedValue(mockStorage),
      };

      mockContractAt.mockResolvedValue(mockContract);

      const soulNFT = new SoulNFT(contractAddress);
      const metadata = await soulNFT.getTokenMetadata(0);

      expect(metadata).toEqual({
        tokenId: 0,
        metadataUri: 'ipfs://QmTest123',
        stage: 1,
        seed: 'quantum-seed-abc',
      });
    });

    it('should return null for non-existent token', async () => {
      const mockStorage = {
        token_metadata: {
          get: jest.fn().mockResolvedValue(undefined),
        },
      };

      const mockContract = {
        storage: jest.fn().mockResolvedValue(mockStorage),
      };

      mockContractAt.mockResolvedValue(mockContract);

      const soulNFT = new SoulNFT(contractAddress);
      const metadata = await soulNFT.getTokenMetadata(999);

      expect(metadata).toBeNull();
    });
  });

  describe('getBalance()', () => {
    it('should return 1 for token owner', async () => {
      const owner = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
      const mockStorage = {
        ledger: {
          get: jest.fn().mockResolvedValue(0), // owner has token 0
        },
      };

      const mockContract = {
        storage: jest.fn().mockResolvedValue(mockStorage),
      };

      mockContractAt.mockResolvedValue(mockContract);

      const soulNFT = new SoulNFT(contractAddress);
      const balance = await soulNFT.getBalance(owner, 0);

      expect(balance).toBe(1);
    });

    it('should return 0 for non-owner', async () => {
      const mockStorage = {
        ledger: {
          get: jest.fn().mockResolvedValue(undefined),
        },
      };

      const mockContract = {
        storage: jest.fn().mockResolvedValue(mockStorage),
      };

      mockContractAt.mockResolvedValue(mockContract);

      const soulNFT = new SoulNFT(contractAddress);
      const balance = await soulNFT.getBalance('tz1OtherAddress', 0);

      expect(balance).toBe(0);
    });
  });

  describe('estimateGas()', () => {
    it('should estimate gas for mint operation', async () => {
      const mockTransferParams = jest.fn().mockResolvedValue({
        gasLimit: 15000,
        storageLimit: 300,
        suggestedFeeMutez: 1500,
      });

      mockEstimate.transfer.mockImplementation(mockTransferParams);

      const soulNFT = new SoulNFT(contractAddress);
      const estimate = await soulNFT.estimateGas('mint', {
        owner: 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb',
        metadataUri: 'ipfs://test',
      });

      expect(estimate).toHaveProperty('gasLimit');
      expect(estimate.gasLimit).toBeGreaterThan(0);
    });

    it('should estimate gas for evolve operation', async () => {
      const mockTransferParams = jest.fn().mockResolvedValue({
        gasLimit: 10000,
        storageLimit: 100,
        suggestedFeeMutez: 1000,
      });

      mockEstimate.transfer.mockImplementation(mockTransferParams);

      const soulNFT = new SoulNFT(contractAddress);
      const estimate = await soulNFT.estimateGas('evolve', {
        tokenId: 0,
        stage: 1,
        seed: 'test',
        metadataUri: 'ipfs://test',
      });

      expect(estimate).toHaveProperty('gasLimit');
      expect(estimate.gasLimit).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should throw custom error for ALREADY_MINTED', async () => {
      const mockSend = jest.fn().mockRejectedValue({
        message: 'ALREADY_MINTED',
      });

      const mockContract = {
        methods: {
          mint_soul: jest.fn().mockReturnValue({ send: mockSend }),
        },
      };

      mockContractAt.mockResolvedValue(mockContract);

      const soulNFT = new SoulNFT(contractAddress);

      await expect(
        soulNFT.mintSoul('tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb', 'ipfs://test')
      ).rejects.toThrow('This address already has a Soul-NFT');
    });

    it('should throw custom error for NOT_OWNER', async () => {
      const mockSend = jest.fn().mockRejectedValue({
        message: 'NOT_OWNER',
      });

      const mockContract = {
        methods: {
          evolve: jest.fn().mockReturnValue({ send: mockSend }),
        },
      };

      mockContractAt.mockResolvedValue(mockContract);

      const soulNFT = new SoulNFT(contractAddress);

      await expect(
        soulNFT.evolve({
          tokenId: 0,
          stage: 1,
          seed: 'test',
          metadataUri: 'ipfs://test',
        })
      ).rejects.toThrow('You do not own this token');
    });
  });
});
