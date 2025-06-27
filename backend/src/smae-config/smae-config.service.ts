import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SmaeConfigService {
    constructor(private readonly prisma: PrismaService) {}

    async upsert(key: string, value: string) {
        return this.prisma.smaeConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }
}
