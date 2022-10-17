import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { ListSerieIndicadorDto } from 'src/indicador/dto/serie-indicador.dto';
import { CreateIndicadorDto } from './dto/create-indicador.dto';
import { FilterIndicadorDto } from './dto/filter-indicador.dto';
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
    @Roles('CadastroIndicador.inserir')
    async create(@Body() createIndicadorDto: CreateIndicadorDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.indicadorService.create(createIndicadorDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get('indicador')
    async findAll(@Query() filters: FilterIndicadorDto): Promise<ListIndicadorDto> {
        return { 'linhas': await this.indicadorService.findAll(filters) };
    }

    @Patch('indicador/:id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.editar')
    async update(@Param() params: FindOneParams, @Body() updateIndicadorDto: UpdateIndicadorDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.indicadorService.update(+params.id, updateIndicadorDto, user);
    }

    @Delete('indicador/:id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.indicadorService.remove(+params.id, user);
        return '';
    }

    @ApiTags('Indicador')
    @Get('indicador/:id/serie')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIndicador.editar')
    async getSeriePrevistoRealizado(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListSerieIndicadorDto> {
        return { linhas: await this.indicadorService.getSeriesIndicador(params.id, user) };
    }

    @ApiTags('default')
    @Get('agregadores')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ deprecated: true })
    @ApiResponse({ description: 'Não há mais agregadores, sempre retorna vazio' })
    agregadores() {
        return {
            linhas: [{
                id: 1,
                codigo: 'deprecated',
                descricao: 'deprecated',
            }]
        };
    }

}
