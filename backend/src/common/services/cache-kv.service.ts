import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CacheMetadata {
    criado_em: Date;
    atualizado_em: Date;
    expiracao: Date | null;
}

@Injectable()
export class CacheKVService {
    private readonly logger = new Logger(CacheKVService.name);

    constructor(private readonly prisma: PrismaService) {}

    async get<T>(chave: string): Promise<{ valor: T; expired: boolean } | null> {
        const cache = await this.prisma.cacheKV.findUnique({ where: { chave } });
        if (!cache) return null;

        try {
            const valor = JSON.parse(cache.valor) as T;
            return { valor, expired: false };
        } catch (e) {
            this.logger.error(`Falha ao parsear cache ${chave}: ${e}`);
            return null;
        }
    }

    async set(chave: string, valor: any): Promise<void> {
        const valorStr = JSON.stringify(valor);

        await this.prisma.cacheKV.upsert({
            where: { chave },
            update: { valor: valorStr, expiracao: null },
            create: { chave, valor: valorStr, expiracao: null },
        });
    }

    async delete(chave: string): Promise<void> {
        await this.prisma.cacheKV.deleteMany({ where: { chave } });
    }

    async isExpired(chave: string): Promise<boolean> {
        const cache = await this.prisma.cacheKV.findUnique({ where: { chave } });
        return !cache;
    }

    async getMetadata(chave: string): Promise<CacheMetadata | null> {
        return this.prisma.cacheKV.findUnique({
            where: { chave },
            select: { criado_em: true, atualizado_em: true, expiracao: true },
        });
    }

    async setDeleted(chave: string): Promise<void> {
        await this.prisma.cacheKV.deleteMany({
            where: { chave },
        });
    }
}
