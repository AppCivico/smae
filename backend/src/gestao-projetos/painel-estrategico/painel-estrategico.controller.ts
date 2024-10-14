import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import {
    PainelEstrategicoExecucaoOrcamentariaLista,
    PainelEstrategicoGeoLocalizacaoDto,
    PainelEstrategicoProjeto,
    PainelEstrategicoResponseDto,
} from './entities/painel-estrategico-responses.dto';
import { PainelEstrategicoService } from './painel-estrategico.service';
import { PainelEstrategicoFilterDto, PainelEstrategicoListaFilterDto } from './dto/painel-estrategico-filter.dto';
import { PaginatedWithPagesDto } from '../../common/dto/paginated.dto';
import { PROJETO_READONLY_ROLES } from '../../pp/projeto/projeto.controller';

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

    @Post('geo-localizacao')
    @ApiBearerAuth('access-token')
    @Roles(PROJETO_READONLY_ROLES)
    async createGeoLocalizacao(
        @Body() filtro: PainelEstrategicoListaFilterDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PainelEstrategicoGeoLocalizacaoDto> {
        return await this.painelEstrategicoService.buildGeoLocalizacao(filtro, user);
    }
}
