import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SmaeConfigService {
    constructor(private readonly prisma: PrismaService) {}

    async getConfig(key: string): Promise<string | null> {
        const config = await this.prisma.smaeConfig.findFirst({
            where: {
                key: key,
            },
        });
        if (config) return config.value;

        if (process.env[key]) return process.env[key] ?? null;

        return null;
    }
}
