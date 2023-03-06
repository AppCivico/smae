import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode, HttpException } from '@nestjs/common';
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
import { PortfolioService } from '../portfolio/portfolio.service';

const roles: ListaDePrivilegios[] = ['Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto'];

@Controller('projeto')
@ApiTags('Projeto - Tarefas')
export class TarefaController {
    constructor(
        private readonly tarefaService: TarefaService,
        private readonly projetoService: ProjetoService,
        private readonly portfolioService: PortfolioService,

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
        return {
            linhas: await this.tarefaService.findAll(projeto.id, user),
            projeto: projeto,
            portfolio: await this.portfolioService.findOne(projeto.portfolio_id, null),
        };
    }

    @Get(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findOne(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<TarefaDetailDto> {
        const projeto = await this.projetoService.findOne(params.id, user, true);
        return await this.tarefaService.findOne(projeto, params.id2, user);
    }

    @Patch(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async update(@Param() params: FindTwoParams, @Body() dto: UpdateTarefaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        // verificar como fazer o check pro responsavel poder editar o realizado, mesmo depois de não poder
        // mais fazer escritas no projeto em si

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
    async calcula_dependencias_tarefas(@Param() params: FindOneParams, @Body() dto: CheckDependenciasDto, @CurrentUser() user: PessoaFromJwt): Promise<DependenciasDatasDto> {
        const projeto = await this.projetoService.findOne(params.id, user, false);

        const result = await this.tarefaService.calcula_dependencias_tarefas(projeto.id, dto, user);
        if (!result) throw new HttpException('Faltando dependências', 400);

        return result;
    }

}
