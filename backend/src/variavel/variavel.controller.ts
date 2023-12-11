import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { BatchRecordWithId, RecordWithId } from '../common/dto/record-with-id.dto';
import { BatchSerieUpsert } from './dto/batch-serie-upsert.dto';
import { CreateGeradorVariavelDto, CreateVariavelDto } from './dto/create-variavel.dto';
import { FilterVariavelDto } from './dto/filter-variavel.dto';
import { ListSeriesAgrupadas, ListVariavelDto } from './dto/list-variavel.dto';
import { UpdateVariavelDto } from './dto/update-variavel.dto';
import { SerieIndicadorValorNominal, SerieValorNomimal } from './entities/variavel.entity';
import { VariavelService } from './variavel.service';

@ApiTags('Indicador')
@Controller('')
export class VariavelController {
    constructor(private readonly variavelService: VariavelService) {}

    @Post('indicador-variavel')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.inserir')
    async create(
        @Body() createVariavelDto: CreateVariavelDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.variavelService.create(createVariavelDto, user);
    }

    @Get('indicador-variavel')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.inserir', 'CadastroIndicador.editar', 'CadastroMeta.listar')
    async listAll(@Query() filters: FilterVariavelDto, @CurrentUser() user: PessoaFromJwt): Promise<ListVariavelDto> {
        return { linhas: await this.variavelService.findAll(filters) };
    }

    @Patch('indicador-variavel/:id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.editar')
    async update(
        @Param() params: FindOneParams,
        @Body() updateUnidadeMedidaDto: UpdateVariavelDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.variavelService.update(+params.id, updateUnidadeMedidaDto, user);
    }

    @Delete('indicador-variavel/:id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.editar')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.variavelService.remove(+params.id, user);
        return '';
    }

    // patch precisa ficar antes da rota do :id/serie-previsto
    @Patch('indicador-variavel-serie')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async patchSeriePrevisto(@Body() series: BatchSerieUpsert, @CurrentUser() user: PessoaFromJwt) {
        await this.variavelService.batchUpsertSerie(series.valores, user);

        return;
    }

    // manter antes da proxima rota
    @Post('indicador-variavel/gerador-regionalizado')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.inserir')
    async create_generated(
        @Body() dto: CreateGeradorVariavelDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<BatchRecordWithId> {
        return { ids: await this.variavelService.create_region_generated(dto, user) };
    }

    @ApiExtraModels(SerieValorNomimal, SerieIndicadorValorNominal)
    @ApiTags('Indicador')
    @Get('indicador-variavel/:id/serie')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.editar', 'CadastroIndicador.inserir', 'CadastroMeta.listar')
    async getSeriePrevistoRealizado(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListSeriesAgrupadas> {
        return await this.variavelService.getSeriePrevistoRealizado(params.id);
    }
}
