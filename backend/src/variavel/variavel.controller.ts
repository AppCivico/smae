import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { TipoVariavel } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiPaginatedWithPagesResponse } from '../auth/decorators/paginated.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { ListaDePrivilegios } from '../common/ListaDePrivilegios';
import { FindOneParams } from '../common/decorators/find-params';
import { PaginatedWithPagesDto } from '../common/dto/paginated.dto';
import { BatchRecordWithId, RecordWithId } from '../common/dto/record-with-id.dto';
import { MetaController, MetaSetorialController } from '../meta/meta.controller';
import { BatchSerieUpsert } from './dto/batch-serie-upsert.dto';
import {
    CreateGeradorVariaveBaselDto,
    CreateGeradorVariavelPDMDto,
    CreateVariavelBaseDto,
    CreateVariavelPDMDto,
} from './dto/create-variavel.dto';
import { FilterVariavelDto, FilterVariavelGlobalDto } from './dto/filter-variavel.dto';
import {
    ListSeriesAgrupadas,
    ListVariavelDto,
    VariavelDetailComAuxiliaresDto,
    VariavelDetailDto,
    VariavelGlobalDetailDto,
} from './dto/list-variavel.dto';
import { UpdateVariavelDto } from './dto/update-variavel.dto';
import {
    FilterSVNPeriodoDto,
    FilterVariavelDetalheDto,
    SerieIndicadorValorNominal,
    SerieValorCategoricaComposta,
    SerieValorCategoricaElemento,
    SerieValorNomimal,
    VariavelGlobalItemDto,
} from './entities/variavel.entity';
import { VariavelService } from './variavel.service';

export const ROLES_ACESSO_VARIAVEL_PDM: ListaDePrivilegios[] = [...MetaController.ReadPerm, 'CadastroMeta.listar'];

@ApiTags('Indicador')
@Controller('')
export class IndicadorVariavelPDMController {
    private tipo: TipoVariavel = 'PDM';

    constructor(private readonly variavelService: VariavelService) {}

    @Post('indicador-variavel')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async create(@Body() dto: CreateVariavelPDMDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.variavelService.create(this.tipo, dto, user);
    }

    @Get('indicador-variavel')
    @ApiBearerAuth('access-token')
    @Roles([...ROLES_ACESSO_VARIAVEL_PDM])
    async listAll(@Query() filters: FilterVariavelDto, @CurrentUser() user: PessoaFromJwt): Promise<ListVariavelDto> {
        return { linhas: await this.variavelService.findAll(this.tipo, filters) };
    }

    @Get('indicador-variavel/:id')
    @ApiBearerAuth('access-token')
    @Roles([...ROLES_ACESSO_VARIAVEL_PDM])
    async findOne(
        @Param() params: FindOneParams,
        filters: FilterVariavelDetalheDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<VariavelDetailDto | VariavelDetailComAuxiliaresDto> {
        return await this.variavelService.findOne(this.tipo, params.id, filters, user);
    }

    @Patch('indicador-variavel/:id')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateVariavelDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.variavelService.update(this.tipo, +params.id, dto, user);
    }

    @Delete('indicador-variavel/:id')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.variavelService.remove(this.tipo, +params.id, user);
        return '';
    }

    // patch precisa ficar antes da rota do :id/serie-previsto
    @Patch('indicador-variavel-serie')
    @ApiBearerAuth('access-token')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles([...MetaController.WritePerm, 'PDM.admin_cp', 'PDM.tecnico_cp'])
    async patchSeriePrevisto(@Body() series: BatchSerieUpsert, @CurrentUser() user: PessoaFromJwt) {
        await this.variavelService.batchUpsertSerie(this.tipo, series.valores, user);

        return;
    }

    // manter antes da proxima rota
    @Post('indicador-variavel/gerador-regionalizado')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async create_generated(
        @Body() dto: CreateGeradorVariavelPDMDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<BatchRecordWithId> {
        return { ids: await this.variavelService.create_region_generated(this.tipo, dto, user) };
    }

    @ApiExtraModels(SerieValorNomimal, SerieIndicadorValorNominal)
    @Get('indicador-variavel/:id/serie')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.ReadPerm)
    async getSeriePrevistoRealizado(
        @Param() params: FindOneParams,
        @Query() filters: FilterSVNPeriodoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListSeriesAgrupadas> {
        return await this.variavelService.getSeriePrevistoRealizado(this.tipo, filters, params.id, user);
    }
}

export const ROLES_ACESSO_VARIAVEL_PS: ListaDePrivilegios[] = [
    'CadastroVariavelGlobal.administrador_no_orgao',
    'CadastroMetaPS.listar',
    'CadastroVariavelGlobal.administrador',
    ...ROLES_ACESSO_VARIAVEL_PDM,
];

