import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchEntitiesNearbyDto, SearchEntitiesNearbyResponseDto } from './dto/geo-busca.entity';
import { GeoBuscaService } from './geo-busca.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';

@Controller('')
@ApiTags('GeoBusca')
export class GeoBuscaController {
    constructor(private readonly geoService: GeoBuscaService) {}

    @Post('busca-proximidades')
    @ApiOperation({ summary: 'Busca por projetos, metas, etc., perto de um local.' })
    @ApiBearerAuth('access-token')
    @Roles(['Menu.cc_consulta_geral'])
    async searchEntitiesNearby(
        @Body() dto: SearchEntitiesNearbyDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<SearchEntitiesNearbyResponseDto> {
        return await this.geoService.searchEntitiesNearby(dto, user);
    }
}
