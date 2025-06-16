import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchEntitiesNearbyDto, SearchEntitiesNearbyResponseDto } from './dto/geo-busca.entity';
import { GeoBuscaService } from './geo-busca.service';

@Controller('')
@ApiTags('GeoBusca')
export class GeoBuscaController {
    constructor(
        private readonly geoService: GeoBuscaService,
    ) {}


    @Post('busca-proximidades')
    @ApiOperation({ summary: 'Busca por projetos, metas, etc., perto de um local.' })
    @ApiBearerAuth('access-token')
    async searchEntitiesNearby(@Body() dto: SearchEntitiesNearbyDto): Promise<SearchEntitiesNearbyResponseDto> {
        return await this.geoService.searchEntitiesNearby(dto);
    }
}
