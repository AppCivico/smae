import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode } from '@nestjs/common';
import { TarefaService } from './tarefa.service';
import { CheckDependenciasDto, CreateTarefaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { DependenciasDatasDto, ListTarefaDto, TarefaDetailDto, TarefaItemDto } from './entities/tarefa.entity';
import { ProjetoService } from '../projeto/projeto.service';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';

const roles: ListaDePrivilegios[] = ['Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto'];

@Controller('projeto')
@ApiTags('Projeto - Tarefas')
export class TarefaController {
    constructor(
        private readonly tarefaService: TarefaService,
        private readonly projetoService: ProjetoService
    ) { }

    @Post(':id/tarefa')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async create(@Param() params: FindOneParams, @Body() dto: CreateTarefaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, false);

        return await this.tarefaService.create(projeto.id, dto, user);
    }

    @Get(':id/tarefa')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findAll(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListTarefaDto> {
        const projeto = await this.projetoService.findOne(params.id, user, true);
        return { linhas: await this.tarefaService.findAll(projeto.id, user) };
    }

    @Get(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findOne(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<TarefaDetailDto> {
        const projeto = await this.projetoService.findOne(params.id, user, true);
        return await this.tarefaService.findOne(projeto.id, params.id2, user);
    }

    @Patch(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async update(@Param() params: FindTwoParams, @Body() dto: UpdateTarefaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, false);
        return await this.tarefaService.update(projeto.id, params.id2, dto, user);
    }

    @Delete(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne(params.id, user, false);

        await this.tarefaService.remove(projeto.id, params.id2, user);
        return '';
    }

    @Post(':id/dependencias')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async getDates(@Param() params: FindOneParams, @Body() dto: CheckDependenciasDto, @CurrentUser() user: PessoaFromJwt): Promise<DependenciasDatasDto> {
        throw 'not implemented'
    }

}
