import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CTPConfigService } from './ctp-config.service';
import { FilterCTPConfigDto, UpdateCTPConfigDto } from './dto/ctp-config.dto';
import { CTPConfigDto } from './entities/ctp-config.entity';

@ApiTags('default')
@Controller('cronograma-termino-planejado-config')
export class CTPConfigController {
    constructor(
        private readonly configSerivce: CTPConfigService,
        private readonly prisma: PrismaService
    ) {}

    @Get('')
    @ApiBearerAuth('access-token')
    async ctpConfig(@Query() filter: FilterCTPConfigDto): Promise<CTPConfigDto> {
        const config = await this.prisma.cronogramaTerminoPlanejadoConfig.findFirstOrThrow({
            where: {
                modulo_sistema: filter.modulo_sistema,
            },
        });
        return {
            assunto_global: config.assunto_global,
            assunto_orgao: config.assunto_orgao,
            modulo_sistema: config.modulo_sistema,
            para: config.para,
            texto_final: config.texto_final,
            texto_inicial: config.texto_inicial,
        };
    }

    @Patch('')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.superadmin'])
    async patchCTPConfig(@Body() dto: UpdateCTPConfigDto): Promise<string> {
        await this.configSerivce.update(dto);
        return '';
    }
}
