import { randomBytes } from 'crypto';

export function MathRandom(max: number = 1): number {
    const buffer = randomBytes(8); // using 8 bytes (64 bits)
    const float = buffer.readDoubleBE(0);
    return Math.abs(float / Number.MAX_SAFE_INTEGER) * max; // ou não, 53 bits... node js...
}
