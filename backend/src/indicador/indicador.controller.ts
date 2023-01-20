import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiNoContentResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { ListSeriesAgrupadas } from '../variavel/dto/list-variavel.dto';
import { SerieIndicadorValorNominal, SerieValorNomimal } from '../variavel/entities/variavel.entity';
import { CreateIndicadorDto } from './dto/create-indicador.dto';
import { FilterIndicadorDto, FilterIndicadorSerieDto } from './dto/filter-indicador.dto';
import { ListIndicadorDto } from './dto/list-indicador.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';
import { IndicadorService } from './indicador.service';

@ApiTags('Indicador')
@Controller('')
export class IndicadorController {
    constructor(private readonly indicadorService: IndicadorService) { }

    @Post('indicador')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.inserir', 'PDM.tecnico_cp', 'PDM.admin_cp')
    async create(@Body() createIndicadorDto: CreateIndicadorDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.indicadorService.create(createIndicadorDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get('indicador')
    async findAll(@Query() filters: FilterIndicadorDto, @CurrentUser() user: PessoaFromJwt): Promise<ListIndicadorDto> {
        return { 'linhas': await this.indicadorService.findAll(filters, user) };
    }

    @Patch('indicador/:id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.editar', 'PDM.tecnico_cp', 'PDM.admin_cp')
    async update(@Param() params: FindOneParams, @Body() updateIndicadorDto: UpdateIndicadorDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.indicadorService.update(+params.id, updateIndicadorDto, user);
    }

    @Delete('indicador/:id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.remover', 'PDM.tecnico_cp', 'PDM.admin_cp')
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
    @Roles('CadastroIndicador.editar', 'PDM.tecnico_cp', 'PDM.admin_cp')
    @ApiOperation({
        summary: 'Recebe o ID do indicador como parâmetro',
        description: 'Filtros só podem ser usados encurtar os períodos do indicador, não é possível puxar dados fora dos períodos existentes (será ignorado)'
    })
    async getSeriePrevistoRealizado(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt,
        @Query() filters: FilterIndicadorSerieDto
    ): Promise<ListSeriesAgrupadas> {
        return await this.indicadorService.getSeriesIndicador(params.id, user, filters || {});
    }

}
