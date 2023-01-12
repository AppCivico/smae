import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../auth/decorators/is-public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { textoTosDto } from './entities/texto-config.entity';
import { TextoConfigService } from './texto-config.service';

@Controller('texto-config')
export class TextoConfigController {
    constructor(
        // TODO implementar o patch
        private readonly textoConfigService: TextoConfigService,
        private readonly prisma: PrismaService,
    ) { }

    @ApiTags('Público')
    @IsPublic()
    @Get('/texto-tos')
    async textoTos(): Promise<textoTosDto> {
        const textoConfig = await this.prisma.textoConfig.findFirstOrThrow({ where: { id: 1 } });
        return {
            bemvindo_email: textoConfig.bemvindo_email,
            tos: textoConfig.tos,
        };
    }

}