@ApiTags('Variável Global')
@Controller('')
export class VariavelGlobalController {
    private tipo: TipoVariavel = 'Global';
    public static WritePerm: ListaDePrivilegios[] = [
        'CadastroVariavelGlobal.administrador_no_orgao',
        'CadastroVariavelGlobal.administrador',
        'SMAE.GrupoVariavel.participante', // ʕ•ᴥ•ʔ
    ];

    constructor(private readonly variavelService: VariavelService) {}

    @Post('variavel')
    @ApiBearerAuth('access-token')
    @Roles(VariavelGlobalController.WritePerm)
    async create(@Body() dto: CreateVariavelBaseDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.variavelService.create(this.tipo, dto, user);
    }

    @Get('plano-setorial-indicador-variavel')
    @ApiBearerAuth('access-token')
    @Roles([...ROLES_ACESSO_VARIAVEL_PS])
    async indicador_listAll(
        @Query() filters: FilterVariavelDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListVariavelDto> {
        return { linhas: await this.variavelService.findAll(this.tipo, filters) };
    }

    @Get('variavel')
    @ApiBearerAuth('access-token')
    @Roles([...ROLES_ACESSO_VARIAVEL_PS])
    @ApiPaginatedWithPagesResponse(VariavelGlobalItemDto)
    async listAll(
        @Query() filters: FilterVariavelGlobalDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PaginatedWithPagesDto<VariavelGlobalItemDto>> {
        return await this.variavelService.findAllGlobal(filters, user);
    }

    @Get('variavel/:id')
    @ApiBearerAuth('access-token')
    @Roles([...ROLES_ACESSO_VARIAVEL_PS])
    async findOne(
        @Param() params: FindOneParams,
        @Query() filters: FilterVariavelDetalheDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<VariavelGlobalDetailDto | VariavelDetailComAuxiliaresDto> {
        return (await this.variavelService.findOne(this.tipo, params.id, filters, user)) as VariavelGlobalDetailDto;
    }

    @Patch('variavel/:id')
    @ApiBearerAuth('access-token')
    @Roles(VariavelGlobalController.WritePerm)
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateVariavelDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.variavelService.update(this.tipo, +params.id, dto, user);
    }

    @Delete('variavel/:id')
    @ApiBearerAuth('access-token')
    @Roles(VariavelGlobalController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.variavelService.remove(this.tipo, +params.id, user);
        return '';
    }

    // patch precisa ficar antes da rota do :id/serie-previsto
    @Patch('variavel-serie')
    @ApiBearerAuth('access-token')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(VariavelGlobalController.WritePerm)
    async patchSeriePrevisto(@Body() series: BatchSerieUpsert, @CurrentUser() user: PessoaFromJwt) {
        await this.variavelService.batchUpsertSerie(this.tipo, series.valores, user);

        return;
    }

    // manter antes da proxima rota
    @Post('variavel/gerador-regionalizado')
    @ApiBearerAuth('access-token')
    @Roles(VariavelGlobalController.WritePerm)
    async create_generated(
        @Body() dto: CreateGeradorVariaveBaselDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<BatchRecordWithId> {
        return { ids: await this.variavelService.create_region_generated(this.tipo, dto, user) };
    }

    // Manter em sync o getSeriePrevistoRealizadoCopia
    @ApiExtraModels(
        SerieValorNomimal,
        SerieIndicadorValorNominal,
        SerieValorCategoricaComposta,
        SerieValorCategoricaElemento
    )
    @Get('variavel/:id/serie')
    @ApiBearerAuth('access-token')
    @Roles([...VariavelGlobalController.WritePerm, ...MetaSetorialController.ReadPerm])
    async getSeriePrevistoRealizado(
        @Param() params: FindOneParams,
        @Query() filters: FilterSVNPeriodoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListSeriesAgrupadas> {
        return await this.variavelService.getSeriePrevistoRealizado(this.tipo, filters, params.id, user);
    }

    // Endpoint é uma copia do acima, o acima está sendo chamado na tela do banco de variaveis
    // mas esse aqui segue o padrão que o frontend está usando para montar as urls do plano setorial
    @ApiExtraModels(SerieValorNomimal, SerieIndicadorValorNominal)
    @Get('plano-setorial-indicador-variavel/:id/serie')
    @ApiBearerAuth('access-token')
    @Roles([...VariavelGlobalController.WritePerm, ...MetaSetorialController.ReadPerm])
    async getSeriePrevistoRealizadoCopia(
        @Param() params: FindOneParams,
        @Query() filters: FilterSVNPeriodoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListSeriesAgrupadas> {
        return await this.variavelService.getSeriePrevistoRealizado(this.tipo, filters, params.id, user);
    }

    @Get('processa-variaveis-suspensas')
    @ApiBearerAuth('access-token')
    @Roles([...VariavelGlobalController.WritePerm])
    async processaVariaveisSuspensas(): Promise<number[]> {
        return await this.variavelService.processVariaveisSuspensasController();
    }
}
