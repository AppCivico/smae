import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchEntitiesNearbyDto } from '../geo-busca/dto/geo-busca.entity';
import { BuscaGlobalService } from './busca-global.service';
import { UnifiedTableResponseDto } from './dto/busca-global.entity';

@Controller('busca-global')
@ApiTags('Busca Global')
export class BuscaGlobalController {
    constructor(private readonly buscaGlobalService: BuscaGlobalService) {}

    @Post('proximidades-table')
    @ApiOperation({
        summary: 'Busca entidades próximas e retorna em formato de tabela unificada.',
        description:
            'Retorna projetos, obras, metas, iniciativas, atividades e etapas em um formato de tabela comum, ordenados por distância, com cabeçalhos definidos.',
    })
    @ApiBearerAuth('access-token')
    async getBuscaGlobal(@Body() dto: SearchEntitiesNearbyDto): Promise<UnifiedTableResponseDto> {
        return await this.buscaGlobalService.getUnifiedTableData(dto);
    }
}
