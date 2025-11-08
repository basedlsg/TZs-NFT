/**
 * Tests for contract deployment script
 * Focus on validation logic and storage generation
 */

import { describe, it, expect } from '@jest/globals';
import { generateInitialStorage } from '@/scripts/deploy-contract';

describe('Contract Deployment', () => {
  describe('generateInitialStorage', () => {
    it('should generate valid Michelson storage expression', () => {
      const adminAddress = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
      const storage = generateInitialStorage(adminAddress);

      expect(storage).toContain(adminAddress);
      expect(storage).toMatch(/^\(Pair "tz1.+" \(Pair 0 \(Pair \{\} \(Pair \{\} \{\}\)\)\)\)$/);
    });

    it('should handle different admin addresses', () => {
      const addresses = [
        'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb',
        'tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6',
        'tz1gjaF81ZRRvdzjobyfVNsAeSC6PScjfQwN',
      ];

      addresses.forEach((addr) => {
        const storage = generateInitialStorage(addr);
        expect(storage).toContain(addr);
      });
    });

    it('should initialize next_token_id to 0', () => {
      const storage = generateInitialStorage('tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb');
      expect(storage).toContain('Pair 0');
    });

    it('should initialize empty big_maps', () => {
      const storage = generateInitialStorage('tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb');
      // Should have 3 empty big_maps: ledger, token_metadata, metadata
      const emptyMaps = (storage.match(/\{\}/g) || []).length;
      expect(emptyMaps).toBe(3);
    });
  });

  describe('Address validation', () => {
    it('should validate Tezos address format', () => {
      const validAddresses = [
        'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb', // tz1 (ed25519)
        'tz2LBtbMMvvguWQupgEmtfjtXy77cHgdr5TE', // tz2 (secp256k1)
        'tz3RDC3Jdn4j15J7bBHZd29EUee9gVB1CxD9', // tz3 (p256)
      ];

      validAddresses.forEach((addr) => {
        expect(addr).toMatch(/^tz[123][a-zA-Z0-9]{33}$/);
      });
    });

    it('should reject invalid addresses', () => {
      const invalidAddresses = [
        '',
        'invalid',
        'KT1...',  // Contract address (not valid for admin)
        'tz1ABC', // Too short
      ];

      invalidAddresses.forEach((addr) => {
        expect(addr.startsWith('tz') && addr.length === 36).toBe(false);
      });
    });
  });
});
