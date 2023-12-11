import { randomBytes } from 'crypto';

export function MathRandom(max = 1): number {
    // Gera ainda 8 bytes, mas instancia como BigInt
    const bigint = BigInt(`0x${randomBytes(8).toString('hex')}`);

    // converte pra um float [0, 1) (nunca é 1, mas pode ser zero)
    // limpa os últimos 12-bits do bigint pq o javascript n sabe fazer conta float depois disso
    // 2**52 (0x10000000000000) é o maior número safe do JS power of 2
    const float = Number(bigint >> BigInt(12)) / 0x10000000000000;

    return float * max;
}
