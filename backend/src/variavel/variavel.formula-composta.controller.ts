import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { MetaController } from '../meta/meta.controller';
import { ListSeriesAgrupadas } from './dto/list-variavel.dto';
import {
    CreatePSFormulaCompostaDto,
    FilterPeriodoFormulaCompostaDto,
    ListaPSFormulaCompostaDto,
    ListaPeriodoFormulaCompostaDto,
} from './dto/variavel.formula-composta.dto';
import { ROLES_ACESSO_VARIAVEL_PS } from './variavel.controller';
import { VariavelFormulaCompostaService } from './variavel.formula-composta.service';
import { IndicadorFormulaCompostaService } from '../indicador/indicador.formula-composta.service';
import { RecordWithId } from '../common/dto/record-with-id.dto';

@ApiTags('Indicador')
@Controller('')
export class VariavelFormulaCompostaController {
    constructor(private readonly variavelFCService: VariavelFormulaCompostaService) {}

    @Get('formula-variavel/:id/periodos')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.ReadPerm)
    async getFormulaCompostaPeriodos(@Param() params: FindOneParams): Promise<ListaPeriodoFormulaCompostaDto> {
        return {
            linhas: await this.variavelFCService.getFormulaCompostaPeriodos(params.id),
        };
    }

    @Get('formula-variavel/:id/series')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.ReadPerm)
    async getFormulaCompostaSeries(
        @Param() params: FindOneParams,
        @Query() filter: FilterPeriodoFormulaCompostaDto
    ): Promise<ListSeriesAgrupadas> {
        return await this.variavelFCService.getFormulaCompostaSeries(params.id, filter);
    }
}

@ApiTags('Variável Global')
@Controller('')
export class VariavelGlobalFCController {
    constructor(
        private readonly variavelFCService: VariavelFormulaCompostaService,
        private readonly indicadorFCService: IndicadorFormulaCompostaService
    ) {}

    @Get('plano-setorial-formula-variavel/:id/periodos')
    @ApiBearerAuth('access-token')
    @Roles(ROLES_ACESSO_VARIAVEL_PS)
    async getFormulaCompostaPeriodos(@Param() params: FindOneParams): Promise<ListaPeriodoFormulaCompostaDto> {
        return {
            linhas: await this.variavelFCService.getFormulaCompostaPeriodos(params.id),
        };
    }

    @Get('plano-setorial-formula-variavel/:id/series')
    @ApiBearerAuth('access-token')
    @Roles(ROLES_ACESSO_VARIAVEL_PS)
    async getFormulaCompostaSeries(
        @Param() params: FindOneParams,
        @Query() filter: FilterPeriodoFormulaCompostaDto
    ): Promise<ListSeriesAgrupadas> {
        return await this.variavelFCService.getFormulaCompostaSeries(params.id, filter);
    }

    @Post('variavel-global-formula-composta')
    @ApiBearerAuth('access-token')
    @Roles(ROLES_ACESSO_VARIAVEL_PS)
    async create_fc(
        @Body() dto: CreatePSFormulaCompostaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.indicadorFCService.createPS(dto, user);
    }

    @Get('variavel-global-formula-composta')
    @ApiBearerAuth('access-token')
    @Roles(ROLES_ACESSO_VARIAVEL_PS)
    async getVariaveisGlobaisFormulaComposta(@CurrentUser() user: PessoaFromJwt): Promise<ListaPSFormulaCompostaDto> {
        return { linhas: await this.variavelFCService.findAll(user) };
    }
}
