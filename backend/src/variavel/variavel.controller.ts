import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { BatchSerieUpsert } from 'src/variavel/dto/batch-serie-upsert.dto';
import { FilterVariavelDto } from 'src/variavel/dto/filter-variavel.dto';
import { ListPrevistoAgrupadas, ListVariavelDto } from 'src/variavel/dto/list-variavel.dto';
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

    @Get('indicador-variavel/:id/serie-previsto')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.editar')
    async getSeriePrevisto(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListPrevistoAgrupadas> {
        return await this.variavelService.getSeriePrevisto(params.id);
    }

}
