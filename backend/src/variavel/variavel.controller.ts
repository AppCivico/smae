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
import { BatchSerieUpsert } from './dto/batch-serie-upsert.dto';
import { CreateGeradorVariaveBaselDto, CreateVariavelBaseDto, CreateVariavelPDMDto } from './dto/create-variavel.dto';
import { FilterVariavelDto, FilterVariavelGlobalDto } from './dto/filter-variavel.dto';
import {
    ListSeriesAgrupadas,
    ListVariavelDto,
    VariavelDetailDto,
    VariavelGlobalDetailDto,
} from './dto/list-variavel.dto';
import { UpdateVariavelDto } from './dto/update-variavel.dto';
import { SerieIndicadorValorNominal, SerieValorNomimal, VariavelGlobalItemDto } from './entities/variavel.entity';
import { VariavelService } from './variavel.service';

export const ROLES_ACESSO_VARIAVEL_PDM: ListaDePrivilegios[] = [
    'CadastroIndicador.inserir',
    'CadastroIndicador.editar',
    'CadastroMeta.listar',
];

@ApiTags('Indicador')
@Controller('')
export class IndicadorVariavelPDMController {
    private tipo: TipoVariavel = 'PDM';

    constructor(private readonly variavelService: VariavelService) {}

    @Post('indicador-variavel')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroIndicador.inserir'])
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
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<VariavelDetailDto> {
        return await this.variavelService.findOne(this.tipo, params.id, user);
    }

    @Patch('indicador-variavel/:id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroIndicador.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateVariavelDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.variavelService.update(this.tipo, +params.id, dto, user);
    }

    @Delete('indicador-variavel/:id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroIndicador.editar'])
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
    @Roles(['CadastroIndicador.inserir'])
    async patchSeriePrevisto(@Body() series: BatchSerieUpsert, @CurrentUser() user: PessoaFromJwt) {
        await this.variavelService.batchUpsertSerie(this.tipo, series.valores, user);

        return;
    }

    // manter antes da proxima rota
    @Post('indicador-variavel/gerador-regionalizado')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroIndicador.inserir'])
    async create_generated(
        @Body() dto: CreateGeradorVariaveBaselDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<BatchRecordWithId> {
        return { ids: await this.variavelService.create_region_generated(this.tipo, dto, user) };
    }

    @ApiExtraModels(SerieValorNomimal, SerieIndicadorValorNominal)
    @Get('indicador-variavel/:id/serie')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroIndicador.editar', 'CadastroIndicador.inserir', 'CadastroMeta.listar'])
    async getSeriePrevistoRealizado(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListSeriesAgrupadas> {
        return await this.variavelService.getSeriePrevistoRealizado(this.tipo, params.id);
    }
}
export const ROLES_ACESSO_VARIAVEL_PS: ListaDePrivilegios[] = [
    'CadastroIndicadorPS.inserir',
    'CadastroIndicadorPS.editar',
    'CadastroMetaPS.listar',
    'CadastroIndicadorPS.administrador',
    ...ROLES_ACESSO_VARIAVEL_PDM,
];

@ApiTags('Variável Global')
@Controller('')
export class VariavelGlobalController {
    private tipo: TipoVariavel = 'Global';

    constructor(private readonly variavelService: VariavelService) {}

    @Post('variavel')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroIndicadorPS.inserir', 'CadastroIndicadorPS.administrador'])
    async create(@Body() dto: CreateVariavelBaseDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.variavelService.create(this.tipo, dto, user);
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
        @CurrentUser() user: PessoaFromJwt
    ): Promise<VariavelGlobalDetailDto> {
        return (await this.variavelService.findOne(this.tipo, params.id, user)) as VariavelGlobalDetailDto;
    }

    @Patch('variavel/:id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroIndicadorPS.editar', 'CadastroIndicadorPS.administrador'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateVariavelDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.variavelService.update(this.tipo, +params.id, dto, user);
    }

    @Delete('variavel/:id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroIndicadorPS.editar', 'CadastroIndicadorPS.administrador'])
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
    @Roles(['CadastroIndicadorPS.inserir', 'CadastroIndicadorPS.administrador'])
    async patchSeriePrevisto(@Body() series: BatchSerieUpsert, @CurrentUser() user: PessoaFromJwt) {
        await this.variavelService.batchUpsertSerie(this.tipo, series.valores, user);

        return;
    }

    // manter antes da proxima rota
    @Post('variavel/gerador-regionalizado')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroIndicadorPS.inserir', 'CadastroIndicadorPS.administrador'])
    async create_generated(
        @Body() dto: CreateGeradorVariaveBaselDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<BatchRecordWithId> {
        return { ids: await this.variavelService.create_region_generated(this.tipo, dto, user) };
    }

    @ApiExtraModels(SerieValorNomimal, SerieIndicadorValorNominal)
    @Get('variavel/:id/serie')
    @ApiBearerAuth('access-token')
    @Roles([
        'CadastroIndicadorPS.editar',
        'CadastroIndicadorPS.inserir',
        'CadastroMetaPS.listar',
        'CadastroIndicadorPS.administrador',
    ])
    async getSeriePrevistoRealizado(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListSeriesAgrupadas> {
        return await this.variavelService.getSeriePrevistoRealizado(this.tipo, params.id);
    }
}
