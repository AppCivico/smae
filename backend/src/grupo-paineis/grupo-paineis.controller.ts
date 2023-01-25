import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateGrupoPaineisDto } from './dto/create-grupo-paineis.dto';
import { DetailGrupoPaineisDto } from './dto/detail-grupo-paineis.dto';
import { FilterGrupoPaineisDto } from './dto/filter-grupo-paineis.dto';
import { ListGrupoPaineisDto } from './dto/list-grupo-paineis.dto';
import { UpdateGrupoPaineisDto } from './dto/update-grupo-paineis.dto';
import { GrupoPaineisService } from './grupo-paineis.service';

@ApiTags('Grupos de Painéis')
@Controller('grupo-paineis')
export class GrupoPaineisController {
    constructor(private readonly grupoPaineisService: GrupoPaineisService) { }

    @Post('')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroGrupoPaineis.inserir')
    async create(@Body() createGrupoPaineisDto: CreateGrupoPaineisDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.grupoPaineisService.create(createGrupoPaineisDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get('')
    @Roles('CadastroPainel.visualizar', 'CadastroGrupoPaineis.inserir', 'CadastroGrupoPaineis.editar', 'CadastroGrupoPaineis.remover')
    async findAll(@Query() filters: FilterGrupoPaineisDto): Promise<ListGrupoPaineisDto> {
        return { 'linhas': await this.grupoPaineisService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroGrupoPaineis.editar')
    async update(@Param() params: FindOneParams, @Body() updateGrupoPaineisDto: UpdateGrupoPaineisDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.grupoPaineisService.update(+params.id, updateGrupoPaineisDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroGrupoPaineis.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.grupoPaineisService.remove(+params.id, user);
        return '';
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    @Roles('CadastroPainel.visualizar', 'CadastroGrupoPaineis.inserir', 'CadastroGrupoPaineis.editar', 'CadastroGrupoPaineis.remover')
    async getDetail(@Param() params: FindOneParams): Promise<DetailGrupoPaineisDto> {
        return await this.grupoPaineisService.getDetail(params.id);
    }

}
