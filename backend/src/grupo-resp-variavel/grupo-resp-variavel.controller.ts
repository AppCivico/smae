import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CreateGrupoRespVariavelDto } from './dto/create-grupo-resp-variavel.dto';
import { UpdateGrupoRespVariavelDto } from './dto/update-grupo-resp-variavel.dto';
import { FilterGrupoRespVariavelDto, ListGrupoRespVariavelDto } from './entities/grupo-resp-variavel.entity';
import { GrupoRespVariavelService } from './grupo-resp-variavel.service';
import { ListaDePrivilegios } from '../common/ListaDePrivilegios';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { FindOneParams } from '../common/decorators/find-params';

const roles: ListaDePrivilegios[] = [
    'CadastroGrupoVariavel.administrador',
    'CadastroGrupoVariavel.colaborador_responsavel',
];

@ApiTags('Grupo Responsável de Variaveis')
@Controller('grupo-variavel-responsavel')
export class GrupoRespVariavelController {
    constructor(private readonly grupoVarService: GrupoRespVariavelService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async create(@Body() dto: CreateGrupoRespVariavelDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.grupoVarService.create(dto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    async findAll(@Query() filter: FilterGrupoRespVariavelDto): Promise<ListGrupoRespVariavelDto> {
        return { linhas: await this.grupoVarService.findAll(filter) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async update(
        @Param() id: FindOneParams,
        @Body() dto: UpdateGrupoRespVariavelDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.grupoVarService.update(id.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() id: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.grupoVarService.remove(id.id, user);

        return '';
    }
}
