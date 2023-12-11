import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiExtraModels,
    ApiNoContentResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../common/decorators/find-params';
import { BatchRecordWithId, RecordWithId } from '../common/dto/record-with-id.dto';
import { ListSeriesAgrupadas } from '../variavel/dto/list-variavel.dto';
import { SerieIndicadorValorNominal, SerieValorNomimal } from '../variavel/entities/variavel.entity';
import { CreateIndicadorDto } from './dto/create-indicador.dto';
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
import { GeneratorFormulaCompostaReturnDto, ListIndicadorFormulaCompostaEmUsoDto } from './entities/indicador.formula-composta.entity';
import { IndicadorFormulaCompostaService } from './indicador.formula-composta.service';
import { IndicadorService } from './indicador.service';

@ApiTags('Indicador')
@Controller('')
export class IndicadorController {
    constructor(
        private readonly indicadorService: IndicadorService,
        private readonly indicadorFormulaCompostaService: IndicadorFormulaCompostaService
    ) {}

    // Nota para 2023: não me lembro o motivo de liberar pra quem pode meta, poder criar indicador
    // reposta: meta ta dentro do indicador, logo, se pode meta, tem que poder indicador
    @Post('indicador')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.inserir', 'CadastroMeta.inserir')
    async create(
        @Body() createIndicadorDto: CreateIndicadorDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.indicadorService.create(createIndicadorDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get('indicador')
    @Roles('CadastroMeta.listar')
    async findAll(@Query() filters: FilterIndicadorDto, @CurrentUser() user: PessoaFromJwt): Promise<ListIndicadorDto> {
        return { linhas: await this.indicadorService.findAll(filters, user) };
    }

    @Patch('indicador/:id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.editar', 'CadastroMeta.inserir')
    async update(
        @Param() params: FindOneParams,
        @Body() updateIndicadorDto: UpdateIndicadorDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.indicadorService.update(+params.id, updateIndicadorDto, user);
    }

    @Delete('indicador/:id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.remover', 'CadastroMeta.inserir')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.indicadorService.remove(+params.id, user);
        return '';
    }

    @ApiExtraModels(SerieValorNomimal, SerieIndicadorValorNominal)
    @ApiTags('Indicador')
    @Get('indicador/:id/serie')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.editar', 'CadastroMeta.inserir', 'CadastroMeta.listar')
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
        return await this.indicadorService.getSeriesIndicador(params.id, user, filters || {});
    }

    @Post('indicador/:id/formula-composta')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.inserir', 'CadastroMeta.inserir')
    async create_fc(
        @Param() params: FindOneParams,
        @Body() createIndicadorDto: CreateIndicadorFormulaCompostaDto,

        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.indicadorFormulaCompostaService.create(params.id, createIndicadorDto, user);
    }

    @Get('indicador/:id/formula-composta')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.inserir', 'CadastroMeta.inserir')
    async list_fc(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListIndicadorFormulaCompostaItemDto> {
        return { rows: await this.indicadorFormulaCompostaService.findAll(params.id, user) };
    }

    @Get('indicador/:id/formula-composta-em-uso')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.inserir', 'CadastroMeta.inserir')
    async listFcEmUso(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListIndicadorFormulaCompostaEmUsoDto> {
        return { rows: await this.indicadorService.listFormulaCompostaEmUso(params.id, user) };
    }

    @Patch('indicador/:id/formula-composta/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.inserir', 'CadastroMeta.inserir')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async patch_fc(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateIndicadorFormulaCompostaDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.indicadorFormulaCompostaService.update(params.id, params.id2, dto, user);
    }

    @Delete('indicador/:id/formula-composta/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.inserir', 'CadastroMeta.inserir')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async delete_fc(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.indicadorFormulaCompostaService.remove(params.id, params.id2, user);
        return '';
    }

    @Get('indicador/:id/auxiliar-formula-composta/variavel')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.inserir', 'CadastroMeta.inserir')
    async auxiliar_formula_composta_variavel(
        @Param() params: FindOneParams,
        @Query() dto: FilterFormulaCompostaFormDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<FilterFormulaCompostaReturnDto> {
        return await this.indicadorFormulaCompostaService.contaVariavelPrefixo(params.id, dto, user);
    }

    @Post('indicador/:id/gerador-formula-composta')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.inserir', 'CadastroMeta.inserir')
    async auxiliar_formula_composta(
        @Param() params: FindOneParams,
        @Body() dto: GeneratorFormulaCompostaFormDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<BatchRecordWithId> {
        return await this.indicadorFormulaCompostaService.geradorFormula(params.id, dto, user);
    }
}
