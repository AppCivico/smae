import { BadRequestException } from '@nestjs/common';
import { Serie } from 'src/generated/prisma/client';
import * as crypto from 'crypto';

// Tipos de série compactados
type CompactSerie = 'P_' | 'PA' | 'R_' | 'RA';

export interface CompactTokenData {
    serie: Serie;
    periodo: string; // DateYMD
    variavelId: number;
    id?: bigint; // bigint pra series que já existem
    userId: bigint; // User ID que pode usar o token
}

export class SerieCompactToken {
    private static SERIE_CODES: Record<Serie, CompactSerie> = {
        'Previsto': 'P_',
        'PrevistoAcumulado': 'PA',
        'Realizado': 'R_',
        'RealizadoAcumulado': 'RA',
    };

    private static SERIE_DECODE: Record<CompactSerie, Serie> = {
        'P_': 'Previsto',
        'PA': 'PrevistoAcumulado',
        'R_': 'Realizado',
        'RA': 'RealizadoAcumulado',
    };

    constructor(private readonly secret: string) {
        if (!secret || secret.length < 8) {
            throw new Error('Secret must be at least 8 characters long');
        }

        const hash = crypto.createHash('sha256');
        hash.update(secret);
        this.secret = hash.digest('hex');
    }

    // Convert number to base36
    private static toBase36(num: number | bigint): string {
        return num.toString(36).toUpperCase();
    }

    // Convert base36 back to number/bigint
    private static fromBase36(str: string, toBigInt: boolean = false): number | bigint {
        const num = parseInt(str, 36);
        return toBigInt ? BigInt(num) : num;
    }

    // Enhanced checksum function with secret
    private calculateSecureChecksum(parts: string[], userId: bigint): string {
        // Combine parts with userId and secret
        const str = parts.join('') + userId.toString() + this.secret;

        // Create a more complex hash using multiple rounds
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;

            // Add some extra complexity based on secret
            const secretChar = this.secret.charCodeAt(i % this.secret.length);
            hash = (hash << 3) - hash + secretChar;
            hash = hash & hash;
        }

        // Return 6-character base36 checksum (matching your example format)
        return SerieCompactToken.toBase36(Math.abs(hash)).padStart(6, '0');
    }

    encode(data: CompactTokenData): string {
        // Get the serie code
        const serieCode = SerieCompactToken.SERIE_CODES[data.serie];
        if (!serieCode) throw new Error('Invalid serie');

        // Parse and validate the date
        const match = data.periodo.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) throw new Error('Invalid date format');

        const [_, year, month, day] = match;
        const yearNum = parseInt(year);
        if (yearNum < 1900 || yearNum > 9999) throw new Error('Year out of range');

        // Convert numbers to base36
        const yearBase36 = SerieCompactToken.toBase36(yearNum).padStart(3, '0'); // 3 chars for year
        const varIdBase36 = SerieCompactToken.toBase36(data.variavelId).padStart(6, '0'); // 6 chars for variavelId
        const idBase36 = data.id ? SerieCompactToken.toBase36(data.id).padStart(7, '0') : '_'.repeat(7); // 7 chars for optional id
        const userIdBase36 = SerieCompactToken.toBase36(data.userId).padStart(7, '0'); // 7 chars for userId

        // Combine parts
        const parts = [
            serieCode.padEnd(2, '_'), // Serie code (2 chars)
            yearBase36, // Year in base36 (3 chars)
            month, // Month (2 chars)
            day, // Day (2 chars)
            varIdBase36, // Variable ID in base36 (6 chars)
            idBase36, // ID in base36 or placeholder (7 chars)
            userIdBase36, // User ID in base36 (7 chars)
        ];

        // Add checksum
        const checksum = this.calculateSecureChecksum(parts, data.userId);

        return [...parts, checksum].join('');
    }

    /*
    R_1K808010003HU000KCIZ00000011A2FC
    |  |  | |  |     |       |      |
    |  |  | |  |     |       |      └─ Checksum (6 chars)
    |  |  | |  |     |       └─ User ID (7 chars)
    |  |  | |  |     └─ Series ID (7 chars or _______)
    |  |  | |  └─ Variable ID (6 chars)
    |  |  | └─ Day (2 chars)
    |  |  └─ Month (2 chars)
    |  └─ Year base36 (3 chars)
    └─ Serie type (2 chars)
    */
    decode(token: string, currentUserId: bigint): CompactTokenData {
        if (token.length !== 35) {
            // 2 + 3 + 2 + 2 + 6 + 7 + 7 + 6 = 35 chars
            throw new BadRequestException('Tamanho inválido');
        }

        // Extract parts
        const serieCode = token.slice(0, 2).trim() as CompactSerie;
        const yearBase36 = token.slice(2, 5);
        const month = token.slice(5, 7);
        const day = token.slice(7, 9);
        const varIdBase36 = token.slice(9, 15);
        const idBase36 = token.slice(15, 22);
        const userIdBase36 = token.slice(22, 29);
        const checksum = token.slice(29);

        // Decode userId and validate
        const userId = BigInt(SerieCompactToken.fromBase36(userIdBase36, true));
        if (userId !== currentUserId) {
            throw new BadRequestException('Token criado por outro usuário');
        }

        // Validate checksum
        const parts = [serieCode.padEnd(2, '_'), yearBase36, month, day, varIdBase36, idBase36, userIdBase36];

        if (checksum !== this.calculateSecureChecksum(parts, userId)) {
            throw new BadRequestException('Assinatura do token inválida');
        }

        // Convert year from base36
        const year = SerieCompactToken.fromBase36(yearBase36);
        if (typeof year !== 'number' || year < 1900 || year > 9999) {
            throw new BadRequestException('Ano inválido');
        }

        // Validate month and day
        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);
        if (isNaN(dayNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
            throw new BadRequestException('Data inválida');
        }

        // Build result
        const result: CompactTokenData = {
            serie: SerieCompactToken.SERIE_DECODE[serieCode],
            periodo: `${year}-${month}-${day}`,
            variavelId: Number(SerieCompactToken.fromBase36(varIdBase36)),
            userId,
        };

        if (isNaN(result.variavelId)) {
            throw new BadRequestException('Variável inválida');
        }

        // Add ID if present
        if (idBase36.trim() !== '_______') {
            result.id = BigInt(SerieCompactToken.fromBase36(idBase36, true));
        }

        return result;
    }
}
