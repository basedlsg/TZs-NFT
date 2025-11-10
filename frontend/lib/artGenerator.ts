/**
 * Generative Art Generator for Soul NFTs
 *
 * Creates deterministic artwork from seed for NFT evolution
 * Uses seed to control colors, geometry, and patterns
 */

export interface ArtMetadata {
  seed: string;
  stage: number;
  colors: string[];
  geometry: GeometryParams;
  dataUrl: string;
  width: number;
  height: number;
}

export interface GeometryParams {
  shapes: number;
  complexity: number;
  symmetry: boolean;
  rotation: number;
}

/**
 * Seeded pseudo-random number generator (PRNG)
 * Uses simple LCG algorithm for deterministic randomness from seed
 */
class SeededRandom {
  private seed: number;

  constructor(seedString: string) {
    // Convert hex seed to number
    this.seed = parseInt(seedString.substring(0, 8), 16);
  }

  /**
   * Get next random number between 0 and 1
   */
  next(): number {
    // Linear Congruential Generator
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  /**
   * Get random integer between min and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Get random float between min and max
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

/**
 * Extract color palette from seed
 */
export function seedToColors(seed: string): string[] {
  if (!seed || seed.length < 12) {
    // Fallback colors for invalid seed
    return ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];
  }

  const colors: string[] = [];

  // Extract 5 colors from different parts of the seed
  for (let i = 0; i < 5; i++) {
    const offset = i * 12;
    const r = parseInt(seed.substring(offset, offset + 2), 16);
    const g = parseInt(seed.substring(offset + 2, offset + 4), 16);
    const b = parseInt(seed.substring(offset + 4, offset + 6), 16);

    colors.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
  }

  return colors;
}

/**
 * Extract geometry parameters from seed
 */
export function seedToGeometry(seed: string): GeometryParams {
  if (!seed || seed.length < 16) {
    return {
      shapes: 5,
      complexity: 0.5,
      symmetry: true,
      rotation: 0,
    };
  }

  const rng = new SeededRandom(seed);

  return {
    shapes: rng.nextInt(3, 12),
    complexity: rng.next(),
    symmetry: rng.next() > 0.5,
    rotation: rng.nextFloat(0, Math.PI * 2),
  };
}

/**
 * Draw interference pattern (quantum-inspired)
 */
function drawInterferencePattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: string[],
  rng: SeededRandom
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const waveCount = rng.nextInt(2, 5);

  ctx.globalAlpha = 0.3;

  for (let w = 0; w < waveCount; w++) {
    const waveX = rng.nextFloat(0, width);
    const waveY = rng.nextFloat(0, height);
    const wavelength = rng.nextFloat(20, 80);
    const amplitude = rng.nextFloat(10, 40);

    for (let x = 0; x < width; x += 4) {
      for (let y = 0; y < height; y += 4) {
        const dx = x - waveX;
        const dy = y - waveY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const wave = Math.sin(distance / wavelength) * amplitude;
        const brightness = Math.max(0, Math.min(255, 128 + wave));

        ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.05)`;
        ctx.fillRect(x, y, 4, 4);
      }
    }
  }

  ctx.globalAlpha = 1;
}

/**
 * Draw geometric shapes
 */
function drawGeometricShapes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: string[],
  geometry: GeometryParams,
  rng: SeededRandom
) {
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(geometry.rotation);

  for (let i = 0; i < geometry.shapes; i++) {
    const color = colors[i % colors.length];
    const radius = rng.nextFloat(50, 200);
    const sides = rng.nextInt(3, 8);
    const angle = (Math.PI * 2) / sides;
    const offsetX = rng.nextFloat(-width / 4, width / 4);
    const offsetY = rng.nextFloat(-height / 4, height / 4);

    ctx.beginPath();

    for (let j = 0; j <= sides; j++) {
      const x = offsetX + radius * Math.cos(angle * j);
      const y = offsetY + radius * Math.sin(angle * j);

      if (j === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();

    ctx.globalAlpha = 0.6;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw symmetric copy if enabled
    if (geometry.symmetry) {
      ctx.save();
      ctx.scale(-1, 1);

      ctx.beginPath();
      for (let j = 0; j <= sides; j++) {
        const x = offsetX + radius * Math.cos(angle * j);
        const y = offsetY + radius * Math.sin(angle * j);

        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      ctx.globalAlpha = 0.6;
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = color;
      ctx.stroke();

      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Draw circular patterns
 */
function drawCircularPatterns(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: string[],
  rng: SeededRandom,
  stage: number
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const rings = 3 + stage; // More rings as NFT evolves

  for (let ring = 0; ring < rings; ring++) {
    const radius = (ring + 1) * (Math.min(width, height) / (rings * 2 + 2));
    const segments = rng.nextInt(6, 16);
    const color = colors[ring % colors.length];

    for (let seg = 0; seg < segments; seg++) {
      const angle1 = (Math.PI * 2 * seg) / segments;
      const angle2 = (Math.PI * 2 * (seg + 0.8)) / segments;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, angle1, angle2);
      ctx.lineTo(centerX, centerY);
      ctx.closePath();

      ctx.globalAlpha = 0.5;
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}

/**
 * Generate deterministic artwork from seed
 *
 * @param seed - Hex seed string (64 characters)
 * @param width - Canvas width
 * @param height - Canvas height
 * @param stage - Evolution stage (affects complexity)
 * @returns Art metadata with data URL
 */
export function generateArt(
  seed: string,
  width: number = 512,
  height: number = 512,
  stage: number = 1
): ArtMetadata {
  // Validate and sanitize inputs
  if (width <= 0) width = 512;
  if (height <= 0) height = 512;
  if (stage < 1) stage = 1;
  if (!seed) seed = '0'.repeat(64);

  // Create seeded RNG
  const rng = new SeededRandom(seed + stage.toString()); // Include stage in seed

  // Extract visual parameters
  const colors = seedToColors(seed);
  const geometry = seedToGeometry(seed);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Background gradient
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    width / 2
  );
  gradient.addColorStop(0, colors[3]);
  gradient.addColorStop(1, '#000000');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw layers
  drawInterferencePattern(ctx, width, height, colors, rng);
  drawCircularPatterns(ctx, width, height, colors, rng, stage);
  drawGeometricShapes(ctx, width, height, colors, geometry, rng);

  // Convert to data URL
  const dataUrl = canvas.toDataURL('image/png');

  return {
    seed,
    stage,
    colors,
    geometry,
    dataUrl,
    width,
    height,
  };
}
