import { Injectable } from '@nestjs/common';
import { UpdateTextoConfigDto } from './dto/update-texto-config.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TextoConfigService {
    constructor(private readonly prisma: PrismaService) {}

    async update(dto: UpdateTextoConfigDto): Promise<void> {
        await this.prisma.textoConfig.update({
            where: { id: 1 },
            data: {
                ...dto,
            },
        });
    }
}
