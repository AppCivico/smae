import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { FindOneParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { CreateRelatorioModeloDto } from './dto/create-relatorio-modelo.dto';
import { FilterColunasRelatorioDto, FilterRelatorioModeloDto } from './dto/filter-relatorio-modelo.dto';
import { UpdateRelatorioModeloDto } from './dto/update-relatorio-modelo.dto';
import {
    ListRelatorioColunasDto,
    ListRelatorioModeloDto,
    RelatorioModeloDetailDto,
} from './entities/relatorio-modelo.entity';
import { RelatorioModeloService } from './relatorio-modelo.service';

/**
 * Gerenciar modelos exige o mesmo privilégio de executar o relatório da fonte — inclusive na
 * variante escopada por fonte, para atender perfis restritos (ex.: "Gestor(a) Transferências
 * Voluntárias", que tem só `Reports.executar.CasaCivil` ou `...:Transferencias`). O gate fino
 * (fonte × sistema da requisição) é aplicado no service; aqui é só o filtro grosso do guard.
 */
const PRIV_EXECUTAR: ListaDePrivilegios[] = [
    'Reports.executar.CasaCivil',
    'Reports.executar.CasaCivil:Demandas',
    'Reports.executar.PDM',
    'Reports.executar.Projetos',
    'Reports.executar.MDO',
    'Reports.executar.PlanoSetorial',
    'Reports.executar.ProgramaDeMetas',
];

// Remoção/edição também é liberada para quem só tem o privilégio de remover: o criador de um
// modelo pode apagá-lo com `executar`, e quem faz a faxinar de modelos de terceiros usa `remover`.
const PRIV_REMOVER: ListaDePrivilegios[] = [
    ...PRIV_EXECUTAR,
    'Reports.remover.CasaCivil',
    'Reports.remover.CasaCivil:Demandas',
    'Reports.remover.PDM',
    'Reports.remover.Projetos',
    'Reports.remover.MDO',
    'Reports.remover.PlanoSetorial',
    'Reports.remover.ProgramaDeMetas',
];

@ApiTags('Relatórios - Modelos')
@Controller('relatorio-modelo')
export class RelatorioModeloController {
    constructor(private readonly relatorioModeloService: RelatorioModeloService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(PRIV_EXECUTAR, 'Criar modelo de relatório')
    async create(@Body() dto: CreateRelatorioModeloDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.relatorioModeloService.create(dto, user);
    }

    /**
     * Colunas declaradas de uma fonte, para o frontend montar o seletor de colunas do modelo.
     * Rota declarada antes de `:id` para não ser capturada por ela.
     */
    @Get('colunas')
    @ApiBearerAuth('access-token')
    @Roles(PRIV_EXECUTAR, 'Listar colunas disponíveis de uma fonte')
    @ApiOkResponse({ type: ListRelatorioColunasDto })
    async colunas(
        @Query() filters: FilterColunasRelatorioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListRelatorioColunasDto> {
        return this.relatorioModeloService.listColunas(filters.fonte, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles(PRIV_EXECUTAR, 'Listar modelos de relatório')
    @ApiOkResponse({ type: ListRelatorioModeloDto })
    async findAll(
        @Query() filters: FilterRelatorioModeloDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListRelatorioModeloDto> {
        return { linhas: await this.relatorioModeloService.findAll(filters, user) };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles(PRIV_EXECUTAR, 'Detalhe de um modelo de relatório')
    @ApiOkResponse({ type: RelatorioModeloDetailDto })
    async findOne(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RelatorioModeloDetailDto> {
        return await this.relatorioModeloService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(PRIV_REMOVER, 'Editar modelo de relatório')
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateRelatorioModeloDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.relatorioModeloService.update(params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(PRIV_REMOVER, 'Remover modelo de relatório')
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.relatorioModeloService.remove(params.id, user);
        return null;
    }
}
