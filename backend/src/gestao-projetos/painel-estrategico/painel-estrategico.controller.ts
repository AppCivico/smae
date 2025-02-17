import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PaginatedWithPagesDto } from '../../common/dto/paginated.dto';
import { PROJETO_READONLY_ROLES } from '../../pp/projeto/projeto.controller';
import { PainelEstrategicoFilterDto, PainelEstrategicoListaFilterDto } from './dto/painel-estrategico-filter.dto';
import {
    PainelEstrategicoExecucaoOrcamentariaLista,
    PainelEstrategicoGeoLocalizacaoDto,
    PainelEstrategicoGeoLocalizacaoDtoV2,
    PainelEstrategicoProjeto,
    PainelEstrategicoResponseDto
} from './entities/painel-estrategico-responses.dto';
import { PainelEstrategicoService } from './painel-estrategico.service';

@ApiTags('Dashboard')
@Controller('painel-estrategico')
export class PainelEstrategicoController {
    constructor(private readonly painelEstrategicoService: PainelEstrategicoService) {}
    @Post()
    @ApiBearerAuth('access-token')
    @Roles(PROJETO_READONLY_ROLES)
    async create(
        @Body() filtro: PainelEstrategicoFilterDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PainelEstrategicoResponseDto> {
        return await this.painelEstrategicoService.buildPainel(filtro, user);
    }

    @Post('lista-projeto-paginado')
    @ApiBearerAuth('access-token')
    @Roles(PROJETO_READONLY_ROLES)
    async createListaProjetoPaginado(
        @Body() filtro: PainelEstrategicoListaFilterDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PaginatedWithPagesDto<PainelEstrategicoProjeto>> {
        return await this.painelEstrategicoService.listaProjetosPaginado(filtro, user);
    }

    @Post('lista-execucao-orcamentaria')
    @ApiBearerAuth('access-token')
    @Roles(PROJETO_READONLY_ROLES)
    async createListaExecucaoOrcamentariaPaginado(
        @Body() filtro: PainelEstrategicoListaFilterDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PaginatedWithPagesDto<PainelEstrategicoExecucaoOrcamentariaLista>> {
        return await this.painelEstrategicoService.listaExecucaoOrcamentaria(filtro, user);
    }

    @Post('geo-localizacao/v2')
    @ApiBearerAuth('access-token')
    @Roles(PROJETO_READONLY_ROLES)
    async createGeoLocalizacaoV2(
        @Body() filtro: PainelEstrategicoFilterDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PainelEstrategicoGeoLocalizacaoDtoV2> {
        return await this.painelEstrategicoService.buildGeoLocalizacaoV2(filtro, user);
    }

    @Post('geo-localizacao')
    @ApiBearerAuth('access-token')
    @Roles(PROJETO_READONLY_ROLES)
    async createGeoLocalizacao(
        @Body() filtro: PainelEstrategicoFilterDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PainelEstrategicoGeoLocalizacaoDto> {
        return await this.painelEstrategicoService.buildGeoLocalizacao(filtro, user);
    }
}
