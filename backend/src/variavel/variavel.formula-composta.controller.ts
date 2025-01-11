import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { LinkIndicadorVariavelDto, UnlinkIndicadorVariavelDto } from '../indicador/dto/create-indicador.dto';
import { MetaController } from '../meta/meta.controller';
import { FilterVariavelDto } from './dto/filter-variavel.dto';
import { ListSeriesAgrupadas, ListVariavelDto } from './dto/list-variavel.dto';
import {
    CreatePSFormulaCompostaDto,
    FilterFormulaCompostaDto,
    FilterPeriodoFormulaCompostaDto,
    ListaPSFormulaCompostaDto,
    ListaPeriodoFormulaCompostaDto,
    PSFormulaCompostaDto,
    UpdatePSFormulaCompostaDto,
} from './dto/variavel.formula-composta.dto';
import { ROLES_ACESSO_VARIAVEL_PS } from './variavel.controller';
import { VariavelFormulaCompostaService } from './variavel.formula-composta.service';

@ApiTags('Indicador')
@Controller('')
export class VariavelFormulaCompostaController {
    constructor(private readonly variavelFCService: VariavelFormulaCompostaService) {}

    @Get('formula-variavel/:id/periodos')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.ReadPerm)
    async getFormulaCompostaPeriodos(@Param() params: FindOneParams): Promise<ListaPeriodoFormulaCompostaDto> {
        return {
            linhas: await this.variavelFCService.getFormulaCompostaPeriodos('PDM', params.id),
        };
    }

    @Get('formula-variavel/:id/series')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.ReadPerm)
    async getFormulaCompostaSeries(
        @Param() params: FindOneParams,
        @Query() filter: FilterPeriodoFormulaCompostaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListSeriesAgrupadas> {
        return await this.variavelFCService.getFormulaCompostaSeries(params.id, filter, user);
    }
}

@ApiTags('Variável Global')
@Controller('')
export class VariavelGlobalFCController {
    constructor(private readonly variavelFCService: VariavelFormulaCompostaService) {}

    @Get('plano-setorial-formula-variavel/:id/periodos')
    @ApiBearerAuth('access-token')
    @Roles(ROLES_ACESSO_VARIAVEL_PS)
    async getFormulaCompostaPeriodos(@Param() params: FindOneParams): Promise<ListaPeriodoFormulaCompostaDto> {
        return {
            linhas: await this.variavelFCService.getFormulaCompostaPeriodos('PS', params.id),
        };
    }

    @Get('plano-setorial-formula-variavel/:id/series')
    @ApiBearerAuth('access-token')
    @Roles(ROLES_ACESSO_VARIAVEL_PS)
    async getFormulaCompostaSeries(
        @Param() params: FindOneParams,
        @Query() filter: FilterPeriodoFormulaCompostaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListSeriesAgrupadas> {
        // Plano setorial é apenas leitura para que seja usado o banco de variáveis globais
        // ou pensar melhor na validação de acesso das variáveis globais
        return await this.variavelFCService.getFormulaCompostaSeries(params.id, filter, user, 'leitura');
    }

    @Post('plano-setorial-formula-composta')
    @ApiBearerAuth('access-token')
    @Roles(ROLES_ACESSO_VARIAVEL_PS)
    async create_fc(
        @Body() dto: CreatePSFormulaCompostaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.variavelFCService.createPS(dto, user);
    }

    @Get('plano-setorial-formula-composta')
    @ApiBearerAuth('access-token')
    @Roles(ROLES_ACESSO_VARIAVEL_PS)
    async getVariaveisGlobaisFormulaComposta(
        @Query() filter: FilterFormulaCompostaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListaPSFormulaCompostaDto> {
        return { linhas: await this.variavelFCService.findAll(filter, user) };
    }

    @Get('plano-setorial-formula-composta/:id/variaveis')
    @ApiBearerAuth('access-token')
    @Roles(
        [...ROLES_ACESSO_VARIAVEL_PS],
        'é o mesmo que acessar o filtro de variáveis global, usando o formula_composta_id=ID'
    )
    async indicador_listAll(
        @Param() params: FindOneParams,
        @Query() filters: FilterVariavelDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListVariavelDto> {
        return { linhas: await this.variavelFCService.findAllVariaveis(params.id, filters) };
    }

    @Patch('plano-setorial-formula-composta/:id/associar-variavel')
    @ApiBearerAuth('access-token')
    @Roles(ROLES_ACESSO_VARIAVEL_PS)
    async link_var(
        @Param() params: FindOneParams,
        @Body() dto: LinkIndicadorVariavelDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.variavelFCService.linkVariavel(+params.id, dto, user);
    }

    @Delete('plano-setorial-formula-composta/:id/desassociar-variavel')
    @ApiBearerAuth('access-token')
    @Roles(ROLES_ACESSO_VARIAVEL_PS)
    async unlink_var(
        @Param() params: FindOneParams,
        @Body() dto: UnlinkIndicadorVariavelDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.variavelFCService.unlinkVariavel(+params.id, dto, user);
    }

    @Get('plano-setorial-formula-composta/:id')
    @ApiBearerAuth('access-token')
    @Roles(ROLES_ACESSO_VARIAVEL_PS)
    async getVariaveisGlobaisFormulaCompostaItem(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PSFormulaCompostaDto> {
        const r = await this.variavelFCService.findAll({ id: params.id }, user);
        if (!r.length) throw new HttpException('Formula não encontrada.', 404);

        return r[0];
    }

    @Patch('plano-setorial-formula-composta/:id')
    @ApiBearerAuth('access-token')
    @Roles(ROLES_ACESSO_VARIAVEL_PS)
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdatePSFormulaCompostaDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.variavelFCService.updateById(+params.id, dto, user);
    }

    @Delete('plano-setorial-formula-composta/:id')
    @ApiBearerAuth('access-token')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async deleteVariaveisGlobaisFormulaCompostaItem(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<void> {
        return this.variavelFCService.removeById(params.id, user);
    }
}
