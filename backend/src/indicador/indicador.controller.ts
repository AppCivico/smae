import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TipoPdm } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { TipoPDM, TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { FindOneParams, FindTwoParams } from '../common/decorators/find-params';
import { BatchRecordWithId, RecordWithId } from '../common/dto/record-with-id.dto';
import { MetaController, MetaSetorialController } from '../meta/meta.controller';
import { ListSeriesAgrupadas } from '../variavel/dto/list-variavel.dto';
import { SerieIndicadorValorNominal, SerieValorNomimal } from '../variavel/entities/variavel.entity';
import { CreateIndicadorDto, LinkIndicadorVariavelDto, UnlinkIndicadorVariavelDto } from './dto/create-indicador.dto';
import {
    CreateIndicadorFormulaCompostaDto,
    FilterFormulaCompostaFormDto,
    FilterFormulaCompostaReturnDto,
    GeneratorFormulaCompostaFormDto,
    UpdateIndicadorFormulaCompostaDto,
} from './dto/create-indicador.formula-composta.dto';
import { FilterIndicadorDto, FilterIndicadorSerieDto } from './dto/filter-indicador.dto';
import { ListIndicadorDto } from './dto/list-indicador.dto';
import { ListIndicadorFormulaCompostaItemDto } from './dto/list-indicador.formula-composta.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';
import { ListIndicadorFormulaCompostaEmUsoDto } from './entities/indicador.formula-composta.entity';
import { IndicadorFormulaCompostaService } from './indicador.formula-composta.service';
import { IndicadorService } from './indicador.service';

@ApiTags('Indicador')
@Controller('')
export class IndicadorController {
    private tipoPdm: TipoPdm = 'PDM';
    constructor(
        private readonly indicadorService: IndicadorService,
        private readonly indicadorFormulaCompostaService: IndicadorFormulaCompostaService
    ) {}

    @Post('indicador')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async create(
        @Body() createIndicadorDto: CreateIndicadorDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.indicadorService.create(this.tipoPdm, createIndicadorDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get('indicador')
    @Roles(MetaController.ReadPerm)
    async findAll(@Query() filters: FilterIndicadorDto, @CurrentUser() user: PessoaFromJwt): Promise<ListIndicadorDto> {
        return { linhas: await this.indicadorService.findAll(this.tipoPdm, filters, user) };
    }

    @Patch('indicador/:id')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async update(
        @Param() params: FindOneParams,
        @Body() updateIndicadorDto: UpdateIndicadorDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.indicadorService.update(this.tipoPdm, +params.id, updateIndicadorDto, user);
    }

    @Delete('indicador/:id')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.indicadorService.remove(this.tipoPdm, +params.id, user);
        return '';
    }

    @ApiExtraModels(SerieValorNomimal, SerieIndicadorValorNominal)
    @ApiTags('Indicador')
    @Get('indicador/:id/serie')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.ReadPerm)
    @ApiOperation({
        summary: 'Recebe o ID do indicador como parâmetro',
        description:
            'Filtros só podem ser usados encurtar os períodos do indicador, não é possível puxar dados fora dos períodos existentes (será ignorado)',
    })
    async getSeriePrevistoRealizado(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt,
        @Query() filters: FilterIndicadorSerieDto
    ): Promise<ListSeriesAgrupadas> {
        return await this.indicadorService.getSeriesIndicador(this.tipoPdm, params.id, user, filters || {});
    }

    @Post('indicador/:id/formula-composta')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async create_fc(
        @Param() params: FindOneParams,
        @Body() createIndicadorDto: CreateIndicadorFormulaCompostaDto,

        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.indicadorFormulaCompostaService.create(this.tipoPdm, params.id, createIndicadorDto, user);
    }

    @Get('indicador/:id/formula-composta')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.ReadPerm)
    async list_fc(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListIndicadorFormulaCompostaItemDto> {
        return { linhas: await this.indicadorFormulaCompostaService.findAll(this.tipoPdm, params.id, user) };
    }

    @Get('indicador/:id/formula-composta-em-uso')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.ReadPerm)
    async listFcEmUso(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListIndicadorFormulaCompostaEmUsoDto> {
        return { linhas: await this.indicadorService.listFormulaCompostaEmUso(params.id, user) };
    }

    @Patch('indicador/:id/formula-composta/:id2')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async patch_fc(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateIndicadorFormulaCompostaDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.indicadorFormulaCompostaService.update(this.tipoPdm, params.id, params.id2, dto, user);
    }

    @Delete('indicador/:id/formula-composta/:id2')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async delete_fc(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.indicadorFormulaCompostaService.remove(this.tipoPdm, params.id, params.id2, user);
        return '';
    }

    @Get('indicador/:id/auxiliar-formula-composta/variavel')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.ReadPerm)
    async auxiliar_formula_composta_variavel(
        @Param() params: FindOneParams,
        @Query() dto: FilterFormulaCompostaFormDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<FilterFormulaCompostaReturnDto> {
        return await this.indicadorFormulaCompostaService.contaVariavelPrefixo(this.tipoPdm, params.id, dto, user);
    }

    @Post('indicador/:id/gerador-formula-composta')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async auxiliar_formula_composta(
        @Param() params: FindOneParams,
        @Body() dto: GeneratorFormulaCompostaFormDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<BatchRecordWithId> {
        return await this.indicadorFormulaCompostaService.geradorFormula(this.tipoPdm, params.id, dto, user);
    }
}

@ApiTags('Indicador')
@Controller('')
export class IndicadorPSController {
    constructor(private readonly indicadorService: IndicadorService) {}

    @Post('plano-setorial-indicador')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async create(
        @Body() createIndicadorDto: CreateIndicadorDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.indicadorService.create(tipo, createIndicadorDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get('plano-setorial-indicador')
    @Roles(MetaSetorialController.ReadPerm)
    async findAll(
        @Query() filters: FilterIndicadorDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<ListIndicadorDto> {
        return { linhas: await this.indicadorService.findAll(tipo, filters, user) };
    }

    @Patch('plano-setorial-indicador/:id/associar-variavel')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async link_var(
        @Param() params: FindOneParams,
        @Body() dto: LinkIndicadorVariavelDto,
        @CurrentUser() user: PessoaFromJwt,
    ) {
        return await this.indicadorService.linkVariavel(+params.id, dto, user);
    }

    @Delete('plano-setorial-indicador/:id/desassociar-variavel')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async unlink_var(
        @Param() params: FindOneParams,
        @Body() dto: UnlinkIndicadorVariavelDto,
        @CurrentUser() user: PessoaFromJwt,
    ) {
        return await this.indicadorService.unlinkVariavel(+params.id, dto, user);
    }

    @Patch('plano-setorial-indicador/:id')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async update(
        @Param() params: FindOneParams,
        @Body() updateIndicadorDto: UpdateIndicadorDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ) {
        return await this.indicadorService.update(tipo, +params.id, updateIndicadorDto, user);
    }

    @Delete('plano-setorial-indicador/:id')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt, @TipoPDM() tipo: TipoPdmType) {
        await this.indicadorService.remove(tipo, +params.id, user);
        return '';
    }

    @ApiExtraModels(SerieValorNomimal, SerieIndicadorValorNominal)
    @ApiTags('Indicador')
    @Get('plano-setorial-indicador/:id/serie')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    @ApiOperation({
        summary: 'Recebe o ID do indicador como parâmetro',
        description:
            'Filtros só podem ser usados encurtar os períodos do indicador, não é possível puxar dados fora dos períodos existentes (será ignorado)',
    })
    async getSeriePrevistoRealizado(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt,
        @Query() filters: FilterIndicadorSerieDto,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<ListSeriesAgrupadas> {
        return await this.indicadorService.getSeriesIndicador(tipo, params.id, user, filters || {});
    }
}
