import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { ListaDePrivilegios } from '../common/ListaDePrivilegios';
import { CreateEquipeRespDto, UpdateEquipeRespDto } from './dto/equipe-resp.dto';
import { FilterEquipeRespDto, ListEquipeRespDto } from './entities/equipe-resp.entity';
import { EquipeRespService } from './equipe-resp.service';

const roles: ListaDePrivilegios[] = [
    'CadastroGrupoVariavel.administrador',
    'CadastroGrupoVariavel.colaborador_responsavel',
];

@ApiTags('Equipes de Responsáveis')
@Controller('equipe-responsavel')
export class EquipeRespController {
    constructor(private readonly grupoVarService: EquipeRespService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async create(@Body() dto: CreateEquipeRespDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.grupoVarService.create(dto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    async findAll(@Query() filter: FilterEquipeRespDto): Promise<ListEquipeRespDto> {
        return { linhas: await this.grupoVarService.findAll(filter) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async update(
        @Param() id: FindOneParams,
        @Body() dto: UpdateEquipeRespDto,
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
