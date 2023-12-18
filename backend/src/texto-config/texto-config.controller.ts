import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../auth/decorators/is-public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { textoTosDto } from './entities/texto-config.entity';
import { TextoConfigService } from './texto-config.service';
import { UpdateTextoConfigDto } from './dto/update-texto-config.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('texto-config')
export class TextoConfigController {
    constructor(private readonly textoConfigService: TextoConfigService, private readonly prisma: PrismaService) {}

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

    @ApiTags('default')
    @Patch('/texto-tos')
    @ApiBearerAuth('access-token')
    @Roles('SMAE.superadmin')
    async patchTextoTos(@Body() dto: UpdateTextoConfigDto): Promise<string> {
        await this.textoConfigService.update(dto);
        return '';
    }
}
