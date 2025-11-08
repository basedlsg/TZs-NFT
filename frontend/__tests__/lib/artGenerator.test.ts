/**
 * Tests for Generative Art Generator
 *
 * Tests seed-deterministic art generation for Soul NFTs
 */

import { generateArt, seedToColors, seedToGeometry } from '@/lib/artGenerator';

describe('Art Generator', () => {
  describe('Determinism', () => {
    test('same seed produces identical art', () => {
      const seed = 'a3f29b8c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678';

      const art1 = generateArt(seed, 512, 512);
      const art2 = generateArt(seed, 512, 512);

      expect(art1).toBeDefined();
      expect(art2).toBeDefined();
      // Should produce same data URL
      expect(art1.dataUrl).toBe(art2.dataUrl);
    });

    test('different seeds produce different art', () => {
      const seed1 = 'a3f29b8c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678';
      const seed2 = 'b4e30c9d5e6f7890abcdef1234567890abcdef1234567890abcdef12345679';

      const art1 = generateArt(seed1, 512, 512);
      const art2 = generateArt(seed2, 512, 512);

      expect(art1.dataUrl).not.toBe(art2.dataUrl);
    });
  });

  describe('Color Generation', () => {
    test('generates color palette from seed', () => {
      const seed = 'a3f29b8c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678';
      const colors = seedToColors(seed);

      expect(colors).toHaveLength(5); // Primary, secondary, accent, background, highlight
      expect(colors.every(c => /^#[0-9A-Fa-f]{6}$/.test(c))).toBe(true);
    });

    test('same seed produces same colors', () => {
      const seed = 'a3f29b8c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678';

      const colors1 = seedToColors(seed);
      const colors2 = seedToColors(seed);

      expect(colors1).toEqual(colors2);
    });
  });

  describe('Geometry Generation', () => {
    test('generates geometric parameters from seed', () => {
      const seed = 'a3f29b8c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678';
      const geometry = seedToGeometry(seed);

      expect(geometry).toHaveProperty('shapes');
      expect(geometry).toHaveProperty('complexity');
      expect(geometry).toHaveProperty('symmetry');
      expect(geometry.complexity).toBeGreaterThanOrEqual(0);
      expect(geometry.complexity).toBeLessThanOrEqual(1);
    });

    test('same seed produces same geometry', () => {
      const seed = 'a3f29b8c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678';

      const geo1 = seedToGeometry(seed);
      const geo2 = seedToGeometry(seed);

      expect(geo1).toEqual(geo2);
    });
  });

  describe('Art Output', () => {
    test('generates valid data URL', () => {
      const seed = 'a3f29b8c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678';
      const art = generateArt(seed, 512, 512);

      expect(art.dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    test('respects canvas dimensions', () => {
      const seed = 'a3f29b8c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678';
      const art = generateArt(seed, 256, 256);

      expect(art.width).toBe(256);
      expect(art.height).toBe(256);
    });

    test('includes metadata in response', () => {
      const seed = 'a3f29b8c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678';
      const art = generateArt(seed, 512, 512);

      expect(art).toHaveProperty('seed');
      expect(art).toHaveProperty('colors');
      expect(art).toHaveProperty('geometry');
      expect(art).toHaveProperty('dataUrl');
      expect(art.seed).toBe(seed);
    });
  });

  describe('Visual Elements', () => {
    test('generates different visual styles based on seed bytes', () => {
      // Test that different seed ranges produce different styles
      const seedLow = '0000000000000000000000000000000000000000000000000000000000000000';
      const seedMid = '8888888888888888888888888888888888888888888888888888888888888888';
      const seedHigh = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

      const artLow = generateArt(seedLow, 512, 512);
      const artMid = generateArt(seedMid, 512, 512);
      const artHigh = generateArt(seedHigh, 512, 512);

      // All should have different color palettes
      expect(artLow.colors).not.toEqual(artMid.colors);
      expect(artMid.colors).not.toEqual(artHigh.colors);
    });
  });

  describe('Stage Evolution', () => {
    test('includes stage parameter in generation', () => {
      const seed = 'a3f29b8c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678';

      const art1 = generateArt(seed, 512, 512, 1);
      const art2 = generateArt(seed, 512, 512, 2);

      expect(art1).toHaveProperty('stage');
      expect(art2).toHaveProperty('stage');
      expect(art1.stage).toBe(1);
      expect(art2.stage).toBe(2);
    });

    test('different stages with same seed produce different art', () => {
      const seed = 'a3f29b8c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678';

      const art1 = generateArt(seed, 512, 512, 1);
      const art2 = generateArt(seed, 512, 512, 2);

      // Different stages should produce variations
      expect(art1.dataUrl).not.toBe(art2.dataUrl);
    });
  });

  describe('Error Handling', () => {
    test('handles invalid seed gracefully', () => {
      const invalidSeed = 'not-a-hex-string';

      expect(() => generateArt(invalidSeed, 512, 512)).not.toThrow();
    });

    test('handles empty seed', () => {
      expect(() => generateArt('', 512, 512)).not.toThrow();
    });

    test('validates dimensions', () => {
      const seed = 'a3f29b8c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678';

      // Should handle reasonable dimensions
      expect(() => generateArt(seed, 0, 0)).not.toThrow();
      expect(() => generateArt(seed, -1, -1)).not.toThrow();
    });
  });
});
