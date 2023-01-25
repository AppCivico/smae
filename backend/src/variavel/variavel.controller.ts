import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiNoContentResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { BatchSerieUpsert } from './dto/batch-serie-upsert.dto';
import { FilterVariavelDto } from './dto/filter-variavel.dto';
import { ListSeriesAgrupadas, ListVariavelDto } from './dto/list-variavel.dto';
import { SerieIndicadorValorNominal, SerieValorNomimal } from './entities/variavel.entity';
import { CreateVariavelDto } from './dto/create-variavel.dto';
import { UpdateVariavelDto } from './dto/update-variavel.dto';
import { VariavelService } from './variavel.service';

@ApiTags('Indicador')
@Controller('')
export class VariavelController {
    constructor(private readonly variavelService: VariavelService) { }

    @Post('indicador-variavel')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.inserir')
    async create(@Body() createVariavelDto: CreateVariavelDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.variavelService.create(createVariavelDto, user);
    }

    @Get('indicador-variavel')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.inserir', 'CadastroIndicador.editar')
    async listAll(@Query() filters: FilterVariavelDto, @CurrentUser() user: PessoaFromJwt): Promise<ListVariavelDto> {
        return { linhas: await this.variavelService.findAll(filters) };
    }

    @Patch('indicador-variavel/:id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.editar')
    async update(@Param() params: FindOneParams, @Body() updateUnidadeMedidaDto: UpdateVariavelDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.variavelService.update(+params.id, updateUnidadeMedidaDto, user);
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

    @ApiExtraModels(SerieValorNomimal, SerieIndicadorValorNominal)
    @ApiTags('Indicador')
    @Get('indicador-variavel/:id/serie')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.editar', 'CadastroIndicador.inserir', 'CadastroMeta.listar')
    async getSeriePrevistoRealizado(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListSeriesAgrupadas> {
        return await this.variavelService.getSeriePrevistoRealizado(params.id);
    }

}
