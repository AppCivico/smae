import { Injectable } from '@nestjs/common';
import { UpdateCTPConfigDto } from './dto/ctp-config.dto';
import { PrismaService } from '../prisma/prisma.service';
import { HtmlSanitizer } from '../common/html-sanitizer';

@Injectable()
export class CTPConfigService {
    constructor(private readonly prisma: PrismaService) {}

    async update(dto: UpdateCTPConfigDto): Promise<void> {
        dto.texto_final = HtmlSanitizer(dto.texto_final);
        dto.texto_inicial = HtmlSanitizer(dto.texto_inicial);

        await this.prisma.cronogramaTerminoPlanejadoConfig.upsert({
            where: {
                modulo_sistema: dto.modulo_sistema,
            },
            update: {
                ...dto,
            },
            create: {
                ...dto,
            },
        });
    }
}
